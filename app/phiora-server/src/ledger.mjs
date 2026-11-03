// Server-owned wallet. Same coins, rates and fee as app/phi-kit/src/wallet.ts so the client's
// optimistic update and the server's answer agree; the server's answer always wins.
export const COINS = ['usd', 'egg', 'sum', 'eth'];
export const USD = { usd: 1, egg: 0.25, sum: 6, eth: 3200 };
export const LABEL = { usd: 'USD', egg: '$EGG', sum: '$UM', eth: 'ETH' };
export const START = { usd: 2500, egg: 12000, sum: 140, eth: 0.42 };
export const FEE = 0.003;
const HISTORY_MAX = 200;
/** Demo faucet: total USD-equivalent a user may receive through /wallet/earn. */
export const EARN_CAP_USD = 50000;

export class LedgerError extends Error { constructor(code, message) { super(message); this.code = code; } }

const num = (v) => (typeof v === 'number' ? v : Number(v));
const isCoin = (c) => COINS.includes(c);
const round = (v) => Math.round(v * 1e8) / 1e8;

export const ensureWallet = (u) => {
  if (!u.wallet) u.wallet = { ...START };
  if (!u.history) u.history = [];
  if (!u.owned) u.owned = {};
  if (typeof u.earned !== 'number') u.earned = 0;
  return u;
};
const log = (u, coin, amt, what) => { u.history = [{ t: Date.now(), coin, amt: round(amt), what: String(what).slice(0, 120) }, ...u.history].slice(0, HISTORY_MAX); };

export const quote = (amt, from, to, fee = FEE) => (amt * USD[from] / USD[to]) * (1 - fee);

export function swap(u, { amt, from, to }) {
  ensureWallet(u); amt = num(amt);
  if (!isCoin(from) || !isCoin(to) || from === to) throw new LedgerError('bad_pair', 'Pick two different coins.');
  if (!(amt > 0) || !Number.isFinite(amt)) throw new LedgerError('bad_amount', 'Amount must be positive.');
  if (amt > u.wallet[from] + 1e-9) throw new LedgerError('insufficient', 'Not enough ' + LABEL[from] + '.');
  const got = quote(amt, from, to);
  u.wallet[from] = round(u.wallet[from] - amt); u.wallet[to] = round(u.wallet[to] + got);
  log(u, from, -amt, 'Swapped to ' + LABEL[to]); log(u, to, got, 'Received from swap');
  return { got: round(got) };
}

export function spend(u, { coin, amt, what = 'Spent' }) {
  ensureWallet(u); amt = num(amt);
  if (!isCoin(coin)) throw new LedgerError('bad_coin', 'Unknown coin.');
  if (!(amt > 0) || !Number.isFinite(amt)) throw new LedgerError('bad_amount', 'Amount must be positive.');
  if (amt > u.wallet[coin] + 1e-9) throw new LedgerError('insufficient', 'Not enough ' + LABEL[coin] + '.');
  u.wallet[coin] = round(u.wallet[coin] - amt); log(u, coin, -amt, what);
  return {};
}

export function earn(u, { coin, amt, what = 'Received' }) {
  ensureWallet(u); amt = num(amt);
  if (!isCoin(coin)) throw new LedgerError('bad_coin', 'Unknown coin.');
  if (!(amt > 0) || !Number.isFinite(amt)) throw new LedgerError('bad_amount', 'Amount must be positive.');
  const usd = amt * USD[coin];
  if (u.earned + usd > EARN_CAP_USD) throw new LedgerError('earn_cap', 'Demo top-up limit reached.');
  u.earned += usd; u.wallet[coin] = round(u.wallet[coin] + amt); log(u, coin, amt, what);
  return {};
}

/** Internal credit (sales, payouts) — not subject to the demo faucet cap. */
export function credit(u, coin, amt, what) { ensureWallet(u); u.wallet[coin] = round(u.wallet[coin] + amt); log(u, coin, amt, what); }
