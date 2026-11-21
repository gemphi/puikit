// Phiora is the source: the bundle is the seed snapshot, and at boot (VITE_PHI_API set) the app pulls the change
// log and overlays every record Phiora created, edited or deleted since the seed — small calls, not the whole tree.
// Updates land in place (Object.assign on the same row objects every page already holds), new records join their
// list, deletions leave it; then the lookup indexes rebuild.
import { apiSend } from '@phi-kit/api';
import { D, PFTS, RENTALS, STORES, forgetKinds, hasKind, itemOf, itemsOf, kindOfId, listsOf, refreshIndexes, type ItemRow } from './data';
import { withDefaults } from './kindDefaults';
import type { ID, ShopLook, Store } from '../types/phiegg';

type Change = { seq: number; kind: string; id: string; action: 'create' | 'update' | 'delete' };
type Rec = { kind: string; item: Record<string, unknown> & { id: ID } };

type Row = ItemRow;
type Kind = string;

/** Where a created record of this kind joins; kinds that only live nested (city, pose) take updates only. */
const ADD: Record<string, (r: Row) => void> = {
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
export { kindOfId, forgetKinds };
/** Take a record out of every list its kind is kept in (data/source.json). */
const removeFrom = (kind: Kind, id: string) => {
  for (const list of listsOf(kind)) { const i = list.findIndex((r) => r.id === id); if (i >= 0) list.splice(i, 1); }
};

/** A record from a write, landed in the local data the same way bootLive lands changes. A kind the bundle does
    not carry locally (an order, say) still writes fine; there is just nothing to land. */
const land = (kind: string, item: Row) => {
  if (!hasKind(kind)) return;
  const existing = itemOf(kind, item.id);
  if (existing) Object.assign(existing, item); else ADD[kind]?.(withDefaults(kind, item));
  refreshIndexes(); forgetKinds();
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
  if (hasKind(kind)) { removeFrom(kind, id); refreshIndexes(); forgetKinds(); } return { ok: true, item: { id } as Row };
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
    const kind = c.kind;
    if (!hasKind(kind)) return;
    if (c.action === 'delete') { removeFrom(kind, c.id); applied++; return; }
    const rec = await apiSend<Rec>('GET', `/tree/item/${kind}/${encodeURIComponent(c.id)}`);
    if (!rec.ok) { if (rec.status === 404) { removeFrom(kind, c.id); applied++; } return; }
    const existing = itemOf(kind, c.id);
    if (existing) Object.assign(existing, rec.body.item);
    else ADD[kind]?.(withDefaults(kind, rec.body.item as Row));
    applied++;
  }));
  if (applied) { refreshIndexes(); forgetKinds(); }
  return applied;
}
