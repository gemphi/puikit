// Phiora — the API behind the Phiace apps (contract in app/phi-kit/src/api.ts).
// Zero dependencies: node:http + JSON files on disk. Start with `npm start` in app/phiora-server.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { createStore } from './store.mjs';
import { ensureWallet, swap, spend, earn, USD, LedgerError } from './ledger.mjs';
import { loadCatalog, buy, offer, sell } from './shop.mjs';
import { loadMenus, menuOf } from './menu.mjs';
import { modelFromEnv } from './model.mjs';
import { AuthError, checkEmail, checkPassword, checkSignup, hashPassword, publicMe, throttle, verifyPassword } from './auth.mjs';
import { mailerFromEnv, resetMail, verifyMail } from './mail.mjs';
import { ItemError, activityOf, addActivity, setTheme, themes } from './items.mjs';
import { narrowOf, normalizeSources, seedItems, themeRows, treeOf } from './tree.mjs';
import { APP_KINDS, appList, composeApp } from './apps.mjs';
import { rowsOf } from './rows.mjs';
import { RecordError, createRecord, deleteRecord, readRecord, updateRecord } from './records.mjs';
import { DelegationError, delegationSecret, signDelegation, verifyDelegation } from './delegation.mjs';
import { accountRoute } from './account.mjs';
import { memberRoute } from './member.mjs';
import { callRoute, createCalls } from './call.mjs';
import { PRIVATE, RoomError, createRooms, roomRoute } from './room.mjs';
import { createHosts, hostRoute } from './host.mjs';
import { createBonds, bondRoute } from './bond.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const APPS = resolve(here, '..', '..');                       // puikit/app
const NAME = /^[\w.-]{1,64}$/;
/** Documents only the server writes (clients read them; PUT is refused). */
/** Plural spellings of earlier releases → the singular API. */
const PLURAL = [[/^\/apps\//, '/app/'], [/^\/items\/themes$/, '/item/theme'], [/^\/items\//, '/item/'], [/^\/auth\/sessions(\/|$)/, '/auth/session$1'], [/^\/auth\/demo-users$/, '/auth/demo-user']];
export const singular = (p) => PLURAL.reduce((x, [re, to]) => x.replace(re, to), p);
export const SERVER_DOCS = new Set(['wallet', 'history', 'owned', 'activity']);
const MAX_BODY = 256 * 1024;

export function createPhiora({
  env = process.env,
  dataDir = env.PHI_DATA_DIR || join(here, '..', '.data'),
  appsDir = APPS,
  shopDataDir = env.PHI_SHOP_DATA || join(APPS, 'phiegg', 'src', 'data'),
  // The one data folder that seeds the database (a tree.json manifest and its files).
  itemsDir = env.PHI_ITEMS_DIR || join(appsDir, 'phiegg', 'src', 'data'),
  fetchImpl = fetch,
  mailFetch = fetch,
} = {}) {
  const store = createStore(dataDir, env.PHI_STORE, env.DATABASE_URL || env.PHI_PG_URL);
  const mailer = mailerFromEnv(env, dataDir, mailFetch);
  const publicUrl = (env.PHI_PUBLIC_URL || 'http://localhost:3101').replace(/\/$/, '');
  // Dev only: with no mail transport, answers to the local machine carry the link so you can click it.
  const devLinks = mailer.outbox && env.PHI_ENV !== 'production';
  const forgots = throttle({ max: 5, windowMs: 15 * 60 * 1000 });
  const VERIFY_TTL = 24 * 3600 * 1000, RESET_TTL = 30 * 60 * 1000;
  // Delegation to other services (Phient, Phione): a short-lived signed statement of who is signed in.
  const delegation = delegationSecret(env);
  const AUDIENCES = new Set((env.PHI_DELEGATION_AUDIENCES || 'phient,phione').split(',').map((x) => x.trim()).filter(Boolean));
  const DELEGATION_TTL = Math.min(60, Math.max(1, Number(env.PHI_DELEGATION_MINUTES) || 10)) * 60 * 1000;
  const IDLE = Number(env.PHI_SESSION_IDLE_DAYS || 30) * 24 * 3600 * 1000; const TOUCH_EVERY = 3600 * 1000;
  const sweep = async () => { try { await store.sweepSessions(Date.now() - IDLE); } catch (e) { console.error('session sweep', e); } };
  void sweep(); const sweeper = setInterval(sweep, 6 * 3600 * 1000); sweeper.unref?.();
  /** Public handle for a session (never the cookie value). */
  const sessionId = (sid) => createHash('sha256').update(sid).digest('hex').slice(0, 16);
  const browserOf = (ua = '') => {
    // The desktop app says what it is itself (phikit's Phiogy, data/phiora.tsv `agent`).
    if (/Phiogy \(Windows\)/.test(ua)) return 'Phiogy for Windows';
    const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : ua ? 'Browser' : 'Unknown';
    const os = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : '';
    return os ? b + ' on ' + os : b;
  };
  const catalog = loadCatalog(shopDataDir);
  const menus = loadMenus(shopDataDir);
  // The database is the source of the records; the data files only seed it. On start, in development, changed files
  // are loaded again (records changed through the API stay as they are); in production (PHI_ENV=production) only an
  // empty database is loaded, and `npm run seed` is the way to bring file changes in. PHI_SEED=0 skips it.
  const init = (async () => {
    if (env.PHI_SEED === '0') return;
    const d = await seedItems(store, itemsDir, { onlyMissing: env.PHI_ENV === 'production', appsDir });
    if (!env.PHI_QUIET && d.loaded) console.log(`items: ${d.items} records in ${d.kinds.length} kinds${d.skipped ? `, ${d.skipped} skipped` : ''}`);
  })().catch((e) => { console.error('items seed', e); });
  // The app records, read again only when the change log moved (an edit, a create, a delete) or the seed reloaded.
  let appCache = { at: null, rows: null };
  const appRecords = async () => {
    const [last] = await store.itemChanges({ n: 1 }); const at = (last?.seq ?? 0) + ':' + ((await store.itemInfo())?.loadedAt ?? '');
    if (appCache.at !== at) appCache = { at, rows: await store.itemsOf(APP_KINDS) };
    return appCache.rows;
  };
  const model = modelFromEnv(env, fetchImpl);
  const origins = (env.PHI_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const originOk = (o) => !!o && (origins.length ? origins.includes(o) : /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o));
  const secure = env.PHI_SECURE_COOKIES === '1';
  const demoLogin = env.PHI_DEMO_LOGIN !== '0';
  const seedUsers = (() => { const f = join(shopDataDir, 'core.json'); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).users : []; })();
  const chatHits = new Map();
  const signins = throttle();
  const seedHandles = new Set(seedUsers.map((x) => x.handle));

  const send = (res, code, body, headers = {}) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };
  const fail = (res, code, error, message) => send(res, code, { error, message });
  const readBody = (req) => new Promise((ok, no) => {
    // Over the limit: keep draining (so the client still gets a 413 back) but stop buffering.
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size <= MAX_BODY) chunks.push(c); });
    req.on('end', () => {
      if (size > MAX_BODY) return no(Object.assign(new Error('too_large'), { code: 413 }));
      const s = Buffer.concat(chunks).toString('utf8'); if (!s) return ok(undefined);
      try { ok(JSON.parse(s)); } catch { no(Object.assign(new Error('bad_json'), { code: 400 })); }
    });
    req.on('error', no);
  });
  const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((p) => p.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
  const sidCookie = (sid) => `phi_sid=${sid}; Path=/; HttpOnly; Max-Age=31536000; SameSite=${secure ? 'None; Secure' : 'Lax'}`;

  /** Every visitor gets a user: a guest until they sign in. */
  async function sessionOf(req, res) {
    const sid = cookies(req).phi_sid; const s = sid ? await store.session(sid) : undefined; const ua = String(req.headers['user-agent'] || '');
    if (s && Date.now() - s.at > IDLE) await store.dropSession(sid);           // idle too long: signed out
    else if (s) {
      const u = await store.user(s.userId);
      if (u) { if (Date.now() - s.at > TOUCH_EVERY) await store.touchSession(sid, ua); return { sid, u }; }
    }
    const u = ensureWallet(await store.createUser({ id: 'guest_' + randomBytes(6).toString('hex'), guest: true, name: 'Guest' }));
    await store.saveUser(u);
    const nsid = await store.newSession(u.id, ua); res.setHeader('set-cookie', sidCookie(nsid));
    return { sid: nsid, u };
  }
  const loopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  /** Links in account emails land on the app that asked (when its origin is allowed), else PHI_PUBLIC_URL. */
  const linkFor = (req, param, token) => (originOk(req.headers.origin) ? req.headers.origin : publicUrl) + '/?' + param + '=' + token;
  const token = () => randomBytes(24).toString('base64url');
  async function sendVerify(req, u) {
    const t = token(); await store.dropTokens('verify', u.id); await store.putToken('verify', t, u.id, { email: u.email }, VERIFY_TTL);
    const link = linkFor(req, 'phi_verify', t); await mailer.send(verifyMail(u.email, u.name, link));
    return devLinks && loopback(req) ? { devLink: link } : {};
  }
  const accountOf = async (login) => {
    const l = String(login || '').trim().toLowerCase(); if (!l) return null;
    const id = l.includes('@') ? await store.emailOwner(l) : await store.handleOwner(l); return id ? await store.user(id) : null;
  };
  const money = (u) => ({ wallet: u.wallet, history: u.history, owned: u.owned });
  const docRead = (u, name) => (name === 'activity' ? u.docs.activity : SERVER_DOCS.has(name) ? money(ensureWallet(u))[name] : u.docs[name]);
  const designers = new Set((env.PHI_DESIGNERS || '').split(',').map((x) => x.trim()).filter(Boolean));
  // Who may change any record in the items database (besides each record's owner): ids or handles, * for anyone
  // signed in. PHI_CREATE_KINDS, when set, lists the kinds anyone signed in may create; other kinds need an editor.
  const editors = new Set((env.PHI_EDITORS || '').split(',').map((x) => x.trim()).filter(Boolean));
  const createKinds = env.PHI_CREATE_KINDS ? new Set(env.PHI_CREATE_KINDS.split(',').map((x) => x.trim()).filter(Boolean)) : null;
  const writeHits = new Map();
  // Calls between the browsers in a room (call.mjs): who is in each, and their signals passed on.
  const calls = createCalls(env);
  // Rooms, hosts and friends shared by their people (room.mjs, host.mjs, bond.mjs): private records, served only to
  // the people of each room, never by a /tree read.
  const rooms = createRooms({ store, appsDir, editors });
  const hosts = createHosts(rooms, store);
  const bonds = createBonds(rooms, store);
  const open = (kind) => !PRIVATE.has(kind);

  const server = createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (originOk(origin)) {
      res.setHeader('access-control-allow-origin', origin); res.setHeader('access-control-allow-credentials', 'true'); res.setHeader('vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      if (!originOk(origin)) return fail(res, 403, 'origin', 'Origin not allowed.');
      return send(res, 204, undefined, { 'access-control-allow-methods': 'GET,PUT,POST,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' });
    }
    if (origin && !originOk(origin) && req.method !== 'GET') return fail(res, 403, 'origin', 'Origin not allowed.');

    const url = new URL(req.url, 'http://phiora'); const { searchParams } = url;
    // Singular names are the API (/app/<key>, /item/theme, /item/<id>/theme, /auth/session, /auth/demo-user); the
    // plural spellings of earlier releases still answer, mapped here, so old clients keep working.
    const pathname = singular(url.pathname);
    const route = req.method + ' ' + pathname;
    try {
      await init;
      if (route === 'GET /health') return send(res, 200, { ok: true, store: store.kind, mail: mailer.kind, model: { provider: model.provider, configured: model.configured }, looks: catalog.size });

      let m;
      // The menu a path has, as the arrays its data holds (menu.mjs).
      if (route === 'GET /menu') return send(res, 200, menuOf(menus, url.searchParams.get('path'), url.searchParams.get('id')), { 'cache-control': 'public, max-age=60' });
      // An app's menus and pages are records (apps.mjs); the document is composed from them. Before the database has
      // them (or for an app it does not hold) the app's own file answers.
      if (route === 'GET /app') return send(res, 200, { apps: appList(await appRecords()) });
      if (req.method === 'GET' && (m = pathname.match(/^\/app\/([\w-]+)$/))) {
        const doc = composeApp(await appRecords(), m[1]);
        if (doc) return send(res, 200, doc, { 'cache-control': 'no-cache' });
        const f = join(appsDir, m[1], 'public', 'data', m[1] + '.json');
        return existsSync(f) ? send(res, 200, JSON.parse(readFileSync(f, 'utf8')), { 'cache-control': 'public, max-age=60' }) : fail(res, 404, 'no_app', 'No app ' + m[1] + '.');
      }

      // Every record of every kind, public: the data files plus live designer themes. Clients index the links.
      if (route === 'GET /tree/rows') { if (!open(searchParams.get('kind'))) return fail(res, 404, 'no_kind', 'No such kind.'); const r = await rowsOf(store, searchParams); return r ? send(res, 200, r) : fail(res, 400, 'no_kind', 'Name a kind: /tree/rows?kind=pool.'); }
      if (route === 'GET /tree/info') return send(res, 200, (await store.itemInfo()) ?? { items: 0, kinds: [], loadedAt: null });
      if (route === 'GET /tree/change') {
        const n = Math.min(200, Math.max(1, Number(searchParams.get('n')) || 50));
        const kind = searchParams.get('kind') || undefined; if (kind && !open(kind)) return send(res, 200, { changes: [] });
        return send(res, 200, { changes: (await store.itemChanges({ kind, id: searchParams.get('id') || undefined, n: kind ? n : n * 10 })).filter((c) => open(c.kind)).slice(0, n) });
      }
      if (route === 'GET /tree') {
        const all = (await store.itemSources()) ?? { sources: [], loadedAt: null };
        const stored = { ...all, sources: all.sources.filter((s) => open(s.kind)) };
        const kinds = (searchParams.get('kind') || '').split(',').map((x) => x.trim()).filter(Boolean);
        const idmap = (await store.global('items.idmap')) ?? {};
        return send(res, 200, treeOf(stored, [{ kind: 'theme', rows: themeRows(await themes(store), catalog, idmap) }], kinds, narrowOf(searchParams)));
      }

      // Designer themes are public: anyone may read what a look is.
      if (route === 'GET /item/theme') return send(res, 200, await themes(store));

      // Services check a delegation here (or verify the JWT themselves with the shared secret).
      if (route === 'POST /auth/delegation/verify') {
        const { token, audience } = (await readBody(req)) || {};
        try { return send(res, 200, { ok: true, claims: verifyDelegation(token, delegation.secret, { audience }) }); }
        catch (e) { if (e instanceof DelegationError) return fail(res, 401, e.code, e.message); throw e; }
      }

      const { sid, u } = await sessionOf(req, res);

      const me = (x) => publicMe(x, { canDemo: demoLogin });
      if (route === 'GET /me') return send(res, 200, me(u));
      // What you made, across kinds: the records whose ownerId is you (a profile's projects, rounds, pledges …).
      if (route === 'GET /tree/mine') {
        const kinds = (searchParams.get('kinds') || '').split(',').map((x) => x.trim()).filter((k) => /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(k) && open(k)).slice(0, 20);
        const got = u.guest ? {} : await store.itemsOf(kinds);
        return send(res, 200, { me: u.guest ? null : u.id, kinds: Object.fromEntries(kinds.map((k) => [k, (got[k] ?? []).filter((r) => r.ownerId === u.id)])) });
      }
      // Issue a delegation for the signed-in user to hand to another service (Authorization: Bearer <token>).
      if (route === 'POST /auth/delegation') {
        const { audience = 'phient' } = (await readBody(req)) || {};
        if (!AUDIENCES.has(audience)) return fail(res, 400, 'audience', 'Unknown service: ' + audience + '.');
        const issued = signDelegation({ aud: audience, sub: u.id, name: u.name, handle: u.handle ?? null, email: u.email ?? null, email_verified: !!u.emailVerified, guest: !!u.guest, sid: sessionId(sid) }, delegation.secret, { ttlMs: DELEGATION_TTL });
        return send(res, 200, { ...issued, ephemeral: delegation.ephemeral });
      }

      // The account routes (account.mjs); one that answered has ended the response.
      await accountRoute(route, { RESET_TTL, accountOf, browserOf, demoLogin, devLinks, fail, forgots, linkFor, loopback, mailer, me, readBody, req, res, seedHandles, seedUsers, send, sendVerify, sessionId, sid, signins, store, token, u });
      if (res.writableEnded) return;
      // A member's own routes (member.mjs); one that answered has ended the response.
      await memberRoute(route, { SERVER_DOCS, catalog, designers, docRead, fail, money, pathname, readBody, req, res, searchParams, send, store, u });
      if (res.writableEnded) return;
      // Rooms, hosts, invites and friends shared by their people; one that answered has ended the response.
      await roomRoute(route, { rooms, pathname, readBody, req, res, searchParams, send, u });
      if (res.writableEnded) return;
      await hostRoute(route, { hosts, pathname, readBody, req, res, send, u });
      if (res.writableEnded) return;
      await bondRoute(route, { bonds, pathname, readBody, req, res, searchParams, send, u });
      if (res.writableEnded) return;
      // A room's call (call.mjs); one it took has answered, or is held open as the room's line.
      await callRoute(route, { calls, fail, pathname, readBody, req, res, searchParams, send, u });
      if (res.headersSent) return;
      // Records in the items database: read with who may change them, create, edit, delete (30 changes a minute each).
      const rec = pathname.match(/^\/tree\/item\/([A-Za-z][A-Za-z0-9]{0,39})\/([\w.:-]{1,120})$/);
      // The kinds of rooms are theirs alone: never read or written as plain records.
      if (rec && !open(rec[1])) return fail(res, 404, 'no_record', 'No ' + rec[1] + ' ' + rec[2] + '.');
      if (rec && req.method === 'GET') return send(res, 200, await readRecord(store, u, editors, rec[1], decodeURIComponent(rec[2])));
      if ((rec && (req.method === 'PATCH' || req.method === 'DELETE')) || route === 'POST /tree/item') {
        const now = Date.now(); const hits = (writeHits.get(u.id) || []).filter((t) => now - t < 60000);
        if (hits.length >= 30) return fail(res, 429, 'rate', 'Slow down a little.');
        hits.push(now); writeHits.set(u.id, hits);
        if (route === 'POST /tree/item') {
          const bd = (await readBody(req)) || {};
          if (!open(String(bd.kind))) return fail(res, 403, 'kind_closed', bd.kind + ' records are kept by their room.');
          // Backing a round: creating an order that names a round first moves the pledge from the backer's wallet to
          // the round (Phiora is the one place money moves), so an underfunded back is refused before any order is
          // written, and the round's raised total and backer count go up.
          if (bd.kind === 'order' && bd.fields && bd.fields.roundId) {
            const rid = String(bd.fields.roundId);
            const got = await store.getItem('round', rid);
            if (!got) return fail(res, 404, 'no_round', 'That round is gone.');
            const rnd = got.doc; // getItem returns a wrapper: the record is under .doc
            const coin = String(rnd.coin || 'usd').toLowerCase();
            const amt = Number(bd.fields.amount ?? bd.fields.totalUsd ?? rnd.minTicket ?? 0);
            try { spend(ensureWallet(u), { coin, amt, what: 'Backed ' + (rnd.name || 'round') }); }
            catch (e) { if (e instanceof LedgerError) return fail(res, 400, e.code, e.message); throw e; }
            bd.fields = { ...bd.fields, amount: amt, coin, totalUsd: Math.round(amt * (USD[coin] || 1)) };
            const created = await createRecord(store, u, bd, editors, createKinds);
            const raised = Math.round((Number(rnd.raised) || 0) + amt * (USD[coin] || 1));
            const backers = (Number(rnd.backers) || 0) + 1;
            await store.saveItem('round', rid, { ...rnd, raised, backers }, { by: u.id, origin: got.origin, owner: got.owner }, { action: 'update', fields: ['raised', 'backers'] });
            await store.saveUser(u);
            return send(res, 201, { ...created, wallet: u.wallet, history: u.history, round: { id: rid, raised, backers } });
          }
          return send(res, 201, await createRecord(store, u, bd, editors, createKinds));
        }
        if (req.method === 'PATCH') return send(res, 200, await updateRecord(store, u, editors, rec[1], decodeURIComponent(rec[2]), await readBody(req)));
        return send(res, 200, await deleteRecord(store, u, editors, rec[1], decodeURIComponent(rec[2])));
      }
      if (route === 'POST /chat') {
        const now = Date.now(); const hits = (chatHits.get(u.id) || []).filter((t) => now - t < 60000);
        if (hits.length >= 30) return fail(res, 429, 'rate', 'Slow down a little.');
        hits.push(now); chatHits.set(u.id, hits);
        const body = (await readBody(req)) || {};
        try { return send(res, 200, await model.reply(body)); } catch (e) { return fail(res, 502, 'model', String(e.message || e)); }
      }

      return fail(res, 404, 'not_found', 'No route ' + route + '.');
    } catch (e) {
      if (e instanceof LedgerError) return fail(res, 409, e.code, e.message);
      if (e instanceof AuthError) return fail(res, e.status, e.code, e.message);
      if (e instanceof ItemError) return fail(res, e.status, e.code, e.message);
      if (e instanceof RecordError) return fail(res, e.status, e.code, e.message);
      if (e instanceof RoomError) return fail(res, e.status, e.code, e.message);
      if (e.code === 413) return fail(res, 413, 'too_large', 'Body over 256 KB.');
      if (e.code === 400) return fail(res, 400, 'bad_json', 'Body is not JSON.');
      console.error(e); return fail(res, 500, 'internal', 'Something went wrong.');
    }
  });
  server.on('close', () => { clearInterval(sweeper); calls.close(); store.close(); });
  return { server, store, calls, catalog, model, mailer, init, itemsDir, appsDir };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4300);
  const { server, catalog, model, store, mailer } = createPhiora();
  if (process.env.PHI_ENV === 'production') {
    if (mailer.outbox) console.warn('⚠ PHI_ENV=production without RESEND_API_KEY or PHI_MAIL_WEBHOOK: account emails only reach .data/outbox.jsonl.');
    if (!process.env.PHI_ORIGINS) console.warn('⚠ PHI_ENV=production without PHI_ORIGINS: only http://localhost origins are allowed.');
    if (process.env.PHI_SECURE_COOKIES !== '1') console.warn('⚠ PHI_ENV=production without PHI_SECURE_COOKIES=1: the session cookie is not marked Secure.');
    if (!process.env.PHI_DELEGATION_SECRET) console.warn('⚠ PHI_ENV=production without PHI_DELEGATION_SECRET: delegations use a per-process key, so Phient cannot check them itself and they end with a restart.');
  }
  server.listen(port, () => console.log(`Phiora on http://localhost:${port} · store: ${store.kind} · mail: ${mailer.kind} · ${catalog.size} looks priced · model: ${model.configured ? model.provider : 'not configured (canned replies)'}`));
}
