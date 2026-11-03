import raw from '../../mocks/api-posts.json';
import { resolve } from './client';
import { creatorByHandle, creatorHandles } from './creator';
import { postPoster, postSlides } from '../media';
import { TOPICS } from '../topics';
import type { SocialFeedKind, SocialPost } from '@pui/types';

/** The app's post: the module's shape plus the hue its poster is built from. */
export interface Post extends SocialPost {
  hue: number;
  topic: string;
}

/** The payload shape, spelled out: `Omit` over an index-signatured type
 * erases the named fields, so the wire shape is declared rather than derived. */
interface RawPost {
  id: string;
  authorHandle: string;
  caption: string;
  hashtags?: string[];
  sound?: { title: string; artist: string };
  hue: number;
  slideCount?: number;
  topic: string;
  stats: Post['stats'];
  postedAt?: string;
}

/** The single place that knows the payload shape: join author, build poster. */
const posts: Post[] = (raw as unknown as RawPost[]).map(({ authorHandle, ...p }) => ({
  ...p,
  author: creatorByHandle(authorHandle),
  poster: postPoster(p),
  slides: postSlides(p),
}));

const topicPool = TOPICS.map((x) => x.slug);

/** The feed never runs dry: fixtures first, then seeded fill to 64. */
export const getFeed = async (_kind: SocialFeedKind): Promise<Post[]> =>
  resolve([
    ...posts,
    ...gen('feed', Math.max(0, 64 - posts.length), (i) => topicPool[i % topicPool.length], (i, topic) => `${cap(topic)} · take ${String(i + 1).padStart(3, '0')}`),
  ]);

export const getTrending = async (): Promise<Post[]> =>
  resolve([
    ...[...posts].sort((a, b) => (b.stats.views ?? 0) - (a.stats.views ?? 0)),
    ...gen('explore', Math.max(0, 96 - posts.length), (i) => topicPool[i % topicPool.length], (i, topic) => `${cap(topic)} · pick ${String(i + 1).padStart(3, '0')}`),
  ]);

export const getPostsByCreator = async (handle: string): Promise<Post[]> => {
  const own = posts.filter((p) => p.author.handle === handle);
  return resolve([
    ...own,
    ...gen(`creator-${handle}`, Math.max(0, 64 - own.length), (i) => topicPool[i % topicPool.length], (i, topic) => `${cap(topic)} · ${String(i + 1).padStart(3, '0')}`, handle),
  ]);
};

export const getPostById = async (id: string): Promise<Post | null> =>
  resolve(generatedById.get(id) ?? posts.find((p) => p.id === id) ?? null);

/** Every topic in the catalog, for the feed's category tabs. */
/** Case-insensitive search across captions, tags, topics and creators. */
export const searchPosts = async (q: string): Promise<Post[]> => {
  const needle = q.trim().toLowerCase();
  if (!needle) return resolve([]);
  return resolve(
    posts.filter(
      (p) =>
        p.caption.toLowerCase().includes(needle) ||
        p.topic.toLowerCase().includes(needle) ||
        (p.hashtags ?? []).some((h) => h.toLowerCase().includes(needle)) ||
        p.author.handle.toLowerCase().includes(needle) ||
        p.author.name.toLowerCase().includes(needle)
    )
  );
};

/** The creators a query matches, each once, by handle or name. */
export const searchCreators = async (q: string): Promise<Post['author'][]> => {
  const needle = q.trim().toLowerCase();
  if (!needle) return resolve([]);
  const seen = new Map<string, Post['author']>();
  for (const p of posts) {
    const a = p.author;
    if (a.handle.toLowerCase().includes(needle) || a.name.toLowerCase().includes(needle)) {
      seen.set(a.handle, a);
    }
  }
  return resolve([...seen.values()]);
};

/** The shop floors, in order. Labels resolve through the app's locales. */
export const SHOP_CATEGORIES = [
  'fashion', 'jewelry', 'watches', 'travel', 'leisure', 'tropicals', 'couture', 'hiphop', 'sport',
] as const;

// Section catalogues are generated, seeded by the section's own name — the
// same section always shows the same items — and registered so a generated
// post opens on the post page like any fixture post.
const generatedById = new Map<string, Post>();
const sectionCache = new Map<string, Post[]>();
const TIERS = [64, 128, 256, 512];

const seedOf = (name: string): number => {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return h >>> 0;
};

const mulberry = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Deterministic filler content, registered so every item opens for real. */
const gen = (
  seedName: string,
  count: number,
  topicOf: (i: number) => string,
  captionOf: (i: number, topic: string) => string,
  fixedHandle?: string
): Post[] => {
  const hit = sectionCache.get(seedName);
  if (hit) return hit;
  const rand = mulberry(seedOf(seedName));
  const handles = creatorHandles();
  const items: Post[] = Array.from({ length: count }, (_, i) => {
    const topic = topicOf(i);
    const hue = Math.floor(rand() * 360);
    const slideCount = i % 6 === 5 ? 4 + (i % 4) : undefined;
    const base = {
      id: `gs-${seedName}-${i + 1}`,
      author: creatorByHandle(fixedHandle ?? handles[Math.floor(rand() * handles.length)]),
      caption: captionOf(i, topic),
      hashtags: [topic],
      hue,
      topic,
      slideCount,
      stats: {
        views: Math.floor(rand() * 4_000_000) + 20_000,
        likes: Math.floor(rand() * 400_000) + 1_000,
        comments: Math.floor(rand() * 8_000) + 40,
        saves: Math.floor(rand() * 40_000) + 200,
        shares: Math.floor(rand() * 20_000) + 100,
      },
    };
    const post: Post = { ...base, poster: postPoster(base), slides: postSlides(base) };
    generatedById.set(post.id, post);
    return post;
  });
  sectionCache.set(seedName, items);
  return items;
};

const cap = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

/**
 * A section's catalogue: at least 64 items — the tier (64/128/256/512) hangs
 * on the section's name — except `shops`, which shows its 64 floor picks
 * across the shop categories. `labelOf` renders slugs for captions, so copy
 * stays with the app's locale.
 */
export const getSectionPosts = async (
  name: string,
  labelOf: (slug: string) => string
): Promise<Post[]> => {
  const seed = seedOf(name);
  const count = name === 'shops' ? 64 : TIERS[seed % TIERS.length];
  return resolve(
    gen(
      name,
      count,
      (i) => (name === 'shops' ? SHOP_CATEGORIES[i % SHOP_CATEGORIES.length] : name),
      (i, topic) =>
        name === 'shops'
          ? `${labelOf(topic)} · drop ${String(i + 1).padStart(2, '0')}`
          : `${labelOf(name)} · ${String(i + 1).padStart(3, '0')}`
    )
  );
};


/** The full taxonomy — every asset category, posted-to or not. */
export const getTopics = async (): Promise<string[]> =>
  resolve(TOPICS.map((x) => x.slug));
