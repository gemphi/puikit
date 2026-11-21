// Where pictures come from. Set VITE_PHI_MEDIA to the bucket or CDN address and every picture reads its key there
// (https://phiegg.com/cdn on the server, a local S3 store here, S3 and CloudFront later); unset, the app serves its own
// public/ folder. Keys are set out in CONTENT-SERVING.md and built by scripts/media/build_media.py.
import media from '../data/media.json';
import keys from '../data/media-key.json';

const MEDIA = (import.meta.env.VITE_PHI_MEDIA as string | undefined)?.replace(/\/$/, '');

/** A path under public/ as its key in the bucket: the first rule of data/media-key.json that fits, else the path. */
const RULES = keys.rule.map((r) => ({ from: new RegExp(r.from), to: r.to }));
const keyOf = (path: string) => {
  const p = path.replace(/^\//, '');
  const rule = RULES.find((r) => r.from.test(p));
  return rule ? p.replace(rule.from, rule.to) : p;
};

export const mediaUrl = (path: string) => (MEDIA ? `${MEDIA}/${keyOf(path)}` : import.meta.env.BASE_URL + path.replace(/^\//, ''));

type WorldMedia = { slug: string; logo: string; hero?: string; icon?: string; logoOriginal?: string; gallery?: string[]; scene?: string };
const WORLDS = media.worlds as unknown as Record<string, WorldMedia>;

/** A world's 3D logo in Phifing, by the world's name (names hold across seeded and live records; ids do not). */
export const worldLogo = (name?: string) => {
  const world = name ? WORLDS[name] : undefined;
  return world ? mediaUrl(`logos/${world.slug}.svg`) : undefined;
};
