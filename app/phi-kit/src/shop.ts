/**
 * Buying, offering and selling looks. One call site for every app:
 *  - with VITE_PHI_API: Phiora prices the looks from its own data and moves the money (/shop/buy|offer|sell);
 *    the answer replaces wallet, history, owned and cartOffers. The return value is the optimistic outcome.
 *  - without it: spends/earns the local wallet and runs the app's own local bookkeeping callback.
 */
import { apiPost, hasApi } from './api';
import { balance, earn, settle, spend, type Money } from './wallet';

export type OfferOutcome = 'accepted' | 'pending' | 'funds';

/** Buy `ids` for `totalUsd`. `local` records ownership when there is no server. */
export function purchase(ids: string[], totalUsd: number, label: string, local: () => void): boolean {
  if (!hasApi) { if (!spend('usd', totalUsd, label)) return false; local(); return true; }
  if (!(totalUsd > 0) || balance('usd') < totalUsd) return false;
  void settle(apiPost<Money>('/shop/buy', { lookIds: ids, label }));
  return true;
}

/** Offer `amount` on a look with this `floor`: at/above floor buys now, below waits for the seller. */
export function placeOffer(id: string, amount: number, floor: number, label: string, local: (o: Exclude<OfferOutcome, 'funds'>) => void): OfferOutcome {
  const outcome: OfferOutcome = amount >= floor ? (balance('usd') >= amount ? 'accepted' : 'funds') : 'pending';
  if (outcome === 'funds') return outcome;
  if (!hasApi) { if (outcome === 'accepted' && !spend('usd', amount, label)) return 'funds'; local(outcome); return outcome; }
  void settle(apiPost<Money>('/shop/offer', { lookId: id, usd: amount }));
  return outcome;
}

/** Sell an owned look back at its floor price. */
export function sell(id: string, floorUsd: number, label: string, local: () => void): void {
  if (!hasApi) { local(); earn('usd', floorUsd, label); return; }
  void settle(apiPost<Money>('/shop/sell', { lookId: id }));
}
