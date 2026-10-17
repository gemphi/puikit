// Beta portraits (Bold Pups Space Club art, public/clubs/ → scripts: public/portraits/sheet-NN.webp, 8×8 cells each).
// Every profile and host gets one, spread so no two share while there are enough (seeded, stable between visits).
import portraitsJson from '../data/portraits.json';
import { D } from './data';
import type { ID } from '../types/phiegg';

type P = { id: string; n: number; sheet: number; index: number; bg: string; outfit: string };
const P_ = portraitsJson as unknown as { cell: number; cols: number; sheets: string[]; portraits: P[] };
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
// Deal portraits to every person and host in a seeded order, so each gets a different one.
const owners = [...D.core.users.map((u) => u.id), ...D.agents.agents.map((a) => a.id), ...D.hosts.hosts.map((h) => h.id)].sort((a, b) => hash(a) - hash(b));
const dealt = new Map<ID, P>(); owners.forEach((id, i) => dealt.set(id, P_.portraits[i % P_.portraits.length]));
const portraitOf = (id: ID): P | undefined => (P_.portraits.length ? dealt.get(id) ?? P_.portraits[hash(id) % P_.portraits.length] : undefined);

/** The portrait as an Avatar sprite (sheet, grid, cell) plus its background and outfit colours. */
export function portrait(id: ID) {
  const p = portraitOf(id); if (!p) return undefined;
  return { sprite: { src: import.meta.env.BASE_URL + 'portraits/' + P_.sheets[p.sheet], cols: P_.cols, index: p.index }, bg: p.bg, outfit: p.outfit, n: p.n, tokenId: p.id };
}
/** A portrait cell by sheet and index (profile PFT items carry both). */
export const spriteOfCell = (sheet: number, index: number) => ({ src: import.meta.env.BASE_URL + 'portraits/' + P_.sheets[sheet], cols: P_.cols, index });
