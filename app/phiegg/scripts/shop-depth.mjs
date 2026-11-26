#!/usr/bin/env node
// Every store holds at least FLOOR looks, so the Looks relation of a shop (look.storeId) is as full as the web's
// other lists. It only adds: the looks already in stores.json stay as they are, and a rerun adds nothing. A look
// is written the way deepen-data.mjs writes a store's looks (id `g_<club>_lk<pool><n>`, no views: its picture is
// drawn from its colour), its colour, name ending, tone and garments taken from the looks already there, and its
// numbers from a run seeded by the store and the look, so the file is the same on every run.
// The looks it adds are marked `depth`, so the ledger leaves the people it draws from as they were and the stories
// already written do not move. On a first run, `npm run data` goes on to items.mjs (specs, render and first ledger)
// and the ledger. On data that already has its ledger, run `npm run data:shop` (this, then the ledger): items.mjs
// must not be run again on a ledger, it drops the first ledgers (`ia_`) of looks that already have the ledger's events.
//
//   node scripts/shop-depth.mjs [--floor 16]        (npm run data:shop)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const arg = (name, fallback) => { const at = process.argv.indexOf(name); return at > 0 ? process.argv[at + 1] : fallback; };
const FLOOR = Number(arg('--floor', 16));
// A look's variants are the other looks of its pool, so a pool of POOL looks gives each of them POOL - 1 variants.
const POOL = Number(arg('--pool', 9));
const path = join(DATA, 'stores.json');
const text = readFileSync(path, 'utf8');
const doc = JSON.parse(text);
// The flagship store (ls.json) is a store like the others, with its own pools.
const lsPath = join(DATA, 'ls.json');
const lsText = readFileSync(lsPath, 'utf8');
const lsDoc = JSON.parse(lsText);
const flagship = { id: lsDoc.store.id, clubId: lsDoc.store.clubId, looks: lsDoc.looks, pools: lsDoc.pools, flagship: true };
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) || 1;
const rngOf = (seed) => { let x = (hash(String(seed)) % 2147483646) + 1; return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const some = (r, a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(r() * c.length), 1)[0]); return o; };
const RARITY = [['Common', 250, 6000, 14000], ['Rare', 100, 15000, 40000], ['Epic', 25, 45000, 90000], ['Legendary', 5, 120000, 260000]];
const all = doc.stores.flatMap((s) => s.looks);
// What the looks already say a look is made of.
// Only colours a render exists for: a look in a colour nothing was rendered in has no picture.
const colours = [...new Map(all.filter((l) => l.colour && l.hex && l.views?.FRONT).map((l) => [l.colour + l.hex, [l.colour, l.hex]])).values()];
const endings = [...new Set(all.map((l) => String(l.name).split(' ').slice(1).join(' ')).filter(Boolean))];
const tones = [...new Set(all.map((l) => l.tone).filter(Boolean))];
const garments = [...new Set(all.flatMap((l) => l.garments || []))];
const used = new Set(all.map((l) => l.id));
lsDoc.looks.forEach((l) => used.add(l.id));
let added = 0; const touched = new Set();
/** One more look in a store, in the pool at `pi` (the look the store would have next, by its own seeded run). */
const addLook = (store, pi) => {
  const pool = store.pools[pi]; const n = store.looks.length;
  const r = rngOf(`depth:${store.id}:${n}`);
  const [rar, edition, lo, hi] = RARITY[Math.min(3, Math.floor(r() * r() * 4.2))]; const [colour, hex] = pick(r, colours);
  const usd = Math.round((lo + r() * (hi - lo)) / 50) * 50; const minted = int(r, Math.floor(edition / 5), edition);
  const stem = store.flagship ? `ls_${pool?.id ?? 'x'}_` : `g_${store.clubId}_lk${pi + 1}`;
  let id = `${stem}${n + 1}`; for (let c = 2; used.has(id); c++) id = `${stem}${n + 1}_${c}`;
  used.add(id);
  const look = {
    id, n: String(n + 1).padStart(2, '0'), ...(pool ? { poolId: pool.id } : {}), storeId: store.id, depth: true, name: colour + ' ' + pick(r, endings), colour, hex, tone: pick(r, tones),
    garments: some(r, garments, int(r, 3, 4)), rarity: rar, edition, minted, owners: Math.max(1, minted - int(r, 0, 4)), usd,
    floor: Math.round((usd * (0.85 + r() * 0.1)) / 50) * 50, change7d: Math.round((r() * 30 - 10) * 10) / 10, views: {},
  };
  store.looks.push(look); pool?.lookIds?.push(id); added++; touched.add(store.id);
};
for (const store of [flagship, ...doc.stores]) {
  const pools = store.pools ?? [];
  // Each pool first, so every look has the variants the pool gives it ...
  pools.forEach((pool, pi) => { while ((pool.lookIds?.length ?? 0) < POOL) addLook(store, pi); });
  // ... then the store as a whole.
  for (let k = 0; store.looks.length < FLOOR; k++) addLook(store, pools.length ? k % pools.length : 0);
}
// Written in the layout each file has: compact, or two-space.
const write = (file, original, value) => writeFileSync(file, JSON.stringify(value, null, /\n\s+"/.test(original.slice(0, 400)) ? 2 : undefined) + (original.endsWith('\n') ? '\n' : ''));
write(path, text, doc); write(lsPath, lsText, lsDoc);
console.log(`shop depth: ${touched.size} stores got looks (pools of ${POOL}, stores of ${FLOOR}) · +${added} looks · ${doc.stores.reduce((n, s) => n + s.looks.length, lsDoc.looks.length)} looks in all`);