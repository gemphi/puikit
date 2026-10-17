/**
 * The Phient platform client for every Phiace app (gemphi/phient → phiadk.phiapi, FastAPI on :8000).
 *
 * VITE_PHIADK_API unset → no platform: agent blocks say how to connect and run nothing.
 * VITE_PHIADK_API set   → GET /v2/agents (the catalogue) and POST /v2/agents/{id}/execute (run a verb).
 *
 * Who asks: with Phiora on (VITE_PHI_API), every call carries a Phiora delegation (POST /auth/delegation,
 * audience "phient") as Authorization: Bearer, renewed a minute before it expires; Phient checks it in
 * GET /v2/identity/me (phiadk/phiapi/delegation.py).
 */
import { apiSend, hasApi } from './api';
import { currentMe } from './auth';

const BASE = ((import.meta.env.VITE_PHIADK_API as string | undefined) || '').replace(/\/$/, '');
export const hasPhient = BASE !== '';

export type PhientAgent = { agent_id: string; agent_name: string; layer?: string; description?: string; version?: string; verbs?: string[] };
export type PhientActor = { sub: string; name?: string; handle?: string | null; email?: string | null; sid?: string; guest?: boolean };
export type PhientRun = { agent_id: string; verb: string; confidence?: number; results?: { plan?: unknown; output?: unknown; eval?: { status?: string; confidence?: number }; duration_ms?: number; error?: string; actor?: PhientActor } };
export type PhientRefusal = { refused: true; status: number; error: string; message: string };
/** The platform's write policy (GET /v2/identity/delegation): which verbs need a signed-in Phiora user. */
export type PhientPolicy = { mode: 'local' | 'remote' | 'off'; require: 'writes' | 'all' | 'off'; write_verbs: Record<string, string[]> };

let delegation: { token: string; expiresAt: number; claims: { sub: string } } | null = null;
async function bearer(): Promise<Record<string, string>> {
  if (!hasApi) return {};
  // Renewed a minute before it ends, and whenever the signed-in user changes (sign in, sign out, switch).
  const who = currentMe()?.id;
  if (!delegation || delegation.expiresAt - 60_000 < Date.now() || (who && delegation.claims.sub !== who)) {
    const r = await apiSend<{ token: string; expiresAt: number; claims: { sub: string } }>('POST', '/auth/delegation', { audience: 'phient' });
    delegation = r.ok ? r.body : null;
  }
  return delegation ? { authorization: 'Bearer ' + delegation.token } : {};
}

let catalogue: Promise<PhientAgent[]> | null = null;
/** The agent catalogue, fetched once per page load. */
export function phientAgents(): Promise<PhientAgent[]> {
  if (!hasPhient) return Promise.resolve([]);
  if (!catalogue) catalogue = (async () => {
    try {
      const r = await fetch(BASE + '/v2/agents', { headers: await bearer() });
      if (!r.ok) return [];
      const body = (await r.json()) as PhientAgent[] | { agents: PhientAgent[] };
      return Array.isArray(body) ? body : body.agents ?? [];
    } catch { return []; }
  })();
  return catalogue;
}

let policy: Promise<PhientPolicy | null> | null = null;
export function phientPolicy(): Promise<PhientPolicy | null> {
  if (!hasPhient) return Promise.resolve(null);
  if (!policy) policy = fetch(BASE + '/v2/identity/delegation').then((r) => (r.ok ? (r.json() as Promise<PhientPolicy>) : null)).catch(() => null);
  return policy;
}
/** Does this verb need a signed-in Phiora user on this platform? */
export const needsSignIn = (p: PhientPolicy | null, agentId: string, verb: string) =>
  !!p && (p.require === 'all' || (p.require === 'writes' && (p.write_verbs[agentId] ?? []).includes(verb)));

/** Run one verb on one agent. null when the platform is off or did not answer; a refusal when it said no (401). */
export async function runVerb(agentId: string, verb: string, parameters: Record<string, unknown> = {}): Promise<PhientRun | PhientRefusal | null> {
  if (!hasPhient) return null;
  try {
    const r = await fetch(`${BASE}/v2/agents/${encodeURIComponent(agentId)}/execute`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(await bearer()) }, body: JSON.stringify({ verb, parameters }),
    });
    if (r.ok) return (await r.json()) as PhientRun;
    const body = (await r.json().catch(() => null)) as { detail?: { error?: string; message?: string } | string } | null;
    const d = body?.detail;
    return { refused: true, status: r.status, error: typeof d === 'object' && d ? d.error ?? 'refused' : 'refused', message: typeof d === 'object' && d ? d.message ?? 'Refused.' : String(d ?? 'Refused.') };
  } catch { return null; }
}
