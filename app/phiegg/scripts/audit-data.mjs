#!/usr/bin/env node
// What the data is missing, kind by kind, read from the data map itself (src/data/tree.json), so a new kind is
// audited the day it is added:
//   - short lists: kinds with fewer than MIN records, and parents whose list of children (pieces of a club, looks of a
//     store) holds fewer than MIN;
//   - missing relations: a link field (…Id, …Ids) most records of a kind carry, empty on some of them;
//   - missing images: a picture field (image, avatar, cover, render, …) empty on some records, or naming a file that
//     is not in public/.
//   node scripts/audit-data.mjs [--min 8] [--json out.json] [--kind club]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src', 'data'), PUBLIC = join(ROOT, 'public');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MIN = Number(arg('--min', 8)), OUT = arg('--json'), ONLY = arg('--kind');

const files = {};
const file = (f) => (files[f] ??= existsSync(join(DATA, f + '.json')) ? JSON.parse(readFileSync(join(DATA, f + '.json'), 'utf8')) : null);
const tree = JSON.parse(readFileSync(join(DATA, 'tree.json'), 'utf8'));

// Every record of every kind, as the seed reads them.
const kinds = {};
for (const s of tree.sources) {
  if (s.map) continue;                                   // specs, not records
  const doc = file(s.file); if (!doc) continue;
  let rows = s.one ? [doc[s.one]] : doc[s.list] ?? [];
  if (s.each) rows = rows.flatMap((p) => (p[s.each] ?? []).map((r) => ({ ...r, [s.parent]: r[s.parent] ?? p.id })));
  (kinds[s.kind] ??= []).push(...rows.filter(Boolean));
}

const LINK = /(Id|Ids)$/;
const PICTURE = /^(image|images|img|avatar|cover|photo|portrait|render|renders|thumb|thumbnail|src|icon|logo|picture|views|mid)$/i;
const SKIP = new Set(['tokenId', 'campaignId', 'trackId', 'questId', 'conversationId', 'itemId', 'itemIds']);
const empty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
const paths = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(paths) : v && typeof v === 'object' ? Object.values(v).flatMap(paths) : []);
const local = (p) => /^\/?[\w-]+\/.+\.(png|jpe?g|webp|svg|gif|avif)$/i.test(p) && !/^https?:/.test(p);

const report = { min: MIN, short: [], thinParents: [], relations: [], images: [] };
for (const [kind, rows] of Object.entries(kinds)) {
  if (ONLY && kind !== ONLY) continue;
  if (rows.length < MIN) report.short.push({ kind, have: rows.length, need: MIN - rows.length });
  // Fields that some records carry: a field most of the kind has is expected on all of it.
  const seen = {};
  for (const r of rows) for (const [f, v] of Object.entries(r)) if (!empty(v)) seen[f] = (seen[f] ?? 0) + 1;
  for (const [f, n] of Object.entries(seen)) {
    const missing = rows.filter((r) => empty(r[f]));
    if (!missing.length || n < rows.length / 2) continue;
    if (LINK.test(f) && !SKIP.has(f)) report.relations.push({ kind, field: f, missing: missing.length, of: rows.length, ids: missing.slice(0, 8).map((r) => r.id) });
    if (PICTURE.test(f)) report.images.push({ kind, field: f, missing: missing.length, of: rows.length, ids: missing.slice(0, 8).map((r) => r.id) });
  }
  // Pictures that name a file public/ does not have (the app reads "assets/x" as public/x too: lib/data worldImage).
  const there = (p) => { const q = p.replace(/^\//, ''); return existsSync(join(PUBLIC, q)) || existsSync(join(PUBLIC, q.replace(/^assets\//, ''))); };
  const lost = {};
  for (const r of rows) for (const [f, v] of Object.entries(r)) {
    if (!PICTURE.test(f)) continue;
    const all = paths(v).filter(local), gone = all.filter((p) => !there(p));
    if (!all.length) continue;
    const x = (lost[f] ??= { kind, field: f, missing: 0, of: 0, ids: [], files: [] });
    x.of += 1; if (gone.length) { x.missing += 1; if (x.ids.length < 8) x.ids.push(r.id); if (x.files.length < 4) x.files.push(gone[0]); }
  }
  for (const x of Object.values(lost)) if (x.missing) report.images.push({ ...x, field: x.field + ' (file)' });
}
// Lists a page shows under a parent: children per parent through the child's link to it (pieces per club).
const owners = new Map(Object.entries(kinds).flatMap(([k, rows]) => rows.map((r) => [r.id, k])));
for (const [kind, rows] of Object.entries(kinds)) for (const f of ['clubId', 'worldId', 'storeId', 'hostId', 'seriesId', 'poolId', 'showId']) {
  const by = new Map();
  for (const r of rows) if (typeof r[f] === 'string') by.set(r[f], (by.get(r[f]) ?? 0) + 1);
  // A link most parents have once (a club's one host) is not a list: only one-to-many links are.
  if (by.size < 2 || rows.filter((r) => typeof r[f] === 'string').length / by.size < 1.5) continue;
  const thin = [...by].filter(([, n]) => n < MIN);
  if (thin.length) report.thinParents.push({ kind, by: f, parent: owners.get(thin[0][0]) ?? f.replace(/Id$/, ''), thin: thin.length, of: by.size, fewest: Math.min(...thin.map(([, n]) => n)), ids: thin.slice(0, 6).map(([id, n]) => `${id}:${n}`) });
}

const line = (cols) => console.log(cols.map((c, i) => String(c).padEnd([18, 14, 10, 10][i] ?? 0)).join(''));
console.log(`\nShort lists (fewer than ${MIN} records)`); line(['kind', 'have', 'need']);
report.short.sort((a, b) => a.have - b.have).forEach((x) => line([x.kind, x.have, x.need]));
console.log(`\nParents with fewer than ${MIN} children`); line(['children', 'by', 'thin', 'of']);
report.thinParents.forEach((x) => line([x.kind, x.by, x.thin, x.of + `  fewest ${x.fewest}  e.g. ${x.ids.slice(0, 3).join(' ')}`]));
console.log('\nMissing relations'); line(['kind', 'field', 'missing', 'of']);
report.relations.forEach((x) => line([x.kind, x.field, x.missing, x.of]));
console.log('\nMissing images'); line(['kind', 'field', 'missing', 'of']);
report.images.forEach((x) => line([x.kind, x.field, x.missing, x.of + (x.files ? '  ' + x.files.join(' ') : '')]));
if (OUT) { writeFileSync(OUT, JSON.stringify(report, null, 1) + '\n'); console.log('\nwritten', OUT); }
