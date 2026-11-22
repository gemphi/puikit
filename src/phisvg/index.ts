// phisvg: the kit's grounds drawn as SVG, not as CSS gradients. A CSS gradient is one line of colour stops; an SVG
// ground is a picture: its colours blend in linear light, and a mask lets it out at every edge, so a ground never shows
// where it ends against what holds it. The base sets are data (ground.json), one for the looks of two colours and one
// for the looks of one faint light: which looks a set dresses, which theme colours it reads, and for each ground token
// its stops and how far it feathers. This file only parses that data into SVG; no
// component draws a gradient, they read the same tokens they always read (--phi-surface, --phi-label, ...).
import set from './ground.json';

/** One stop of a ground: a colour by its role in the set, where it stands (0 to 1, left to right), how much of it shows. */
export type GroundStop = [role: string, at: number, alpha: number];
/** A ground: its stops, and how far it fades out at its sides and at its top and foot (shares of its width and height). */
export type Ground = { stop: GroundStop[]; feather: [x: number, y: number] };
/** A set of grounds: the looks it dresses, the theme colour each role reads, the strengths a ground comes in (a token's
 *  suffix and what its stops are multiplied by), and the grounds by token. `scale` names a theme token that is a share
 *  ("6%"): every stop is multiplied by it too, so a look's one strength of light sets them all. */
export type GroundSet = { look: string[]; colour: Record<string, string>; scale?: string; strength: Record<string, number>; ground: Record<string, Ground> };

/** The kit's base sets, and the one that dresses a look (none when no set names it). */
export const GROUND_SETS = (set as unknown as { set: GroundSet[] }).set;
export const groundSetFor = (look: string): GroundSet | undefined => GROUND_SETS.find((s) => s.look.includes(look));

const pct = (n: number) => +(n * 100).toFixed(2) + '%';
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * A ground as an SVG document. It has no size of its own, so it takes the size of whatever it is the ground of. Its
 * colours run left to right through the stops, blended in linear light; a mask of two fades (sides, then top and
 * foot) lets it out toward every edge. `colour` gives each role its colour; `strength` scales every stop.
 */
export function groundSvg(g: Ground, colour: Record<string, string>, strength = 1): string {
  const stops = g.stop.map(([role, at, alpha]) => `<stop offset="${pct(at)}" stop-color="${colour[role] ?? '#000'}" stop-opacity="${+clamp(alpha * strength).toFixed(3)}"/>`).join('');
  const [fx, fy] = g.feather;
  const fade = (id: string, f: number, down: boolean) => `<linearGradient id="${id}" x1="0" y1="0" x2="${down ? 0 : 1}" y2="${down ? 1 : 0}">`
    + `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${pct(f)}" stop-color="#fff"/><stop offset="${pct(1 - f)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><defs>`
    + `<linearGradient id="g" x1="0" y1="0" x2="1" y2="0" color-interpolation="linearRGB">${stops}</linearGradient>`
    + fade('x', fx, false) + fade('y', fy, true)
    + `<mask id="mx"><rect width="100%" height="100%" fill="url(#x)"/></mask><mask id="my"><rect width="100%" height="100%" fill="url(#y)"/></mask></defs>`
    + `<g mask="url(#my)"><rect width="100%" height="100%" fill="url(#g)" mask="url(#mx)"/></g></svg>`;
}

/** An SVG document as a CSS image value. */
export const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Every ground token of a set, at every strength, for the colours given: `{ '--phi-surface': 'url(...)', ... }`.
 *  `scale` is the set's share of light, read from the theme (1 when the set names none). */
export function groundTokens(s: GroundSet, colour: Record<string, string>, scale = 1): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [token, g] of Object.entries(s.ground)) for (const [suffix, k] of Object.entries(s.strength)) out[token + suffix] = svgUrl(groundSvg(g, colour, k * scale));
  return out;
}
