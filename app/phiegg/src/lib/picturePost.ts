/**
 * Every picture opens as a post. A post is made, when asked by its id (lib/data.ts `postById`), of what is no post:
 *   a record's picture (a world, a club, a drop, a look, a person: EntityAvatar, PersonAvatar, LookImage): the record's
 *     own pictures (its gallery, a look's renders, its image, its logo), else its world's views, else the pictures of the shots posted by it, in it or
 *     about it; its name, what it says of itself, its owner as the author;
 *   a picture of a band (`pic:<file>`: the welcome's Step in, About's bands): the band's pictures from that one on, the
 *     band's words.
 * So the post screen, its comments, likes and the posts after it are the same for every picture of the app.
 */
import type { ID, Post, Slide, Tone } from '../types/phiegg';
import { D, itemOf, kindOfId, person, postMaker } from './data';
import landing from '../data/landing.json';
import about from '../data/about.json';
import gembar from '../data/gembar.json';

type Row = Record<string, unknown> & { id: ID; name?: string; tone?: Tone };
const text = (r: Row, ...keys: string[]) => keys.map((k) => r[k]).find((v): v is string => typeof v === 'string' && !!v) ?? '';

/** The pictures a record shows: its own, else its world's, else its shots'. */
const picturesOf = (id: ID, r: Row): string[] => {
  const gallery = (r.gallery as { lg?: string; sm?: string }[] | undefined)?.map((g) => g.lg ?? g.sm ?? '') ?? [];
  // A look's renders, front first (`views`: FRONT, BACK, ...).
  const renders = r.views && typeof r.views === 'object' ? Object.values(r.views as Record<string, unknown>).filter((v): v is string => typeof v === 'string') : [];
  const own = [...gallery, ...renders, text(r, 'image'), text(r, 'cover'), text(r, 'logo')].filter(Boolean);
  if (own.length) return own;
  // A show's or a drop's looks, each its renders (`looks`: their records or ids; `lookIds`).
  const looked = [...((r.looks as ({ lookId?: ID; id?: ID } | ID)[] | undefined) ?? []), ...((r.lookIds as ID[] | undefined) ?? [])]
    .map((one) => (typeof one === 'string' ? one : one.lookId ?? one.id ?? ''))
    .flatMap((look) => { const l = itemOf('look', look) as Row | undefined; return l ? picturesOf(l.id, l).slice(0, 1) : []; });
  if (looked.length) return looked;
  const world = itemOf('world', text(r, 'worldId')) as Row | undefined;
  const views = world ? picturesOf(world.id, world) : [];
  if (views.length) return views;
  return D.feed.shots.filter((s) => s.media.src && (s.authorId === id || s.clubId === id || s.worldId === id)).slice(0, 12).map((s) => s.media.src!);
};

const post = (id: ID, author: ID, title: string, caption: string, tone: Tone, pictures: string[], day: string, at: { worldId?: ID | null; clubId?: ID | null }): Post => ({
  id, authorId: author, kind: 'image', clubId: at.clubId ?? null, worldId: at.worldId ?? null, caption, likes: 0, createdAt: day, tags: [],
  slides: (pictures.length ? pictures : ['']).map((src): Slide => ({ title, tone, caption, src: src || undefined })), comments: [],
});

/** A record as a post. */
const recordPost = (id: ID): Post | undefined => {
  const kind = kindOfId(id);
  const r = kind ? (itemOf(kind, id) as Row | undefined) : undefined;
  if (!kind || !r) return undefined;
  const who = kind === 'person' || kind === 'agent' ? id : text(r, 'ownerId', 'founderId', 'creatorId', 'hostId', 'authorId') || D.core.currentUserId;
  const name = kind === 'person' || kind === 'agent' ? person(id).name : text(r, 'name', 'title') || id;
  return post(id, who, name, text(r, 'tagline', 'description', 'bio', 'caption'), r.tone ?? 'accent', picturesOf(id, r), text(r, 'createdAt', 'foundedAt', 'launchedAt', 'date'),
    { worldId: kind === 'world' ? id : text(r, 'worldId') || null, clubId: kind === 'club' ? id : text(r, 'clubId') || null });
};

/** A band's picture as a post: the band's pictures from the one pressed on, in the band's words. */
const STEP = landing.step as { before: string; after: string; body: string; picture?: string[]; centre?: string };
const ABOUT = (about as { band: { title: string; body: string; picture: string }[] }).band;
/** The old gembar's reels (scripts/gembar.py): each its pictures, large, in its teller's words. */
export const REELS = (gembar as { reel: { id: string; name: string; caption: string; picture: string[] }[] }).reel;
export const reelPicture = (key: string, size: 'sm' | 'lg') => `${key}-${size}.webp`;
const BANDS = [
  ...REELS.map((reel) => ({ pictures: reel.picture.map((key) => reelPicture(key, 'lg')), title: reel.name, caption: reel.caption })),{ pictures: [...(STEP.centre ? [STEP.centre] : []), ...(STEP.picture ?? [])], title: `${STEP.before} ${STEP.after}`, caption: STEP.body },
  // About's bands, each its picture in its own words, the next band's after it.
  ...ABOUT.map((b, i) => ({ pictures: [b.picture, ...ABOUT.slice(i + 1).map((x) => x.picture)], title: b.title, caption: b.body }))];
export const pictureId = (src: string) => 'pic:' + src;
const bandPost = (id: ID): Post | undefined => {
  if (!id.startsWith('pic:')) return undefined;
  const src = id.slice(4);
  const band = BANDS.find((b) => b.pictures[0] === src) ?? BANDS.find((b) => b.pictures.includes(src));
  const pictures = band ? [...band.pictures.slice(band.pictures.indexOf(src)), ...band.pictures.slice(0, band.pictures.indexOf(src))] : [src];
  return post(id, (landing as { ask: { agentId: ID } }).ask.agentId, band?.title ?? '', band?.caption ?? '', 'accent', pictures, '', {});
};

postMaker(bandPost);
postMaker(recordPost);
