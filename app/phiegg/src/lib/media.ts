// Where pictures come from. Set VITE_PHI_MEDIA to the bucket or CDN address and every picture reads its key there
// (a local S3 store now, S3 and CloudFront later); unset, the app serves its own public/ folder. Keys are set out in
// CONTENT-SERVING.md and built by scripts/media/build_media.py.
import media from '../data/media.json';

const MEDIA = (import.meta.env.VITE_PHI_MEDIA as string | undefined)?.replace(/\/$/, '');

/** A path under public/ as its key in the bucket. */
const keyOf = (path: string) => {
  const p = path.replace(/^\//, '');
  const logo = p.match(/^logos\/(.+)\.svg$/);
  if (logo) return `worlds/${logo[1]}/logo.svg`;
  if (/^(items|rides|jewels|portraits|welcome|logo)\//.test(p)) return 'assets/' + p;
  if (p.startsWith('worlds/')) return 'assets/scenes/' + p.slice('worlds/'.length);
  if (p.startsWith('assets/')) return p;
  return p;
};

export const mediaUrl = (path: string) => (MEDIA ? `${MEDIA}/${keyOf(path)}` : import.meta.env.BASE_URL + path.replace(/^\//, ''));

type WorldMedia = { slug: string; logo: string; hero?: string; icon?: string; logoOriginal?: string; gallery?: string[]; scene?: string };
const WORLDS = media.worlds as unknown as Record<string, WorldMedia>;

/** A world's 3D logo in Phifing, by the world's name (names hold across seeded and live records; ids do not). */
export const worldLogo = (name?: string) => {
  const world = name ? WORLDS[name] : undefined;
  return world ? mediaUrl(`logos/${world.slug}.svg`) : undefined;
};
