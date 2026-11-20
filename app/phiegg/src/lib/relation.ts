// Lookups of records by their relations: rides and jewels, EGGs and SUMs, the worlds, places and clubs of a
// world, hosts, casts and sales of a person. Kept apart from data.ts (which re-exports them) so neither passes
// 300 lines; a new lookup is better written as itemsOf(kind) filtered by a declared link.
import { D, itemOf, site, t } from './data';
import { mediaUrl } from './media';
import { PLACES } from './lazy';
import type { City, District, EggItem, ID, ItemType, JewelItem, Place, ProfileItem, RideItem, SumItem, World } from '../types/phiegg';

// ── Item types: PFT (looks), EGG (gate, earnings, land), SUM (machines) ──
export const ridesOfWorld = (worldId: ID) => D.ride.list.filter((r) => r.worldId === worldId);
export const ridesOfClub = (clubId: ID) => D.ride.list.filter((r) => r.clubId === clubId);
/** The ride's cell on its sheet, for SpriteImage. */
export const rideSprite = (r: RideItem) => ({ src: mediaUrl(D.ride.sheets[r.sheet]), cols: D.ride.cols, rows: D.ride.rows, index: r.index });
export const jewelsOfWorld = (worldId: ID) => D.jewel.list.filter((j) => j.worldId === worldId);
export const jewelSprite = (j: JewelItem) => ({ src: mediaUrl(D.jewel.sheet), cols: D.jewel.cols, rows: D.jewel.rows, index: j.index });
/** Labels for a ride's kind and use (site.json copy rdKind_* and rdMode_*). */
export const rideKind = (k: string) => t(('rdKind_' + k) as 'rdKind_car');
export const rideMode = (m: string) => t(('rdMode_' + m) as 'rdMode_sale');
/** What a ride costs: its price for sale, else its ticket or fare. */
export const ridePrice = (r: RideItem) => (r.mode === 'sale' ? r.priceUsd : r.ticketUsd);
/** Every club that lives in a world (its owner first). */
export const clubsInWorld = (worldId: ID) => D.core.clubs.filter((c) => c.worldIds?.includes(worldId)).sort((a, b) => (itemOf('world', worldId)?.clubId === a.id ? -1 : itemOf('world', worldId)?.clubId === b.id ? 1 : 0));
export const profileItemOfHolder = (holderId: ID) => D.assets.profiles.find((x) => x.holderId === holderId);
export const profilesOfPool = (p: { profileIds?: ID[] }) => (p.profileIds ?? []).map(((id) => itemOf('profilePft', id))).filter((e): e is ProfileItem => !!e);
/** Which of the three an item id is. */
export const itemTypeOf = (id: ID): ItemType | undefined => (itemOf('egg', id) ? 'egg' : itemOf('sum', id) ? 'sum' : itemOf('profilePft', id) || itemOf('ride', id) || itemOf('jewel', id) || itemOf('look', id) ? 'pft' : undefined);
export const eggsOfHost = (hostId: ID) => D.assets.eggs.filter((e) => e.hostId === hostId);
export const eggsOfPool = (p: { eggIds?: ID[] }) => (p.eggIds ?? []).map(((id) => itemOf('egg', id))).filter((e): e is EggItem => !!e);
export const sumsOfPool = (p: { sumIds?: ID[] }) => (p.sumIds ?? []).map(((id) => itemOf('sum', id))).filter((e): e is SumItem => !!e);
export const eggUsd = (egg: number) => egg * D.assets.eggUsd;
/** Every world of a club, in data order (the Bold Cities are the 16 worlds of Bold Pups). */
export const worldsOfClub = (clubId: ID) => D.core.worlds.filter((w) => w.clubId === clubId);
/** The posts set in a world. */
export const shotsOfWorld = (worldId: ID) => D.feed.shots.filter((x) => x.worldId === worldId);
/** The EGGs of a world (its land plots, gates and earnings). */
export const eggsOfWorld = (worldId: ID) => D.assets.eggs.filter((e) => e.worldId === worldId);
// ── Places: world → city → district → place ──
export const cityOf = (id: ID | null | undefined): { city: City; world: World } | undefined => {
  if (!id) return undefined;
  for (const w of D.core.worlds) { const c = w.cities.find((x) => x.id === id); if (c) return { city: c, world: w }; }
  return undefined;
};
const P = () => PLACES.now() ?? { cities: {}, districts: {} as Record<ID, District[]> };
/** City / district / place lookups read the lazily loaded places.json, call usePlaces() in the component. */
export const cityMeta = (id: ID) => P().cities[id];
export const districtsOf = (cityId: ID): District[] => P().districts[cityId] ?? [];
export const placeOf = (id: ID): { place: Place; district: District; cityId: ID } | undefined => {
  for (const [cityId, ds] of Object.entries(P().districts)) for (const d of ds) { const p = d.places.find((x) => x.id === id); if (p) return { place: p, district: d, cityId }; }
  return undefined;
};
export const placesOfClub = (clubId: ID) => Object.entries(P().districts).flatMap(([cityId, ds]) => ds.flatMap((d) => d.places.filter((p) => p.clubId === clubId).map((p) => ({ place: p, cityId }))));
// ── Hosts as roles, casts, sales (data/roles.json, casts.json, sales.json, scripts/hosts-casts.mjs) ──
/** Hosts are children of a profile: the hosts a person owns. */
export const hostsOwnedBy = (personId: ID) => D.hosts.hosts.filter((h) => h.ownerId === personId);
export const castsOfHost = (hostId: ID) => D.casts.casts.filter((c) => c.hostIds.includes(hostId));
export const castsOfPerson = (personId: ID) => { const hs = new Set(hostsOwnedBy(personId).map((h) => h.id)); return D.casts.casts.filter((c) => c.hostAgentId === personId || c.hostIds.some((h) => hs.has(h))); };
export const salesOfPerson = (personId: ID) => D.sales.sales.filter((x) => x.fromId === personId || x.toId === personId);
export const salesOfItem = (itemId: ID) => D.sales.sales.filter((x) => x.itemId === itemId);
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
