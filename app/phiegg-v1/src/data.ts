import React from 'react';
import { persisted, type Persisted } from '@phi-kit/api';

export type User = { id: string; handle: string; name: string; tone: string; bio?: string; verified?: boolean; followers?: number; clubIds?: string[] };
export type Club = { id: string; name: string; ticker: string; tone: string; supply: number; floor: number; holders: number; chain: string; status: string; tagline: string; description: string; tags: string[]; founderId: string };
export type Shot = { id: string; authorId: string; clubId: string | null; media: { kind: string; tone: string; ratio: string; title: string }; caption: string; likes: number; comments: number; reshares: number; createdAt: string; tags: string[] };
export type Look = { id: string; n: string; collectionId: string; name: string; colour: string; hex: string; garments: string[]; rarity: string; edition: number; minted: number; owners: number; usd: number; floor: number; change7d: number; views: Record<string, string>; opaque?: Record<string, string> };
export type Msg = { id: string; authorId: string; at: string; text: string };
export type Ev = { id: string; kind: string; title: string; clubId: string; worldId: string; startsAt: string; rsvps: number };
export type DB = {
  core: { currentUserId: string; users: User[]; clubs: Club[] };
  feed: { moments: { id: string; userId: string; label: string; live?: boolean; isSelf?: boolean }[]; shots: Shot[]; suggestedClubIds: string[] };
  explore: { categories: string[]; trendingClubIds: string[]; creatorIds: string[] };
  phipad: { hero: { title: string; subtitle: string; body: string }; tracks: { id: string; name: string; pool: number; currency: string; body: string }[]; stages: { id: string; label: string }[]; applications: { id: string; clubId: string; trackId: string; stage: string; ask: number; raised: number }[] };
  messages: { conversations: { id: string; kind: string; title: string; userIds: string[]; last: string; at: string; unread: number }[]; threads: Record<string, Msg[]> };
  events: { filters: string[]; events: Ev[] };
  ls: { store: { name: string; tagline: string }; views: { id: string; label: string }[]; collections: { id: string; name: string; season: string; desc: string; lookIds: string[] }[]; looks: Look[] };
};

const FILES = ['core', 'feed', 'explore', 'ls', 'messages', 'events', 'phipad'] as const;

/** One parallel load of the app's files (swap for Phiora: GET /tree or paged endpoints). */
export const useDB = () => {
  const [db, setDb] = React.useState<DB | null>(null);
  const [err, setErr] = React.useState('');
  React.useEffect(() => {
    Promise.all(FILES.map((f) => fetch(import.meta.env.BASE_URL + 'data/' + f + '.json').then((r) => r.json())))
      .then((all) => setDb(Object.fromEntries(FILES.map((f, i) => [f, all[i]])) as DB), (e) => setErr(String(e)));
  }, []);
  return { db, err };
};

export const byId = <T extends { id: string }>(list: T[], id: string | null | undefined) => list.find((x) => x.id === id);
export const img = (p: string) => import.meta.env.BASE_URL + p;
export const num = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n.toLocaleString('en-US');
export const usd = (n: number) => Math.round(n).toLocaleString('en-US') + ' USD';
export const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/** Data tones → Organic ramp fills (bg, ink). */
const TONE: Record<string, [string, string]> = {
  accent: ['var(--phi-organic-accent-300)', 'var(--phi-organic-accent-900)'],
  sage: ['var(--phi-organic-sage-300)', 'var(--phi-organic-sage-900)'],
  ink: ['var(--phi-color-gray-800)', '#f5ead8'],
  sand: ['var(--phi-color-background-secondary)', 'var(--phi-color-text-primary)'],
};
export const tone = (t: string) => TONE[t] || TONE.sand;

/** Owned items, profile edits and the small keyed maps below are Phiora user-state documents
 *  (`/state/<name>`) when VITE_PHI_API is set, localStorage otherwise — see @phi-kit/api. */
/** Server-owned with VITE_PHI_API (Phiora changes it through /shop); local otherwise. */
const OWNED = persisted<Record<string, number>>('owned', {}, undefined, { serverOwned: true });
export const owned = (): Record<string, number> => ({ ...OWNED.get() });
export const disown = (id: string) => { const o = owned(); delete o[id]; OWNED.replace(o); };
export const own = (id: string) => OWNED.replace({ ...OWNED.get(), [id]: Date.now() });

/** Profile edits (name, handle, bio) layered over the seed user — `/state/me`. */
export type MeEdit = { name?: string; handle?: string; bio?: string };
const ME = persisted<MeEdit>('me', {});
export const meEdits = (): MeEdit => ME.get();
export const saveMe = (e: MeEdit) => ME.set(e);

/** Keyed user-state map (sent messages, RSVPs, comments…): `useStored('phi.rsvp', {})` → `/state/rsvp`. */
const docs = new Map<string, Persisted<unknown>>();
const doc = <T,>(key: string, init: T) => {
  if (!docs.has(key)) docs.set(key, persisted<unknown>(key.replace(/^phi\./, ''), init));
  return docs.get(key) as Persisted<T>;
};
export const useStored = <T,>(key: string, init: T) => {
  const d = doc(key, init);
  return [d.use(), d.set] as const;
};
