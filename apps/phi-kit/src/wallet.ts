import { apiPost, hasApi, persisted } from './api';

/** Wallet stand-in (USD, $EGG, $SUM, ETH). Mirrors the prototype's PhiCore; synced to Phiora via api.ts. */
export type Coin = 'usd' | 'egg' | 'sum' | 'eth';
export type Wallet = Record<Coin, number>;
export const USD: Record<Coin, number> = { usd: 1, egg: 0.25, sum: 6, eth: 3200 };
export const LABEL: Record<Coin, string> = { usd: 'USD', egg: '$EGG', sum: '$SUM', eth: 'ETH' };

const START: Wallet = { usd: 2500, egg: 12000, sum: 140, eth: 0.42 };
/** Balances. With VITE_PHI_API the server owns them: changes go through /wallet/*, the local copy is updated
 *  optimistically and then replaced by the server's answer. Without it, localStorage (see api.ts). */
const W = persisted<Wallet>('wallet', START, undefined, { serverOwned: true });
const set = (w: Wallet) => W.set(w);

/** Activity log (newest first), Phiora `/state/history`. */
export type Entry = { t: number; coin: Coin; amt: number; what: string };
const H = persisted<Entry[]>('history', [], undefined, { serverOwned: true });
/** Owned items (look id → time), also server-owned; apps read it through persisted('owned', …). */
export const OWNED = persisted<Record<string, number>>('owned', {}, undefined, { serverOwned: true });
const log = (coin: Coin, amt: number, what: string) => H.set([{ t: Date.now(), coin, amt, what }, ...H.get()].slice(0, 200));
export const useHistory = () => H.use();

export const useWallet = () => W.use();
const state = () => W.get();

/** What Phiora returns from any money move. */
export type Money = { wallet?: Wallet; history?: Entry[]; owned?: Record<string, number>; cartOffers?: unknown };
/** Apply the server's answer to every money document it mentions; if the call failed, re-read them. */
export const settle = (p: Promise<Money | undefined>) => p.then((r) => {
  if (!r || !r.wallet) { void W.refresh(); void H.refresh(); void OWNED.refresh(); return r; }
  W.replace(r.wallet); if (r.history) H.replace(r.history);
  if (r.owned) OWNED.replace(r.owned);
  if (r.cartOffers) persisted('cartOffers', { cart: [], offers: [] }).replace(r.cartOffers as never);
  return r;
});
const serverMove = (op: string, body: unknown) => { if (hasApi) void settle(apiPost<Money>('/wallet/' + op, body)); };
export const quote = (amt: number, from: Coin, to: Coin, fee = 0.003) => (amt * USD[from] / USD[to]) * (1 - fee);
export const swap = (amt: number, from: Coin, to: Coin, fee = 0.003) => {
  if (!(amt > 0) || amt > state()[from] || from === to) return false;
  const got = quote(amt, from, to, fee);
  log(from, -amt, 'Swapped to ' + LABEL[to]); log(to, got, 'Received from swap');
  const w = state(); set({ ...w, [from]: w[from] - amt, [to]: w[to] + got });
  serverMove('swap', { amt, from, to });
  return true;
};
export const spend = (c: Coin, amt: number, what = 'Spent') => {
  if (!(amt > 0) || amt > state()[c]) return false;
  log(c, -amt, what); const w = state(); set({ ...w, [c]: w[c] - amt });
  serverMove('spend', { coin: c, amt, what });
  return true;
};
export const earn = (c: Coin, amt: number, what = 'Received') => { if (!(amt > 0)) return; log(c, amt, what); const w = state(); set({ ...w, [c]: w[c] + amt }); serverMove('earn', { coin: c, amt, what }); };
/** USD balance right now (for synchronous affordability checks). */
export const balance = (c: Coin) => state()[c];
export const fmt = (c: Coin, v: number) => {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (c === 'eth') return a < 0.01 ? v.toPrecision(3) : v.toFixed(4);
  return a < 1 ? v.toPrecision(3) : a < 100 ? v.toFixed(2).replace(/\.00$/, '') : Math.round(v).toLocaleString('en-US');
};
