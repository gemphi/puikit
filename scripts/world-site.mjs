#!/usr/bin/env node
// A world's site from its spec: node scripts/world-site.mjs <key> [<key>...]
//
// app/<key>/site.json holds the whole app as data with placeholders; this fills them and writes
// app/<key>/public/data/<key>.json, the file the one host (app/phi) runs as /<key>/ (or at its own domain).
//   $tokens   every token of the trait sheet (kind `token`, id `<key>-<n>`, picture `token/<id>.webp`), a card each (picture, number, club, traits as `fields`): written to
//             public/data/token.json, which the block names as its `source` (so the app document stays small)
//   $teaser   `teaser` tokens with pictures, spread over the collection
//   $hero     the first teaser's picture
//   $stats    the total, the count of each facet value, the traits and how many have a picture online
//   $facets   the facet row: `all`, then each value of the facet field
//   $traits   the trait names, for the grid's filters
//   $cities   the world's cities (Phiegg's world record) as lore sections
//   {n} {club.x} {world.x} in any string: the total and the fields of Phiegg's club and world records
// The trait sheet is a TSV file or a folder of them (one header, the first file's names); pictures are keys of the
// media store (media/phi-media, phiegg.com/cdn on the server), counted only where the file is there.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = path.join(ROOT, 'media/phi-media');
const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/phiegg/src/data/core.json'), 'utf8'));
const fmt = (n) => n.toLocaleString('en-US');
/** The kind every collection's tokens are, in Phiora and in every path. */
const KIND = 'token';
/** A picture the importer made (media/phi-media/collections/...) at the token's own key, as a hard link: no copy on
 *  disk, and sync.sh sends it like any file. */
const publish = (from, to) => {
  const dest = path.join(MEDIA, to);
  if (!fs.existsSync(dest)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.linkSync(path.join(MEDIA, from), dest); }
  return to;
};

const readSheet = (where) => {
  const at = path.join(ROOT, where);
  const files = fs.statSync(at).isDirectory() ? fs.readdirSync(at).filter((f) => f.endsWith('.tsv')).sort().map((f) => path.join(at, f)) : [at];
  let head;
  const rows = [];
  for (const file of files) {
    const [first, ...lines] = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim());
    head ??= first.split('\t').map((h) => h.trim());
    for (const l of lines) rows.push(Object.fromEntries(l.split('\t').map((v, i) => [head[i], v.trim()])));
  }
  return { head, rows, files: files.map((f) => path.relative(ROOT, f)) };
};

const build = (key) => {
  const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'app', key, 'site.json'), 'utf8'));
  const club = core.clubs.find((c) => c.id === spec.club);
  const world = core.worlds.find((w) => w.clubId === spec.club);
  const { head, rows, files } = readSheet(spec.sheet);
  const name = (h) => spec.field?.[h] ?? h;
  const traits = head.filter((h) => !spec.drop.includes(h)).map(name);
  const t = spec.token;

  const tokens = rows.filter((r) => /^\d+$/.test(r[t.number])).map((r) => {
    const n = String(Number(r[t.number]));
    const fields = head.filter((h) => !spec.drop.includes(h) && r[h]).map((h) => [name(h), r[h]]);
    const fact = (f) => fields.find(([k]) => k === name(f) || k === f)?.[1];
    const rule = spec.picture.by ? spec.picture[r[spec.picture.by]] : spec.picture.all;
    const pic = rule?.replace('{n5}', n.padStart(5, '0'));
    // One name everywhere: the kind is the file (data/<kind>.json), the address (#/<kind>/<id>), Phiora's
    // /tree/item/<kind>/<id> and the picture's key (<kind>/<id>.webp); the id carries the app, so ids stay one of a
    // kind across collections.
    const id = key + '-' + n;
    const item = { kind: KIND, id, route: KIND + '/' + id, collection: key, number: Number(n), title: t.title.replace('{n}', n), sub: fact(t.sub), facet: fact(t.facet), fields };
    if (pic && fs.existsSync(path.join(MEDIA, pic))) item.image = 'cdn:' + publish(pic, KIND + '/' + id + '.webp');
    return item;
  // By number; `token.lead: "picture"` puts the tokens whose picture is online first (until every picture is there).
  }).sort((a, b) => (t.lead === 'picture' ? Number(!a.image) - Number(!b.image) : 0) || a.number - b.number);

  const pictured = tokens.filter((x) => x.image);
  const step = Math.max(1, Math.floor(pictured.length / spec.teaser));
  const teaser = pictured.filter((_, i) => i % step === 0).slice(0, spec.teaser).map(({ fields, ...x }) => x);
  const facetValues = [...new Set(tokens.map((x) => x.facet).filter(Boolean))];
  const count = (v) => tokens.filter((x) => x.facet === v).length;
  // The commonest first: the order a collection's own counts give, with no ladder written by hand.
  facetValues.sort((a, b) => count(b) - count(a));
  const stats = [
    { label: spec.stat.total, value: fmt(tokens.length) },
    ...facetValues.map((v) => ({ label: v, value: fmt(count(v)), sub: ((100 * count(v)) / tokens.length).toFixed(1) + '%' })),
    { label: spec.stat.traits, value: String(traits.length), sub: traits.join(', ') },
    { label: spec.stat.pictured, value: fmt(pictured.length), progress: pictured.length / tokens.length },
  ];
  const fill = {
    $tokens: 'data/token.json', $teaser: teaser, $hero: teaser[0]?.image, $stats: stats, $facets: [spec.all, ...facetValues], $traits: traits,
    $cities: (world?.cities ?? []).map((c) => ({ title: c.name, body: c.vibe + '.' })),
  };
  const words = (s) => s.replace(/\{n\}/g, fmt(tokens.length)).replace(/\{(club|world)\.(\w+)\}/g, (_, o, f) => String((o === 'club' ? club : world)?.[f] ?? ''));
  const walk = (v) => (typeof v === 'string' ? (v in fill ? fill[v] : words(v)) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  const app = walk(spec.app);

  const out = path.join(ROOT, 'app', key, 'public/data', key + '.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tokenFile = path.join(path.dirname(out), 'token.json');
  fs.writeFileSync(out, JSON.stringify(app, null, 1) + '\n');
  fs.writeFileSync(tokenFile, JSON.stringify(tokens) + '\n');
  console.log(`${key}: ${fmt(tokens.length)} tokens from ${files.join(', ')}; ${fmt(pictured.length)} with pictures; facets ${facetValues.map((v) => v + ' ' + count(v)).join(', ')}; app ${(fs.statSync(out).size / 1e3).toFixed(0)} KB, tokens ${(fs.statSync(tokenFile).size / 1e6).toFixed(2)} MB`);
};

const keys = process.argv.slice(2);
if (!keys.length) { console.error('usage: node scripts/world-site.mjs <key> [<key>...]'); process.exit(1); }
keys.forEach(build);
