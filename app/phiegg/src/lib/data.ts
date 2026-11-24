// Typed access to data/*.json, normalized to the one database's ids (md5 + slug, lib/ids.ts) before anything reads
// them; with VITE_PHI_API set, lib/live.ts overlays Phiora's changes on top at boot.
import "./ids";
import { rid, srcId } from "./ids";
import { core, feed, hosts, club, phipad, messages, events, agents, economy, series as seriesJson, league, ls, roles as rolesJson, casts as castsJson, pools as poolsJson, assets as assetsJson, ride as rideJson, jewel as jewelJson, beauty as beautyJson, collections as collectionsJson } from './datasets';
import explore from "../data/explore.json";
import profile from "../data/profile.json";
import settings from "../data/settings.json";
import landing from "../data/landing.json";
import { mediaUrl } from "./media";
import siteJson from "../data/site.json";
import sourceJson from '../data/source.json';
import threadCounts from '../data/threadCounts.json';
import type {
  Agent, AgentsData, ClubPage, CoreData, EventsPage, ExplorePage, FeedPage, Highlight, HostsPage, ID,
  LandingPage, MessagesPage, RolesData, CastsData, SalesData, TrailData, ShowsData, Show, EconomyData, SeriesData, LeagueData, LsData, StoresData, Store, ShopLook, PoolsData, Pool, PoolLot, PoolQuest, AssetsData, RideItem, RideData, JewelItem, JewelData, EggItem, SumItem, ItemType, ProfileItem, City, World, District, Place, PhipadPage, Post, ProfilePage, SettingsPage, Shot, Tone, User,
} from "../types/phiegg";

export const D = {
  core: core as unknown as CoreData,
  feed: feed as unknown as FeedPage,
  hosts: hosts as unknown as HostsPage,
  club: club as unknown as ClubPage,
  explore: explore as unknown as ExplorePage,
  phipad: phipad as unknown as PhipadPage,
  messages: messages as unknown as MessagesPage,
  events: events as unknown as EventsPage,
  profile: profile as unknown as ProfilePage,
  settings: settings as unknown as SettingsPage,
  landing: landing as unknown as LandingPage,
  agents: agents as unknown as AgentsData,
  shows: { shows: [], poses: [] } as unknown as ShowsData, // filled by lib/heavy.ts
  economy: economy as unknown as EconomyData,
  series: seriesJson as unknown as SeriesData,
  league: league as unknown as LeagueData,
  ls: ls as unknown as LsData,
  stores: { stores: [] } as unknown as StoresData, // filled by lib/heavy.ts
  roles: rolesJson as unknown as RolesData,
  casts: castsJson as unknown as CastsData,
  sales: { sales: [] } as unknown as SalesData, // filled by lib/heavy.ts
  trail: { sales: [] } as unknown as TrailData, // the assets' ledger, filled by lib/heavy.ts
  pools: poolsJson as unknown as PoolsData,
  assets: assetsJson as unknown as AssetsData,
  ride: rideJson as unknown as RideData,
  jewel: jewelJson as unknown as JewelData,
};
// Collection nests (data/collections.json, scripts/collections.mjs) sit with the other nests: the families clubs
// break out of — one mark, many clubs.
D.hosts.nests.push(...((collectionsJson as { collections: unknown[] }).collections as HostsPage['nests']));
export const collectionOf = (id: ID | null | undefined) => (id ? D.hosts.nests.find((n) => n.id === id && n.kind === 'collection') : undefined);
export const clubsOfCollection = (nestId: ID) => D.core.clubs.filter((c) => (c as { nestId?: ID }).nestId === nestId);
export type CollectionFamily = { nest: HostsPage['nests'][number]; clubs: ReturnType<typeof clubsOfCollection>; holders: number; supply: number; pfts: number; volumeUsd: number };
let FAMILIES: CollectionFamily[] | null = null;
/** Every collection with its family rolled up (clubs, holders, supply, PFT count, sales volume), biggest volume first. */
export function collectionFamilies(): CollectionFamily[] {
  if (FAMILIES) return FAMILIES;
  const nestOfItem = new Map<ID, ID>();
  const take = (rows: { id: ID }[]) => { for (const r of rows) { const n = (r as { nestId?: ID }).nestId; if (n) nestOfItem.set(r.id, n); } };
  take(STORES.flatMap((st) => st.looks)); take(D.club.pieces); take(D.assets.eggs); take(D.assets.sums); take(D.assets.profiles); take(D.ride.list); take(D.jewel.list);
  const vol = new Map<ID, number>(); const cnt = new Map<ID, number>();
  nestOfItem.forEach((n) => cnt.set(n, (cnt.get(n) ?? 0) + 1));
  for (const x of D.sales.sales) if (x.event === 'sale') { const n = nestOfItem.get(x.itemId); if (n) vol.set(n, (vol.get(n) ?? 0) + x.priceUsd); }
  FAMILIES = D.hosts.nests.filter((n) => n.kind === 'collection').map((nest) => {
    const clubs = clubsOfCollection(nest.id);
    return { nest, clubs, holders: clubs.reduce((a, c) => a + c.holders, 0), supply: clubs.reduce((a, c) => a + c.supply, 0), pfts: cnt.get(nest.id) ?? 0, volumeUsd: vol.get(nest.id) ?? 0 };
  }).sort((a, b) => b.volumeUsd - a.volumeUsd || b.holders - a.holders);
  return FAMILIES;
}

export const site = siteJson;
export type SiteCopyKey = keyof typeof siteJson.copy;

/** Copy lookup with {var} interpolation. Every UI string goes through here. */
export function t(key: SiteCopyKey, vars: Record<string, string | number> = {}): string {
  return site.copy[key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}
export const lookup = <V>(table: Record<string, V>, key: string): V | undefined => table[key];

export interface Person {
  id: ID; name: string; handle: string; tone: Tone; initials: string; isAgent: boolean; glyph?: string;
  verified: boolean; followers: number; following: number; bio: string; badges: string[]; clubIds: ID[];
  agent?: Agent; user?: User;
}

export const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
export const firstName = (n: string) => n.split(" ")[0].replace(/'s$/, "");
// ── One lookup for every kind. Where a kind's rows live is data (data/source.json), never a function per kind ──
/** What a row of each kind is. A kind not listed here is still found, as a plain row. */
type Schema = {
  person: (typeof D.core.users)[number]; agent: (typeof D.agents.agents)[number]; club: (typeof D.core.clubs)[number]; world: World;
  host: (typeof D.hosts.hosts)[number]; nest: (typeof D.hosts.nests)[number]; show: Show; pose: (typeof D.shows.poses)[number];
  series: (typeof D.series.series)[number]; event: (typeof D.events.events)[number]; coin: (typeof D.economy.coins)[number];
  store: Store; look: ShopLook; pool: Pool; lot: PoolLot; poolQuest: PoolQuest; metric: (typeof D.pools.metrics)[number];
  piece: (typeof D.club.pieces)[number]; role: (typeof D.roles.types)[number]; roleCategory: (typeof D.roles.categories)[number];
  egg: EggItem; sum: SumItem; profilePft: ProfileItem; ride: RideItem; jewel: JewelItem; cast: (typeof D.casts.casts)[number];
  pft: Pft; rental: Rental; shade: Shade & { line: string };
};
export type ItemKind = keyof Schema;
/** A row of a kind: Item<'world'>. */
export type Item<K extends ItemKind> = Schema[K];
export type ItemRow = Record<string, unknown> & { id: ID };
const SOURCE = (sourceJson as unknown as { kind: Record<string, string | string[]> }).kind;
/** The sets the app builds from D, read only when a path walks into them. */
const DERIVED = { get store() { return STORES; }, get pft() { return PFTS; }, get rental() { return RENTALS; }, get shade() { return [...SHADES.values()]; }, get feedPost() { return feedPosts(); } };
/** Every value at a path: `*` steps into each row of a list; the end is a list's rows, or the one value there. */
export const valuesAt = (v: unknown, keys: string[]): unknown[] => (keys.length === 0 ? (Array.isArray(v) ? v : v == null ? [] : [v])
  : keys[0] === '*' ? (Array.isArray(v) ? v : []).flatMap((x) => valuesAt(x, keys.slice(1)))
  : valuesAt((v as Record<string, unknown> | undefined)?.[keys[0]], keys.slice(1)));
const INDEX = new Map<string, Map<ID, ItemRow>>();
/** Every kind that has rows. */
export const kindsOf = () => Object.keys(SOURCE);
export const hasKind = (kind: string) => kind in SOURCE;
/** The lists at a path, the arrays themselves: `*` steps into each row of a list. */
const listsAt = (v: unknown, keys: string[]): ItemRow[][] => (keys.length === 0 ? (Array.isArray(v) ? [v as ItemRow[]] : [])
  : keys[0] === '*' ? (Array.isArray(v) ? v : []).flatMap((x) => listsAt(x, keys.slice(1)))
  : listsAt((v as Record<string, unknown> | undefined)?.[keys[0]], keys.slice(1)));
/** The lists a kind's rows are kept in (the arrays themselves, so a row can be taken out of them). */
export const listsOf = (kind: string): ItemRow[][] => [SOURCE[kind] ?? []].flat().flatMap((path) => listsAt({ ...D, derived: DERIVED }, path.split('.')));
/** Every row of a kind. */
export function itemsOf<K extends ItemKind>(kind: K): Schema[K][];
export function itemsOf(kind: string): ItemRow[];
export function itemsOf(kind: string): unknown[] {
  const lists = listsOf(kind); const rows = lists.flat();
  if (lists.length < 2) return rows;
  const seen = new Set<ID>(); // kept in several lists: the first row with an id wins
  return rows.filter((r) => !seen.has(r.id) && !!seen.add(r.id));
}
/** One row of a kind by its id. */
export function itemOf<K extends ItemKind>(kind: K, id?: ID | null): Schema[K] | undefined;
export function itemOf(kind: string, id?: ID | null): ItemRow | undefined;
export function itemOf(kind: string, id?: ID | null): unknown {
  if (!id) return undefined;
  let rows = INDEX.get(kind);
  if (!rows) { rows = new Map(); for (const r of itemsOf(kind)) if (!rows.has(r.id)) rows.set(r.id, r); INDEX.set(kind, rows); }
  return rows.get(id);
}
/** The kind of any record from its id alone (ids are unique across kinds), so anything listed can be opened. */
let KIND_OF: Map<ID, string> | null = null;
export const kindOfId = (id: ID): string | undefined => {
  if (!KIND_OF) { KIND_OF = new Map(); for (const k of kindsOf()) for (const r of itemsOf(k)) if (!KIND_OF.has(r.id)) KIND_OF.set(r.id, k); }
  return KIND_OF.get(id);
};
/** New, edited or removed records: the next lookup rebuilds. */
export const forgetKinds = () => { KIND_OF = null; };
/** The one value at a path from a record ("cities.length"). A step into an id follows it to the record it names:
 *  "worldId.kind" is the kind of the record's world, "clubId.ticker" its club's ticker. */
export const valueAt = (v: unknown, path: string): unknown => path.split('.').reduce<unknown>((x, k) => {
  const row = typeof x === 'string' ? itemOf(kindOfId(x) ?? '', x) : x;
  return row == null ? undefined : (row as Record<string, unknown>)[k];
}, v);
/** The record a nested record is kept in (a zone in its world, a look in its shop), read from where the kind's rows
 *  are kept (data/source.json: `core.worlds.*.cities` is a list inside each world). */
export const holderOf = (kind: string, id: ID): { kind: string; row: ItemRow } | undefined => {
  for (const path of [SOURCE[kind] ?? []].flat()) {
    const at = path.lastIndexOf('.*.'); const parent = path.slice(0, Math.max(0, at));
    const holder = at < 0 ? undefined : kindsOf().find((k) => [SOURCE[k]].flat().includes(parent));
    const row = holder ? itemsOf(holder).find((r) => valuesAt(r, path.slice(at + 3).split('.')).some((x) => (x as ItemRow | undefined)?.id === id)) : undefined;
    if (holder && row) return { kind: holder, row };
  }
  return undefined;
};
/** A value of the data itself ("shows.season"), for words that carry a figure. */
export const dataAt = (path: string): unknown => valueAt({ ...D, derived: DERIVED }, path);
export const showForWorld = (worldId: ID) => D.shows.shows.find((s) => s.worldId === worldId);

export function person(id: ID): Person {
  const a = itemOf('agent', id);
  if (a) return { id: a.id, name: a.name, handle: a.handle, tone: a.tone, initials: initials(a.name), isAgent: true, glyph: a.glyph,
    verified: a.verified, followers: a.followers, following: a.following, bio: a.bio, badges: a.badges, clubIds: a.clubIds, agent: a };
  const u = itemOf('person', id);
  if (!u) return { id, name: id, handle: id, tone: "neutral", initials: "?", isAgent: false, verified: false, followers: 0, following: 0, bio: "", badges: [], clubIds: [] };
  return { id: u.id, name: u.name, handle: u.handle, tone: u.tone, initials: initials(u.name), isAgent: false,
    verified: u.verified, followers: u.followers, following: u.following, bio: u.bio, badges: u.badges, clubIds: u.clubIds, user: u };
}
export const me = () => person(D.core.currentUserId);

/** A feed shot as a carousel post: cover slide + one slide per look item. */
export function shotPost(s: Shot): Post {
  return {
    id: s.id, authorId: s.authorId, kind: s.media.kind, clubId: s.clubId, worldId: s.worldId, cityId: s.cityId, caption: s.caption,
    likes: s.likes, createdAt: s.createdAt, tags: s.tags,
    slides: [{ title: s.media.title, tone: s.media.tone, hex: s.media.hex, lookId: s.media.lookId, family: s.media.family, src: s.media.src },
      ...(s.media.views ?? []).map((v) => ({ title: s.media.title, tone: s.media.tone, src: v.src, caption: viewLabel(v.view) })), ...s.lookItems.map((li, i) => ({
      title: li, tone: site.lookTones[i % site.lookTones.length] as Tone, caption: t("piece", { n: i + 2 }) }))],
    comments: site.defaultComments.map((c, i) => ({ ...c, authorId: rid('person', c.authorId), id: `${s.id}_c${i}` })), // site.json keeps the written ids
  };
}
/** Posts made of what is no post (any record's pictures, a band's pictures: lib/picturePost.ts), asked last. */
const MAKERS: ((id: ID) => Post | undefined)[] = [];
export const postMaker = (make: (id: ID) => Post | undefined) => { MAKERS.push(make); };
export const postById = (id: ID): Post | undefined =>
  D.agents.posts.find((p) => p.id === id) ?? (() => { const s = D.feed.shots.find((x) => x.id === id); return s && shotPost(s); })()
  ?? MAKERS.reduce<Post | undefined>((found, make) => found ?? make(id), undefined);

/** An agent's greeting addressed to whoever is signed in (the seed text names the prototype's member, Noor). */
export const greetingOf = (a: { greeting: string }) => { const me = person(D.core.currentUserId).name.split(' ')[0]; return me && me !== 'Guest' ? a.greeting.replace(/\bNoor\b/g, me) : a.greeting.replace(/,? Noor\b/g, ''); };
/** Comments on a post: its own, the threads under it (data/threadCounts.json, from scripts/threads.mjs) and yours. */
export const commentCount = (post: { id: ID; comments: unknown[] }, mine = 0) => post.comments.length + ((threadCounts as Record<string, number>)[srcId(post.id)] ?? 0) + mine;
export const postsBy = (author: ID): Post[] =>
  [...D.agents.posts.filter((p) => p.authorId === author), ...D.feed.shots.filter((s) => s.authorId === author).map(shotPost)];

/** People's shots interleaved with agent posts. */
export function feedPosts(): Post[] {
  const ap = D.agents.posts.filter((p) => itemOf('agent', p.authorId)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); // newest first, so live drops lead
  return D.feed.shots.flatMap((s, i) => (ap[i] ? [shotPost(s), ap[i]] : [shotPost(s)]));
}

export function storySets(uid: ID): Highlight[] {
  const a = itemOf('agent', uid);
  if (a) return a.highlights;
  const ps = postsBy(uid);
  if (!ps.length) return [];
  return [{ id: `${uid}_today`, label: t("today"), tone: ps[0].slides[0].tone,
    frames: ps.slice(0, 4).map((p) => ({ title: p.slides[0].title, tone: p.slides[0].tone, caption: p.caption })) }];
}

export const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e4 ? Math.round(n / 1e3) + "k" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
export const ago = (iso: string, now = Date.now()) => {
  const h = Math.max(0, Math.round((now - Date.parse(iso)) / 36e5));
  return h < 1 ? t("now") : h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

/** Public path of a world's generated default image (assets/worlds → public/worlds). */
export const worldImage = (w?: { image?: string }) => (w && w.image ? mediaUrl(w.image.replace(/^assets\//, '')) : undefined);
/** A world's picture for a card: its own small render when it has views (never the large file), else its scene. */
export const worldThumb = (w?: World) => (w?.gallery?.length ? mediaUrl(w.gallery[0].sm) : worldImage(w));
/** A world's own mark (public/cities/<slug>/logo.webp), when it has one. */
export const worldMark = (w?: World) => (w?.logo ? mediaUrl(w.logo) : undefined);
/** What a type of record is called (host, egg, pft …), from site.json typeNames. */
export const typeName = (type: string) => (site as unknown as { typeNames: Record<string, string> }).typeNames[type] ?? type;
/** The label of a world view (3q, front, close-up-1 …), from site.json cityViews. */
export const viewLabel = (view: string) => (site as unknown as { cityViews: Record<string, string> }).cityViews[view] ?? view;
export const garmentOf = (id?: string) => (site as unknown as { garments: { id: string; name: string; path: string }[] }).garments.find((g) => g.id === id);


/** Public URL of a shop image (public/items/…). */
export const itemImage = (p: string) => mediaUrl(p);
/** The same picture for a full screen: a city's view is written small and large (core.json gallery sm, lg; sizes in
 *  scripts/media/bold-cities.json), so a view shown big takes its large file; any other picture is its own full size. */
let LARGE: Map<string, string> | undefined;
export const itemImageLarge = (p: string) => {
  LARGE ??= new Map(D.core.worlds.flatMap((w) => (w.gallery ?? []).map((g) => [g.sm, g.lg] as [string, string])));
  return mediaUrl(LARGE.get(p) ?? p);
};
export const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

// ── Stores: Lora's Spark is the flagship; every other club has its own ──
export const FLAGSHIP_ID: ID = D.ls.store.id;
const flagship: Store = { id: FLAGSHIP_ID, clubId: (D.ls.store as { clubId?: ID }).clubId ?? rid('club', 'c_opal'), code: D.ls.store.code, name: D.ls.store.name, tagline: D.ls.store.tagline, pools: D.ls.pools, looks: D.ls.looks };
export const STORES: Store[] = [flagship, ...D.stores.stores];
export const storeOf = (id: ID | null | undefined) => STORES.find((s) => s.id === id) ?? flagship;
export const storeOfClub = (clubId: ID) => STORES.find((s) => s.clubId === clubId);
/** A show's lead look: the first runway look that walks a store look with a render, so the show's card wears its own
 *  dress and colour (not a render picked from the club). */
export const showLead = (sh: Show): { mid?: string; hex?: string } => {
  for (const l of sh.looks) { const p = itemOf('look', l.lookId); if (p?.views.FRONT) return { mid: itemImage(p.views.FRONT), hex: l.hex ?? p.hex }; }
  return {};
};
export const lookStore = (l: ShopLook) => STORES.find((s) => s.looks.some((x) => x.id === l.id)) ?? flagship;

// ── Pools: the centre of PFTs. Every look sits in a pool; pools sell lots, publish stats, run a pool quest ──

/** Modules with their own caches over D (depth.ts, relations.ts) register here; refreshIndexes calls them. */
const REFRESH: (() => void)[] = [];
export const onDataRefresh = (cb: () => void) => { REFRESH.push(cb); };

/** (Re)build every lookup index from D — at import, and again after lib/heavy.ts and lib/live.ts land their rows. */
export function refreshIndexes() {
  FAMILIES = null;
  INDEX.clear(); forgetKinds();
  for (const cb of REFRESH) cb();
}
refreshIndexes();
export const lotsOfPool = (p: Pool) => (p.lotIds ?? []).map(((id) => itemOf('lot', id))).filter((l): l is PoolLot => !!l);
/** A PFT item minted inside a pool (kind `pft` in Phiora), linked to its pool by poolId. */
export type Pft = { id: ID; poolId: ID; name: string; rarity?: string; edition?: number; priceUsd?: number; traits?: string; hex?: string; ownerId?: ID };
export const PFTS: Pft[] = [];
export const pftsOfPool = (poolId: ID) => PFTS.filter((x) => x.poolId === poolId);
/** A rental of a PFT (kind `rental`), linked to the item and the renter. */
export type Rental = { id: ID; pftId: ID; renterId?: ID; days?: number; priceUsd?: number; status?: string; note?: string };
export const RENTALS: Rental[] = [];
export const poolsOfClub = (clubId: ID) => D.pools.pools.filter((p) => p.clubId === clubId);
export const poolOfLook = (l: ShopLook) => itemOf('pool', l.poolId);
export const poolOfShow = (showId: ID) => D.pools.pools.find((p) => p.showId === showId);
export const liquidityOf = (p: Pool) => (p.liquidityId ? D.economy.liquidity.find((x) => x.id === p.liquidityId) : undefined);
/** Beauty shades (data/beauty.json): each is a unit of its line's 64-shade drop. */
export type Shade = { id: ID; name: string; hex: string };
const SHADES = new Map<ID, Shade & { line: string }>((beautyJson as { lines: { name: string; shades: Shade[] }[] }).lines.flatMap((l) => l.shades.map((x) => [x.id, { ...x, line: l.name }] as [ID, Shade & { line: string }])));
/** Name of any PFT unit: a shop look, a show look or a beauty shade. */
export const unitName = (id: ID) => itemOf('look', id)?.name ?? showLookOf(id)?.look.title ?? itemOf('shade', id)?.name ?? id;
/** A show look (a unit of a show drop) by id. */
export const showLookOf = (id: ID) => { for (const sh of D.shows.shows) { const l = sh.looks.find((x) => x.id === id); if (l) return { look: l, show: sh }; } return undefined; };

// Lookups by relation live in their own file; everything imports them from here as before.
export * from './relation';
