// The account routes of the Phiora API: register, sign in, email, password reset and change, sessions, export,
// delete, demo sign-in and sign out. The request handler (server.mjs) hands them what they read; a route that
// answered has ended the response.
import { checkEmail, checkPassword, checkSignup, hashPassword, verifyPassword } from './auth.mjs';
import { ensureWallet } from './ledger.mjs';
import { resetMail } from './mail.mjs';

/** Answer `route` when it is an account route; otherwise leave the response open for the next routes. */
/** How many of the seeded people anyone may be, to try things (PHI_DEMO_USERS): the main accounts, 64 by default. */
const DEMO_USERS = Math.max(1, Math.min(500, Number(process.env.PHI_DEMO_USERS) || 64));
export async function accountRoute(route, { RESET_TTL, accountOf, browserOf, demoLogin, devLinks, fail, forgots, linkFor, loopback, mailer, me, readBody, req, res, seedHandles, seedUsers, send, sendVerify, sessionId, sid, signins, store, token, u }) {
    // Accounts. Registering upgrades the current guest in place, so its wallet, looks and saved state carry over.
    if (route === 'POST /auth/register') {
      if (!u.guest) return fail(res, 409, 'signed_in', 'Sign out first to create another account.');
      const body = (await readBody(req)) || {};
      const { handle, name, password } = checkSignup(body); const email = checkEmail(body.email, { optional: true });
      if (await store.handleOwner(handle) || seedHandles.has(handle)) return fail(res, 409, 'handle_taken', 'That handle is taken.');
      if (email && await store.emailOwner(email)) return fail(res, 409, 'email_taken', 'That email is already on an account.');
      Object.assign(u, { guest: false, handle, name, passwordHash: hashPassword(password), registeredAt: Date.now(), email, emailVerified: false });
      await store.claimHandle(handle, u.id); if (email) await store.claimEmail(email, u.id); await store.saveUser(u);
      return send(res, 200, { ...me(u), ...(email ? await sendVerify(req, u) : {}) });
    }
    if (route === 'POST /auth/signin') {
      const { handle, password } = (await readBody(req)) || {};
      const h = String(handle || '').trim().toLowerCase(); const key = (req.socket.remoteAddress || '') + '|' + h;
      if (signins.blocked(key)) return fail(res, 429, 'throttled', 'Too many tries — wait a few minutes.');
      const acct = await accountOf(h);
      if (!acct || !verifyPassword(password, acct.passwordHash)) { signins.fail(key); return fail(res, 401, 'bad_credentials', 'Handle or password is wrong.'); }
      signins.clear(key); await store.setSessionUser(sid, acct.id, String(req.headers['user-agent'] || ''));
      return send(res, 200, me(acct));
    }
    // Email: add or change (signed in), confirm with the emailed link.
    if (route === 'POST /auth/email') {
      if (u.guest) return fail(res, 401, 'sign_in', 'Create an account or sign in first.');
      const email = checkEmail(((await readBody(req)) || {}).email);
      const owner = await store.emailOwner(email); if (owner && owner !== u.id) return fail(res, 409, 'email_taken', 'That email is already on an account.');
      Object.assign(u, { email, emailVerified: owner === u.id ? !!u.emailVerified : false }); await store.claimEmail(email, u.id); await store.saveUser(u);
      return send(res, 200, { ...me(u), ...(u.emailVerified ? {} : await sendVerify(req, u)) });
    }
    if (route === 'POST /auth/verify') {
      const t = await store.takeToken('verify', String(((await readBody(req)) || {}).token || ''));
      const acct = t && await store.user(t.userId);
      if (!acct || acct.email !== t.data?.email) return fail(res, 400, 'bad_token', 'This link has expired or was already used.');
      acct.emailVerified = true; await store.saveUser(acct);
      return send(res, 200, { ok: true, email: acct.email, ...(acct.id === u.id ? { me: me(acct) } : {}) });
    }
    // Password reset: always answers ok (no account probing); mails a 30-minute link when the account has an email.
    if (route === 'POST /auth/forgot') {
      const key = req.socket.remoteAddress || ''; if (forgots.blocked(key)) return fail(res, 429, 'throttled', 'Too many requests — wait a few minutes.');
      forgots.fail(key);
      const acct = await accountOf(((await readBody(req)) || {}).login); let extra = {};
      if (acct?.email) {
        const t = token(); await store.dropTokens('reset', acct.id); await store.putToken('reset', t, acct.id, { email: acct.email }, RESET_TTL);
        const link = linkFor(req, 'phi_reset', t); await mailer.send(resetMail(acct.email, acct.name, link));
        if (devLinks && loopback(req)) extra = { devLink: link };
      }
      return send(res, 200, { ok: true, ...extra });
    }
    if (route === 'POST /auth/reset') {
      const body = (await readBody(req)) || {}; const password = checkPassword(body.password);
      const t = await store.takeToken('reset', String(body.token || '')); const acct = t && await store.user(t.userId);
      if (!acct) return fail(res, 400, 'bad_token', 'This link has expired or was already used.');
      acct.passwordHash = hashPassword(password); if (acct.email && acct.email === t.data?.email) acct.emailVerified = true;
      await store.saveUser(acct); await store.dropUserSessions(acct.id); await store.setSessionUser(sid, acct.id, String(req.headers['user-agent'] || ''));
      return send(res, 200, me(acct));
    }
    if (route === 'POST /auth/password') {
      if (u.guest) return fail(res, 401, 'sign_in', 'Sign in first.');
      const { current, password } = (await readBody(req)) || {}; const key = (req.socket.remoteAddress || '') + '|' + u.handle;
      if (signins.blocked(key)) return fail(res, 429, 'throttled', 'Too many tries — wait a few minutes.');
      if (!verifyPassword(current, u.passwordHash)) { signins.fail(key); return fail(res, 401, 'bad_credentials', 'Current password is wrong.'); }
      u.passwordHash = hashPassword(checkPassword(password)); await store.saveUser(u); await store.dropUserSessions(u.id, sid);
      return send(res, 200, me(u));
    }
    // Signed-in browsers: list them, sign one (or all others) out.
    if (route === 'GET /auth/session') {
      return send(res, 200, await store.userSessions(u.id).map((x) => ({ id: sessionId(x.sid), current: x.sid === sid, browser: browserOf(x.ua), created: x.created, lastSeen: x.at })));
    }
    if (route === 'POST /auth/session/revoke') {
      const { id, others } = (await readBody(req)) || {}; let n = 0;
      for (const x of await store.userSessions(u.id)) if (x.sid !== sid && (others || sessionId(x.sid) === id)) { await store.dropSession(x.sid); n++; }
      return n || others ? send(res, 200, { ok: true, revoked: n }) : fail(res, 404, 'no_session', 'No such session.');
    }
    // Your data: download everything Phiora keeps about you; or delete the account.
    if (route === 'GET /me/export') {
      const { passwordHash, ...doc } = u; void passwordHash;
      return send(res, 200, { exportedAt: new Date().toISOString(), user: doc }, { 'content-disposition': `attachment; filename="phiace-${u.handle || u.id}.json"` });
    }
    if (route === 'POST /auth/delete') {
      const { password, confirm } = (await readBody(req)) || {};
      if (!u.guest) {
        if (String(confirm || '').toLowerCase() !== u.handle) return fail(res, 400, 'confirm', 'Type your handle to confirm.');
        if (!verifyPassword(password, u.passwordHash)) return fail(res, 401, 'bad_credentials', 'Password is wrong.');
      }
      await store.deleteUser(u.id); res.setHeader('set-cookie', 'phi_sid=; Path=/; Max-Age=0');
      return send(res, 200, { ok: true });
    }
    // Demo sign-in as a seeded member (no password) — PHI_DEMO_LOGIN=0 turns it off.
    if (route === 'GET /auth/demo-user') return demoLogin ? send(res, 200, seedUsers.slice(0, DEMO_USERS).map((x) => ({ id: x.id, name: x.name, handle: x.handle }))) : fail(res, 403, 'disabled', 'Demo sign-in is off.');
    if (route === 'POST /auth/login' || route === 'POST /auth/demo') {
      if (!demoLogin) return fail(res, 403, 'disabled', 'Demo sign-in is off.');
      const { userId } = (await readBody(req)) || {};
      const seed = seedUsers.find((x) => x.id === userId);
      if (!seed) return fail(res, 404, 'no_user', 'Unknown user.');
      // Accounts live under the same md5 ids as the records, so a person owns the records that name them.
      const uid = ((await store.global('items.idmap')) ?? {})[seed.id] ?? seed.id;
      const existing = await store.user(uid) ?? await store.createUser({ id: uid, name: seed.name, handle: seed.handle });
      await store.saveUser(ensureWallet(existing)); await store.setSessionUser(sid, uid, String(req.headers['user-agent'] || ''));
      return send(res, 200, me(existing));
    }
    if (route === 'POST /auth/logout') { await store.dropSession(sid); res.setHeader('set-cookie', 'phi_sid=; Path=/; Max-Age=0'); return send(res, 200, { ok: true }); }
}
