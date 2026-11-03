// What you hold besides looks: EGG items (gate passes, earnings shares, land), profile PFTs and SUM deposits.
// One `/state/holdings` document; money moves through the phi-kit wallet in EGG. Every move is recorded (lib/activity).
import { persisted } from '@phi-kit/api';
import { balance, spend } from '@phi-kit/wallet';
import { record } from './activity';
import type { ID } from '../types/phiegg';

export type Holding = { qty: number; egg: number; at: number };
const H = persisted<Record<ID, Holding>>('holdings', {});
export const useHoldings = () => H.use();
const put = (id: ID, add: Partial<Holding> & { qty?: number; egg?: number }) => {
  const cur = H.get()[id] ?? { qty: 0, egg: 0, at: Date.now() };
  H.set({ ...H.get(), [id]: { qty: cur.qty + (add.qty ?? 0), egg: cur.egg + (add.egg ?? 0), at: cur.at } });
};
/** Buy one EGG item or profile PFT for its EGG price. false = not enough EGG. */
export function buyAsset(id: ID, priceEgg: number, label: string): boolean {
  if (balance('egg') < priceEgg || !spend('egg', priceEgg, label)) return false;
  put(id, { qty: 1, egg: priceEgg }); record('buy', id, { refKind: 'asset', usd: priceEgg, note: 'EGG' }); return true;
}
/** Put EGG into a SUM machine. */
export function deposit(sumId: ID, egg: number, label: string): boolean {
  if (!(egg > 0) || balance('egg') < egg || !spend('egg', egg, label)) return false;
  put(sumId, { qty: 0, egg }); record('stake', sumId, { refKind: 'sum', usd: egg, note: 'EGG' }); return true;
}
/** What a SUM deposit has made so far at its APY (simple, per second). */
export const sumYield = (h: Holding | undefined, apy: number, now = Date.now()) => (h ? h.egg * (apy / 100) * ((now - h.at) / (365 * 24 * 3600 * 1000)) : 0);
