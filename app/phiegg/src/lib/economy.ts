// Quests entered, pool stakes and club-coin holdings. Money moves through the phi-kit wallet (Phiora /wallet/* when
// VITE_PHI_API is set), so balances stay server-owned; positions persist as the user's `/state/economy` document.
import { persisted } from '@phi-kit/api';
import { balance, earn, spend } from '@phi-kit/wallet';
import { D } from './data';
import type { ID } from '../types/phiegg';
import { record } from './activity';

export type Economy = { quests: Record<ID, number>; stakes: Record<ID, { usd: number; at: number }>; coins: Record<ID, number> };
export const ECONOMY = persisted<Economy>('economy', { quests: {}, stakes: {}, coins: {} });
export const useEconomy = () => ECONOMY.use();
const put = (p: Partial<Economy>) => ECONOMY.set({ ...ECONOMY.get(), ...p });

export const enterQuest = (id: ID) => { record('quest.join', id, { refKind: 'quest' }); return put({ quests: { ...ECONOMY.get().quests, [id]: Date.now() } }); };
export const leaveQuest = (id: ID) => { record('quest.leave', id, { refKind: 'quest' }); const q = { ...ECONOMY.get().quests }; delete q[id]; put({ quests: q }); };

/** Stake USD into a pool. false = not enough USD. */
export const stake = (poolId: ID, usd: number): boolean => {
  const pool = D.economy.liquidity.find((p) => p.id === poolId); if (!pool || !(usd > 0) || usd > balance('usd')) return false;
  if (!spend('usd', usd, 'Staked in ' + pool.name)) return false;
  const cur = ECONOMY.get().stakes[poolId]; put({ stakes: { ...ECONOMY.get().stakes, [poolId]: { usd: (cur?.usd ?? 0) + usd, at: cur?.at ?? Date.now() } } }); record('stake', poolId, { refKind: 'liquidity', usd });
  return true;
};
/** Accrued yield so far (simple APR, per second). */
export const accrued = (poolId: ID, now = Date.now()) => {
  const s = ECONOMY.get().stakes[poolId]; const pool = D.economy.liquidity.find((p) => p.id === poolId);
  return s && pool ? s.usd * (pool.apr / 100) * ((now - s.at) / (365 * 24 * 3600 * 1000)) : 0;
};
export const unstake = (poolId: ID) => {
  const s = ECONOMY.get().stakes[poolId]; const pool = D.economy.liquidity.find((p) => p.id === poolId); if (!s || !pool) return 0;
  const back = s.usd + accrued(poolId); earn('usd', back, 'Unstaked from ' + pool.name);
  const st = { ...ECONOMY.get().stakes }; delete st[poolId]; put({ stakes: st }); record('unstake', poolId, { refKind: 'liquidity', usd: back }); return back;
};

/** Buy club coins with USD at the listed price. */
export const buyCoin = (coinId: ID, usd: number): boolean => {
  const c = D.economy.coins.find((x) => x.id === coinId); if (!c || !(usd > 0) || usd > balance('usd')) return false;
  if (!spend('usd', usd, 'Bought ' + c.symbol)) return false;
  put({ coins: { ...ECONOMY.get().coins, [coinId]: (ECONOMY.get().coins[coinId] ?? 0) + usd / c.price } }); record('coin.buy', coinId, { refKind: 'coin', usd }); return true;
};
export const sellCoin = (coinId: ID) => {
  const c = D.economy.coins.find((x) => x.id === coinId); const units = ECONOMY.get().coins[coinId] ?? 0; if (!c || !units) return 0;
  const usd = units * c.price; earn('usd', usd, 'Sold ' + c.symbol);
  const cs = { ...ECONOMY.get().coins }; delete cs[coinId]; put({ coins: cs }); record('coin.sell', coinId, { refKind: 'coin', usd }); return usd;
};
