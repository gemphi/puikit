/**
 * Seeded palettes and the full gradient system.
 *
 * A palette is one seed colour (the ground), an optional light-mode seed, an accent and a second accent, each
 * as HSL — the phiber v2 theme/palette model that Phiegg's data/themes.json carries (11 phiber palettes +
 * 5 Phiegg ones). From a palette and a gradient level the system derives every surface colour and every
 * gradient token, by nesting depth:
 *
 *   level 0  page        --phi-gradient-main            (opaque: tints over the ground)
 *   level 1  parent      --phi-gradient-card / -parent   (cards, panels, media frames)
 *   level 2  child       --phi-gradient-card-child / -child (a card inside a card, the framed image)
 *   level 3  grandchild  --phi-gradient-card-grandchild / -grandchild (the photo, a chip inside that)
 *
 * plus chrome (rail, sidebar, navbar, table header), overlays (drawer, media), controls (primary buttons)
 * and the lit accent rim. Each level is lit from the opposite corner at roughly half the strength of its
 * parent, so nesting reads as depth and never compounds into a painted panel.
 *
 * Levels: flat (no gradients, palette colours only) · soft · vivid · aurora (adds a third hue).
 */

export type HSL = [number, number, number];

export interface SeedPalette {
  id: string;
  name: string;
  /** Ground colour of the dark mode (hex). */
  seed: string;
  /** Ground colour of the light mode (hex); derived from the seed's hue when absent. */
  lightSeed?: string | null;
  /** Accent as [hue, saturation %, lightness %]. */
  accent: HSL;
  /** Light-mode accent; the dark accent, darkened slightly, when absent. */
  lightAccent?: HSL | null;
  /** Second accent — the other end of every two-colour gradient. */
  accent2: HSL;
  source?: string;
}

export type GradientLevel = 'flat' | 'soft' | 'vivid' | 'aurora';
export const GRADIENT_LEVELS: GradientLevel[] = ['flat', 'soft', 'vivid', 'aurora'];
const STRENGTH: Record<GradientLevel, number> = { flat: 0, soft: 0.55, vivid: 1, aurora: 1.3 };

/** phiber v2 theme/palette (11) + 5 Phiegg — same values as apps/phiegg/src/data/themes.json. */
export const PALETTES: SeedPalette[] = [
  { id: 'sphere', name: 'Sphere', seed: '#3B4657', accent: [212, 58, 55], accent2: [142, 70, 45], source: 'phiber default' },
  { id: 'graphite', name: 'Graphite', seed: '#3D3D3D', accent: [28, 95, 54], accent2: [142, 70, 45], source: 'Blender grey + orange' },
  { id: 'tokyo', name: 'Tokyo', seed: '#3B4261', accent: [220.8, 88.7, 72.4], accent2: [142, 70, 45], source: 'Tokyo Night' },
  { id: 'onyx', name: 'Onyx', seed: '#2A2A2A', accent: [331, 71.2, 49], accent2: [142, 70, 45], source: 'concept-car magenta' },
  { id: 'grey', name: 'Grey', seed: '#7A7A7A', lightSeed: '#C4C6C9', accent: [32.4, 80.4, 53.9], lightAccent: [223.8, 73.1, 56.3], accent2: [142, 70, 45], source: 'Boldland orange / Tesla blue light' },
  { id: 'apple', name: 'Apple', seed: '#38383A', lightSeed: '#CBCBCD', accent: [210.1, 100, 52], lightAccent: [211.3, 100, 50], accent2: [142, 70, 45], source: 'macOS window greys' },
  { id: 'swift', name: 'Swift', seed: '#3F3532', accent: [11.2, 100, 60], accent2: [142, 70, 45], source: 'Swift orange' },
  { id: 'barbie', name: 'Barbie', seed: '#4D2A3E', accent: [327.8, 85.3, 52], accent2: [142, 70, 45], source: 'hot pink' },
  { id: 'fenty', name: 'Fenty', seed: '#4E3F33', accent: [25.5, 56.6, 58.4], accent2: [142, 70, 45], source: 'earth + bronze' },
  { id: 'cyberpunk', name: 'Cyberpunk', seed: '#2C1C42', accent: [174.1, 100, 50], accent2: [142, 70, 45], source: 'neon cyan' },
  { id: 'chanel', name: 'Chanel', seed: '#3E3A30', accent: [41.2, 38.6, 67.5], accent2: [82, 19, 45], source: 'mushroom + champagne' },
  { id: 'opal', name: 'Opal', seed: '#4A4036', lightSeed: '#F5EAD8', accent: [24, 55, 50], accent2: [82, 19, 45], source: 'Phiegg organic cream + terracotta' },
  { id: 'nebula', name: 'Nebula', seed: '#2A2140', accent: [328, 100, 59], accent2: [262, 60, 62], source: 'Phiegg brand magenta' },
  { id: 'naimia', name: 'Naimia', seed: '#4A3A1F', accent: [38, 90, 55], accent2: [16, 70, 50], source: 'saffron capital' },
  { id: 'sage', name: 'Sage', seed: '#3A4230', accent: [84, 19, 45], accent2: [30, 55, 50], source: 'Phiegg sage' },
  { id: 'velour', name: 'Velour', seed: '#3D1F2A', accent: [345, 60, 45], accent2: [150, 30, 45], source: 'wine velvet' },
];

export const paletteOf = (id: string | null | undefined): SeedPalette | undefined => PALETTES.find((p) => p.id === id);

// ── colour maths ────────────────────────────────────────────────────────────
const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const round = (n: number) => Math.round(n * 10) / 10;

export function hexToHsl(hex: string): HSL {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16) / 255, g = parseInt(full.slice(2, 4), 16) / 255, b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [round(h), round(s * 100), round(l * 100)];
}

/** Hex from HSL. */
export function hslToHex([h, s, l]: HSL): string {
  const S = clamp(s) / 100, L = clamp(l) / 100, k = (n: number) => (n + h / 30) % 12, a = S * Math.min(L, 1 - L);
  const f = (n: number) => Math.round(255 * (L - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * A whole palette seeded from one colour (an item, a look, a brand swatch): the grounds take its hue,
 * the accent is the colour itself pulled into a readable band, and the second accent sits 40° round the wheel.
 * Used for a page that wears the theme of what it shows, without touching the user's saved palette.
 */
export function paletteFromHex(hex: string, id = 'override', accent2Hex?: string | null): SeedPalette {
  const [h, s, l] = hexToHsl(hex);
  const sat = Math.max(s, 18);
  const accent: HSL = [h, Math.min(Math.max(sat, 45), 92), Math.min(Math.max(l, 48), 64)];
  const second: HSL = accent2Hex ? (() => { const [h2, s2, l2] = hexToHsl(accent2Hex); return [h2, Math.max(s2, 40), Math.min(Math.max(l2, 45), 62)] as HSL; })() : [(h + 40) % 360, Math.min(sat + 10, 80), 52];
  return {
    id, name: id, source: hex,
    seed: hslToHex([h, Math.min(sat, 32), 22]),
    lightSeed: hslToHex([h, Math.min(sat, 40), 95]),
    accent, lightAccent: [h, accent[1], Math.min(accent[2], 46)], accent2: second,
  };
}

/** CSS colour from HSL, optionally with alpha (0–1). */
export const hsl = ([h, s, l]: HSL, a = 1) => (a >= 1 ? `hsl(${round(h)} ${round(clamp(s))}% ${round(clamp(l))}%)` : `hsl(${round(h)} ${round(clamp(s))}% ${round(clamp(l))}% / ${round(clamp(a * 100))}%)`);
const shift = ([h, s, l]: HSL, dl: number, ds = 0, dh = 0): HSL => [(h + dh + 360) % 360, clamp(s + ds), clamp(l + dl)];

// ── derivation ──────────────────────────────────────────────────────────────
export interface PaletteColors { ground: HSL; secondary: HSL; card: HSL; elevated: HSL; border: HSL; text: HSL; textSecondary: HSL; textMuted: HSL; accent: HSL; accent2: HSL; accent3: HSL }

/** Surface ramp + text + accents for one mode. */
export function paletteColors(p: SeedPalette, isDark: boolean): PaletteColors {
  const seed = hexToHsl(p.seed);
  const accent: HSL = isDark ? p.accent : p.lightAccent ?? shift(p.accent, -4);
  const accent2: HSL = isDark ? p.accent2 : shift(p.accent2, -4);
  const accent3: HSL = shift(accent, 0, 0, 48);
  if (isDark) {
    // The seed is the panel tone (Blender-style); the page sits below it, raised surfaces above it.
    const [h, s, l] = seed;
    return {
      ground: [h, s, clamp(l * 0.55, 6)], secondary: [h, s, clamp(l * 0.75, 9)], card: [h, s, clamp(l * 0.92, 12)], elevated: [h, s, clamp(l * 1.12, 15)],
      border: [h, clamp(s * 0.8), clamp(l * 1.45, 22)], text: [h, 12, 95], textSecondary: [h, 10, 74], textMuted: [h, 8, 56], accent, accent2, accent3,
    };
  }
  const light = p.lightSeed ? hexToHsl(p.lightSeed) : ([seed[0], Math.min(seed[1], 12), 96] as HSL);
  // A grey light seed (window chrome) is the secondary surface; the page is lifted to near-white with its hue.
  const [h, s, l] = light;
  const ground: HSL = l >= 90 ? light : [h, Math.min(s, 14), 97];
  return {
    ground, secondary: shift(ground, -3.5), card: [ground[0], ground[1], clamp(ground[2] + 2.5, 0, 100)], elevated: [ground[0], ground[1], 100],
    border: shift(ground, -12, -2), text: [h, 18, 11], textSecondary: [h, 10, 36], textMuted: [h, 8, 50], accent, accent2, accent3,
  };
}

/** Every colour + gradient token for a palette, mode and level, as CSS custom properties. */
export function derivePaletteTokens(p: SeedPalette, isDark: boolean, level: GradientLevel = 'soft'): Record<string, string> {
  const c = paletteColors(p, isDark);
  const out: Record<string, string> = {
    '--phi-color-background': hsl(c.ground),
    '--phi-color-background-secondary': hsl(c.secondary),
    '--phi-color-background-card': hsl(c.card),
    '--phi-color-background-elevated': hsl(c.elevated),
    '--phi-color-border': hsl(c.border, isDark ? 0.7 : 0.9),
    '--phi-color-border-subtle': hsl(c.border, isDark ? 0.4 : 0.55),
    '--phi-color-text-primary': hsl(c.text),
    '--phi-color-text-secondary': hsl(c.textSecondary),
    '--phi-color-text-muted': hsl(c.textMuted),
    '--phi-color-primary': hsl(c.accent),
    '--phi-color-primary-hover': hsl(shift(c.accent, isDark ? 6 : -6)),
    '--phi-color-primary-light': hsl(c.accent, isDark ? 0.22 : 0.12),
    '--phi-color-primary-dark': hsl(shift(c.accent, -10)),
    '--phi-color-accent': hsl(c.accent),
    '--phi-color-accent-2': hsl(c.accent2),
    '--phi-color-accent-3': hsl(c.accent3),
    '--phi-color-hover': hsl(c.text, isDark ? 0.06 : 0.045),
  };
  return { ...out, ...deriveGradientTokens(c, isDark, level) };
}

/**
 * The gradient tokens alone, from any accent pair over any ground — used for a palette, and for a plain brand
 * (accent = the brand's primary) when an app turns gradients on without picking a palette.
 */
export function deriveGradientTokens(c: Pick<PaletteColors, 'accent' | 'accent2' | 'accent3'>, isDark: boolean, level: GradientLevel): Record<string, string> {
  const k = STRENGTH[level];
  const over = (base: string, ...layers: string[]) => [...layers, `linear-gradient(${base}, ${base})`].join(', ');
  const fade = (base: string) => `linear-gradient(180deg, ${base} 0%, color-mix(in srgb, ${base} 55%, transparent) 55%, transparent 100%)`;
  /** A menu's own ground: its colour at the edge it grows from, gone by the far edge, so it merges into what it sits beside. */
  const fadeFrom = (base: string, dir: string) => `linear-gradient(${dir}, ${base} 0%, color-mix(in srgb, ${base} 50%, transparent) 55%, transparent 100%)`;
  const surface = (v: string) => `color-mix(in srgb, var(${v}) var(--phi-surface-opacity, 100%), transparent)`;
  const ground = 'var(--phi-color-background)', secondary = 'var(--phi-color-background-secondary)';
  const card = surface('--phi-color-background-card'), cardChild = surface('--phi-color-background-secondary'), cardGrand = surface('--phi-color-background-elevated');
  if (k === 0) {
    // Flat: surfaces that consumers paint with `background:` stay opaque in their plain colour; overlays vanish.
    const solid: Record<string, string> = { main: ground, card, 'card-child': cardChild, 'card-grandchild': cardGrand, rail: ground, 'rail-reverse': ground, sidebar: secondary, navbar: ground, 'table-header': secondary };
    const overlays = ['parent', 'child', 'grandchild', 'card-wash', 'card-wash-reverse', 'media', 'drawer', 'accent', 'control', 'control-hover', 'control-soft', 'text'];
    return Object.fromEntries([...Object.entries(solid).map(([x, b]) => ['--phi-gradient-' + x, over(b)]), ...overlays.map((x) => ['--phi-gradient-' + x, 'none'])]) as Record<string, string>;
  }
  const A = (a: number) => hsl(c.accent, a * k), B = (a: number) => hsl(c.accent2, a * k), C = (a: number) => hsl(c.accent3, a * k);
  const dk = isDark ? 1.25 : 1; // tints read weaker on dark grounds
  const aurora = level === 'aurora';

  const mainLayers = [
    `radial-gradient(70% 55% at 0% 0%, ${A(0.26 * dk)} 0%, transparent 62%)`,
    `radial-gradient(65% 50% at 100% 100%, ${B(0.2 * dk)} 0%, transparent 62%)`,
    ...(aurora ? [`radial-gradient(60% 45% at 85% 5%, ${C(0.2 * dk)} 0%, transparent 65%)`] : []),
  ];
  // Parent cards: clear at the top, then a shade of the theme colour over the rest of the card (deepest at the foot).
  const parent = [`linear-gradient(180deg, ${A(0.13 * dk)} 0%, ${A(0.06 * dk)} 40%, transparent 100%)`, ...(aurora ? [`radial-gradient(80% 55% at 100% 100%, ${B(0.12 * dk)} 0%, transparent 70%)`] : [])];
  const child = [`linear-gradient(340deg, ${B(0.12 * dk)} 0%, transparent 60%)`, ...(aurora ? [`radial-gradient(70% 60% at 0% 0%, ${C(0.1 * dk)} 0%, transparent 70%)`] : [])];
  const grandchild = [`radial-gradient(90% 90% at 30% 20%, ${A(0.1 * dk)} 0%, transparent 70%)`];

  return {
    '--phi-gradient-main': over(ground, ...mainLayers),
    '--phi-gradient-parent': parent.join(', '),
    '--phi-gradient-child': child.join(', '),
    '--phi-gradient-grandchild': grandchild.join(', '),
    // Cards are a shade of their parent fading to nothing, so they merge into what holds them: the card colour is
    // full at the head and transparent at the foot (children and grandchildren the same, a level lighter each).
    '--phi-gradient-card': [...parent, fade(card)].join(', '),
    '--phi-gradient-card-child': [...child, fade(cardChild)].join(', '),
    '--phi-gradient-card-grandchild': [...grandchild, fade(cardGrand)].join(', '),
    '--phi-gradient-card-wash': `linear-gradient(0deg, ${A(0.08 * dk)} 0%, transparent 50%)`,
    '--phi-gradient-card-wash-reverse': `linear-gradient(180deg, ${A(0.08 * dk)} 0%, transparent 50%)`,
    '--phi-gradient-media': [`linear-gradient(150deg, ${A(0.42)} 0%, transparent 70%)`, `linear-gradient(330deg, ${B(0.34)} 0%, transparent 70%)`, ...(aurora ? [`radial-gradient(60% 50% at 80% 10%, ${C(0.3)} 0%, transparent 70%)`] : [])].join(', '),
    '--phi-gradient-drawer': [`radial-gradient(90% 40% at 100% 0%, ${A(0.2 * dk)} 0%, transparent 70%)`, `radial-gradient(80% 35% at 0% 100%, ${B(0.14 * dk)} 0%, transparent 70%)`, ...(aurora ? [`radial-gradient(70% 30% at 20% 45%, ${C(0.12 * dk)} 0%, transparent 70%)`] : [])].join(', '),
    '--phi-gradient-rail': [`linear-gradient(180deg, ${A(0.14 * dk)} 0%, transparent 60%)`, fadeFrom(ground, '180deg')].join(', '),
    '--phi-gradient-rail-reverse': [`linear-gradient(0deg, ${A(0.14 * dk)} 0%, transparent 60%)`, fadeFrom(ground, '0deg')].join(', '),
    '--phi-gradient-sidebar': [`linear-gradient(90deg, ${A(0.1 * dk)} 0%, transparent 65%)`, fadeFrom(secondary, '90deg')].join(', '),
    '--phi-gradient-navbar': [`linear-gradient(90deg, ${A(0.1 * dk)} 0%, transparent 55%)`, fadeFrom(ground, '180deg')].join(', '),
    '--phi-gradient-table-header': over(secondary, `linear-gradient(90deg, ${A(0.1 * dk)} 0%, transparent 70%)`),
    '--phi-gradient-accent': `linear-gradient(90deg, transparent, ${hsl(c.accent)}, ${hsl(c.accent2)}, transparent)`,
    '--phi-gradient-control': level === 'soft' ? 'none' : `linear-gradient(135deg, ${hsl(c.accent)} 0%, ${hsl(aurora ? c.accent3 : shift(c.accent, 0, 0, 24))} 100%)`,
    '--phi-gradient-control-hover': level === 'soft' ? 'none' : `linear-gradient(315deg, ${hsl(c.accent)} 0%, ${hsl(aurora ? c.accent3 : shift(c.accent, 0, 0, 24))} 100%)`,
    '--phi-gradient-text': `linear-gradient(90deg, ${hsl(c.accent)}, ${hsl(aurora ? c.accent3 : c.accent2)})`,
    // Resting fill tint for ghost / outline / icon buttons and tabs.
    '--phi-gradient-control-soft': `linear-gradient(135deg, ${A(0.12 * dk)} 0%, ${aurora ? C(0.1 * dk) : B(0.08 * dk)} 100%)`,
    ...(level === 'soft' ? {} : { '--phi-gradient-control-text': '#fff' }),
  };
}

/** Every custom property the palette system may set — so it can clear exactly what it wrote. */
export const PALETTE_TOKEN_NAMES: string[] = Object.keys({ ...derivePaletteTokens(PALETTES[0], true, 'aurora') });

/** Gradient tokens for a plain brand: its primary as the accent, its info colour as the second accent. */
export function brandGradientTokens(primary: string, second: string, isDark: boolean, level: GradientLevel): Record<string, string> | null {
  if (!/^#[0-9a-f]{3,8}$/i.test(primary)) return null;
  const accent = hexToHsl(primary);
  const accent2 = /^#[0-9a-f]{3,8}$/i.test(second) ? hexToHsl(second) : shift(accent, 0, 0, 40);
  return deriveGradientTokens({ accent, accent2, accent3: shift(accent, 0, 0, 48) }, isDark, level);
}

/* ── Radius steps ───────────────────────────────────────────────────────────────────────────────────────────
   Named stops (Small · Medium · Large · Pill (egg)) for the provider's radius scale (`borderRadius` → `--phi-radius-scale`). Every `--phi-radius-*`
   token multiplies by it, so one choice rounds every card, deck, tab, button, drawer and bubble together. */
export const RADIUS_PRESETS = { small: 0.5, medium: 1, large: 1.75, pill: 3 } as const;
/** Display names for the four corner presets. Pill is the egg: controls go fully round, containers deeply rounded. */
export const RADIUS_LABELS: Record<keyof typeof RADIUS_PRESETS, string> = { small: 'Small', medium: 'Medium', large: 'Large', pill: 'Pill (egg)' };
/** Older saved ids map onto the four presets. */
export const RADIUS_ALIASES: Record<string, keyof typeof RADIUS_PRESETS> = { sharp: 'small', soft: 'medium', round: 'large', pill: 'pill', sm: 'small', md: 'medium', lg: 'large' };
export type RadiusPreset = keyof typeof RADIUS_PRESETS;
export const radiusPresetOf = (scale: number): RadiusPreset =>
  (Object.entries(RADIUS_PRESETS) as [RadiusPreset, number][]).reduce((a, b) => (Math.abs(b[1] - scale) < Math.abs(a[1] - scale) ? b : a))[0];
