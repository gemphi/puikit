// Accounts: handle + password (scrypt), guest upgrade, sign-in throttling.
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const N = 16384, KEYLEN = 64;
export const HANDLE = /^[a-z0-9][a-z0-9._]{2,29}$/;

export class AuthError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N });
  return `scrypt$${N}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [kind, n, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const want = Buffer.from(hash, 'base64');
  const got = scryptSync(String(password), Buffer.from(salt, 'base64'), want.length, { N: Number(n) });
  return got.length === want.length && timingSafeEqual(got, want);
}

export function checkSignup({ handle, name, password }) {
  const h = String(handle || '').trim().toLowerCase();
  if (!HANDLE.test(h)) throw new AuthError(400, 'bad_handle', 'Handle: 3–30 characters, letters, numbers, dots or underscores.');
  const n = String(name || '').trim();
  if (n.length < 1 || n.length > 60) throw new AuthError(400, 'bad_name', 'Name: 1–60 characters.');
  checkPassword(password);
  return { handle: h, name: n, password };
}

export function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) throw new AuthError(400, 'bad_password', 'Password: at least 8 characters.');
  return password;
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
/** Normalised address, or throws. Empty → null (email is optional). */
export function checkEmail(email, { optional = false } = {}) {
  const e = String(email ?? '').trim().toLowerCase();
  if (!e && optional) return null;
  if (!EMAIL.test(e)) throw new AuthError(400, 'bad_email', 'That email address does not look right.');
  return e;
}

/** Failed sign-ins per key (ip|handle), sliding window. */
export function throttle({ max = 8, windowMs = 10 * 60 * 1000 } = {}) {
  const fails = new Map();
  const recent = (k) => (fails.get(k) || []).filter((t) => Date.now() - t < windowMs);
  return {
    blocked: (k) => recent(k).length >= max,
    fail: (k) => fails.set(k, [...recent(k), Date.now()]),
    clear: (k) => fails.delete(k),
  };
}

/** What a client may see about a user. */
export const publicMe = (u, extra = {}) => ({ id: u.id, name: u.name, handle: u.handle ?? null, guest: !!u.guest, email: u.email ?? null, emailVerified: !!u.emailVerified, ...extra });
