// Delegation: Phiora vouches for who is signed in to another service (the Python Phient platform, Phione).
// The token is a standard JWT (HS256), so any service holding the shared secret can check it with a stock
// library (PyJWT, jose) or with phient's phiadk.phiapi.delegation. Claims: iss, aud, sub (the Phiora user id),
// name, handle, email, email_verified, guest, sid (the public session handle), iat, exp.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
const unb64 = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
const mac = (secret, data) => createHmac('sha256', secret).update(data).digest('base64url');

export class DelegationError extends Error { constructor(code, message) { super(message); this.code = code; } }

/** The secret from PHI_DELEGATION_SECRET; without it a random one per process (tokens die with a restart). */
export function delegationSecret(env) {
  const s = env.PHI_DELEGATION_SECRET;
  if (s && s.length >= 16) return { secret: s, ephemeral: false };
  return { secret: randomBytes(32).toString('base64url'), ephemeral: true };
}

export function signDelegation(claims, secret, { ttlMs = 10 * 60 * 1000, now = Date.now() } = {}) {
  const iat = Math.floor(now / 1000), exp = iat + Math.floor(ttlMs / 1000);
  const body = { iss: 'phiora', ...claims, iat, exp };
  const head = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(body);
  return { token: head + '.' + mac(secret, head), claims: body, expiresAt: exp * 1000 };
}

export function verifyDelegation(token, secret, { audience, now = Date.now() } = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new DelegationError('malformed', 'Not a delegation token.');
  const [h, p, sig] = parts; let head, body;
  try { head = unb64(h); body = unb64(p); } catch { throw new DelegationError('malformed', 'Not a delegation token.'); }
  if (head.alg !== 'HS256') throw new DelegationError('alg', 'Unsupported algorithm.');
  const want = Buffer.from(mac(secret, h + '.' + p)); const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) throw new DelegationError('signature', 'Bad signature.');
  if (body.iss !== 'phiora') throw new DelegationError('issuer', 'Not issued by Phiora.');
  if (typeof body.exp !== 'number' || body.exp * 1000 <= now) throw new DelegationError('expired', 'The delegation has expired.');
  if (audience && body.aud !== audience) throw new DelegationError('audience', 'Issued for another service.');
  return body;
}
