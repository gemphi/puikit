import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhiora } from '../src/server.mjs';

const ORIGIN = 'http://localhost:3101';
let root, base, phiora, modelCalls = [];

before(async () => {
  root = mkdtempSync(join(tmpdir(), 'phiora-'));
  const shop = join(root, 'shop'); const apps = join(root, 'apps');
  mkdirSync(shop); mkdirSync(join(apps, 'demo', 'public', 'data'), { recursive: true });
  writeFileSync(join(apps, 'demo', 'public', 'data', 'demo.json'), JSON.stringify({ app: 'demo', nav: [], views: {} }));
  writeFileSync(join(shop, 'ls.json'), JSON.stringify({ looks: [{ id: 'lk1', name: 'Indigo Tier', usd: 1000, floor: 900 }, { id: 'lk2', name: 'Rose', usd: 600, floor: 500 }] }));
  writeFileSync(join(shop, 'stores.json'), JSON.stringify({ stores: [{ looks: [{ id: 'lk3', name: 'Ink', usd: 5000, floor: 4500 }] }] }));
  writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale', handle: 'noor.hale' }] }));
  const fakeFetch = async (url, init) => { modelCalls.push({ url, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ choices: [{ message: { content: 'Wear the sash.' } }] }), { status: 200 }); };
  phiora = createPhiora({ env: { PHI_MODEL_URL: 'http://model.test/v1', PHI_MODEL: 'm', PHI_QUIET: '1' }, dataDir: join(root, 'data'), appsDir: apps, shopDataDir: shop, fetchImpl: fakeFetch });
  await new Promise((ok) => phiora.server.listen(0, ok));
  base = 'http://localhost:' + phiora.server.address().port;
});
after(() => { phiora.server.close(); rmSync(root, { recursive: true, force: true }); });

/** A browser-ish client: keeps the session cookie, sends Origin. */
const client = (ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36', at = () => base) => {
  let cookie = '';
  const call = async (method, path, body, origin = ORIGIN) => {
    const r = await fetch(at() + path, { method, headers: { origin, 'user-agent': ua, ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    const text = await r.text();
    return { status: r.status, headers: r.headers, body: text ? JSON.parse(text) : undefined };
  };
  return { get: (p, o) => call('GET', p, undefined, o), put: (p, b) => call('PUT', p, b), post: (p, b, o) => call('POST', p, b, o) };
};

test('health reports catalog and model', async () => {
  const r = await client().get('/health');
  assert.equal(r.status, 200); assert.equal(r.body.looks, 3); assert.equal(r.body.model.configured, true);
  assert.equal(r.body.store, 'sqlite'); assert.equal(r.body.mail, 'outbox');
});

test('serves app content', async () => {
  const c = client();
  assert.equal((await c.get('/apps/demo')).body.app, 'demo');
  assert.equal((await c.get('/apps/nope')).status, 404);
});

test('CORS: allowed origin echoed with credentials; others refused for writes', async () => {
  const c = client();
  const ok = await c.get('/me');
  assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(ok.headers.get('access-control-allow-credentials'), 'true');
  const bad = await c.post('/wallet/spend', { coin: 'usd', amt: 1 }, 'https://evil.example');
  assert.equal(bad.status, 403);
});

test('each visitor gets their own guest session and state', async () => {
  const a = client(), b = client();
  assert.equal((await a.put('/state/follow', { c_opal: 1 })).status, 204);
  assert.deepEqual((await a.get('/state/follow')).body, { c_opal: 1 });
  assert.equal((await b.get('/state/follow')).status, 404);
  const me = await a.get('/me'); assert.equal(me.body.guest, true);
});

test('wallet, history and owned are server-owned', async () => {
  const c = client();
  assert.equal((await c.get('/state/wallet')).body.usd, 2500);
  const r = await c.put('/state/wallet', { usd: 1e9, egg: 0, sum: 0, eth: 0 });
  assert.equal(r.status, 403); assert.equal(r.body.error, 'server_owned');
  assert.equal((await c.get('/state/wallet')).body.usd, 2500);
});

test('swap uses the shared rates and fee', async () => {
  const c = client();
  const r = await c.post('/wallet/swap', { amt: 400, from: 'egg', to: 'usd' });
  assert.equal(r.status, 200);
  assert.equal(r.body.got, 99.7); // 400 × 0.25 × (1 − 0.003)
  assert.equal(r.body.wallet.egg, 11600); assert.equal(r.body.wallet.usd, 2599.7);
  assert.equal(r.body.history.length, 2);
  assert.equal((await c.post('/wallet/swap', { amt: 1e9, from: 'egg', to: 'usd' })).body.error, 'insufficient');
  assert.equal((await c.post('/wallet/swap', { amt: 1, from: 'egg', to: 'egg' })).body.error, 'bad_pair');
});

test('spend refuses overdrafts and junk', async () => {
  const c = client();
  assert.equal((await c.post('/wallet/spend', { coin: 'usd', amt: 3000 })).status, 409);
  assert.equal((await c.post('/wallet/spend', { coin: 'usd', amt: -5 })).body.error, 'bad_amount');
  assert.equal((await c.post('/wallet/spend', { coin: 'gold', amt: 1 })).body.error, 'bad_coin');
  assert.equal((await c.post('/wallet/spend', { coin: 'usd', amt: 500, what: 'Ticket' })).body.wallet.usd, 2000);
});

test('earn is capped (demo faucet)', async () => {
  const c = client();
  assert.equal((await c.post('/wallet/earn', { coin: 'usd', amt: 40000 })).status, 200);
  assert.equal((await c.post('/wallet/earn', { coin: 'usd', amt: 20000 })).body.error, 'earn_cap');
});

test('shop buy prices from data, not the client, and records ownership', async () => {
  const c = client();
  await c.put('/state/cartOffers', { cart: ['lk1', 'lk2'], offers: [] });
  const r = await c.post('/shop/buy', { lookIds: ['lk1', 'lk2'], usd: 1 });
  assert.equal(r.status, 200); assert.equal(r.body.total, 1600);
  assert.equal(r.body.wallet.usd, 900);
  assert.ok(r.body.owned.lk1 && r.body.owned.lk2);
  assert.deepEqual(r.body.cartOffers.cart, []);
  assert.equal((await c.post('/shop/buy', { lookIds: ['lk1'] })).body.error, 'already_owned');
  assert.equal((await c.post('/shop/buy', { lookIds: ['lk3'] })).body.error, 'insufficient');
  assert.equal((await c.post('/shop/buy', { lookIds: ['nope'] })).body.error, 'unknown_look');
});

test('offers: below floor pends, at floor pays', async () => {
  const c = client();
  const low = await c.post('/shop/offer', { lookId: 'lk2', usd: 100 });
  assert.equal(low.body.status, 'pending'); assert.equal(low.body.wallet.usd, 2500);
  const hit = await c.post('/shop/offer', { lookId: 'lk2', usd: 500 });
  assert.equal(hit.body.status, 'accepted'); assert.equal(hit.body.wallet.usd, 2000); assert.ok(hit.body.owned.lk2);
  assert.equal(hit.body.cartOffers.offers.filter((o) => o.status === 'pending').length, 0);
});

test('sell an owned look at floor', async () => {
  const c = client();
  assert.equal((await c.post('/shop/sell', { lookId: 'lk2' })).body.error, 'not_owned');
  await c.post('/shop/buy', { lookIds: ['lk2'] });
  const r = await c.post('/shop/sell', { lookId: 'lk2' });
  assert.equal(r.body.usd, 500); assert.equal(r.body.wallet.usd, 2400); assert.equal(r.body.owned.lk2, undefined);
});

test('state persists across restarts (disk)', async () => {
  const c = client();
  await c.put('/state/votes', { p1: 'for' });
  phiora.store.user; // same process; reload a fresh store from disk
  const { createStore } = await import('../src/store.mjs');
  const fresh = createStore(join(root, 'data'));
  const me = await c.get('/me');
  assert.deepEqual(fresh.user(me.body.id).docs.votes, { p1: 'for' });
});

test('demo sign-in switches the session to a seeded user', async () => {
  const c = client();
  assert.equal((await c.post('/auth/login', { userId: 'nobody' })).status, 404);
  const r = await c.post('/auth/login', { userId: 'u_noor' });
  assert.equal(r.body.name, 'Noor Hale');
  assert.equal((await c.get('/me')).body.id, 'u_noor');
});

test('delegation: the signed-in user is vouched for to Phient, and checked', async () => {
  const c = client();
  await c.post('/auth/login', { userId: 'u_noor' });
  assert.equal((await c.post('/auth/delegation', { audience: 'elsewhere' })).status, 400);
  const d = await c.post('/auth/delegation', { audience: 'phient' });
  assert.equal(d.status, 200);
  assert.equal(d.body.claims.sub, 'u_noor'); assert.equal(d.body.claims.aud, 'phient'); assert.equal(d.body.claims.name, 'Noor Hale');
  assert.ok(d.body.expiresAt > Date.now());
  assert.equal(d.body.token.split('.').length, 3);
  // A service checks it without any cookie, and a tampered token fails.
  const svc = client();
  const ok = await svc.post('/auth/delegation/verify', { token: d.body.token, audience: 'phient' }, '');
  assert.equal(ok.status, 200); assert.equal(ok.body.claims.handle, 'noor.hale');
  assert.equal((await svc.post('/auth/delegation/verify', { token: d.body.token, audience: 'phione' }, '')).body.error, 'audience');
  const [h, , sig] = d.body.token.split('.');
  const forged = h + '.' + Buffer.from(JSON.stringify({ ...d.body.claims, sub: 'u_admin' })).toString('base64url') + '.' + sig;
  assert.equal((await svc.post('/auth/delegation/verify', { token: forged }, '')).body.error, 'signature');
});

test('chat goes to the model with persona and trimmed history', async () => {
  const c = client(); modelCalls = [];
  const r = await c.post('/chat', { app: 'phiegg', persona: 'ag_ponte', messages: [{ role: 'assistant', text: 'Hi' }, { role: 'user', text: 'What to wear?' }] });
  assert.equal(r.status, 200); assert.equal(r.body.text, 'Wear the sash.');
  assert.equal(modelCalls[0].url, 'http://model.test/v1/chat/completions');
  assert.match(modelCalls[0].body.messages[0].content, /ag_ponte/);
  assert.equal(modelCalls[0].body.messages.at(-1).content, 'What to wear?');
});

test('rejects bad names, bad JSON and oversized bodies', async () => {
  const c = client();
  assert.equal((await c.get('/state/..%2Fetc')).status, 400);
  const bad = await fetch(base + '/state/x', { method: 'PUT', headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: '{nope' });
  assert.equal(bad.status, 400);
  const big = await fetch(base + '/state/x', { method: 'PUT', headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify('x'.repeat(300 * 1024)) });
  assert.equal(big.status, 413);
});

test('register upgrades the guest in place: purchases and state carry over', async () => {
  const c = client();
  await c.put('/state/follow', { c_opal: 1 });
  await c.post('/shop/buy', { lookIds: ['lk2'] });
  const r = await c.post('/auth/register', { handle: 'Ada.Lace', name: 'Ada', password: 'correct horse' });
  assert.equal(r.status, 200); assert.equal(r.body.handle, 'ada.lace'); assert.equal(r.body.guest, false);
  assert.equal(r.body.passwordHash, undefined);
  assert.deepEqual((await c.get('/state/follow')).body, { c_opal: 1 });
  assert.ok((await c.get('/state/owned')).body.lk2);
  assert.equal((await c.get('/state/wallet')).body.usd, 1900);
  assert.equal((await c.post('/auth/register', { handle: 'other', name: 'x', password: 'password1' })).body.error, 'signed_in');
});

test('register validates and refuses taken or seeded handles', async () => {
  assert.equal((await client().post('/auth/register', { handle: 'ab', name: 'x', password: 'password1' })).body.error, 'bad_handle');
  assert.equal((await client().post('/auth/register', { handle: 'okname', name: '', password: 'password1' })).body.error, 'bad_name');
  assert.equal((await client().post('/auth/register', { handle: 'okname', name: 'x', password: 'short' })).body.error, 'bad_password');
  assert.equal((await client().post('/auth/register', { handle: 'noor.hale', name: 'x', password: 'password1' })).body.error, 'handle_taken');
  const a = client(); await a.post('/auth/register', { handle: 'twin', name: 'A', password: 'password1' });
  assert.equal((await client().post('/auth/register', { handle: 'twin', name: 'B', password: 'password1' })).body.error, 'handle_taken');
});

test('sign in from another browser reaches the same account; sign out starts a new guest', async () => {
  const a = client();
  await a.post('/auth/register', { handle: 'mira', name: 'Mira', password: 'pass-word-1' });
  await a.put('/state/votes', { p9: 'for' });
  const b = client();
  assert.equal((await b.post('/auth/signin', { handle: 'mira', password: 'nope-nope' })).status, 401);
  const ok = await b.post('/auth/signin', { handle: 'MIRA', password: 'pass-word-1' });
  assert.equal(ok.status, 200); assert.equal(ok.body.name, 'Mira');
  assert.deepEqual((await b.get('/state/votes')).body, { p9: 'for' });
  await b.post('/auth/logout');
  const after = await b.get('/me');
  assert.equal(after.body.guest, true); assert.notEqual(after.body.id, ok.body.id);
});

test('passwords are stored hashed, never in clear', async () => {
  const c = client();
  const r = await c.post('/auth/register', { handle: 'hashcheck', name: 'H', password: 'super-secret-pw' });
  const raw = JSON.stringify(phiora.store.user(r.body.id));
  assert.ok(!raw.includes('super-secret-pw')); assert.match(phiora.store.user(r.body.id).passwordHash, /^scrypt\$/);
});

test('repeated wrong passwords are throttled', async () => {
  const a = client(); await a.post('/auth/register', { handle: 'locked', name: 'L', password: 'right-password' });
  const b = client(); let last;
  for (let i = 0; i < 9; i++) last = await b.post('/auth/signin', { handle: 'locked', password: 'wrong-' + i });
  assert.equal(last.status, 429);
  assert.equal((await b.post('/auth/signin', { handle: 'locked', password: 'right-password' })).status, 429);
});

test('demo users are listed when demo sign-in is on', async () => {
  const r = await client().get('/auth/demo-users');
  assert.deepEqual(r.body, [{ id: 'u_noor', name: 'Noor Hale', handle: 'noor.hale' }]);
  assert.equal((await client().get('/me')).body.canDemo, true);
});

const tokenOf = (link, param) => new URL(link).searchParams.get(param);

test('register with an email sends a verify link; the link works once', async () => {
  const c = client();
  const r = await c.post('/auth/register', { handle: 'vera', name: 'Vera', password: 'password-v', email: 'Vera@Example.com' });
  assert.equal(r.status, 200); assert.equal(r.body.email, 'vera@example.com'); assert.equal(r.body.emailVerified, false);
  assert.match(r.body.devLink, /^http:\/\/localhost:3101\/\?phi_verify=/);
  const t = tokenOf(r.body.devLink, 'phi_verify');
  const ok = await c.post('/auth/verify', { token: t });
  assert.equal(ok.status, 200); assert.equal(ok.body.me.emailVerified, true);
  assert.equal((await c.get('/me')).body.emailVerified, true);
  assert.equal((await c.post('/auth/verify', { token: t })).body.error, 'bad_token');
  assert.equal((await client().post('/auth/register', { handle: 'vera2', name: 'V', password: 'password-v', email: 'vera@example.com' })).body.error, 'email_taken');
  assert.equal((await client().post('/auth/register', { handle: 'vera3', name: 'V', password: 'password-v', email: 'not-an-email' })).body.error, 'bad_email');
});

test('sign in with email as well as handle', async () => {
  const b = client();
  const r = await b.post('/auth/signin', { handle: 'VERA@example.com', password: 'password-v' });
  assert.equal(r.status, 200); assert.equal(r.body.handle, 'vera');
});

test('forgot → reset: new password works, old one and old sessions do not', async () => {
  const a = client(); await a.post('/auth/register', { handle: 'rex', name: 'Rex', password: 'old-password', email: 'rex@example.com' });
  const f = await client().post('/auth/forgot', { login: 'rex@example.com' });
  assert.equal(f.status, 200); assert.equal(f.body.ok, true); assert.match(f.body.devLink, /phi_reset=/);
  const b = client();
  assert.equal((await b.post('/auth/reset', { token: tokenOf(f.body.devLink, 'phi_reset'), password: 'short' })).body.error, 'bad_password');
  const r = await b.post('/auth/reset', { token: tokenOf(f.body.devLink, 'phi_reset'), password: 'new-password' });
  assert.equal(r.status, 200); assert.equal(r.body.handle, 'rex'); assert.equal(r.body.emailVerified, true);
  assert.equal((await b.get('/me')).body.handle, 'rex');
  assert.equal((await a.get('/me')).body.guest, true);
  assert.equal((await b.post('/auth/reset', { token: tokenOf(f.body.devLink, 'phi_reset'), password: 'another-one' })).body.error, 'bad_token');
  assert.equal((await client().post('/auth/signin', { handle: 'rex', password: 'old-password' })).status, 401);
  assert.equal((await client().post('/auth/signin', { handle: 'rex', password: 'new-password' })).status, 200);
});

test('forgot never reveals whether an account exists', async () => {
  const r = await client().post('/auth/forgot', { login: 'nobody@example.com' });
  assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true });
});

test('change password needs the current one and signs out other browsers', async () => {
  const a = client(); await a.post('/auth/register', { handle: 'pia', name: 'Pia', password: 'first-pass' });
  const b = client(); await b.post('/auth/signin', { handle: 'pia', password: 'first-pass' });
  assert.equal((await a.post('/auth/password', { current: 'wrong-pass', password: 'second-pass' })).status, 401);
  assert.equal((await a.post('/auth/password', { current: 'first-pass', password: 'second-pass' })).status, 200);
  assert.equal((await a.get('/me')).body.handle, 'pia');
  assert.equal((await b.get('/me')).body.guest, true);
  assert.equal((await client().post('/auth/password', { current: 'x', password: 'yyyyyyyy' })).status, 401);
});

test('add an email later, then verify it', async () => {
  const c = client(); await c.post('/auth/register', { handle: 'late', name: 'Late', password: 'late-pass-1' });
  assert.equal((await c.post('/auth/email', { email: 'vera@example.com' })).body.error, 'email_taken');
  const r = await c.post('/auth/email', { email: 'late@example.com' });
  assert.equal(r.status, 200); assert.equal(r.body.emailVerified, false);
  assert.equal((await c.post('/auth/verify', { token: tokenOf(r.body.devLink, 'phi_verify') })).status, 200);
  assert.equal((await client().post('/auth/email', { email: 'g@example.com' })).body.error, 'sign_in');
});

test('outbox keeps the mails in dev', async () => {
  const { readFileSync } = await import('node:fs');
  const lines = readFileSync(join(root, 'data', 'outbox.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.ok(lines.some((m) => m.to === 'rex@example.com' && /Reset/.test(m.subject)));
  assert.ok(lines.every((m) => !/password-/.test(m.text)));
});

test('forgot is throttled per address', async () => {
  let last; for (let i = 0; i < 6; i++) last = await client().post('/auth/forgot', { login: 'x' + i });
  assert.equal(last.status, 429);
});

test('list signed-in browsers and sign one out', async () => {
  const a = client(); await a.post('/auth/register', { handle: 'sana', name: 'Sana', password: 'sana-pass-1' });
  const b = client('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile Safari/604.1');
  await b.post('/auth/signin', { handle: 'sana', password: 'sana-pass-1' });
  const list = (await a.get('/auth/sessions')).body;
  assert.equal(list.length, 2);
  assert.deepEqual(list.map((x) => x.browser).sort(), ['Chrome on Windows', 'Safari on iOS']);
  assert.equal(list.filter((x) => x.current).length, 1);
  assert.ok(list.every((x) => x.id.length === 16 && !('sid' in x)));
  const other = list.find((x) => !x.current);
  assert.equal((await a.post('/auth/sessions/revoke', { id: other.id })).body.revoked, 1);
  assert.equal((await b.get('/me')).body.guest, true);
  assert.equal((await a.post('/auth/sessions/revoke', { id: 'nope' })).status, 404);
  assert.equal((await a.get('/me')).body.handle, 'sana');
});

test('export your data (never the password hash)', async () => {
  const c = client(); await c.post('/auth/register', { handle: 'exa', name: 'Exa', password: 'exa-pass-1' }); await c.put('/state/votes', { p1: 'for' });
  const r = await c.get('/me/export');
  assert.equal(r.status, 200); assert.match(r.headers.get('content-disposition'), /phiace-exa\.json/);
  assert.deepEqual(r.body.user.docs.votes, { p1: 'for' }); assert.equal(r.body.user.passwordHash, undefined); assert.ok(r.body.user.wallet);
});

test('delete the account: confirm with handle + password; the handle is free again', async () => {
  const c = client(); await c.post('/auth/register', { handle: 'gone', name: 'Gone', password: 'gone-pass-1', email: 'gone@example.com' });
  assert.equal((await c.post('/auth/delete', { password: 'gone-pass-1', confirm: 'nope' })).body.error, 'confirm');
  assert.equal((await c.post('/auth/delete', { password: 'wrong-pass', confirm: 'gone' })).status, 401);
  assert.equal((await c.post('/auth/delete', { password: 'gone-pass-1', confirm: 'gone' })).body.ok, true);
  assert.equal((await client().post('/auth/signin', { handle: 'gone', password: 'gone-pass-1' })).status, 401);
  const again = await client().post('/auth/register', { handle: 'gone', name: 'New', password: 'new-pass-12', email: 'gone@example.com' });
  assert.equal(again.status, 200);
  assert.equal((await client().post('/auth/delete', {})).body.ok, true, 'a guest can drop its own data');
});

test('sessions expire after the idle window', async () => {
  const idle = createPhiora({ env: { PHI_SESSION_IDLE_DAYS: String(0.6 / 86400), PHI_QUIET: '1' }, dataDir: join(root, 'idle'), appsDir: join(root, 'apps'), shopDataDir: join(root, 'shop') });
  await new Promise((ok) => idle.server.listen(0, ok));
  const at = () => 'http://localhost:' + idle.server.address().port;
  try {
    const c = client(undefined, at); await c.post('/auth/register', { handle: 'idler', name: 'Idle', password: 'idle-pass-1' });
    assert.equal((await c.get('/me')).body.handle, 'idler');
    await new Promise((ok) => setTimeout(ok, 800));
    assert.equal((await c.get('/me')).body.guest, true);
  } finally { await new Promise((ok) => idle.server.close(ok)); }
});

test('singular names are the API, plural spellings still answer', async () => {
  const { singular } = await import('../src/server.mjs');
  assert.equal(singular('/apps/demo'), '/app/demo');
  assert.equal(singular('/items/themes'), '/item/theme');
  assert.equal(singular('/items/lk1/theme'), '/item/lk1/theme');
  assert.equal(singular('/auth/sessions/revoke'), '/auth/session/revoke');
  assert.equal(singular('/auth/demo-users'), '/auth/demo-user');
  assert.equal(singular('/app/demo'), '/app/demo');
  const c = client();
  assert.equal((await c.get('/app/demo')).body.app, 'demo');
  assert.equal((await c.get('/apps/demo')).body.app, 'demo');
  assert.equal((await c.get('/item/theme')).status, 200);
});
