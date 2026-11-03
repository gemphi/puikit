// Moving prices for saleable lots, pure functions, no DOM, so Phiora can run the same maths server-side.
//
// Every saleable thing is a LOT:
//   solo, one item, one unit.
//   pack, 4–7 items sold together; each unit has its own price, listed high → low, and the pack costs their sum.
//   drop, a run of units (a show drop has 64: one per look) sold as editions of a fixed supply ("3009 / 3999 sold").
//
// A unit's price is found, not stored. Each lot owns a SHELF of `shelf` values (64 by default) running from the top
// of its band down to the bottom. At every tick the pricing function uses the unit's index to pick one value off the
// shelf (a seeded hash of lot · index · tick), and glides from the last pick to the next across the tick, so prices
// move smoothly. The lot total is the sum of its units' moving prices, it is always transitory.

export type LotKind = 'solo' | 'pack' | 'drop';
export interface Lot {
  id: string;
  kind: LotKind;
  /** Pool the lot is sold from (the market maker that sponsors swaps out of it). */
  poolId: string;
  title: string;
  /** Items inside one unit set: 1 (solo), 4–7 (pack), up to 64 (drop). */
  itemIds: string[];
  /** Editions on sale (pack / drop runs). Solo lots have 1. */
  supply: number;
  /** Editions already sold when the lot opened, and how many sell per hour after. */
  sold0: number;
  sellRate: number;
  opensAt: string;
  /** Centre of the price band in USD, and its half-width as a fraction (0.35 = ±35 %). */
  base: number;
  spread: number;
  /** Values on the shelf the pricing function picks from. */
  shelf?: number;
  /** Optional fixed anchors per item (e.g. a look's list price), the band then centres on each anchor. */
  anchors?: number[];
  seed: string;
}

export interface UnitPrice { index: number; itemId: string; usd: number; shelfPick: number; change: number }
export interface LotQuote {
  lotId: string; kind: LotKind; units: UnitPrice[]; total: number; high: number; low: number; avg: number;
  sold: number; supply: number; remaining: number; soldPct: number; tick: number; change: number;
}

/** Tick length: prices pick a new shelf value every period and glide between picks. */
export const PRICE_PERIOD_MS = 30_000;

const fnv = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
/** Seeded value in [0, 1) for any list of parts. */
export const hash01 = (...parts: (string | number)[]) => {
  let x = fnv(parts.join('·')) || 1;
  x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
  return (x % 1_000_000) / 1_000_000;
};

/** The shelf: `n` values from the top of the band to the bottom (an eased curve, so a few units are dear). */
export const shelfValues = (centre: number, spread: number, n = 64) =>
  Array.from({ length: n }, (_, j) => {
    const u = n === 1 ? 0.5 : j / (n - 1);          // 0 = top shelf, 1 = bottom
    const eased = 1 - Math.pow(u, 0.8);              // top values thin out like rarities
    return centre * (1 - spread + 2 * spread * eased);
  });

const pick = (lot: Lot, index: number, tick: number) => Math.floor(hash01(lot.seed, index, tick) * (lot.shelf ?? 64));
const smooth = (f: number) => f * f * (3 - 2 * f);

/** One unit's moving price at `now`, gliding between this tick's shelf pick and the next. */
export function unitPrice(lot: Lot, index: number, now = Date.now()): UnitPrice {
  const n = lot.shelf ?? 64;
  const centre = lot.anchors?.[index] ?? lot.base;
  const shelf = shelfValues(centre, lot.spread, n);
  const k = Math.floor(now / PRICE_PERIOD_MS); const f = smooth((now % PRICE_PERIOD_MS) / PRICE_PERIOD_MS);
  const a = shelf[pick(lot, index, k)], b = shelf[pick(lot, index, k + 1)], prev = shelf[pick(lot, index, k - 1)];
  const usd = a + (b - a) * f;
  return { index, itemId: lot.itemIds[index % lot.itemIds.length], usd: Math.round(usd * 100) / 100, shelfPick: pick(lot, index, k), change: prev ? (usd - prev) / prev : 0 };
}

/** How many editions are sold at `now` (grows from sold0 at sellRate per hour, capped at supply). */
export const soldAt = (lot: Lot, now = Date.now()) => {
  const h = Math.max(0, (now - Date.parse(lot.opensAt)) / 36e5);
  return Math.min(lot.supply, Math.floor(lot.sold0 + lot.sellRate * h));
};

/** Units of a lot: one per item (solo 1, pack 4–7, drop 64). */
export const unitCount = (lot: Lot) => (lot.kind === 'solo' ? 1 : lot.itemIds.length);

/** Full quote: unit prices high → low, their transitory total, and the sold counter. */
export function quoteLot(lot: Lot, now = Date.now()): LotQuote {
  const units = Array.from({ length: unitCount(lot) }, (_, i) => unitPrice(lot, i, now)).sort((x, y) => y.usd - x.usd);
  const total = Math.round(units.reduce((s, u) => s + u.usd, 0) * 100) / 100;
  const prevTotal = units.reduce((s, u) => s + u.usd / (1 + u.change), 0);
  const sold = soldAt(lot, now);
  return {
    lotId: lot.id, kind: lot.kind, units, total, high: units[0]?.usd ?? 0, low: units[units.length - 1]?.usd ?? 0,
    avg: units.length ? total / units.length : 0, sold, supply: lot.supply, remaining: lot.supply - sold,
    soldPct: lot.supply ? sold / lot.supply : 0, tick: Math.floor(now / PRICE_PERIOD_MS), change: prevTotal ? (total - prevTotal) / prevTotal : 0,
  };
}

/** A solo lot for one item at a list price (every shop look is saleable on its own). */
export const soloLot = (poolId: string, itemId: string, title: string, usd: number, spread = 0.12): Lot => ({
  id: 'solo_' + itemId, kind: 'solo', poolId, title, itemIds: [itemId], supply: 1, sold0: 0, sellRate: 0,
  opensAt: '2026-01-01T00:00:00Z', base: usd, spread, shelf: 64, seed: 'solo:' + itemId,
});

// ── Fungible swaps ───────────────────────────────────────────────────────────────────────────────────────────
// PFTs are profile FUNGIBLE tokens: any held item can be exchanged for any other. Give a $2,000 handbag, take a
// $300 skirt, and the pool you take from pays you the $1,700 difference (the market maker sponsors the deal); take
// something dearer and you pay the difference. Barter runs freely while the differences you are paid out stay
// within your withdraw limit for the window, past it, only fair swaps (you pay, or the values are within the
// fair band) go through until the window rolls.

export interface SwapRules { withdrawLimitUsd: number; windowMs: number; fairBand: number }
export const DEFAULT_SWAP_RULES: SwapRules = { withdrawLimitUsd: 2500, windowMs: 7 * 24 * 36e5, fairBand: 0.05 };
export interface SwapPayout { usd: number; at: number }
export interface SwapQuote {
  giveUsd: number; getUsd: number; difference: number;
  /** receive: the pool pays you · pay: you pay the pool · even: within the fair band, nothing moves. */
  direction: 'receive' | 'pay' | 'even';
  sponsorPoolId: string; usedUsd: number; allowanceUsd: number; allowed: boolean; reason?: 'limit' | 'funds' | 'reserve';
}

export function quoteSwap(
  give: { usd: number }, get: { usd: number; poolId: string },
  payouts: SwapPayout[], wallet: number, sponsorReserve = Infinity, rules: SwapRules = DEFAULT_SWAP_RULES, now = Date.now(),
): SwapQuote {
  const difference = Math.round((give.usd - get.usd) * 100) / 100;
  const fair = Math.abs(difference) <= rules.fairBand * Math.max(give.usd, get.usd);
  const direction = fair ? 'even' : difference > 0 ? 'receive' : 'pay';
  const usedUsd = payouts.filter((p) => now - p.at < rules.windowMs).reduce((s, p) => s + p.usd, 0);
  const allowanceUsd = Math.max(0, rules.withdrawLimitUsd - usedUsd);
  let reason: SwapQuote['reason'];
  if (direction === 'receive' && difference > allowanceUsd) reason = 'limit';
  else if (direction === 'receive' && difference > sponsorReserve) reason = 'reserve';
  else if (direction === 'pay' && -difference > wallet) reason = 'funds';
  return { giveUsd: give.usd, getUsd: get.usd, difference, direction, sponsorPoolId: get.poolId, usedUsd, allowanceUsd, allowed: !reason, reason };
}
