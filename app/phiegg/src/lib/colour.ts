// The colour a record wears on its card: a person's profile PFT (portrait background), a host's portrait or club, a
// club's or a world's first colour, a pool's colour. Lifted into a readable band so a dark portrait ground still tints.
import { hexToHsl, hslToHex } from '@pui/providers';
import { D, STORES, clubOf, hostOf, lookOf, poolOf, worldOf } from './data';
import { portrait } from './portraits';
import type { ID } from '../types/phiegg';

const lift = (hex?: string | null) => { if (!hex) return undefined; const [h, s, l] = hexToHsl(hex); return hslToHex([h, Math.max(s, 45), Math.min(Math.max(l, 50), 62)]); };
/** A person's or an agent's card colour: their portrait's background. */
export const personColour = (id: ID) => lift(portrait(id)?.bg);
/** Any record's card colour by id: host, club, world, pool, else nothing (the card keeps the theme). */
export function entityColour(id: ID): string | undefined {
  const h = hostOf(id); if (h) return lift(portrait(id)?.bg ?? clubOf(h.clubId)?.colors?.[0]);
  const c = clubOf(id); if (c) return lift(c.colors?.[0] ?? worldOf(c.worldIds?.[0])?.colors?.[0]);
  const w = worldOf(id); if (w) return lift(w.colors?.[0] ?? clubOf(w.clubId)?.colors?.[0]);
  const p = poolOf(id); if (p) return lift(p.colors?.[0] ?? clubOf(p.clubId)?.colors?.[0]);
  const e = D.events.events.find((x) => x.id === id); if (e) return lift(clubOf(e.clubId)?.colors?.[0]);
  return undefined;
}

type Rec = Record<string, unknown>;
const hexes = (v: unknown): string[] => (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x));
/** The colours a record's own pictures give (a look's measured render palette, its hex), else what it carries. */
const ownColours = (r?: Rec): string[] => {
  if (!r) return [];
  const spec = (r.specs as { colour?: { palette?: string[]; hex?: string } } | undefined)?.colour;
  return [...hexes(spec?.palette), ...hexes(r.hex), ...hexes(r.colors)];
};
/**
 * Any record's colours, taken from its pictures, for its badge and card: its own (a look's render palette, a club's,
 * a world's or a pool's colours), else the first look filed under it (a collection), else its club's, else its
 * world's. Lifted into a readable band; two at most, the first and the most different second.
 */
export function entityPalette(id: ID): string[] | undefined {
  const find = (rows: unknown[]) => (rows as Rec[]).find((x) => x.id === id);
  const r = (lookOf(id) as unknown as Rec | undefined) ?? (clubOf(id) as unknown as Rec | undefined) ?? (worldOf(id) as unknown as Rec | undefined)
    ?? (poolOf(id) as unknown as Rec | undefined) ?? find(D.economy.coins) ?? find(STORES) ?? find(D.club.pieces) ?? find(D.hosts.nests) ?? find(D.events.events);
  const hostPic = hostOf(id) ? hexes(portrait(id)?.bg) : [];
  const lead = (STORES.flatMap((s) => s.looks) as unknown as Rec[]).find((l) => l.nestId === id);
  const club = r && typeof r.clubId === 'string' ? (clubOf(r.clubId) as unknown as Rec | undefined) : undefined;
  const world = r && typeof r.worldId === 'string' ? (worldOf(r.worldId) as unknown as Rec | undefined) : undefined;
  const all = [...hostPic, ...ownColours(r), ...ownColours(lead), ...ownColours(club), ...ownColours(world)];
  if (!all.length) return undefined;
  const lifted = all.map((x) => lift(x)!).filter(Boolean);
  const hueOf = (h: string) => hexToHsl(h)[0];
  const second = lifted.slice(1).sort((a, b) => Math.abs(((hueOf(b) - hueOf(lifted[0]) + 540) % 360) - 180) - Math.abs(((hueOf(a) - hueOf(lifted[0]) + 540) % 360) - 180))[0];
  return second ? [lifted[0], second] : [lifted[0]];
}
