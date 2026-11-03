// Three-layer media for every card: a world scene (parent) → a look render framed inside it → a profile photo inside that.
// Layers come from the record's own links (world, club, author); anything missing is picked deterministically from the
// same pools, so a card always has all three and keeps the same images between visits.
import type { ID, Tone } from '../types/phiegg';
import { D, STORES, clubOf, itemImage, onDataRefresh, storeOfClub, worldImage, worldOf } from './data';

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const pick = <T,>(xs: T[], seed: string): T | undefined => (xs.length ? xs[hash(seed) % xs.length] : undefined);

const lookFront = (l: { views: Record<string, string> }) => l.views.FRONT ?? l.views['3Q'] ?? Object.values(l.views)[0];
type Render = { src: string; hex: string };
const rendersOf = (looks: { views: Record<string, string>; hex: string }[]): Render[] =>
  looks.map((l) => ({ src: lookFront(l), hex: l.hex })).filter((r): r is Render => !!r.src).map((r) => ({ src: itemImage(r.src), hex: r.hex }));
let LOOK_RENDERS = rendersOf(STORES.flatMap((s) => s.looks));
let LOOK_IMAGES = LOOK_RENDERS.map((r) => r.src);
const WORLD_IMAGES = D.core.worlds.map((w) => worldImage(w)).filter((p): p is string => !!p);
/** The measured colour of a render (scripts/item-colors.py → items.mjs set every rendered look's hex from its image). */
let RENDER_HEX = new Map(LOOK_RENDERS.map((r) => [r.src, r.hex]));
// The look pool starts with the flagship only; when lib/heavy.ts lands the other stores, rebuild it.
onDataRefresh(() => {
  LOOK_RENDERS = rendersOf(STORES.flatMap((s) => s.looks));
  LOOK_IMAGES = LOOK_RENDERS.map((r) => r.src);
  RENDER_HEX = new Map(LOOK_RENDERS.map((r) => [r.src, r.hex]));
});
export const renderColour = (src?: string) => (src ? RENDER_HEX.get(src) ?? RENDER_HEX.get(itemImage(src)) : undefined);

const hue = (hex: string) => { const n = parseInt(hex.slice(1), 16); const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2; const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  const h = !d ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: (h * 60 + 360) % 360, s, l }; };
const near = (a: string, b: string) => { const x = hue(a), y = hue(b); const dh = Math.min(Math.abs(x.h - y.h), 360 - Math.abs(x.h - y.h)) / 180;
  return dh * dh * (x.s > 0.15 && y.s > 0.15 ? 3 : 0.4) + (x.s - y.s) ** 2 + (x.l - y.l) ** 2 * 1.4; };

/** The parent layer: the linked world's scene, else the club's first world, else one from the pool. */
export function sceneFor(seed: string, worldId?: ID | null, clubId?: ID | null): string | undefined {
  const w = worldOf(worldId) ?? worldOf(clubOf(clubId)?.worldIds?.[0]);
  return worldImage(w) ?? pick(WORLD_IMAGES, 'w' + seed);
}

/**
 * The middle layer: a look render from the club's own store, else one from the pool. With `hex`, the render is one
 * whose dress is that colour (the club's first, else any), so a card's dress and its background always match.
 */
export function renderFor(seed: string, clubId?: ID | null, hex?: string): Render | undefined {
  const own = clubId ? rendersOf(storeOfClub(clubId)?.looks ?? []) : [];
  if (hex) {
    const close = (rs: Render[]) => rs.filter((r) => near(r.hex, hex) < 0.06);
    const hit = pick(close(own), seed) ?? pick(close(LOOK_RENDERS), 'l' + seed);
    if (hit) return hit;
    return [...LOOK_RENDERS].sort((a, b) => near(a.hex, hex) - near(b.hex, hex))[0];
  }
  return pick(own, seed) ?? pick(LOOK_RENDERS, 'l' + seed);
}
export function lookFor(seed: string, clubId?: ID | null, hex?: string): string | undefined { return renderFor(seed, clubId, hex)?.src; }
export { LOOK_IMAGES };

/** Tone → CSS background for layers without an image. */
export const toneBackground = (tone: Tone | string = 'accent') => ({
  accent: 'color-mix(in srgb, var(--phi-color-primary) 22%, var(--phi-color-background))',
  sage: 'color-mix(in srgb, var(--phi-color-success) 22%, var(--phi-color-background))',
  neutral: 'var(--phi-color-gray-200)',
  ink: 'var(--phi-color-gray-900)',
} as Record<string, string>)[tone] ?? 'var(--phi-color-background-secondary)';
