// Prices come from the app's own data files, never from the client:
// Lora's Spark (ls.json) plus every club store (stores.json) in app/phiegg/src/data.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spend, LedgerError, ensureWallet, credit } from './ledger.mjs';

export function loadCatalog(dataDir) {
  const looks = new Map();
  const read = (f) => (existsSync(join(dataDir, f)) ? JSON.parse(readFileSync(join(dataDir, f), 'utf8')) : null);
  const ls = read('ls.json'); if (ls) for (const l of ls.looks) looks.set(l.id, l);
  const stores = read('stores.json'); if (stores) for (const s of stores.stores) for (const l of s.looks) looks.set(l.id, l);
  return { looks, size: looks.size };
}

const lookOrThrow = (catalog, id) => { const l = catalog.looks.get(id); if (!l) throw new LedgerError('unknown_look', 'Unknown look ' + id + '.'); return l; };
const docOf = (u, name, init) => (u.docs[name] ?? (u.docs[name] = init));

/** Buy one or more looks at list price in a single USD spend; already-owned looks are skipped. */
export function buy(u, catalog, ids, label) {
  ensureWallet(u);
  const unique = [...new Set(Array.isArray(ids) ? ids : [ids])];
  if (!unique.length || unique.length > 50) throw new LedgerError('bad_items', 'Pick between 1 and 50 looks.');
  const looks = unique.map((id) => lookOrThrow(catalog, id)).filter((l) => !u.owned[l.id]);
  if (!looks.length) throw new LedgerError('already_owned', 'You already own these looks.');
  const total = looks.reduce((a, l) => a + l.usd, 0);
  spend(u, { coin: 'usd', amt: total, what: label || (looks.length === 1 ? 'Bought ' + looks[0].name : 'Checkout · ' + looks.length + ' looks') });
  const now = Date.now(); for (const l of looks) u.owned[l.id] = now;
  const co = docOf(u, 'cartOffers', { cart: [], offers: [] });
  co.cart = (co.cart || []).filter((x) => !looks.some((l) => l.id === x));
  return { bought: looks.map((l) => l.id), total };
}

/** Seller rule (same as the client stand-in): at or above floor → accepted and paid now; below → pending. */
export function offer(u, catalog, lookId, amount) {
  ensureWallet(u);
  const l = lookOrThrow(catalog, lookId); const n = Number(amount);
  if (!(n > 0) || !Number.isFinite(n)) throw new LedgerError('bad_amount', 'Offer must be positive.');
  if (u.owned[l.id]) throw new LedgerError('already_owned', 'You already own this look.');
  const co = docOf(u, 'cartOffers', { cart: [], offers: [] });
  const rest = (co.offers || []).filter((o) => !(o.lookId === l.id && o.status === 'pending'));
  if (n >= l.floor) {
    spend(u, { coin: 'usd', amt: n, what: 'Offer accepted · ' + l.name });
    u.owned[l.id] = Date.now();
    co.cart = (co.cart || []).filter((x) => x !== l.id);
    co.offers = [{ lookId: l.id, usd: n, t: Date.now(), status: 'accepted' }, ...rest];
    return { status: 'accepted' };
  }
  co.offers = [{ lookId: l.id, usd: n, t: Date.now(), status: 'pending' }, ...rest];
  return { status: 'pending' };
}

/** Sell an owned look back at its floor price (the client's "Sell" in Profile). */
export function sell(u, catalog, lookId) {
  ensureWallet(u);
  const l = lookOrThrow(catalog, lookId);
  if (!u.owned[l.id]) throw new LedgerError('not_owned', 'You don’t own this look.');
  delete u.owned[l.id];
  credit(u, 'usd', l.floor, 'Sold ' + l.name);
  return { sold: l.id, usd: l.floor };
}
