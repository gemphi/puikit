import { createContext, useContext } from 'react';
import { fmt, t, usd, type ItemRow } from './data';
import { lookLive, poolNumbers, poolStats, quote } from './market';
import { useOwned } from './cart';
import type { Pool, PoolLot, ShopLook } from '../types/phiegg';

/** The clock a list's live cards read (prices move): one tick for the whole list. A card outside a list reads the
 *  time it is drawn. */
export const Now = createContext<number | undefined>(undefined);
export const useNowValue = () => useContext(Now) ?? Date.now();

/** The values of a record that are worked out, not kept: a price that moves, what is sold of a supply, whether the
 *  viewer owns it. A card's templates (data/card.json) read them as `{live.<name>}`; the sums live in lib/market. */
export type Live = Record<string, string | number>;
const pct = (n: number) => (n > 0 ? '+' : '') + (n * 100).toFixed(1) + '%';

/** Per kind, a hook of that kind: a card is drawn for one kind, so the same one runs every time. */
const LIVE: Record<string, (now: number) => (row: ItemRow) => Live> = {
  look: function useLookLive(now) {
    const mine = useOwned();
    return (r) => { const l = r as unknown as ShopLook;
      return { total: usd(lookLive(l, now).total), minted: l.minted + ' / ' + l.edition, mintedShare: l.edition ? l.minted / l.edition : 0, owned: mine[l.id] ? t('shOwned') : '' }; };
  },
  lot: (now) => (r) => { const l = r as unknown as PoolLot; const q = quote(l, now); const out = q.remaining <= 0;
    return { total: t('plTotal', { v: usd(q.total) }), change: pct(q.change), sold: t('plSold', { sold: fmt(q.sold), supply: fmt(q.supply) }), soldShare: q.soldPct,
      high: usd(q.high), low: usd(q.low), left: fmt(Math.max(0, q.remaining)), count: q.units.length,
      size: l.kind === 'pack' ? t('plPack', { n: l.itemIds.length }) : t('plDrop', { n: l.itemIds.length }), stock: out ? t('plSoldOut') : t('plOnSale') }; },
  pool: (now) => (r) => { const p = r as unknown as Pool; const n = poolNumbers(p, now); const vol = poolStats(p, now).find((x) => x.metric.id === 'vol24h');
    return { sold: t('plSold', { sold: fmt(n.sold), supply: fmt(n.supply) }), soldShare: n.supply ? n.sold / n.supply : 0, floor: usd(n.floor), vol: vol?.text ?? '',
      total: '$' + fmt(n.total), kind: t(('plKind_' + p.kind) as 'plKind_show'), showDrop: p.kind === 'show' ? t('plShowDrop') : '' }; },
};
const none = () => ({});
/** A record with its live values beside its own, under `live`. */
export const useLive = (kind: string): ((row: ItemRow) => ItemRow) => {
  const now = useNowValue(); const of = LIVE[kind]?.(now) ?? none;
  return (row) => (LIVE[kind] ? { ...row, live: of(row) } : row);
};
