// The Phient platform API (gemphi/phient → phiadk.phiapi, FastAPI on :8000).
//   VITE_PHIADK_API=http://localhost:8000 npm run dev
export const PHIADK = String(import.meta.env.VITE_PHIADK_API ?? '').replace(/\/$/, '');
export const hasPhiadk = PHIADK !== '';

/** The Phiora delegation Phione holds (identityStore sets it): sent as Authorization: Bearer so Phient knows who asks. */
let bearer: { token: string; expiresAt: number } | null = null;
export const setDelegation = (d: { token: string; expiresAt: number } | null) => { bearer = d; };
const auth = (): Record<string, string> => (bearer && bearer.expiresAt > Date.now() ? { authorization: 'Bearer ' + bearer.token } : {});

export async function phiGet<T>(path: string): Promise<T | null> {
  if (!hasPhiadk) return null;
  try { const r = await fetch(PHIADK + path, { headers: auth() }); return r.ok ? ((await r.json()) as T) : null; } catch { return null; }
}

/** Like phiGet but keeps the status and FastAPI's detail, for pages that explain a refusal. */
export async function phiGetResult<T>(path: string): Promise<{ ok: true; body: T } | { ok: false; status: number; detail: unknown }> {
  if (!hasPhiadk) return { ok: false, status: 0, detail: 'off' };
  try {
    const r = await fetch(PHIADK + path, { headers: auth() }); const body = await r.json().catch(() => null);
    return r.ok ? { ok: true, body: body as T } : { ok: false, status: r.status, detail: (body as { detail?: unknown } | null)?.detail };
  } catch { return { ok: false, status: 0, detail: 'unreachable' }; }
}

/** The last refusal (401/403) from the platform, so a caller that got null can say why. */
export let lastRefusal: { status: number; error: string; message: string } | null = null;

export async function phiPost<T>(path: string, body: unknown): Promise<T | null> {
  if (!hasPhiadk) return null;
  try {
    const r = await fetch(PHIADK + path, { method: 'POST', headers: { 'content-type': 'application/json', ...auth() }, body: JSON.stringify(body) });
    lastRefusal = null;
    if (r.ok) return (await r.json()) as T;
    if (r.status === 401 || r.status === 403) {
      const d = ((await r.json().catch(() => null)) as { detail?: { error?: string; message?: string } } | null)?.detail;
      lastRefusal = { status: r.status, error: d?.error ?? 'refused', message: d?.message ?? 'The platform refused.' };
    }
    return null;
  } catch { return null; }
}

export type RawAgent = { agent_id: string; agent_name: string; layer?: string; description?: string; version?: string; specs?: string[]; tasks?: string[]; verbs?: string[] };
export type VerbResult = { agent_id: string; verb: string; confidence?: number; results?: { plan?: unknown; output?: unknown; eval?: { status?: string }; duration_ms?: number } };

/** POST /v2/agents/{id}/execute */
export const executeVerb = (agentId: string, verb: string, parameters: Record<string, unknown> = {}) =>
  phiPost<VerbResult>(`/v2/agents/${encodeURIComponent(agentId)}/execute`, { verb, parameters });
