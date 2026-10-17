// Shared collection utilities: serial ids, deterministic item generators,
// 24 card patterns (guilloché "money" engravings, fingerprints, palm lines)
// and icon watermarks. Pure functions, no DOM. Mirrors are in
// apps/phiegg-web/lib/collection.ts and puijs/apps/phiegg/src/lib/collection.ts.

/** "#OPAL-00001" style serial for item n of a collection. */
export const serialId = (prefix: string, n: number, width = 5) => '#' + prefix.toUpperCase() + '-' + String(n).padStart(width, '0');

/** Small deterministic PRNG so generated items are stable across renders. */
export const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export interface GenSpec { prefix: string; supply: number; names: string[]; traits: string[]; tones: string[]; seed?: string }
export interface GenItem { n: number; id: string; serial: string; name: string; trait: string; tone: string; pattern: number }

/** Items from..from+count of a collection, generated on demand (supply can be 10k+). */
export function generateItems(spec: GenSpec, from: number, count: number): GenItem[] {
  const out: GenItem[] = [];
  for (let n = from; n < Math.min(spec.supply, from + count); n++) {
    const r = rng(hashOf((spec.seed || spec.prefix) + ':' + n) || 1);
    out.push({ n: n + 1, id: spec.prefix.toLowerCase() + '_' + (n + 1), serial: serialId(spec.prefix, n + 1),
      name: spec.names[Math.floor(r() * spec.names.length)], trait: spec.traits[Math.floor(r() * spec.traits.length)],
      tone: spec.tones[Math.floor(r() * spec.tones.length)], pattern: Math.floor(r() * PATTERNS.length) });
  }
  return out;
}

/** 24 patterns. `c` is the ink colour (use a translucent tone). */
export const PATTERNS: { id: string; family: 'money' | 'fingerprint' | 'palm' | 'weave'; css: (c: string) => string }[] = [
  { id: 'guilloche-rings', family: 'money', css: (c) => `repeating-radial-gradient(circle at 50% 50%, ${c} 0 1px, transparent 1px 6px)` },
  { id: 'guilloche-ellipses', family: 'money', css: (c) => `repeating-radial-gradient(ellipse at 0% 50%, ${c} 0 1px, transparent 1px 7px), repeating-radial-gradient(ellipse at 100% 50%, ${c} 0 1px, transparent 1px 7px)` },
  { id: 'rosette', family: 'money', css: (c) => `repeating-conic-gradient(from 0deg at 50% 50%, ${c} 0 2deg, transparent 2deg 12deg)` },
  { id: 'sunburst', family: 'money', css: (c) => `repeating-conic-gradient(from 0deg at 50% 110%, ${c} 0 1.5deg, transparent 1.5deg 8deg)` },
  { id: 'moire', family: 'money', css: (c) => `repeating-radial-gradient(circle at 30% 40%, ${c} 0 1px, transparent 1px 5px), repeating-radial-gradient(circle at 70% 60%, ${c} 0 1px, transparent 1px 5px)` },
  { id: 'microlines', family: 'money', css: (c) => `repeating-linear-gradient(0deg, ${c} 0 1px, transparent 1px 4px)` },
  { id: 'crosshatch', family: 'money', css: (c) => `repeating-linear-gradient(45deg, ${c} 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, ${c} 0 1px, transparent 1px 8px)` },
  { id: 'wave-bands', family: 'money', css: (c) => `repeating-radial-gradient(ellipse 200% 100% at 50% 0%, ${c} 0 1px, transparent 1px 8px)` },
  { id: 'whorl', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 60% 80% at 50% 55%, ${c} 0 1.5px, transparent 1.5px 5px)` },
  { id: 'double-loop', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 50% 70% at 35% 50%, ${c} 0 1.2px, transparent 1.2px 5px), repeating-radial-gradient(ellipse 50% 70% at 65% 50%, ${c} 0 1.2px, transparent 1.2px 5px)` },
  { id: 'left-loop', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 90% 70% at 20% 60%, ${c} 0 1.5px, transparent 1.5px 5px)` },
  { id: 'right-loop', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 90% 70% at 80% 60%, ${c} 0 1.5px, transparent 1.5px 5px)` },
  { id: 'plain-arch', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 160% 90% at 50% 120%, ${c} 0 1.5px, transparent 1.5px 5px)` },
  { id: 'tented-arch', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 80% 140% at 50% 110%, ${c} 0 1.5px, transparent 1.5px 5px)` },
  { id: 'peacock-eye', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 40% 60% at 50% 40%, ${c} 0 1.5px, transparent 1.5px 5px)` },
  { id: 'composite', family: 'fingerprint', css: (c) => `repeating-radial-gradient(ellipse 45% 60% at 40% 35%, ${c} 0 1.2px, transparent 1.2px 5px), repeating-radial-gradient(ellipse 45% 60% at 60% 70%, ${c} 0 1.2px, transparent 1.2px 5px)` },
  { id: 'palm-creases', family: 'palm', css: (c) => `repeating-radial-gradient(ellipse 120% 60% at 0% 100%, ${c} 0 1px, transparent 1px 9px)` },
  { id: 'heart-line', family: 'palm', css: (c) => `repeating-radial-gradient(ellipse 140% 50% at 100% 0%, ${c} 0 1px, transparent 1px 9px)` },
  { id: 'fingertips', family: 'palm', css: (c) => `radial-gradient(ellipse 9% 16% at 22% 26%, ${c} 0 60%, transparent 62%), radial-gradient(ellipse 9% 18% at 40% 18%, ${c} 0 60%, transparent 62%), radial-gradient(ellipse 9% 18% at 58% 18%, ${c} 0 60%, transparent 62%), radial-gradient(ellipse 9% 16% at 76% 26%, ${c} 0 60%, transparent 62%), repeating-radial-gradient(ellipse 60% 45% at 50% 85%, ${c} 0 1px, transparent 1px 7px)` },
  { id: 'dermal-ridges', family: 'palm', css: (c) => `repeating-linear-gradient(60deg, ${c} 0 1.5px, transparent 1.5px 5px)` },
  { id: 'lattice', family: 'weave', css: (c) => `repeating-linear-gradient(0deg, ${c} 0 1px, transparent 1px 14px), repeating-linear-gradient(90deg, ${c} 0 1px, transparent 1px 14px)` },
  { id: 'dots', family: 'weave', css: (c) => `repeating-linear-gradient(45deg, ${c} 0 1px, transparent 1px 6px), repeating-linear-gradient(135deg, ${c} 0 1px, transparent 1px 12px)` },
  { id: 'herringbone', family: 'weave', css: (c) => `repeating-linear-gradient(30deg, ${c} 0 2px, transparent 2px 10px), repeating-linear-gradient(150deg, ${c} 0 2px, transparent 2px 10px)` },
  { id: 'spiral', family: 'money', css: (c) => `repeating-conic-gradient(from 45deg at 50% 50%, ${c} 0 3deg, transparent 3deg 9deg), repeating-radial-gradient(circle at 50% 50%, ${c} 0 1px, transparent 1px 11px)` },
];

/** CSS background for pattern i (wraps). */
export const patternCss = (i: number, ink = 'rgba(0,0,0,0.14)') => PATTERNS[((i % PATTERNS.length) + PATTERNS.length) % PATTERNS.length].css(ink);

/** SVG icon path → data-URI watermark usable as a background layer. */
export const iconWatermark = (path: string, ink = '000', opacity = 0.14) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-10 -10 44 44' fill='none' stroke='#${ink}' stroke-opacity='${opacity}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='${path}'/></svg>`)}")`;

/** Full card background: icon watermark over a rich pattern. */
export const cardBackground = (i: number, iconPath?: string, ink?: string) => (iconPath ? iconWatermark(iconPath) + ', ' : '') + patternCss(i, ink);
