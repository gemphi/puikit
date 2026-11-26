#!/usr/bin/env node
// Every item's ledger is long enough to fill its page: at least FLOOR holders, so the Trail and Owner tabs each
// carry FLOOR rows or more. It only adds: the events already in sales.json stay as they are, and the ones this step
// wrote before (ids starting `lg_`) are taken out and written again, so a rerun gives the same file.
// It touches sales.json, and writes trail.json: the same kind of ledger for the kinds sales.json does not cover (EGG
// items, SUMs, profile PFTs, rides, jewels), kept in its own file so the numbers read from sales.json do not move.
// Run `npm run data:ids` after it (the `data:ledger` script does).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const MIN_EVENTS = 16;                           // events an item has at least: its page reads as OpenSea's activity does
const FLOOR = 8;                                  // holders an item has at least
const END = Date.parse('2026-11-20T00:00:00Z');   // nothing is written after this day
const day = 864e5;

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// A seeded run of numbers in [0, 1) for one item, so its story is the same on every run.
const rndOf = (seed) => { let x = hash(seed) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };

// What happens around a sale on a marketplace, besides the sale: listing it, changing the price, taking the listing
// down, bids and offers on it. None of them moves the item, so the holders and the owner stay as the hops made them.
// It draws from a run of its own, so the sales, transfers and owners written before are the same as they were.
// A listing is the doing of whoever held the item that day (`hands`: who took it and when, the oldest first); a price
// change and a cancelled listing follow a listing, by the same holder, while they still hold it. A bid or an offer
// comes from anybody but the holder of the day.
const AROUND = ['list', 'bid', 'price', 'cancel', 'offer'];
const MOVE = new Set(['mint', 'sale', 'transfer', 'swap']);
const iso = (ms) => new Date(ms).toISOString();
// Another item than this one, for a swap: nothing is traded for itself.
const otherOf = (list, rnd, id) => { const i = Math.floor(rnd() * list.length); return (list[i].id === id ? list[(i + 1) % list.length] : list[i]).id; };
function around(ev, count, rnd, pick, hands, price, from, to) {
  const first = hands[0].at; const span = Math.max(day, to - Math.max(from, first));
  const when = () => Math.max(from, first) + rnd() * span;
  const tenure = (at) => { let i = 0; while (i + 1 < hands.length && hands[i + 1].at <= at) i++; return { who: hands[i].who, end: Math.max(at, hands[i + 1]?.at ?? to) }; };
  const other = (who) => { let b = pick(); for (let n = 0; b === who && n < 8; n++) b = pick(); return b; };
  let open = null;   // the listing a price change or a cancel belongs to
  const listing = () => { const at = when(); return { at, ...tenure(at) }; };
  const KIND = {
    list: () => { open = listing(); ev('list', { fromId: open.who, priceUsd: Math.round(price * (1 + rnd() * 0.25)), at: iso(open.at) }); },
    bid: () => { const at = when(); ev('bid', { fromId: other(tenure(at).who), priceUsd: Math.round(price * (0.7 + rnd() * 0.25)), at: iso(at) }); },
    price: () => { open ??= listing(); ev('price', { fromId: open.who, priceUsd: Math.round(price * (0.85 + rnd() * 0.3)), at: iso(open.at + rnd() * 0.5 * (open.end - open.at)) }); },
    cancel: () => { open ??= listing(); ev('cancel', { fromId: open.who, priceUsd: Math.round(price), at: iso(open.at + (0.5 + rnd() * 0.45) * (open.end - open.at)) }); open = null; },
    offer: () => { const at = when(); const who = tenure(at).who; ev('offer', { fromId: other(who), toId: who, priceUsd: Math.round(price * (0.75 + rnd() * 0.2)), at: iso(at) }); },
  };
  for (let n = count; n < MIN_EVENTS; n++) KIND[AROUND[n % AROUND.length]]();
}
const doc = read('sales.json'); const ls = read('ls.json'); const stores = read('stores.json');
const kept = doc.sales.filter((x) => !String(x.id).startsWith('lg_'));
// The people a ledger draws from are the ones the first looks' events name: looks added later by shop-depth.mjs (depth)
// do not add to them, so the stories already written do not move when a shop gets more looks.
const depthIds = new Set([...ls.looks, ...stores.stores.flatMap((s) => s.looks)].filter((l) => l.depth).map((l) => l.id));
const people = [...new Set(kept.filter((x) => !depthIds.has(x.itemId)).flatMap((x) => [x.fromId, x.toId]).filter(Boolean))].sort();

const byItem = new Map();
for (const x of kept) { if (!byItem.has(x.itemId)) byItem.set(x.itemId, []); byItem.get(x.itemId).push(x); }
const looks = [...ls.looks, ...stores.stores.flatMap((s) => s.looks)];
const items = [
  ...looks.map((l) => ({ kind: 'look', id: l.id, usd: l.usd ?? l.floor ?? 120, by: l.specs?.provenance?.designerId, minted: l.mintDate })),
  // Every piece of every club has a ledger, not only the ones with a first event: a page with no trail is a page with nothing on it.
  ...read('club.json').pieces.map((p) => ({ kind: 'piece', id: p.id, usd: 0, by: p.creatorId })),
];

const added = [];
for (const it of items) {
  const rows = (byItem.get(it.id) ?? []).slice().sort((a, b) => a.at.localeCompare(b.at));
  const rnd = rndOf(it.id); const pick = () => people[Math.floor(rnd() * people.length)];
  const more = rndOf('around:' + it.id); const pick2 = () => people[Math.floor(more() * people.length)]; const t0 = Math.max(Date.parse('2026-06-01'), END - 150 * day);
  let k = 0; const ev = (event, extra) => added.push({ id: `lg_${it.id}_${k++}`, event, itemKind: it.kind, itemId: it.id, ...extra });
  const held = new Set(rows.map((x) => x.toId).filter(Boolean));
  let owner = [...rows].reverse().find((x) => x.toId && x.event !== 'offer')?.toId;
  const hands = rows.filter((x) => x.toId && MOVE.has(x.event)).map((x) => ({ who: x.toId, at: Date.parse(x.at) }));
  let price = [...rows].reverse().find((x) => x.priceUsd)?.priceUsd || it.usd || 120;
  let t = rows.length ? Date.parse(rows[rows.length - 1].at) : Math.min(END - 60 * day, Date.parse(it.minted ?? '2026-08-01'));
  if (!owner) { owner = it.by ?? pick(); ev('mint', { toId: owner, priceUsd: 0, at: new Date(t).toISOString() }); held.add(owner); hands.push({ who: owner, at: t }); }
  const hops = Math.max(0, FLOOR - held.size);
  // The time left is shared between the hops; an item whose ledger already reaches the last day moves by the hour.
  const step = hops ? Math.max(36e5, (END - t) / (hops + 1)) : 0;
  for (let h = 0; h < hops; h++) {
    t += step * (0.7 + rnd() * 0.6);
    price = Math.max(10, price * (0.9 + rnd() * 0.25));
    let buyer = pick(); for (let n = 0; held.has(buyer) && n < 64; n++) buyer = pick();
    const at = new Date(Math.min(t, END + h * 36e5)).toISOString();
    if (rnd() < 0.2) ev('offer', { fromId: buyer, toId: owner, priceUsd: Math.round(price * 0.92), at: new Date(Date.parse(at) - 6 * 36e5).toISOString() });
    const moved = rnd() < 0.85 ? 'sale' : 'transfer';
    // Some of the hands it changed without a price were a swap: it was traded for another look of the buyer's.
    if (moved === 'transfer' && more() < 0.6) ev('swap', { fromId: owner, toId: buyer, priceUsd: 0, forItemId: otherOf(items, more, it.id), at });
    else ev(moved, { fromId: owner, toId: buyer, priceUsd: Math.round(price), at });
    owner = buyer; held.add(buyer); hands.push({ who: buyer, at: Date.parse(at) });
  }
  if (!hands.length) hands.push({ who: owner, at: t0 });
  around(ev, rows.length + k, more, pick2, hands.sort((a, b) => a.at - b.at), price, t0, END);
}

doc.sales = [...kept, ...added].sort((a, b) => b.at.localeCompare(a.at));
// Written compact, as the file is kept.
writeFileSync(join(DATA, 'sales.json'), JSON.stringify(doc));

// ── trail.json: the assets' ledger ──
// An asset its record says someone holds ends its story with that holder; one nobody holds is listed and bid on, and
// changes no hands. Either way it has FLOOR events or more.
const assets = read('assets.json'); const ride = read('ride.json'); const jewel = read('jewel.json');
const things = [
  ...assets.eggs.map((x) => ({ kind: 'egg', id: x.id, usd: x.priceUsd, holder: x.ownerId })),
  ...assets.sums.map((x) => ({ kind: 'sum', id: x.id, usd: x.minEgg * assets.eggUsd, holder: null, open: true })),
  ...assets.profiles.map((x) => ({ kind: 'profilePft', id: x.id, usd: x.priceUsd, holder: x.holderId })),
  ...ride.list.map((x) => ({ kind: 'ride', id: x.id, usd: x.priceUsd || x.ticketUsd, holder: x.holderId })),
  ...jewel.list.map((x) => ({ kind: 'jewel', id: x.id, usd: x.priceUsd, holder: x.holderId })),
];
const trail = [];
for (const it of things) {
  const rnd = rndOf('trail:' + it.id); const pick = () => people[Math.floor(rnd() * people.length)];
  const more = rndOf('around:' + it.id); const pick2 = () => people[Math.floor(more() * people.length)];
  let k = 0; const ev = (event, extra) => trail.push({ id: `tr_${it.id}_${k++}`, event, itemKind: it.kind, itemId: it.id, ...extra });
  const base = Math.max(1, it.usd || 20); const span = (120 + rnd() * 280) * day; const step = span / (FLOOR + 1); let t = END - span;
  const now = () => new Date(Math.min(t, END)).toISOString(); const fresh = (held) => { let b = pick(); for (let n = 0; held.has(b) && n < 64; n++) b = pick(); return b; };
  if (!it.holder && !it.open) {
    // Nobody holds it: it is listed, and people bid.
    const lister = pick(); ev('list', { fromId: lister, priceUsd: Math.round(base), at: now() }); const held = new Set([lister]);
    for (let h = 1; h < FLOOR; h++) { t += step * (0.7 + rnd() * 0.6); const b = fresh(held); held.add(b); ev('offer', { fromId: b, priceUsd: Math.round(base * (0.7 + rnd() * 0.28)), at: now() }); }
    around(ev, k, more, pick2, [{ who: lister, at: END - span }], base, END - span, END);
    continue;
  }
  // The hands it passed through, the last of them the holder its record names (a SUM names none).
  const held = new Set(it.holder ? [it.holder] : []); const chain = [];
  for (let h = 0; h < FLOOR - (it.holder ? 1 : 0); h++) { const b = fresh(held); held.add(b); chain.push(b); }
  if (it.holder) chain.push(it.holder);
  let price = base * (0.55 + rnd() * 0.3); let owner = chain[0];
  ev('mint', { toId: owner, priceUsd: 0, at: now() }); const hands = [{ who: owner, at: Math.min(t, END) }];
  for (let h = 1; h < chain.length; h++) {
    t += step * (0.7 + rnd() * 0.6); const last = h === chain.length - 1;
    price = last ? base : Math.max(1, price * (0.95 + rnd() * 0.22));
    if (rnd() < 0.2) ev('offer', { fromId: chain[h], toId: owner, priceUsd: Math.round(price * 0.92), at: new Date(Math.min(t, END) - 6 * 36e5).toISOString() });
    const moved = rnd() < 0.85 ? 'sale' : 'transfer';
    if (moved === 'transfer' && more() < 0.6) ev('swap', { fromId: owner, toId: chain[h], priceUsd: 0, forItemId: otherOf(things, more, it.id), at: now() });
    else ev(moved, { fromId: owner, toId: chain[h], priceUsd: Math.round(price), at: now() });
    owner = chain[h]; hands.push({ who: owner, at: Math.min(t, END) });
  }
  around(ev, k, more, pick2, hands, price, END - span, END);
}
trail.sort((a, b) => b.at.localeCompare(a.at));
writeFileSync(join(DATA, 'trail.json'), JSON.stringify({ sales: trail }));
console.log(`trail: ${things.length} assets · ${trail.length} events`);
console.log(`ledger: ${items.length} items · +${added.length} events · ${doc.sales.length} in all`);
