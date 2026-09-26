import type { BrandTheme, ThemeStyle } from './types';

/**
 * The resolved gradient values for gradient-by-default.
 *
 * Each value is a layered CSS `background-image` string: low-alpha radial
 * brand tints over a vertical surface-to-surface gradient.
 */
export interface GradientTreatment {
  /** Ambient treatment for a container surface. */
  parent: string;
  /** Quieter treatment for a nested surface, so tints do not compound. */
  child: string;
  /** Hairline lit top edge, for surfaces that want a rim. */
  accent: string;
  /** Horizontal wash for a rail: brand shade at the outer edge, fading to nothing. */
  rail: string;
  /** The same wash mirrored, for a rail docked on the opposite side. */
  railReverse: string;
  /** Bottom-to-top wash for a card, so the tint pools under the content. */
  card: string;
  /** The same wash inverted, for a card that wants the tint at its head. */
  cardReverse: string;
}

/**
 * Extract the leading brand color from a brand gradient string such as
 * `linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)`. Falls back to the whole
 * trimmed string when no recognizable color token is present, so any brand
 * value still yields a usable treatment.
 */
function extractBrandColor(gradient: string): string {
  const source = gradient.trim();
  // Prefer the first hex color (#rgb, #rrggbb, #rrggbbaa).
  const hex = source.match(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/);
  if (hex) {
    return hex[0];
  }
  // Otherwise the first functional color (rgb/rgba/hsl/hsla/color/etc.).
  const fn = source.match(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/i);
  if (fn) {
    return fn[0];
  }
  // Otherwise the first stop token inside the gradient parentheses, dropping a
  // trailing position (e.g. `red 0%` -> `red`), or the raw value as a last resort.
  const inner = source.match(/\(([^)]*)\)/);
  const body = inner ? inner[1] : source;
  const firstStop = body.split(',')[0]?.trim() ?? source;
  const colorOnly = firstStop.replace(/\s+-?\d.*$/, '').trim();
  return colorOnly || source;
}

/**
 * Convert a hex color to an `r, g, b` triplet usable inside `rgba(...)`.
 * Returns `null` for any non-hex color so callers fall back to `color-mix`,
 * which handles named/functional colors without parsing them.
 */
function hexToRgbTriplet(color: string): string | null {
  const m = color.trim().match(/^#([0-9a-fA-F]{3,8})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3 || h.length === 4) {
    h = h.slice(0, 3).split('').map((c) => c + c).join('');
  } else if (h.length === 8) {
    h = h.slice(0, 6);
  } else if (h.length !== 6) {
    return null;
  }
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/**
 * Build a translucent version of the brand color at `alpha`. Hex colors go
 * through `rgba()`; anything else uses `color-mix`, so named and functional
 * colors still produce a valid, low-opacity tint.
 */
function tint(color: string, alpha: number): string {
  const rgb = hexToRgbTriplet(color);
  if (rgb) return `rgba(${rgb}, ${alpha})`;
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

/**
 * Alpha ceilings for the ambient tints. Dark surfaces need slightly more
 * brand light to read at all; light surfaces tint much more readily, so the
 * same alpha there would look like a colored panel rather than a surface.
 */
const TINT_ALPHA = {
  light: { top: 0.05, bottom: 0.035, hover: 0.08 },
  dark: { top: 0.1, bottom: 0.07, hover: 0.14 },
} as const;

/**
 * Derive the gradient treatment for the active brand and mode. Returns `null`
 * outside `gradient` style, so no treatment is applied.
 *
 * The treatment is deliberately *ambient*: two wide, low-alpha radial tints
 * (one from the top-left, one from the bottom-right) layered over a vertical
 * surface-to-surface gradient. Nothing reaches full brand saturation, so a
 * gradient surface reads as lit rather than painted, and text contrast on top
 * of it is unaffected.
 *
 * - `parent` is the ambient treatment for a container surface.
 * - `child` is the quieter treatment for a nested surface: the same lighting
 *   from the opposing corner at roughly half strength, so nesting a child in a
 *   parent does not double the tint.
 * - `accent` is a hairline top edge, for surfaces that want an lit rim.
 *
 * The color source is the brand's dark gradient in dark mode, else its light
 * gradient.
 */
export function deriveGradientTreatment(
  brand: BrandTheme,
  style: ThemeStyle,
  isDark: boolean,
): GradientTreatment | null {
  if (style !== 'gradient') {
    return null;
  }

  const source = isDark ? brand.gradientDark : brand.gradient;
  const color = extractBrandColor(source);
  const a = isDark ? TINT_ALPHA.dark : TINT_ALPHA.light;

  const surface = 'linear-gradient(180deg, var(--phi-color-surface-raised, transparent), var(--phi-color-surface, transparent))';

  // Each tint is deliberately short: it resolves to transparent well before the
  // far edge, so the surface reads as lit from one direction rather than
  // washed end to end.
  const parent = [
    `radial-gradient(ellipse 60% 45% at 25% 0%, ${tint(color, a.top)}, transparent 55%)`,
    `radial-gradient(ellipse 45% 45% at 85% 100%, ${tint(color, a.bottom)}, transparent 55%)`,
    surface,
  ].join(', ');

  const child = [
    `radial-gradient(ellipse 55% 45% at 85% 0%, ${tint(color, a.top / 2)}, transparent 55%)`,
    surface,
  ].join(', ');

  const accent = `linear-gradient(90deg, transparent 0%, ${tint(color, a.hover)} 50%, transparent 100%)`;

  // A rail is a tall, narrow surface, so it takes a horizontal wash: it starts
  // transparent at the outer edge and gathers the brand shade against the edge
  // that meets the content. `railReverse` mirrors it, for a rail docked right.
  const rail = `linear-gradient(90deg, transparent 55%, ${tint(color, a.top)} 100%)`;
  const railReverse = `linear-gradient(270deg, transparent 55%, ${tint(color, a.top)} 100%)`;

  // A small card is wider than it is tall, so its tint runs bottom to top and
  // pools under the text rather than behind it.
  const card = `linear-gradient(0deg, ${tint(color, a.top)} 0%, transparent 55%)`;
  const cardReverse = `linear-gradient(180deg, ${tint(color, a.top)} 0%, transparent 55%)`;

  return { parent, child, accent, rail, railReverse, card, cardReverse };
}
