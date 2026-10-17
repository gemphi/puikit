import { describe, expect, it } from 'vitest';
import { PRICE_PERIOD_MS, quoteLot, quoteSwap, shelfValues, soldAt, soloLot, unitPrice, type Lot } from './pricing';

const drop: Lot = {
  id: 'drop_x', kind: 'drop', poolId: 'pool_x', title: 'X drop', itemIds: Array.from({ length: 64 }, (_, i) => 'l' + i),
  supply: 3999, sold0: 2900, sellRate: 10, opensAt: '2026-10-01T00:00:00Z', base: 500, spread: 0.4, seed: 'x',
};
const T = Date.parse('2026-10-12T00:00:00Z');

describe('pricing', () => {
  it('shelf runs high to low inside the band', () => {
    const s = shelfValues(100, 0.5, 64);
    expect(s).toHaveLength(64);
    expect(s[0]).toBeCloseTo(150); expect(s[63]).toBeCloseTo(50);
    expect(s.every((v, i) => i === 0 || v <= s[i - 1])).toBe(true);
  });

  it('a drop quotes 64 units high → low and the total is their sum', () => {
    const q = quoteLot(drop, T);
    expect(q.units).toHaveLength(64);
    expect(q.units.every((u, i) => i === 0 || u.usd <= q.units[i - 1].usd)).toBe(true);
    expect(q.total).toBeCloseTo(q.units.reduce((s, u) => s + u.usd, 0), 1);
    expect(q.high).toBeLessThanOrEqual(700); expect(q.low).toBeGreaterThanOrEqual(300);
  });

  it('prices are deterministic but move with time and glide between ticks', () => {
    expect(quoteLot(drop, T).total).toBe(quoteLot(drop, T).total);
    const later = quoteLot(drop, T + 5 * PRICE_PERIOD_MS).total;
    expect(later).not.toBe(quoteLot(drop, T).total);
    // inside one tick the step is a small glide, not a jump to a new value
    const a = unitPrice(drop, 3, T).usd, b = unitPrice(drop, 3, T + 1000).usd, c = unitPrice(drop, 3, T + PRICE_PERIOD_MS - 1).usd;
    expect(Math.abs(b - a)).toBeLessThanOrEqual(Math.abs(c - a) + 1e-6);
  });

  it('counts sold editions up to supply', () => {
    expect(soldAt(drop, Date.parse('2026-10-01T00:00:00Z'))).toBe(2900);
    expect(soldAt(drop, T)).toBe(Math.min(3999, 2900 + 10 * 264));
    expect(soldAt(drop, T + 1e12)).toBe(3999);
    const q = quoteLot(drop, T); expect(q.remaining).toBe(q.supply - q.sold);
  });

  it('a pack centres each unit on its item anchor', () => {
    const pack: Lot = { ...drop, id: 'p', kind: 'pack', itemIds: ['a', 'b', 'c', 'd', 'e'], anchors: [2000, 900, 400, 300, 150], spread: 0.1 };
    const q = quoteLot(pack, T);
    expect(q.units).toHaveLength(5);
    expect(q.high).toBeGreaterThan(1700); expect(q.low).toBeLessThan(200);
  });

  it('solo lots are one unit near the list price', () => {
    const q = quoteLot(soloLot('pool', 'look1', 'Look', 1000), T);
    expect(q.units).toHaveLength(1); expect(q.total).toBeGreaterThan(880); expect(q.total).toBeLessThan(1120);
  });
});

describe('fungible swaps', () => {
  const now = T;
  it('the pool pays the difference when you give the dearer item', () => {
    const q = quoteSwap({ usd: 2000 }, { usd: 300, poolId: 'pool_jeans' }, [], 0, Infinity, undefined, now);
    expect(q).toMatchObject({ direction: 'receive', difference: 1700, sponsorPoolId: 'pool_jeans', allowed: true, allowanceUsd: 2500 });
  });
  it('you pay the difference for a dearer item, if the wallet covers it', () => {
    expect(quoteSwap({ usd: 300 }, { usd: 2000, poolId: 'p' }, [], 2000, Infinity, undefined, now)).toMatchObject({ direction: 'pay', difference: -1700, allowed: true });
    expect(quoteSwap({ usd: 300 }, { usd: 2000, poolId: 'p' }, [], 100, Infinity, undefined, now)).toMatchObject({ allowed: false, reason: 'funds' });
  });
  it('barter stops paying out past the withdraw limit, but fair swaps still go through', () => {
    const paid = [{ usd: 2000, at: now - 1000 }];
    expect(quoteSwap({ usd: 2000 }, { usd: 300, poolId: 'p' }, paid, 0, Infinity, undefined, now)).toMatchObject({ allowed: false, reason: 'limit', allowanceUsd: 500 });
    expect(quoteSwap({ usd: 1000 }, { usd: 980, poolId: 'p' }, paid, 0, Infinity, undefined, now)).toMatchObject({ direction: 'even', allowed: true });
    // the window rolls
    expect(quoteSwap({ usd: 2000 }, { usd: 300, poolId: 'p' }, [{ usd: 2000, at: now - 8 * 24 * 36e5 }], 0, Infinity, undefined, now).allowed).toBe(true);
  });
  it('a pool cannot pay out more than its reserve', () => {
    expect(quoteSwap({ usd: 2000 }, { usd: 300, poolId: 'p' }, [], 0, 1000, undefined, now)).toMatchObject({ allowed: false, reason: 'reserve' });
  });
});
