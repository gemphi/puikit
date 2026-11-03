#!/usr/bin/env node
// Collections: nests are the collections, and a collection breaks into clubs (one mark, many clubs — the Gilt
// collection holds Gilt Cranes, Gilt Foxes and Gilt Owls). This authors them from the club families already in the
// data (clubs sharing the first word of their name; a lone club is a collection of one), writes each club's
// `nestId` and every PFT's `nestId` (via its club), and registers the new rows with the manifest and the checker.
// Relations are props only: membership is the nestId prop, read both ways by the relations index. Run it again
// safely; it rewrites the same facts. `node scripts/collections.mjs`
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const write = (f, v) => writeFileSync(join(DATA, f), JSON.stringify(v, null, 1));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const core = read('core.json');

// One collection per family: the clubs that share the first word of their name.
const families = new Map();
for (const c of core.clubs) { const mark = c.name.split(' ')[0]; if (!families.has(mark)) families.set(mark, []); families.get(mark).push(c); }
const collections = [...families.entries()].map(([mark, clubs]) => ({
  id: 'n_col_' + slug(mark),
  name: mark,
  kind: 'collection',
  parentId: null,
  topic: clubs.length > 1 ? `One mark, ${clubs.length} clubs: ${clubs.map((c) => c.name).join(', ')}` : `The ${clubs[0].name} collection`,
  // the family's home world: the one its clubs name most
  worldId: (() => { const n = new Map(); for (const c of clubs) for (const w of c.worldIds ?? []) n.set(w, (n.get(w) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null; })(),
}));
write('collections.json', { about: 'Collection nests: the families clubs break out of. Authored by scripts/collections.mjs from club name marks.', collections });

// Every club names its collection.
const colOf = new Map(); for (const [mark, clubs] of families) for (const c of clubs) colOf.set(c.id, 'n_col_' + slug(mark));
for (const c of core.clubs) c.nestId = colOf.get(c.id);
write('core.json', core);

// Every PFT names its collection through its club.
const byClub = (row) => (row.clubId && colOf.get(row.clubId)) || undefined;
const stamp = (rows) => { let n = 0; for (const r of rows ?? []) { const v = byClub(r); if (v) { r.nestId = v; n++; } } return n; };
let n = 0;
const stores = read('stores.json'); for (const s of stores.stores) { const v = colOf.get(s.clubId); if (v) for (const l of s.looks ?? []) { l.nestId = v; n++; } } write('stores.json', stores);
const ls = read('ls.json'); { const v = colOf.get(ls.store.clubId ?? 'c_opal'); if (v) for (const l of ls.looks ?? []) { l.nestId = v; n++; } } write('ls.json', ls);
const assets = read('assets.json'); n += stamp(assets.eggs) + stamp(assets.sums) + stamp(assets.profiles); write('assets.json', assets);
const club = read('club.json'); n += stamp(club.pieces); write('club.json', club);
const ride = read('ride.json'); n += stamp(ride.list); write('ride.json', ride);
const jewel = read('jewel.json'); n += stamp(jewel.list); write('jewel.json', jewel);

// The manifest serves the new rows as nests; the kind list labels them.
const tree = read('tree.json');
if (!tree.sources.some((e) => e.file === 'collections')) tree.sources.push({ kind: 'nest', file: 'collections', list: 'collections' });
write('tree.json', tree);
const hosts = read('hosts.json');
if (!hosts.nestKinds.some((k) => k.kind === 'collection')) hosts.nestKinds.push({ kind: 'collection', label: 'Collection', hint: 'A family of clubs cut from one mark' });
write('hosts.json', hosts);

console.log(`${collections.length} collections (${[...families.values()].filter((v) => v.length > 1).length} families of 2+, largest ${Math.max(...[...families.values()].map((v) => v.length))}), ${core.clubs.length} clubs linked, ${n} PFTs linked`);
