import type { ShopProduct } from '@pui/types';

/**
 * Deterministic product imagery as a data URI.
 *
 * A reference app must not depend on a third-party photo CDN: it breaks
 * offline, leaks a referrer, and rots when the remote asset moves. Each product
 * gets a stable SVG derived from its own id — quilted diamond field, the line's
 * initials, and the first colourway as an accent.
 *
 * Returns a plain URL string, so it drops into any puijs `image` prop.
 */

/** Relative luminance, to decide whether a colourway needs light or dark ink. */
function isDark(hex: string): boolean {
  const v = hex.replace('#', '');
  const n = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.55;
}

/** FNV-1a: small, stable, and enough to spread ids across the variants. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

const initials = (line: string): string =>
  line
    .split(/[\s.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (/^\d/.test(w) ? w.slice(0, 2) : w[0].toUpperCase()))
    .join('');

const cache = new Map<string, string>();

export function productImage(
  product: ShopProduct & { line?: string },
  /** Colourway to render. Defaults to the product's first colour. */
  colorHex?: string
): string {
  const key = `${product.id}|${colorHex ?? ''}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const h = hash(key);
  const accent = colorHex ?? product.options?.colors?.[0]?.hex ?? '#e8e4dc';
  // The colourway is the ground, not a tint on it: choosing a colour has to
  // visibly change the piece, and the ink flips so the label stays legible.
  const bg = accent;
  const ink = isDark(accent) ? '#f4f1ec' : '#141414';
  const cell = 22 + (h % 3) * 6;
  const rotate = (h % 4) * 15;
  const label = initials(product.line ?? product.title);

  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
  <defs>
    <pattern id="q" width="${cell}" height="${cell}" patternTransform="rotate(${45 + rotate})" patternUnits="userSpaceOnUse">
      <path d="M0 0 H${cell} V${cell} H0 Z" fill="none" stroke="${ink}" stroke-opacity="0.10" stroke-width="1"/>
    </pattern>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${ink}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${ink}" stop-opacity="0.10"/>
    </linearGradient>
    <radialGradient id="a" cx="72%" cy="18%" r="58%">
      <stop offset="0%" stop-color="${ink}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${ink}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="300" height="400" fill="${bg}"/>
  <rect width="300" height="400" fill="url(#a)"/>
  <rect width="300" height="400" fill="url(#q)"/>
  <rect width="300" height="400" fill="url(#v)"/>
  <text x="150" y="212" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif"
        font-size="64" letter-spacing="6" fill="${ink}" fill-opacity="0.82">${label}</text>
  <text x="150" y="244" text-anchor="middle" font-family="Inter, system-ui, sans-serif"
        font-size="9" letter-spacing="5" fill="${ink}" fill-opacity="0.45">CHANEL</text>
</svg>`;

  const url = `data:image/svg+xml;utf8,${encodeURIComponent(doc)}`;
  cache.set(key, url);
  return url;
}

/**
 * Editorial imagery — the same deterministic, offline-safe treatment as
 * {@link productImage}, in a wider frame with the entry's label set across it.
 */
export function editorialImage(entry: { id: string; title: string; eyebrow?: string }): string {
  const key = `ed:${entry.id}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const h = hash(key);
  const dark = h % 3 !== 0;
  const bg = dark ? '#141414' : '#efece6';
  const ink = dark ? '#f4f1ec' : '#111111';
  const cell = 26 + (h % 3) * 8;
  const rotate = (h % 5) * 12;

  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
  <defs>
    <pattern id="q" width="${cell}" height="${cell}" patternTransform="rotate(${45 + rotate})" patternUnits="userSpaceOnUse">
      <path d="M0 0 H${cell} V${cell} H0 Z" fill="none" stroke="${ink}" stroke-opacity="0.09" stroke-width="1"/>
    </pattern>
    <linearGradient id="v" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${ink}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${ink}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="${bg}"/>
  <rect width="400" height="300" fill="url(#q)"/>
  <rect width="400" height="300" fill="url(#v)"/>
  <text x="200" y="168" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif"
        font-size="46" letter-spacing="4" fill="${ink}" fill-opacity="0.8">${(entry.eyebrow ?? entry.title).toUpperCase()}</text>
</svg>`;

  const url = `data:image/svg+xml;utf8,${encodeURIComponent(doc)}`;
  cache.set(key, url);
  return url;
}
