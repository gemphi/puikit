// The colour a record wears on its card: a person's profile PFT (portrait background), a host's portrait or club, a
// club's or a world's first colour, a pool's colour. Lifted into a readable band so a dark portrait ground still tints.
import { hexToHsl, hslToHex } from '@pui/providers';
import { D, clubOf, hostOf, poolOf, worldOf } from './data';
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
