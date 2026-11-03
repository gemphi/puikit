// Thematic kinds come from the designers. The data ships `specs.theme` (pending until supplied); a designer adds kinds
// in the item sheet. With VITE_PHI_API they go to Phiora (PUT /item/<id>/theme, only the look's designer may; everyone
// reads GET /item/theme); without it they are kept on this device.
import { useSyncExternalStore } from 'react';
import { apiGet, apiSend, hasApi, persisted } from '@phi-kit/api';
import { D, clubOf } from './data';
import type { ID, ShopLook } from '../types/phiegg';

export type Theme = { kinds: string[]; mood: string | null; story: string | null; colours?: string[]; by?: ID; at?: number };
const LOCAL = persisted<Record<ID, Theme>>('itemThemesLocal', {});
let server: Record<ID, Theme> = {}; const subs = new Set<() => void>();
if (hasApi) void apiGet<Record<ID, Theme>>('/item/theme').then((t) => { if (t) { server = t; subs.forEach((f) => f()); } });
const subscribe = (f: () => void) => { subs.add(f); const off = LOCAL.subscribe(f); return () => { subs.delete(f); off(); }; };

/** The look's theme: a designer's (server, else this device) over the shipped specs. */
export function themeOf(l: ShopLook): Theme & { source: 'designer' | 'pending' } {
  const t = server[l.id] ?? LOCAL.get()[l.id];
  if (t?.kinds?.length) return { ...t, source: 'designer' };
  const s = l.specs?.theme; return { kinds: s?.kinds ?? [], mood: s?.mood ?? null, story: s?.story ?? null, colours: s?.colours ?? [], source: s?.kinds?.length ? 'designer' : 'pending' };
}
export const useTheme = (l: ShopLook) => { useSyncExternalStore(subscribe, () => server[l.id] ?? LOCAL.get()[l.id]); return themeOf(l); };

/** Who may set it: the house's designer. Offline (no API) anyone may, and it stays on this device. */
export const designerOf = (l: ShopLook) => l.specs?.provenance?.designerId ?? clubOf(l.specs?.provenance?.clubId)?.founderId;
export const canDesign = (l: ShopLook) => !hasApi || designerOf(l) === D.core.currentUserId;

export async function saveTheme(l: ShopLook, t: Theme): Promise<{ ok: boolean; message?: string }> {
  if (!hasApi) { LOCAL.set({ ...LOCAL.get(), [l.id]: { ...t, by: D.core.currentUserId, at: Date.now() } }); return { ok: true }; }
  const r = await apiSend<Theme>('PUT', `/item/${encodeURIComponent(l.id)}/theme`, t);
  if (!r.ok) return { ok: false, message: r.message };
  server = { ...server, [l.id]: r.body }; subs.forEach((f) => f()); return { ok: true };
}

/** The colours a look's page wears when it has a set theme: the designer's, else the dress colour; none while pending. */
export function themeColours(l?: ShopLook): [string, string | null] | null {
  if (!l) return null; const th = themeOf(l); if (th.source !== 'designer') return null;
  return [th.colours?.[0] ?? l.hex, th.colours?.[1] ?? null];
}
/** Subscribes so a designer's save re-themes the open page. */
export const useThemeColours = (l?: ShopLook) => { useSyncExternalStore(subscribe, () => (l ? server[l.id] ?? LOCAL.get()[l.id] : undefined)); return themeColours(l); };
