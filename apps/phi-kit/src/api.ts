/**
 * Phiora client. Every write the apps make goes through here.
 *
 * VITE_PHI_API unset  → values live in localStorage only (offline / prototype mode).
 * VITE_PHI_API set    → localStorage is a read-through cache; Phiora is the source of truth.
 *
 * Endpoints (all JSON, relative to VITE_PHI_API):
 *   GET  /apps/<key>        app content (nav + views + blocks)         , see data.ts loadApp
 *   GET  /state/<name>      one user-state document, 404 when never set
 *   PUT  /state/<name>      replace that document (body = the value)
 *   POST /chat              { app, persona, messages: [{ role, text }] } → { text, href?, rsvp? }
 *   POST /wallet/swap|spend|earn, POST /shop/buy|offer|sell   money moves; the server owns wallet, history, owned
 *
 * State documents used today: wallet, history, follows, owned, cart-offers, profile, votes,
 * rsvps, flags (likes/saves/follows/RSVPs), chats. The signed-in user comes from the session
 * cookie (credentials: 'include'), so no user id travels in the path.
 */
import { useSyncExternalStore } from 'react';

const BASE = ((import.meta.env.VITE_PHI_API as string | undefined) || '').replace(/\/$/, '');
export const hasApi = BASE !== '';

const req = async <T>(method: string, path: string, body?: unknown): Promise<T | undefined> => {
  if (!hasApi) return undefined;
  try {
    const r = await fetch(BASE + path, {
      method, credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!r.ok) return undefined;
    const txt = await r.text();
    return txt ? (JSON.parse(txt) as T) : undefined;
  } catch { return undefined; }
};
/** Like apiPost but keeps the server's error ({ error, message }) instead of collapsing it to undefined. */
export type ApiResult<T> = { ok: true; body: T } | { ok: false; status: number; error: string; message: string };
export const apiSend = async <T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> => {
  if (!hasApi) return { ok: false, status: 0, error: 'no_api', message: 'No Phiora API configured.' };
  try {
    const r = await fetch(BASE + path, { method, credentials: 'include', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const txt = await r.text(); const j = txt ? JSON.parse(txt) : undefined;
    return r.ok ? { ok: true, body: j as T } : { ok: false, status: r.status, error: j?.error ?? 'error', message: j?.message ?? 'Request failed (' + r.status + ').' };
  } catch { return { ok: false, status: 0, error: 'network', message: 'Can’t reach Phiora.' }; }
};
export const apiGet = <T>(path: string) => req<T>('GET', path);
export const apiPut = <T>(path: string, body: unknown) => req<T>('PUT', path, body);
export const apiPost = <T>(path: string, body: unknown) => req<T>('POST', path, body);

export type Persisted<T> = {
  get: () => T; set: (v: T) => void; subscribe: (f: () => void) => () => void; use: () => T;
  /** Replace the local copy with what the server said (no write back). */
  replace: (v: T) => void;
  /** Re-read from Phiora. */
  refresh: () => Promise<void>;
};
const registry = new Map<string, Persisted<unknown>>();
/** Re-read every user document (after sign-in / sign-out the user behind the cookie changed). */
export const refreshAll = () => Promise.all([...registry.values()].map((d) => d.refresh()));

/**
 * A user-state document: synchronous get/set (so existing helper signatures stay the same),
 * cached in localStorage under `phi.<name>`, hydrated from and written back to Phiora.
 * `merge` combines the server copy with the initial value (defaults to shallow-merge for objects).
 * `serverOwned` documents (wallet, history, owned) are never PUT: Phiora changes them through /wallet and /shop.
 * One instance per name: a second call returns the first, so shared code and the app see the same document.
 */
export function persisted<T>(name: string, init: T, merge: (init: T, server: T) => T = defaultMerge, opts: { serverOwned?: boolean } = {}): Persisted<T> {
  const existing = registry.get(name); if (existing) return existing as Persisted<T>;
  const key = 'phi.' + name;
  let v: T = (() => { try { const s = localStorage.getItem(key); return s ? merge(init, JSON.parse(s)) : init; } catch { return init; } })();
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((f) => f());
  const cache = () => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode */ } };
  const refresh = () => apiGet<T>('/state/' + name).then((server) => { if (server !== undefined) { v = merge(init, server); cache(); emit(); } });
  if (hasApi) void refresh();
  const api: Persisted<T> = {
    get: () => v,
    set: (n) => { v = n; cache(); emit(); if (!opts.serverOwned) void apiPut('/state/' + name, n); },
    replace: (n) => { v = n; cache(); emit(); },
    refresh,
    subscribe: (f) => { subs.add(f); return () => { subs.delete(f); }; },
    use: () => useSyncExternalStore(api.subscribe, api.get),
  };
  registry.set(name, api as Persisted<unknown>);
  return api;
}

function defaultMerge<T>(init: T, server: T): T {
  if (init && server && typeof init === 'object' && typeof server === 'object' && !Array.isArray(init) && !Array.isArray(server))
    return { ...(init as object), ...(server as object) } as T;
  return server ?? init;
}

export type ChatTurn = { role: 'user' | 'assistant'; text: string };
export type ChatReply = { text: string; href?: string; rsvp?: string };

/** Persona chat through Phiora's model proxy (the server holds the model key). undefined → caller uses its offline reply. */
export const chat = (app: string, persona: string, messages: ChatTurn[]) =>
  apiPost<ChatReply>('/chat', { app, persona, messages }).then((r) => (r && typeof r.text === 'string' && r.text.trim() ? r : undefined));
