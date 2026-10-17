// Identity delegation: the Phiora account (puijs apps/phiora-server) ↔ the PhiOne identity on the Phient platform.
//   1. Phiora says who is signed in (GET /me, session cookie).
//   2. Phiora issues a short-lived delegation for Phient (POST /auth/delegation → HS256 JWT).
//   3. Phione sends it to Phient as Authorization: Bearer; GET /v2/identity/me checks it and looks the identity up.
//   4. The link (email, node id, when) is kept on Phiora (/state/phione-link) so every device sees it.
import { createStore } from '@pui/store';
import { apiGet, apiPut, apiSend, hasApi } from '@phi-kit/api';
import { executeVerb, hasPhiadk, lastRefusal, phiGetResult, setDelegation } from './phiadkClient';

export type DelegationClaims = { iss: string; aud: string; sub: string; name: string; handle: string | null; email: string | null; email_verified: boolean; guest: boolean; sid: string; iat: number; exp: number };
export type Delegation = { token: string; claims: DelegationClaims; expiresAt: number; ephemeral?: boolean };
export type IdentityNode = { node_id?: string; email: string; display_name: string; job_title?: string; department?: string; office_location?: string; account_enabled?: boolean; groups?: string[]; licenses?: string[] };
export type Morphism = { morphism_id: string; morphism_type: string; status: string; parameters: Record<string, unknown>; executed_at?: string | null };
export type Link = { email: string; nodeId?: string; displayName?: string; linkedAt: number; requestId?: string; requestStatus?: string };

type State = {
  delegation: Delegation | null;
  identity: IdentityNode | null;
  mode: 'local' | 'remote' | 'off' | null;
  link: Link | null;
  request: Morphism | null;
  busy: string | null;
  error: string | null;
};

export const identityStore = createStore<State>(() => ({ delegation: null, identity: null, mode: null, link: null, request: null, busy: null, error: null }));
const set = (p: Partial<State>) => identityStore.setState(p);
const message = (d: unknown, fallback: string) => (d && typeof d === 'object' && 'message' in d ? String((d as { message: unknown }).message) : typeof d === 'string' ? d : fallback);

export const phioraOn = hasApi;

/** Ask Phiora for a delegation (audience phient) and hand it to the Phient client. */
export async function issueDelegation() {
  if (!hasApi) return null;
  set({ busy: 'delegate', error: null });
  const r = await apiSend<Delegation>('POST', '/auth/delegation', { audience: 'phient' });
  if (!r.ok) { set({ busy: null, error: r.message || 'Phiora did not issue a delegation.' }); return null; }
  setDelegation(r.body); set({ delegation: r.body, busy: null });
  return r.body;
}

/** Who Phient says you are, from the delegation (GET /v2/identity/me). */
export async function resolveIdentity() {
  if (!hasPhiadk) return null;
  const d = identityStore.getState().delegation ?? (await issueDelegation());
  if (!d) return null;
  set({ busy: 'resolve', error: null });
  const r = await phiGetResult<{ mode: State['mode']; claims: DelegationClaims; identity: IdentityNode | null }>('/v2/identity/me');
  if (!r.ok) { set({ busy: null, error: r.status === 0 ? 'The Phient API could not be reached.' : message(r.detail, 'Phient refused the delegation.') }); return null; }
  set({ busy: null, identity: r.body.identity, mode: r.body.mode });
  return r.body.identity;
}

/** Keep the link on Phiora, so it follows the account. */
export async function linkIdentity() {
  const { identity, request } = identityStore.getState(); if (!identity) return;
  const link: Link = { email: identity.email, nodeId: identity.node_id, displayName: identity.display_name, linkedAt: Date.now(), requestId: request?.morphism_id, requestStatus: request?.status };
  set({ link }); if (hasApi) await apiPut('/state/phione-link', link);
}
export async function unlinkIdentity() { set({ link: null }); if (hasApi) await apiPut('/state/phione-link', null); }

/** Ask PhiOne to provision an identity for this account (an approval-gated morphism). */
export async function requestIdentity(name: string, email: string) {
  if (!identityStore.getState().delegation || identityStore.getState().delegation!.expiresAt < Date.now()) await issueDelegation();
  set({ busy: 'request', error: null });
  const r = await executeVerb('phione', 'provision_identity', { user_data: { email, display_name: name, department: 'Phiace', job_title: 'Member' } });
  const m = (r?.results as { output?: Morphism } | undefined)?.output ?? null;
  set({ busy: null, request: m, error: m ? null : lastRefusal?.message ?? 'PhiOne did not answer.' });
  const { link } = identityStore.getState(); if (m && link && hasApi) await apiPut('/state/phione-link', { ...link, requestId: m.morphism_id, requestStatus: m.status });
}

export async function loadLink() {
  if (!hasApi) return;
  const l = await apiGet<Link | null>('/state/phione-link'); if (l) set({ link: l });
}
