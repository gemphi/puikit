// Account email + password recovery against Phiora (/auth/email, /auth/verify, /auth/forgot, /auth/reset, /auth/password).
// The emailed links land on the app as ?phi_verify=<token> or ?phi_reset=<token>; readAccountLink() picks them up once.
import { apiGet, apiSend, refreshAll } from './api';
import { loadMe, type Me } from './auth';

/** Me plus the account email fields Phiora returns. */
export type Account = Me & { email?: string | null; emailVerified?: boolean };
/** Dev only: with no mail transport configured, Phiora hands the emailed link back to requests from the same machine. */
export type DevLinked = { devLink?: string };

const refreshMe = async <R extends { ok: boolean }>(r: R) => { if (r.ok) await loadMe(); return r; };
const switched = async <R extends { ok: boolean }>(r: R) => { if (r.ok) { await loadMe(); await refreshAll(); } return r; };

export const registerAccount = (handle: string, name: string, password: string, email?: string) =>
  apiSend<Account & DevLinked>('POST', '/auth/register', { handle, name, password, ...(email ? { email } : {}) }).then(switched);
export const setEmail = (email: string) => apiSend<Account & DevLinked>('POST', '/auth/email', { email }).then(refreshMe);
export const verifyEmail = (token: string) => apiSend<{ ok: true; email: string }>('POST', '/auth/verify', { token }).then(refreshMe);
export const forgotPassword = (login: string) => apiSend<{ ok: true } & DevLinked>('POST', '/auth/forgot', { login });
export const resetPassword = (token: string, password: string) => apiSend<Account>('POST', '/auth/reset', { token, password }).then(switched);
export const changePassword = (current: string, password: string) => apiSend<Account>('POST', '/auth/password', { current, password });

export type AccountLink = { kind: 'verify' | 'reset'; token: string };
/** Read ?phi_verify / ?phi_reset from the address bar and remove it (so a reload doesn't reuse a spent token). */
export function readAccountLink(): AccountLink | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const verify = url.searchParams.get('phi_verify'); const reset = url.searchParams.get('phi_reset');
  if (!verify && !reset) return null;
  url.searchParams.delete('phi_verify'); url.searchParams.delete('phi_reset');
  window.history.replaceState(window.history.state, '', url.pathname + (url.search ? url.search : '') + url.hash);
  return verify ? { kind: 'verify', token: verify } : { kind: 'reset', token: reset! };
}

/** Browsers signed in to this account (Phiora never exposes the cookie, only a short id). */
export type SessionInfo = { id: string; current: boolean; browser: string; created: number; lastSeen: number };
export const listSessions = () => apiGet<SessionInfo[]>('/auth/session').then((v) => v ?? []);
export const revokeSession = (id: string) => apiSend<{ ok: true; revoked: number }>('POST', '/auth/session/revoke', { id });
export const revokeOtherSessions = () => apiSend<{ ok: true; revoked: number }>('POST', '/auth/session/revoke', { others: true });
/** Link that downloads everything Phiora keeps about you (cookie-authenticated). */
export const exportUrl = () => String(import.meta.env.VITE_PHI_API ?? '').replace(/\/$/, '') + '/me/export';
export const deleteAccount = (password: string, confirm: string) => apiSend<{ ok: true }>('POST', '/auth/delete', { password, confirm }).then(switched);
