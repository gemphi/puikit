/**
 * Asset-backed imagery. The media pool lives in `apps/phlick/assets/<topic>/`
 * — one folder per taxonomy slug — and is bundled by Vite, so it's offline,
 * deterministic and has no CDN. Each post draws its poster from its topic's
 * folder (seeded by id, so it never rots), each slide of a photo-mode deck
 * the next image around, and each creator a portrait from `hosts/`. Folders
 * with no assets yet fall back to the generated SVG poster/monogram.
 */

// Everything under assets/, resolved to hashed URLs at build time.
const modules = import.meta.glob<string>('../../assets/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** topic slug -> its image URLs, in stable order. */
const POOL: Record<string, string[]> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = path.match(/\.\.\/\.\.\/assets\/([^/]+)\//);
  if (!m) continue;
  (POOL[m[1]] ??= []).push(url);
}
for (const urls of Object.values(POOL)) urls.sort();

/** Pick an image for `seed` from the pool folder; undefined when empty. */
function fromPool(folder: string, seed: number): string | undefined {
  const urls = POOL[folder];
  return urls && urls.length > 0 ? urls[Math.abs(seed) % urls.length] : undefined;
}

function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

const cache = new Map<string, string>();

const hsl = (h: number, s: number, l: number) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;

export function postPoster(
  post: { id: string; hue: number; hashtags?: string[]; topic?: string },
  /** Which slide of a photo-mode deck; each steps to the next pool image. */
  slide = 0
): string {
  const key = `poster:${post.id}:${slide}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const h = hash(`${post.id}:${slide}`);
  const image = post.topic ? fromPool(post.topic.toLowerCase(), h + slide) : undefined;
  if (image) {
    cache.set(key, image);
    return image;
  }

  const hue = post.hue + slide * 24;
  const glyph = (post.hashtags?.[0] ?? 'p')[0].toUpperCase();
  const tilt = -18 + (h % 36);

  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hsl(hue, 62, 14)}"/>
      <stop offset="55%" stop-color="${hsl(hue + 30, 55, 24)}"/>
      <stop offset="100%" stop-color="${hsl(hue + 70, 48, 12)}"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${hsl(hue + 40, 80, 60)}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${hsl(hue + 40, 80, 60)}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${hsl(hue + 40, 80, 60)}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="360" height="640" fill="url(#g)"/>
  <g transform="rotate(${tilt} 180 320)">
    <rect x="-80" y="150" width="520" height="46" fill="url(#beam)"/>
    <rect x="-80" y="330" width="520" height="26" fill="url(#beam)" opacity="0.7"/>
    <rect x="-80" y="470" width="520" height="60" fill="url(#beam)" opacity="0.5"/>
  </g>
  <circle cx="${70 + (h % 220)}" cy="${110 + (h % 160)}" r="86" fill="${hsl(hue + 120, 70, 55)}" opacity="0.16"/>
  <text x="180" y="358" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800"
        font-size="210" fill="#ffffff" fill-opacity="0.14">${glyph}</text>
</svg>`;

  const url = `data:image/svg+xml;utf8,${encodeURIComponent(doc)}`;
  cache.set(key, url);
  return url;
}

export function creatorAvatar(creator: { handle: string; name: string }): string {
  const key = `avatar:${creator.handle}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const h = hash(creator.handle);
  const image = fromPool('hosts', h);
  if (image) {
    cache.set(key, image);
    return image;
  }
  const hue = h % 360;
  const initials = creator.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hsl(hue, 60, 42)}"/>
      <stop offset="100%" stop-color="${hsl(hue + 50, 55, 26)}"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" fill="url(#a)"/>
  <text x="48" y="60" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700"
        font-size="34" fill="#ffffff" fill-opacity="0.92">${initials}</text>
</svg>`;

  const url = `data:image/svg+xml;utf8,${encodeURIComponent(doc)}`;
  cache.set(key, url);
  return url;
}

/** The full deck for a photo-mode post. */
export function postSlides(post: { id: string; hue: number; hashtags?: string[]; topic?: string; slideCount?: number }): string[] | undefined {
  if (!post.slideCount || post.slideCount < 2) return undefined;
  return Array.from({ length: post.slideCount }, (_, i) => postPoster(post, i));
}
