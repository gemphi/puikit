/**
 * Every picture opens as a post. A post is made, when asked by its id (lib/data.ts `postById`), of what is no post:
 *   a record's picture (a world, a club, a drop, a person: EntityAvatar, PersonAvatar): the record's own pictures (its
 *     gallery, its image, its logo), else its world's views, else the pictures of the shots posted by it, in it or
 *     about it; its name, what it says of itself, its owner as the author;
 *   a picture of a band (`pic:<file>`, the welcome's Step in): the band's pictures from that one on, the band's words.
 * So the post screen, its comments, likes and the posts after it are the same for every picture of the app.
 */
import type { ID, Post, Slide, Tone } from '../types/phiegg';
import { D, itemOf, kindOfId, person, postMaker } from './data';
import landing from '../data/landing.json';

type Row = Record<string, unknown> & { id: ID; name?: string; tone?: Tone };
const text = (r: Row, ...keys: string[]) => keys.map((k) => r[k]).find((v): v is string => typeof v === 'string' && !!v) ?? '';

/** The pictures a record shows: its own, else its world's, else its shots'. */
const picturesOf = (id: ID, r: Row): string[] => {
  const gallery = (r.gallery as { lg?: string; sm?: string }[] | undefined)?.map((g) => g.lg ?? g.sm ?? '') ?? [];
  const own = [...gallery, text(r, 'image'), text(r, 'cover'), text(r, 'logo')].filter(Boolean);
  if (own.length) return own;
  const world = itemOf('world', text(r, 'worldId')) as Row | undefined;
  const views = world ? picturesOf(world.id, world) : [];
  if (views.length) return views;
  return D.feed.shots.filter((s) => s.media.src && (s.authorId === id || s.clubId === id || s.worldId === id)).slice(0, 12).map((s) => s.media.src!);
};

const post = (id: ID, author: ID, title: string, caption: string, tone: Tone, pictures: string[], at: { worldId?: ID | null; clubId?: ID | null }): Post => ({
  id, authorId: author, kind: 'image', clubId: at.clubId ?? null, worldId: at.worldId ?? null, caption, likes: 0, createdAt: '', tags: [],
  slides: (pictures.length ? pictures : ['']).map((src): Slide => ({ title, tone, caption, src: src || undefined })), comments: [],
});

/** A record as a post. */
const recordPost = (id: ID): Post | undefined => {
  const kind = kindOfId(id);
  const r = kind ? (itemOf(kind, id) as Row | undefined) : undefined;
  if (!kind || !r) return undefined;
  const who = kind === 'person' || kind === 'agent' ? id : text(r, 'ownerId', 'founderId', 'creatorId', 'hostId', 'authorId') || D.core.currentUserId;
  const name = kind === 'person' || kind === 'agent' ? person(id).name : text(r, 'name', 'title') || id;
  return post(id, who, name, text(r, 'tagline', 'description', 'bio', 'caption'), r.tone ?? 'accent', picturesOf(id, r),
    { worldId: kind === 'world' ? id : text(r, 'worldId') || null, clubId: kind === 'club' ? id : text(r, 'clubId') || null });
};

/** A band's picture as a post: the band's pictures from the one pressed on, in the band's words. */
const STEP = landing.step as { before: string; after: string; body: string; picture?: string[]; centre?: string };
const BANDS = [{ pictures: [...(STEP.centre ? [STEP.centre] : []), ...(STEP.picture ?? [])], title: `${STEP.before} ${STEP.after}`, caption: STEP.body }];
export const pictureId = (src: string) => 'pic:' + src;
const bandPost = (id: ID): Post | undefined => {
  if (!id.startsWith('pic:')) return undefined;
  const src = id.slice(4);
  const band = BANDS.find((b) => b.pictures.includes(src));
  const pictures = band ? [...band.pictures.slice(band.pictures.indexOf(src)), ...band.pictures.slice(0, band.pictures.indexOf(src))] : [src];
  return post(id, (landing as { ask: { agentId: ID } }).ask.agentId, band?.title ?? '', band?.caption ?? '', 'accent', pictures, {});
};

postMaker(bandPost);
postMaker(recordPost);
