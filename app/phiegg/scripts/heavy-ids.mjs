#!/usr/bin/env node
// The heavy record files (stores, shows, sales) load on demand, so the app cannot read their ids at boot — but the
// light files reference them (a cast's lookIds, a lot's items). This writes src/data/heavyIds.json: original id →
// database id (md5 of kind:id, the seed's rule) for every record in those files, tiny enough to stay in the bundle.
// Rerun it whenever those files change (scripts/collections.mjs and the generators leave it valid; `npm run data:ids`).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f + '.json'), 'utf8'));
const md5 = (s) => createHash('md5').update(s).digest('hex');
const HEAVY = new Set(['stores', 'shows', 'sales']);

const manifest = read('tree');
const map = {};
for (const e of manifest.sources) {
  if (!HEAVY.has(e.file)) continue;
  const f = read(e.file);
  let rows = e.one ? [f[e.one]].filter(Boolean) : Array.isArray(f[e.list]) ? f[e.list] : [];
  if (e.each) rows = rows.flatMap((r) => r?.[e.each] ?? []);
  for (const r of rows) if (r && typeof r.id === 'string' && r.id && !map[r.id]) map[r.id] = md5(e.kind + ':' + r.id);
}
writeFileSync(join(DATA, 'heavyIds.json'), JSON.stringify(map));
console.log(Object.keys(map).length + ' heavy ids mapped');
