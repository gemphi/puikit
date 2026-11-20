#!/usr/bin/env node
// Every item's ledger is long enough to fill its page: at least FLOOR holders, so the Trail and Owner tabs each
// carry FLOOR rows or more. It only adds: the events already in sales.json stay as they are, and the ones this step
// wrote before (ids starting `lg_`) are taken out and written again, so a rerun gives the same file.
// It touches sales.json alone. Run `npm run data:ids` after it (the `data:ledger` script does).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const FLOOR = 8;                                  // holders an item has at least
const END = Date.parse('2026-11-20T00:00:00Z');   // nothing is written after this day
const day = 864e5;

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// A seeded run of numbers in [0, 1) for one item, so its story is the same on every run.
const rndOf = (seed) => { let x = hash(seed) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };

const doc = read('sales.json'); const ls = read('ls.json'); const stores = read('stores.json');
const kept = doc.sales.filter((x) => !String(x.id).startsWith('lg_'));
const people = [...new Set(kept.flatMap((x) => [x.fromId, x.toId]).filter(Boolean))].sort();

const byItem = new Map();
for (const x of kept) { if (!byItem.has(x.itemId)) byItem.set(x.itemId, []); byItem.get(x.itemId).push(x); }
const looks = [...ls.looks, ...stores.stores.flatMap((s) => s.looks)];
const items = [
  ...looks.map((l) => ({ kind: 'look', id: l.id, usd: l.usd ?? l.floor ?? 120, by: l.specs?.provenance?.designerId, minted: l.mintDate })),
  ...[...byItem.entries()].filter(([, rows]) => rows[0].itemKind === 'piece').map(([id]) => ({ kind: 'piece', id, usd: 0 })),
];

const added = [];
for (const it of items) {
  const rows = (byItem.get(it.id) ?? []).slice().sort((a, b) => a.at.localeCompare(b.at));
  const rnd = rndOf(it.id); const pick = () => people[Math.floor(rnd() * people.length)];
  let k = 0; const ev = (event, extra) => added.push({ id: `lg_${it.id}_${k++}`, event, itemKind: it.kind, itemId: it.id, ...extra });
  const held = new Set(rows.map((x) => x.toId).filter(Boolean));
  let owner = [...rows].reverse().find((x) => x.toId && x.event !== 'offer')?.toId;
  let price = [...rows].reverse().find((x) => x.priceUsd)?.priceUsd || it.usd || 120;
  let t = rows.length ? Date.parse(rows[rows.length - 1].at) : Math.min(END - 60 * day, Date.parse(it.minted ?? '2026-08-01'));
  if (!owner) { owner = it.by ?? pick(); ev('mint', { toId: owner, priceUsd: 0, at: new Date(t).toISOString() }); held.add(owner); }
  const hops = Math.max(0, FLOOR - held.size);
  // The time left is shared between the hops; an item whose ledger already reaches the last day moves by the hour.
  const step = hops ? Math.max(36e5, (END - t) / (hops + 1)) : 0;
  for (let h = 0; h < hops; h++) {
    t += step * (0.7 + rnd() * 0.6);
    price = Math.max(10, price * (0.9 + rnd() * 0.25));
    let buyer = pick(); for (let n = 0; held.has(buyer) && n < 64; n++) buyer = pick();
    const at = new Date(Math.min(t, END + h * 36e5)).toISOString();
    if (rnd() < 0.2) ev('offer', { fromId: buyer, toId: owner, priceUsd: Math.round(price * 0.92), at: new Date(Date.parse(at) - 6 * 36e5).toISOString() });
    ev(rnd() < 0.85 ? 'sale' : 'transfer', { fromId: owner, toId: buyer, priceUsd: Math.round(price), at });
    owner = buyer; held.add(buyer);
  }
}

doc.sales = [...kept, ...added].sort((a, b) => b.at.localeCompare(a.at));
// Written compact, as the file is kept.
writeFileSync(join(DATA, 'sales.json'), JSON.stringify(doc));
console.log(`ledger: ${items.length} items · +${added.length} events · ${doc.sales.length} in all`);
