// Market: moving prices, pool stats (each linked to a quest), and fungible swaps, Phiegg's side of
// @phi-kit/pricing. Prices are found by the pricing function at render time; nothing here stores a price.
import { useEffect, useState } from 'react';
import { persisted } from '@phi-kit/api';
import { OWNED, balance, earn, spend } from '@phi-kit/wallet';
import { purchase } from '@phi-kit/shop';
import { DEFAULT_SWAP_RULES, quoteLot, quoteSwap, soldAt, soloLot, unitPrice, type Lot, type LotQuote, type SwapPayout, type SwapQuote, type SwapRules } from '@phi-kit/pricing';
import { D, coinOf, fmt, liquidityOf, lookOf, lotsOfPool, poolOf, poolQuestOf, salesOfItem, showLookOf, site, unitName, usd } from './data';
import type { ID, Pool, PoolLot, PoolMetric, ShopLook } from '../types/phiegg';
import { record } from './activity';

/** Re-render every `ms` with the current time, so moving prices glide on screen. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), ms); return () => window.clearInterval(id); }, [ms]);
  return now;
}

export const asLot = (l: PoolLot): Lot => l as unknown as Lot;
/** Every shop look is also saleable on its own: a solo lot centred on its list price. */
export const soloOf = (l: ShopLook): Lot => soloLot(l.poolId, l.id, l.name, l.usd);
export const quote = (l: PoolLot, now = Date.now()) => quoteLot(asLot(l), now);
export const lookLive = (l: ShopLook, now = Date.now()) => quoteLot(soloOf(l), now);

/** What any PFT is worth right now: a shop look at its solo price, a show look at its unit price in the show drop. */
export function valueOf(itemId: ID, now = Date.now()): { usd: number; poolId: ID; name: string } | undefined {
  const l = lookOf(itemId);
  if (l) return { usd: lookLive(l, now).total, poolId: l.poolId, name: l.name };
  // a unit of a drop (show look or beauty shade): its moving unit price in that drop
  const lot = D.pools.lots.find((x) => x.kind === 'drop' && x.itemIds.includes(itemId)); if (!lot) return undefined;
  return { usd: unitPrice(asLot(lot), lot.itemIds.indexOf(itemId), now).usd, poolId: lot.poolId, name: unitName(itemId) };
}

// ── Stats: OpenSea-style metrics per pool; each one is a quest ──────────────────────────────────────────────
export type StatRow = { metric: PoolMetric; value: number; text: string; questId: string; target: number; progress: number; sub?: string };
const H = 36e5, DAYms = 24 * H;
const h01 = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 10000) / 10000; };
export const fmtStat = (m: PoolMetric, v: number, of?: number) =>
  m.format === 'usd' ? (v >= 1e4 ? '$' + fmt(v) : usd(v)) : m.format === 'pct' ? (v > 0 && m.id.startsWith('change') ? '+' : '') + (v * 100).toFixed(1) + '%' : m.format === 'ratio' ? fmt(v) + ' / ' + fmt(of ?? 0) : fmt(Math.round(v));

export function poolNumbers(p: Pool, now = Date.now()) {
  const lots = lotsOfPool(p); const looks = (p.lookIds ?? []).map(lookOf).filter((l): l is ShopLook => !!l);
  const declared = p;
  const quotes: LotQuote[] = [...lots.map((l) => quote(l, now)), ...looks.map((l) => lookLive(l, now))];
  const units = quotes.flatMap((q) => q.units.map((u) => u.usd));
  const supply = (lots.reduce((n, l) => n + l.supply, 0) + looks.reduce((n, l) => n + l.edition, 0)) || declared.supply || 0;
  const sold = lots.reduce((n, l) => n + soldAt(asLot(l), now), 0) + looks.reduce((n, l) => n + l.minted, 0);
  return { lots, looks, quotes, units, supply, sold, total: quotes.reduce((n, q) => n + q.total, 0),
    floor: units.length ? Math.min(...units) : declared.floorUsd ?? 0, high: units.length ? Math.max(...units) : declared.floorUsd ?? 0 };
}

export function poolStats(p: Pool, now = Date.now()): StatRow[] {
  const N = poolNumbers(p, now); const N1 = poolNumbers(p, now - DAYms); const N7 = poolNumbers(p, now - 7 * DAYms);
  const avgUnit = N.units.length ? N.units.reduce((a, b) => a + b, 0) / N.units.length : 0;
  const ledger = N.looks.flatMap((l) => salesOfItem(l.id)).filter((x) => x.event === 'sale');
  const since = (ms: number) => ledger.filter((x) => now - Date.parse(x.at) < ms);
  const soldIn = (ms: number) => N.lots.reduce((n, l) => n + soldAt(asLot(l), now) - soldAt(asLot(l), now - ms), 0);
  const vol = (ms: number) => since(ms).reduce((a, x) => a + x.priceUsd, 0) + soldIn(ms) * avgUnit;
  const liq = liquidityOf(p); const pq = poolQuestOf(p.questId); const coin = p.coinIds?.[0] ? coinOf(p.coinIds[0]) : undefined;
  const sw = swapsOf(p.id, now);
  const owners = Math.round(N.looks.reduce((n, l) => n + l.owners, 0) + N.sold * (0.55 + 0.15 * h01(p.id + 'own')));
  const volAll = ledger.reduce((a, x) => a + x.priceUsd, 0) + N.sold * avgUnit;
  // Seeded activity (offers, listings, swap traffic) only exists once something is for sale: a pool with no lots or
  // looks yet reads zero until real activity arrives.
  const market = N.lots.length + N.looks.length > 0 ? 1 : 0;
  const v: Record<string, number> = {
    floor: N.floor, topOffer: market * N.floor * (0.9 + 0.06 * h01(p.id + 'offer' + Math.floor(now / 6e4))), ladderHigh: N.high, ladderTotal: N.total,
    avgSale: N.sold ? volAll / N.sold : avgUnit, marketCap: N.floor * N.supply,
    vol24h: vol(DAYms), vol7d: vol(7 * DAYms), vol30d: vol(30 * DAYms), volAll,
    sales24h: since(DAYms).length + soldIn(DAYms), sales7d: since(7 * DAYms).length + soldIn(7 * DAYms),
    swaps24h: market * Math.round(4 + 40 * h01(p.id + 'sw')) + sw.count, swapPaid24h: market * Math.round(800 + 9000 * h01(p.id + 'swp')) + sw.paid,
    change24h: N1.floor ? (N.floor - N1.floor) / N1.floor : 0, change7d: N7.floor ? (N.floor - N7.floor) / N7.floor : 0,
    sold: N.sold, remaining: N.supply - N.sold, supply: N.supply, listedPct: market * (0.04 + 0.12 * h01(p.id + 'list')),
    owners, uniquePct: N.supply ? Math.min(1, owners / N.supply) : 0, whales: Math.round(owners * (0.01 + 0.03 * h01(p.id + 'wh'))),
    newOwners7d: Math.round((since(7 * DAYms).length + soldIn(7 * DAYms)) * 0.45),
    solos: N.looks.length, packs: N.lots.filter((l) => l.kind === 'pack').length, drops: N.lots.filter((l) => l.kind === 'drop').length,
    // a pool that declares its royalty (royaltyPct, from the mint form) shows that; seed pools keep a stable filler
    royalty: typeof p.royaltyPct === 'number' ? p.royaltyPct / 100 : 0.05 + 0.05 * h01(p.id + 'roy'), tvl: liq?.tvl ?? 0, apr: (liq?.apr ?? 0) / 100, stakers: liq?.stakers ?? 0,
    reserve: reserveOf(p, now), entrants: pq?.entrants ?? 0, questsLive: D.pools.metrics.length, coinPrice: coin?.price ?? 0, coinHolders: coin?.holders ?? 0,
  };
  return D.pools.metrics.map((m) => {
    const value = v[m.id] ?? 0; const lift = 1.15 + 0.5 * h01(p.id + m.id);
    const target = m.format === 'pct' ? Math.min(1, Math.max(0.05, Math.abs(value) * lift)) : m.id === 'sold' ? N.supply : Math.max(1, value * lift);
    const progress = m.id === 'sold' ? (N.supply ? N.sold / N.supply : 0) : target ? Math.min(1, Math.abs(value) / target) : 0;
    return { metric: m, value, text: fmtStat(m, value, N.supply), questId: `mq_${p.id}_${m.id}`, target, progress };
  });
}

/** The quest behind a stat: lift it to its target and the pool pays out in its coin. */
export function statQuest(p: Pool, row: StatRow) {
  const pq = poolQuestOf(p.questId);
  return { id: row.questId, poolId: p.id, metricId: row.metric.id, title: `${row.metric.label}: reach ${fmtStat(row.metric, row.target, row.target)}`,
    reward: Math.round(50 + 950 * h01(row.questId)), rewardCoin: pq?.rewardCoin ?? 'EGG', progress: row.progress, endsAt: pq?.endsAt };
}

// ── Fungible swaps ──────────────────────────────────────────────────────────────────────────────────────────
type SwapLog = { payouts: SwapPayout[]; history: { t: number; give: ID; get: ID; difference: number; poolId: ID }[] };
const SWAPS = persisted<SwapLog>('swaps', { payouts: [], history: [] });
export const useSwaps = () => SWAPS.use();
export const swapRules = (): SwapRules => { const r = (site as unknown as { swap?: { withdrawLimitUsd: number; windowDays: number; fairBand: number } }).swap;
  return r ? { withdrawLimitUsd: r.withdrawLimitUsd, windowMs: r.windowDays * DAYms, fairBand: r.fairBand } : DEFAULT_SWAP_RULES; };
function swapsOf(poolId: ID, now: number) { const h = SWAPS.get().history.filter((x) => x.poolId === poolId && now - x.t < DAYms); return { count: h.length, paid: h.reduce((a, x) => a + Math.max(0, x.difference), 0) }; }
/** What a pool can pay out to sponsor swaps: a share of its liquidity and of its moving value. */
export function reserveOf(p: Pool, now = Date.now()) { const liq = liquidityOf(p); return Math.round((liq?.tvl ?? 0) * 0.2 + poolNumbers(p, now).total * 0.05); }

export function quoteSwapOf(giveId: ID, getId: ID, now = Date.now()): (SwapQuote & { give: NonNullable<ReturnType<typeof valueOf>>; get: NonNullable<ReturnType<typeof valueOf>> }) | undefined {
  const give = valueOf(giveId, now), get = valueOf(getId, now); if (!give || !get) return undefined;
  const pool = poolOf(get.poolId);
  const q = quoteSwap({ usd: give.usd }, { usd: get.usd, poolId: get.poolId }, SWAPS.get().payouts, balance('usd'), pool ? reserveOf(pool, now) : Infinity, swapRules(), now);
  return { ...q, give, get };
}

/** Swap one held PFT for another; the pool you take from settles the difference. */
export function doSwap(giveId: ID, getId: ID, now = Date.now()): SwapQuote | undefined {
  const q = quoteSwapOf(giveId, getId, now); if (!q || !q.allowed) return q;
  const label = `Swap ${q.give.name} → ${q.get.name}`;
  if (q.direction === 'pay' && !spend('usd', -q.difference, label + ' (difference)')) return { ...q, allowed: false, reason: 'funds' };
  if (q.direction === 'receive') earn('usd', q.difference, label + ', difference sponsored by ' + (poolOf(q.get.poolId)?.name ?? 'the pool'));
  const owned = { ...OWNED.get() }; delete owned[giveId]; owned[getId] = now; OWNED.replace(owned);
  record('swap', getId, { refKind: 'look', with: giveId, usd: q.difference, note: q.direction });
  const s = SWAPS.get();
  SWAPS.set({ payouts: q.direction === 'receive' ? [...s.payouts, { usd: q.difference, at: now }] : s.payouts,
    history: [{ t: now, give: giveId, get: getId, difference: q.difference, poolId: q.get.poolId }, ...s.history].slice(0, 200) });
  return q;
}

/** Buy a lot: a pack takes every unit at the moving total; a drop or solo takes one unit at its live price. */
export function buyLot(lot: PoolLot, unitIndex: number | null, now = Date.now()) {
  const q = quote(lot, now);
  if (lot.kind === 'pack' || unitIndex == null) {
    const ids = lot.kind === 'pack' ? lot.itemIds : [q.units[0].itemId];
    const price = lot.kind === 'pack' ? q.total : q.units[0].usd;
    return purchase(ids, price, `${lot.title} · ${usd(price)}`, () => { OWNED.replace({ ...OWNED.get(), ...Object.fromEntries(ids.map((id) => [id, now])) }); record('lot.buy', lot.id, { refKind: 'lot', usd: price }); });
  }
  const u = q.units[unitIndex]; if (!u) return false;
  return purchase([u.itemId], u.usd, `${lot.title} · unit ${u.index + 1} · ${usd(u.usd)}`, () => { OWNED.replace({ ...OWNED.get(), [u.itemId]: now }); record('lot.buy', u.itemId, { refKind: 'look', usd: u.usd, with: lot.id }); });
}

// ── Stories and feed moments made from live pool numbers ──────────────────────────────────────────────────────
import type { Highlight, Tone } from '../types/phiegg';
const toneOf = (p: Pool): Tone => (D.core.clubs.find((c) => c.id === p.clubId)?.tone ?? 'accent') as Tone;
/** A pool's story: sold counter, floor, the dearest unit, the moving total, its quest and its swaps, read live. */
export function poolStory(p: Pool, now = Date.now()): Highlight[] {
  const N = poolNumbers(p, now); const pq = poolQuestOf(p.questId); const tone = toneOf(p);
  const top = N.quotes.flatMap((q) => q.units).sort((a, b) => b.usd - a.usd)[0];
  const topName = top ? (lookOf(top.itemId)?.name ?? showLookOf(top.itemId)?.look.title ?? '') : '';
  return [{ id: 'story_' + p.id, label: p.kind === 'show' ? 'Show drop' : p.kind === 'drop' ? 'Club drop' : 'Pool', tone, frames: [
    { title: `${N.sold.toLocaleString('en-US')} / ${N.supply.toLocaleString('en-US')} sold`, tone, caption: p.name },
    { title: `Floor ${usd(N.floor)}`, tone, caption: `Top unit ${topName} · ${usd(N.high)}` },
    { title: `Moving value ${'$' + fmt(N.total)}`, tone, caption: 'The sum of every unit’s moving price' },
    ...(pq ? [{ title: pq.title, tone, caption: `${pq.metricIds.length} stats · ${pq.coinIds.length} coins · ${pq.reward} ${pq.rewardCoin}` }] : []),
    { title: 'Swap anything for anything', tone, caption: `${p.name} pays the difference, up to your weekly limit` },
  ] }];
}

/** Pools to surface now: hottest show drops first (most sold), then club drops, re-ranked as prices move. */
export function livePools(now = Date.now(), n = 8) {
  return D.pools.pools.filter((p) => p.kind !== 'collection')
    .map((p) => { const N = poolNumbers(p, now); return { pool: p, N, heat: (N.supply ? N.sold / N.supply : 0) + 0.15 * Math.sin(now / 9e5 + p.id.length) }; })
    .sort((a, b) => b.heat - a.heat).slice(0, n);
}

// ── Item stats: the full metrics of one PFT (a look) ─────────────────────────────────────────────────────────
export function itemStats(l: ShopLook, now = Date.now()): { label: string; text: string }[] {
  const q = lookLive(l, now); const day = lookLive(l, now - DAYms).total; const week = lookLive(l, now - 7 * DAYms).total;
  const sales = salesOfItem(l.id); const sold = sales.filter((x) => x.event === 'sale'); const offers = sales.filter((x) => x.event === 'offer');
  const pool = poolOf(l.poolId); const N = pool ? poolNumbers(pool, now) : undefined;
  const rank = N ? [...N.units].sort((a, b) => b - a).findIndex((u) => u <= q.total) + 1 : 0;
  const swaps = SWAPS.get().history.filter((x) => x.give === l.id || x.get === l.id).length + Math.round(20 * h01(l.id + 'sw'));
  const pc = (a: number, b: number) => (b ? ((a - b) / b * 100 > 0 ? '+' : '') + ((a - b) / b * 100).toFixed(1) + '%' : '·');
  return [
    { label: 'Live price', text: usd(q.total) }, { label: 'List price', text: usd(l.usd) }, { label: 'Floor', text: usd(l.floor) },
    { label: 'Change 24h', text: pc(q.total, day) }, { label: 'Change 7d', text: pc(q.total, week) }, { label: 'Shelf pick', text: `${q.units[0].shelfPick + 1} / 64` },
    { label: 'Edition', text: `${l.minted} / ${l.edition}` }, { label: 'Owners', text: fmt(l.owners) }, { label: 'Rarity', text: l.rarity },
    { label: 'Pool rank', text: rank ? `#${rank} of ${N!.units.length}` : '·' }, { label: 'Sales', text: fmt(sold.length) },
    { label: 'Volume', text: usd(sold.reduce((a, x) => a + x.priceUsd, 0)) }, { label: 'Best sale', text: sold.length ? usd(Math.max(...sold.map((x) => x.priceUsd))) : '·' },
    { label: 'Last sale', text: l.lastSale ? usd(l.lastSale) : sold.length ? usd(sold[sold.length - 1].priceUsd) : '·' }, { label: 'Offers', text: fmt(offers.length) },
    { label: 'Top offer', text: offers.length ? usd(Math.max(...offers.map((x) => x.priceUsd))) : usd(q.total * 0.92) }, { label: 'Swaps', text: fmt(swaps) },
    { label: 'Pool', text: pool?.name ?? '·' },
  ];
}
