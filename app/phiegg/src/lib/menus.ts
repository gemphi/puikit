// Phiegg's menus are records in Phiora like every app's: the rail entries are `menu` records of app phiegg, each
// panel section a sub-menu, each destination a menu under it, each phone tab a menu in slot `mobile` (phiora-server/src/apps.mjs). data/phiegg.json is the
// seed and the bundled copy; with Phiora on, bootMenus() swaps in what the database holds, so a renamed or added
// menu entry shows on the next load. The rail and its panels are rebuilt here from that one tree.
import { apiSend } from '@phi-kit/api';
import file from '../data/phiegg.json';

export type RailItem = { id: string; icon: string; label: string; tab?: string; role?: string; apps?: string[]; addLabel?: string };
export type SecItem = { label: string; tab: string; icon: string; source?: string; panel?: string; params?: Record<string, string>; inline?: boolean };
export type Section = { position: string; items: SecItem[] };
/** A phone tab (slot `mobile`): the bottom bar below the compact breakpoint. */
export type MobileTab = { id: string; label: string; icon: string; tab: string };
type Menu = { id: string; label?: string; icon?: string; slot?: string; title?: string; position?: string; items?: Menu[] } & Record<string, unknown>;

const SLOTS = ['top', 'center', 'bottom'] as const;
type Slot = (typeof SLOTS)[number];

/** The rail by slot, and each rail entry's panel (title + sections). Mutated in place so every reader sees a swap. */
export const MENUS: { rail: Record<Slot, RailItem[]>; secondary: Record<string, { title: string; sections: Section[] }>; mobile: MobileTab[] } = { rail: { top: [], center: [], bottom: [] }, secondary: {}, mobile: [] };

const strip = <T extends Record<string, unknown>>(m: T, keys: string[]) => Object.fromEntries(Object.entries(m).filter(([k]) => !keys.includes(k)));

/** Lay a menu tree (the shape GET /app/phiegg answers) over MENUS. */
export function applyMenus(nav: Menu[]) {
  const rail: Record<Slot, RailItem[]> = { top: [], center: [], bottom: [] }; const secondary: typeof MENUS.secondary = {}; const mobile: MobileTab[] = [];
  for (const m of nav) {
    if (m.slot === 'mobile') { mobile.push(strip(m, ['slot']) as unknown as MobileTab); continue; }
    const slot = (SLOTS as readonly string[]).includes(m.slot ?? '') ? (m.slot as Slot) : 'top';
    rail[slot].push(strip(m, ['slot', 'title', 'items']) as unknown as RailItem);
    if (m.items?.length) secondary[m.id] = { title: m.title ?? m.label ?? '', sections: m.items.map((sec) => ({ position: sec.position ?? sec.id, items: (sec.items ?? []).map((it) => strip(it, ['id']) as unknown as SecItem) })) };
  }
  MENUS.rail = rail; MENUS.secondary = secondary; MENUS.mobile = mobile;
}
applyMenus((file as { nav: Menu[] }).nav);

/** Read the menus from Phiora; true when they changed what the app shows. */
export async function bootMenus(): Promise<boolean> {
  const r = await apiSend<{ nav?: Menu[] }>('GET', '/app/phiegg');
  if (!r.ok || !Array.isArray(r.body.nav) || !r.body.nav.length) return false;
  const before = JSON.stringify(MENUS); applyMenus(r.body.nav); return JSON.stringify(MENUS) !== before;
}
