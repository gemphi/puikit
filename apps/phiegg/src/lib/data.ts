// Typed access to data/*.json, normalized to the one database's ids (md5 + slug, lib/ids.ts) before anything reads
// them; with VITE_PHI_API set, lib/live.ts overlays Phiora's changes on top at boot.
import "./ids";
import { rid, srcId } from "./ids";
import core from "../data/core.json";
import feed from "../data/feed.json";
import hosts from "../data/hosts.json";
import club from "../data/club.json";
import explore from "../data/explore.json";
import phipad from "../data/phipad.json";
import messages from "../data/messages.json";
import events from "../data/events.json";
import profile from "../data/profile.json";
import settings from "../data/settings.json";
import landing from "../data/landing.json";
import agents from "../data/agents.json";
import siteJson from "../data/site.json";
import economy from "../data/economy.json";
import seriesJson from "../data/series.json";
import league from "../data/league.json";
import ls from "../data/ls.json";
import rolesJson from "../data/roles.json";
import castsJson from "../data/casts.json";
import poolsJson from "../data/pools.json";
import assetsJson from "../data/assets.json";
import rideJson from "../data/ride.json";
import jewelJson from "../data/jewel.json";
import beautyJson from "../data/beauty.json";
import threadCounts from '../data/threadCounts.json';
import collectionsJson from "../data/collections.json";
import type {
  Agent, AgentsData, ClubPage, CoreData, EventsPage, ExplorePage, FeedPage, Highlight, HostsPage, ID,
  LandingPage, MessagesPage, RolesData, CastsData, SalesData, ShowsData, Show, EconomyData, SeriesData, LeagueData, LsData, StoresData, Store, ShopLook, PoolsData, Pool, PoolLot, PoolQuest, AssetsData, RideItem, RideData, JewelItem, JewelData, EggItem, SumItem, ItemType, ProfileItem, City, World, District, Place, PhipadPage, Post, ProfilePage, SettingsPage, Shot, Tone, User,
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
export const agentOf = (id: ID) => D.agents.agents.find((a) => a.id === id);
export const userOf = (id: ID) => D.core.users.find((u) => u.id === id);
export const clubOf = (id: ID | null | undefined) => (id ? D.core.clubs.find((c) => c.id === id) : undefined);
export const worldOf = (id: ID | null | undefined) => (id ? D.core.worlds.find((w) => w.id === id) : undefined);
export const hostOf = (id: ID | null | undefined) => (id ? D.hosts.hosts.find((h) => h.id === id) : undefined);
export const eventOf = (id: ID) => D.events.events.find((e) => e.id === id);
export const showOf = (id: ID) => D.shows.shows.find((s) => s.id === id);
export const showForWorld = (worldId: ID) => D.shows.shows.find((s) => s.worldId === worldId);
export const poseOf = (id: ID) => D.shows.poses.find((p) => p.id === id);

export function person(id: ID): Person {
  const a = agentOf(id);
  if (a) return { id: a.id, name: a.name, handle: a.handle, tone: a.tone, initials: initials(a.name), isAgent: true, glyph: a.glyph,
    verified: a.verified, followers: a.followers, following: a.following, bio: a.bio, badges: a.badges, clubIds: a.clubIds, agent: a };
  const u = userOf(id);
  if (!u) return { id, name: id, handle: id, tone: "neutral", initials: "?", isAgent: false, verified: false, followers: 0, following: 0, bio: "", badges: [], clubIds: [] };
  return { id: u.id, name: u.name, handle: u.handle, tone: u.tone, initials: initials(u.name), isAgent: false,
    verified: u.verified, followers: u.followers, following: u.following, bio: u.bio, badges: u.badges, clubIds: u.clubIds, user: u };
}
export const me = () => person(D.core.currentUserId);

/** A feed shot as a carousel post: cover slide + one slide per look item. */
export function shotPost(s: Shot): Post {
  return {
    id: s.id, authorId: s.authorId, kind: s.media.kind, clubId: s.clubId, worldId: s.worldId, caption: s.caption,
    likes: s.likes, createdAt: s.createdAt, tags: s.tags,
    slides: [{ title: s.media.title, tone: s.media.tone, hex: s.media.hex, lookId: s.media.lookId, family: s.media.family }, ...s.lookItems.map((li, i) => ({
      title: li, tone: site.lookTones[i % site.lookTones.length] as Tone, caption: t("piece", { n: i + 2 }) }))],
    comments: site.defaultComments.map((c, i) => ({ ...c, id: `${s.id}_c${i}` })),
  };
}
export const postById = (id: ID): Post | undefined =>
  D.agents.posts.find((p) => p.id === id) ?? (() => { const s = D.feed.shots.find((x) => x.id === id); return s && shotPost(s); })();
// ── Item types: PFT (looks), EGG (gate, earnings, land), SUM (machines) ──
const EGGS = new Map<ID, EggItem>(); const SUMS = new Map<ID, SumItem>(); const PROFILES = new Map<ID, ProfileItem>();
const RIDES = new Map<ID, RideItem>(); const JEWELS = new Map<ID, JewelItem>();
export const profileItemOf = (id?: ID | null): ProfileItem | undefined => (id ? PROFILES.get(id) : undefined);
export const rideOf = (id?: ID | null): RideItem | undefined => (id ? RIDES.get(id) : undefined);
export const ridesOfWorld = (worldId: ID) => D.ride.list.filter((r) => r.worldId === worldId);
export const ridesOfClub = (clubId: ID) => D.ride.list.filter((r) => r.clubId === clubId);
/** The ride's cell on its sheet, for SpriteImage. */
export const rideSprite = (r: RideItem) => ({ src: import.meta.env.BASE_URL + D.ride.sheets[r.sheet], cols: D.ride.cols, rows: D.ride.rows, index: r.index });
export const jewelOf = (id?: ID | null): JewelItem | undefined => (id ? JEWELS.get(id) : undefined);
export const jewelsOfWorld = (worldId: ID) => D.jewel.list.filter((j) => j.worldId === worldId);
export const jewelSprite = (j: JewelItem) => ({ src: import.meta.env.BASE_URL + D.jewel.sheet, cols: D.jewel.cols, rows: D.jewel.rows, index: j.index });
/** Labels for a ride's kind and use (site.json copy rdKind_* and rdMode_*). */
export const rideKind = (k: string) => t(('rdKind_' + k) as 'rdKind_car');
export const rideMode = (m: string) => t(('rdMode_' + m) as 'rdMode_sale');
/** What a ride costs: its price for sale, else its ticket or fare. */
export const ridePrice = (r: RideItem) => (r.mode === 'sale' ? r.priceUsd : r.ticketUsd);
/** Every club that lives in a world (its owner first). */
export const clubsInWorld = (worldId: ID) => D.core.clubs.filter((c) => c.worldIds?.includes(worldId)).sort((a, b) => (worldOf(worldId)?.clubId === a.id ? -1 : worldOf(worldId)?.clubId === b.id ? 1 : 0));
export const profileItemOfHolder = (holderId: ID) => D.assets.profiles.find((x) => x.holderId === holderId);
export const profilesOfPool = (p: { profileIds?: ID[] }) => (p.profileIds ?? []).map(profileItemOf).filter((e): e is ProfileItem => !!e);
export const eggOf = (id?: ID | null): EggItem | undefined => (id ? EGGS.get(id) : undefined);
export const sumOf = (id?: ID | null): SumItem | undefined => (id ? SUMS.get(id) : undefined);
/** Which of the three an item id is. */
export const itemTypeOf = (id: ID): ItemType | undefined => (EGGS.has(id) ? 'egg' : SUMS.has(id) ? 'sum' : PROFILES.has(id) || RIDES.has(id) || JEWELS.has(id) || lookOf(id) ? 'pft' : undefined);
export const eggsOfHost = (hostId: ID) => D.assets.eggs.filter((e) => e.hostId === hostId);
export const eggsOfPool = (p: { eggIds?: ID[] }) => (p.eggIds ?? []).map(eggOf).filter((e): e is EggItem => !!e);
export const sumsOfPool = (p: { sumIds?: ID[] }) => (p.sumIds ?? []).map(sumOf).filter((e): e is SumItem => !!e);
export const eggUsd = (egg: number) => egg * D.assets.eggUsd;

/** An agent's greeting addressed to whoever is signed in (the seed text names the prototype's member, Noor). */
export const greetingOf = (a: { greeting: string }) => { const me = person(D.core.currentUserId).name.split(' ')[0]; return me && me !== 'Guest' ? a.greeting.replace(/\bNoor\b/g, me) : a.greeting.replace(/,? Noor\b/g, ''); };
/** Comments on a post: its own, the threads under it (data/threadCounts.json, from scripts/threads.mjs) and yours. */
export const commentCount = (post: { id: ID; comments: unknown[] }, mine = 0) => post.comments.length + ((threadCounts as Record<string, number>)[srcId(post.id)] ?? 0) + mine;
export const postsBy = (author: ID): Post[] =>
  [...D.agents.posts.filter((p) => p.authorId === author), ...D.feed.shots.filter((s) => s.authorId === author).map(shotPost)];

/** People's shots interleaved with agent posts. */
export function feedPosts(): Post[] {
  const ap = D.agents.posts.filter((p) => agentOf(p.authorId)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); // newest first, so live drops lead
  return D.feed.shots.flatMap((s, i) => (ap[i] ? [shotPost(s), ap[i]] : [shotPost(s)]));
}

export function storySets(uid: ID): Highlight[] {
  const a = agentOf(uid);
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
export const worldImage = (w?: { image?: string }) => (w && w.image ? import.meta.env.BASE_URL + w.image.replace(/^assets\//, '') : undefined);
export const garmentOf = (id?: string) => (site as unknown as { garments: { id: string; name: string; path: string }[] }).garments.find((g) => g.id === id);

export const seriesOf = (id: ID) => D.series.series.find((x) => x.id === id);

/** Public URL of a shop image (public/items/…). */
export const itemImage = (p: string) => import.meta.env.BASE_URL + p;
export const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

// ── Places: world → city → district → place ──
export const cityOf = (id: ID | null | undefined): { city: City; world: World } | undefined => {
  if (!id) return undefined;
  for (const w of D.core.worlds) { const c = w.cities.find((x) => x.id === id); if (c) return { city: c, world: w }; }
  return undefined;
};
import { PLACES } from './lazy';
const P = () => PLACES.now() ?? { cities: {}, districts: {} as Record<ID, District[]> };
/** City / district / place lookups read the lazily loaded places.json, call usePlaces() in the component. */
export const cityMeta = (id: ID) => P().cities[id];
export const districtsOf = (cityId: ID): District[] => P().districts[cityId] ?? [];
export const placeOf = (id: ID): { place: Place; district: District; cityId: ID } | undefined => {
  for (const [cityId, ds] of Object.entries(P().districts)) for (const d of ds) { const p = d.places.find((x) => x.id === id); if (p) return { place: p, district: d, cityId }; }
  return undefined;
};
export const placesOfClub = (clubId: ID) => Object.entries(P().districts).flatMap(([cityId, ds]) => ds.flatMap((d) => d.places.filter((p) => p.clubId === clubId).map((p) => ({ place: p, cityId }))));

// ── Stores: Lora's Spark is the flagship; every other club has its own ──
export const FLAGSHIP_ID = 'ls';
const flagship: Store = { id: FLAGSHIP_ID, clubId: (D.ls.store as { clubId?: ID }).clubId ?? rid('club', 'c_opal'), code: D.ls.store.code, name: D.ls.store.name, tagline: D.ls.store.tagline, pools: D.ls.pools, looks: D.ls.looks };
export const STORES: Store[] = [flagship, ...D.stores.stores];
export const storeOf = (id: ID | null | undefined) => STORES.find((s) => s.id === id) ?? flagship;
export const storeOfClub = (clubId: ID) => STORES.find((s) => s.clubId === clubId);
const LOOKS = new Map<ID, ShopLook>();
export const lookOf = (id: ID) => LOOKS.get(id);
/** A show's lead look: the first runway look that walks a store look with a render, so the show's card wears its own
 *  dress and colour (not a render picked from the club). */
export const showLead = (sh: Show): { mid?: string; hex?: string } => {
  for (const l of sh.looks) { const p = l.lookId ? LOOKS.get(l.lookId) : undefined; if (p?.views.FRONT) return { mid: itemImage(p.views.FRONT), hex: l.hex ?? p.hex }; }
  return {};
};
export const lookStore = (l: ShopLook) => STORES.find((s) => s.looks.some((x) => x.id === l.id)) ?? flagship;

// ── Hosts as roles, casts, sales (data/roles.json, casts.json, sales.json, scripts/hosts-casts.mjs) ──
export const roleOf = (id: ID | null | undefined) => (id ? D.roles.types.find((r) => r.id === id) : undefined);
export const roleCategoryOf = (id: ID | null | undefined) => (id ? D.roles.categories.find((c) => c.id === id) : undefined);
export const castOf = (id: ID) => D.casts.casts.find((c) => c.id === id);
/** Hosts are children of a profile: the hosts a person owns. */
export const hostsOwnedBy = (personId: ID) => D.hosts.hosts.filter((h) => h.ownerId === personId);
export const castsOfHost = (hostId: ID) => D.casts.casts.filter((c) => c.hostIds.includes(hostId));
export const castsOfPerson = (personId: ID) => { const hs = new Set(hostsOwnedBy(personId).map((h) => h.id)); return D.casts.casts.filter((c) => c.hostAgentId === personId || c.hostIds.some((h) => hs.has(h))); };
export const salesOfPerson = (personId: ID) => D.sales.sales.filter((x) => x.fromId === personId || x.toId === personId);
export const salesOfItem = (itemId: ID) => D.sales.sales.filter((x) => x.itemId === itemId);
export const pieceOf = (id: ID) => D.club.pieces.find((p) => p.id === id);
/** Items a person holds now: the last owner of each item in the sales ledger, plus pieces marked as theirs. */
export function itemsOfPerson(personId: ID): { kind: 'piece' | 'look'; id: ID }[] {
  const last = new Map<string, { kind: 'piece' | 'look'; owner: string }>();
  for (const x of [...D.sales.sales].reverse()) if (x.event === 'mint' || x.event === 'sale' || x.event === 'transfer') last.set(x.itemId, { kind: x.itemKind, owner: x.toId! });
  const out = [...last.entries()].filter(([, v]) => v.owner === personId).map(([id, v]) => ({ kind: v.kind, id }));
  for (const p of D.club.pieces) if (p.ownerId === personId && !last.has(p.id)) out.push({ kind: 'piece', id: p.id });
  return out;
}
/** OpenSea-style numbers for a person, from the ledger. */
export function statsOfPerson(personId: ID) {
  const ss = salesOfPerson(personId).filter((x) => x.event === 'sale');
  const bought = ss.filter((x) => x.toId === personId), sold = ss.filter((x) => x.fromId === personId);
  const sum = (xs: { priceUsd: number }[]) => xs.reduce((n, x) => n + x.priceUsd, 0);
  const items = itemsOfPerson(personId);
  const listed = D.sales.sales.filter((x) => x.event === 'list' && x.fromId === personId);
  return { items: items.length, volumeUsd: sum(ss), boughtUsd: sum(bought), soldUsd: sum(sold), trades: ss.length,
    floorUsd: listed.length ? Math.min(...listed.map((x) => x.priceUsd)) : 0, bestSaleUsd: ss.length ? Math.max(...ss.map((x) => x.priceUsd)) : 0,
    hosts: hostsOwnedBy(personId).length, casts: castsOfPerson(personId).length };
}

// ── Pools: the centre of PFTs. Every look sits in a pool; pools sell lots, publish stats, run a pool quest ──
const POOLS = new Map<ID, Pool>(); const LOTS = new Map<ID, PoolLot>(); const PQ = new Map<ID, PoolQuest>();

/** Modules with their own caches over D (depth.ts, relations.ts) register here; refreshIndexes calls them. */
const REFRESH: (() => void)[] = [];
export const onDataRefresh = (cb: () => void) => { REFRESH.push(cb); };

/** (Re)build every lookup index from D — at import, and again after lib/heavy.ts and lib/live.ts land their rows. */
export function refreshIndexes() {
  FAMILIES = null;
  EGGS.clear(); for (const e of D.assets.eggs) EGGS.set(e.id, e);
  SUMS.clear(); for (const x of D.assets.sums) SUMS.set(x.id, x);
  PROFILES.clear(); for (const x of D.assets.profiles) PROFILES.set(x.id, x);
  RIDES.clear(); for (const r of D.ride.list) RIDES.set(r.id, r);
  JEWELS.clear(); for (const j of D.jewel.list) JEWELS.set(j.id, j);
  LOOKS.clear(); for (const st of STORES) for (const l of st.looks) if (!LOOKS.has(l.id)) LOOKS.set(l.id, l);
  POOLS.clear(); for (const p of D.pools.pools) POOLS.set(p.id, p);
  LOTS.clear(); for (const l of D.pools.lots) LOTS.set(l.id, l);
  PQ.clear(); for (const q of D.pools.quests) PQ.set(q.id, q);
  for (const cb of REFRESH) cb();
}
refreshIndexes();
export const poolOf = (id: ID | null | undefined) => (id ? POOLS.get(id) : undefined);
export const lotOf = (id: ID) => LOTS.get(id);
export const poolQuestOf = (id: ID | null | undefined) => (id ? PQ.get(id) : undefined);
export const lotsOfPool = (p: Pool) => (p.lotIds ?? []).map(lotOf).filter((l): l is PoolLot => !!l);
/** A PFT item minted inside a pool (kind `pft` in Phiora), linked to its pool by poolId. */
export type Pft = { id: ID; poolId: ID; name: string; rarity?: string; edition?: number; priceUsd?: number; traits?: string; hex?: string; ownerId?: ID };
export const PFTS: Pft[] = [];
export const pftsOfPool = (poolId: ID) => PFTS.filter((x) => x.poolId === poolId);
/** A rental of a PFT (kind `rental`), linked to the item and the renter. */
export type Rental = { id: ID; pftId: ID; renterId?: ID; days?: number; priceUsd?: number; status?: string; note?: string };
export const RENTALS: Rental[] = [];
export const poolsOfClub = (clubId: ID) => D.pools.pools.filter((p) => p.clubId === clubId);
export const poolOfLook = (l: ShopLook) => poolOf(l.poolId);
export const poolOfShow = (showId: ID) => D.pools.pools.find((p) => p.showId === showId);
export const metricOf = (id: string) => D.pools.metrics.find((m) => m.id === id);
export const liquidityOf = (p: Pool) => (p.liquidityId ? D.economy.liquidity.find((x) => x.id === p.liquidityId) : undefined);
export const coinOf = (id: ID) => D.economy.coins.find((c) => c.id === id);
/** Beauty shades (data/beauty.json): each is a unit of its line's 64-shade drop. */
export type Shade = { id: ID; name: string; hex: string };
const SHADES = new Map<ID, Shade & { line: string }>((beautyJson as { lines: { name: string; shades: Shade[] }[] }).lines.flatMap((l) => l.shades.map((x) => [x.id, { ...x, line: l.name }] as [ID, Shade & { line: string }])));
export const shadeOf = (id: ID) => SHADES.get(id);
/** Name of any PFT unit: a shop look, a show look or a beauty shade. */
export const unitName = (id: ID) => lookOf(id)?.name ?? showLookOf(id)?.look.title ?? shadeOf(id)?.name ?? id;
/** A show look (a unit of a show drop) by id. */
export const showLookOf = (id: ID) => { for (const sh of D.shows.shows) { const l = sh.looks.find((x) => x.id === id); if (l) return { look: l, show: sh }; } return undefined; };
