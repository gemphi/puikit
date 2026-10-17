// Phiora is the source: the bundle is the seed snapshot, and at boot (VITE_PHI_API set) the app pulls the change
// log and overlays every record Phiora created, edited or deleted since the seed — small calls, not the whole tree.
// Updates land in place (Object.assign on the same row objects every page already holds), new records join their
// list, deletions leave it; then the lookup indexes rebuild.
import { apiSend } from '@phi-kit/api';
import { D, PFTS, RENTALS, STORES, refreshIndexes } from './data';
import { withDefaults } from './kindDefaults';
import type { ID, ShopLook, Store } from '../types/phiegg';

type Change = { seq: number; kind: string; id: string; action: 'create' | 'update' | 'delete' };
type Rec = { kind: string; item: Record<string, unknown> & { id: ID } };

type Row = Record<string, unknown> & { id: ID };
const L = {
  person: () => D.core.users as unknown as Row[],
  club: () => D.core.clubs as unknown as Row[],
  world: () => D.core.worlds as unknown as Row[],
  city: () => D.core.worlds.flatMap((w) => w.cities) as unknown as Row[],
  host: () => D.hosts.hosts as unknown as Row[],
  nest: () => D.hosts.nests as unknown as Row[],
  show: () => D.shows.shows as unknown as Row[],
  pose: () => D.shows.poses as unknown as Row[],
  series: () => D.series.series as unknown as Row[],
  quest: () => D.economy.quests as unknown as Row[],
  coin: () => D.economy.coins as unknown as Row[],
  liquidity: () => D.economy.liquidity as unknown as Row[],
  event: () => D.events.events as unknown as Row[],
  store: () => STORES as unknown as Row[],
  look: () => STORES.flatMap((s) => s.looks) as unknown as Row[],
  pool: () => [...STORES.flatMap((s) => s.pools ?? []), ...D.pools.pools] as unknown as Row[],
  lot: () => D.pools.lots as unknown as Row[],
  poolQuest: () => D.pools.quests as unknown as Row[],
  metric: () => D.pools.metrics as unknown as Row[],
  piece: () => D.club.pieces as unknown as Row[],
  role: () => D.roles.types as unknown as Row[],
  roleCategory: () => D.roles.categories as unknown as Row[],
  egg: () => D.assets.eggs as unknown as Row[],
  sum: () => D.assets.sums as unknown as Row[],
  profilePft: () => D.assets.profiles as unknown as Row[],
  ride: () => D.ride.list as unknown as Row[],
  jewel: () => D.jewel.list as unknown as Row[],
  cast: () => D.casts.casts as unknown as Row[],
  sale: () => D.sales.sales as unknown as Row[],
  shot: () => D.feed.shots as unknown as Row[],
  post: () => D.agents.posts as unknown as Row[],
  room: () => D.messages.voiceRooms as unknown as Row[],
  conversation: () => D.messages.conversations as unknown as Row[],
  moment: () => D.feed.moments as unknown as Row[],
  track: () => D.phipad.tracks as unknown as Row[],
  application: () => D.phipad.applications as unknown as Row[],
  pft: () => PFTS as unknown as Row[],
  rental: () => RENTALS as unknown as Row[],
} as const;
type Kind = keyof typeof L;

/** Where a created record of this kind joins; kinds that only live nested (city, pose) take updates only. */
const ADD: Partial<Record<Kind, (r: Row) => void>> = {
  person: (r) => D.core.users.push(r as never),
  club: (r) => D.core.clubs.push(r as never),
  world: (r) => D.core.worlds.push(r as never),
  host: (r) => D.hosts.hosts.push(r as never),
  nest: (r) => D.hosts.nests.push(r as never),
  show: (r) => D.shows.shows.push(r as never),
  series: (r) => D.series.series.push(r as never),
  quest: (r) => D.economy.quests.push(r as never),
  coin: (r) => D.economy.coins.push(r as never),
  event: (r) => D.events.events.push(r as never),
  store: (r) => { STORES.push(r as unknown as Store); D.stores.stores.push(r as never); },
  look: (r) => { const st = STORES.find((s) => s.id === (r as unknown as ShopLook & { storeId?: ID }).storeId) ?? STORES[0]; st.looks.push(r as unknown as ShopLook); },
  pool: (r) => D.pools.pools.push(r as never),
  lot: (r) => D.pools.lots.push(r as never),
  piece: (r) => D.club.pieces.push(r as never),
  egg: (r) => D.assets.eggs.push(r as never),
  sum: (r) => D.assets.sums.push(r as never),
  profilePft: (r) => D.assets.profiles.push(r as never),
  ride: (r) => D.ride.list.push(r as never),
  jewel: (r) => D.jewel.list.push(r as never),
  cast: (r) => D.casts.casts.push(r as never),
  sale: (r) => D.sales.sales.push(r as never),
  shot: (r) => D.feed.shots.unshift(r as never), // newest shots lead the feed
  post: (r) => D.agents.posts.push(r as never),
  moment: (r) => D.feed.moments.push(r as never),
  pft: (r) => PFTS.push(r as never),
  rental: (r) => RENTALS.push(r as never),
};

export type LiveKind = Kind;
const findIn = (kind: Kind, id: string) => L[kind]().find((r) => r.id === id);
/** One record of any live kind, as every page holds it. */
export const findRecord = (kind: string, id: string): Row | undefined => (kind in L ? findIn(kind as Kind, id) : undefined);
/** Every record of a live kind. */
export const recordsOf = (kind: string): Row[] => (kind in L ? L[kind as Kind]() : []);
const removeFrom = (kind: Kind, id: string) => {
  const lists: Row[][] = kind === 'look' ? (STORES.map((s) => s.looks) as unknown as Row[][])
    : kind === 'store' ? ([STORES, D.stores.stores] as unknown as Row[][])
    : kind === 'pool' ? ([D.pools.pools, ...STORES.map((s) => s.pools ?? [])] as unknown as Row[][])
    : kind === 'city' ? (D.core.worlds.map((w) => w.cities) as unknown as Row[][])
    : [L[kind]() as Row[]];
  for (const list of lists) { const i = list.findIndex((r) => r.id === id); if (i >= 0) list.splice(i, 1); }
};

/** A record from a write, landed in the local data the same way bootLive lands changes. A kind the bundle does
    not carry locally (an order, say) still writes fine; there is just nothing to land. */
const land = (kind: string, item: Row) => {
  if (!(kind in L)) return;
  const existing = findIn(kind as Kind, item.id);
  if (existing) Object.assign(existing, item); else ADD[kind as Kind]?.(withDefaults(kind, item));
  refreshIndexes();
};

export type WriteResult = { ok: true; item: Row } | { ok: false; status: number; error: string; message: string };
const failOf = (r: { status?: number; error?: string; message?: string }): WriteResult =>
  ({ ok: false, status: r.status ?? 0, error: r.error ?? 'error', message: r.message ?? 'Request failed.' });

/** Create a record in the one database (POST /tree/item) and land it locally. */
export async function liveCreate(kind: LiveKind | (string & {}), fields: Record<string, unknown>): Promise<WriteResult> {
  const r = await apiSend<Rec>('POST', '/tree/item', { kind, fields });
  if (!r.ok) return failOf(r);
  land(kind, r.body.item); return { ok: true, item: r.body.item };
}
/** Change a record you own (PATCH /tree/item/kind/id) and land the result locally. */
export async function liveEdit(kind: LiveKind | (string & {}), id: ID, set: Record<string, unknown>): Promise<WriteResult> {
  const r = await apiSend<Rec>('PATCH', `/tree/item/${kind}/${encodeURIComponent(id)}`, { set });
  if (!r.ok) return failOf(r);
  land(kind, r.body.item); return { ok: true, item: r.body.item };
}
/** Delete a record you own (DELETE /tree/item/kind/id) and drop it locally. */
export async function liveRemove(kind: LiveKind | (string & {}), id: ID): Promise<WriteResult> {
  const r = await apiSend<{ ok: boolean }>('DELETE', `/tree/item/${kind}/${encodeURIComponent(id)}`);
  if (!r.ok) return failOf(r);
  if (kind in L) { removeFrom(kind as Kind, id); refreshIndexes(); } return { ok: true, item: { id } as Row };
}

/** Pull Phiora's changes since the seed and lay them over the bundle. Quiet about failures: the bundle stands. */
export async function bootLive(): Promise<number> {
  const r = await apiSend<{ changes: Change[] }>('GET', '/tree/change?n=200');
  if (!r.ok || !r.body.changes.length) return 0;
  // newest first in the log; keep each record's latest change only
  const latest = new Map<string, Change>();
  for (const c of r.body.changes) { const k = c.kind + ':' + c.id; if (!latest.has(k)) latest.set(k, c); }
  let applied = 0;
  await Promise.all([...latest.values()].map(async (c) => {
    const kind = c.kind as Kind;
    if (!(kind in L)) return;
    if (c.action === 'delete') { removeFrom(kind, c.id); applied++; return; }
    const rec = await apiSend<Rec>('GET', `/tree/item/${kind}/${encodeURIComponent(c.id)}`);
    if (!rec.ok) { if (rec.status === 404) { removeFrom(kind, c.id); applied++; } return; }
    const existing = findIn(kind, c.id);
    if (existing) Object.assign(existing, rec.body.item);
    else ADD[kind]?.(withDefaults(kind, rec.body.item as Row));
    applied++;
  }));
  if (applied) refreshIndexes();
  return applied;
}
