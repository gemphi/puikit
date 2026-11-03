// Big, screen-specific data files load on demand so they stay out of the main bundle:
// places.json (~1 MB: districts + places per city) and the comment-thread shards (data/threads/*.json).
// Helpers in lib/data read the cached copy synchronously; components call the hook to trigger
// the load and re-render once it lands.
import { useEffect, useState } from 'react';
import { mapKeys, remapDoc, srcId, MAP } from './ids';
import type { PlacesData } from '../types/phiegg';

type Lazy<T> = { now: () => T | undefined; load: () => Promise<T>; use: () => T | undefined };
function lazy<T>(importer: () => Promise<{ default: unknown }>): Lazy<T> {
  let value: T | undefined; let pending: Promise<T> | undefined;
  const load = () => (pending ??= importer().then((m) => (value = m.default as T)));
  return {
    now: () => value,
    load,
    use: () => {
      const [v, setV] = useState<T | undefined>(value);
      useEffect(() => { if (!v) void load().then(setV); }, [v]);
      return v;
    },
  };
}

export type ThreadComment = { id: string; targetId: string; parentId: string | null; depth: number; authorId: string; text: string; likes: number; at: string };
export const PLACES = lazy<PlacesData>(() => import('../data/places.json').then((m) => {
  // Same ids as the database: remap the city keys and every reference inside (clubId, worldId, …).
  const d = m.default as unknown as PlacesData;
  remapDoc(d);
  return { default: { ...d, cities: mapKeys(d.cities as Record<string, unknown>, MAP), districts: mapKeys(d.districts as unknown as Record<string, unknown>, MAP) } as unknown as PlacesData };
}));
export const usePlaces = PLACES.use;

// Comment threads are split into 16 shards by post id (scripts/threads.mjs); a post loads only its own shard.
const SHARDS = 16;
const shardOf = (id: string) => [...id].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7) % SHARDS;
const files = import.meta.glob<{ default: { comments: ThreadComment[] } }>('../data/threads/*.json');
const shard = Array.from({ length: SHARDS }, (_, i) => lazy<{ comments: ThreadComment[] }>(() => files[`../data/threads/${String(i).padStart(2, '0')}.json`]()));
/** The thread under one post (and its pose, for show looks). */
export function useThreadFor(...dbIds: (string | undefined)[]): ThreadComment[] | undefined {
  // Shards were cut and keyed on the original ids, so the database id goes back through the map first.
  const ids = dbIds.map((x) => (x ? srcId(x) : x));
  const keys = [...new Set(ids.filter((x): x is string => !!x).map(shardOf))];
  const docs = keys.map((k) => shard[k].use());
  if (docs.some((d) => !d)) return undefined;
  const want = new Set(ids.filter(Boolean));
  return docs.flatMap((d) => d!.comments.filter((c) => want.has(c.targetId)));
}

// Full stories (data/stories.json, about 220 KB): the long text, logline and, for a retold storyline, what it is after.
export type StoryRecord = { id: string; seriesId: string; title: string; logline: string; story: string; genre: string; era: string; after?: string; clubId: string; worldId: string };
export const STORIES = lazy<{ stories: StoryRecord[] }>(() => import('../data/stories.json'));
export const useStory = (id?: string) => { const d = STORIES.use(); return id ? d?.stories.find((x) => x.id === id) : undefined; };
