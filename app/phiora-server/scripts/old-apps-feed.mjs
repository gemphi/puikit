// Feed the one database with the old apps' kinds and data (bundle from old-apps-extract.mjs).
// Every record gets the house rules: md5 id (md5 of `kind:srcId`), slug = the full name with underscores,
// origin 'oldapps'. The declared kinds themselves land as records of kind `kindSpec` (fields with their
// controls: form, values, filterable, searchable), so new surfaces can render controls from the database.
// Direct SQL on purpose: a bulk feed must not flood the item_changes log the apps' live overlay reads.
// Run: DATABASE_URL=postgres://... node scripts/old-apps-feed.mjs <bundle.json>   (idempotent: re-runs update in place)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { dress } from './fictional.mjs';

const [bundlePath] = process.argv.slice(2);
const md5 = (s) => createHash('md5').update(String(s)).digest('hex');
const slugify = (name) => String(name).trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const nameOf = (d) => [d.slug, d.name, d.title, d.label, d.displayName, d.handle, d.username].find((x) => typeof x === 'string' && x.trim());

const { specs, records } = JSON.parse(readFileSync(bundlePath, 'utf8'));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let ord = Number((await client.query('SELECT COALESCE(MAX(ord), -1) + 1 AS n FROM items')).rows[0].n);
const now = Date.now();
let fed = 0;
const put = async (kind, srcId, raw) => {
  const doc = dress(kind, { ...raw, srcId: String(srcId) }); // placeholder sample text becomes fictional Phiace content
  const id = md5(kind + ':' + srcId);
  const named = nameOf(doc);
  const slug = named ? slugify(named) : kind.toLowerCase() + '_' + id.slice(0, 8);
  const full = { ...doc, id, srcId: String(srcId), slug };
  await client.query(
    `INSERT INTO items (kind, id, slug, ord, doc, origin, edited, deleted, owner, updated_at, updated_by)
     VALUES ($1,$2,$3,$4,$5,'oldapps',FALSE,FALSE,NULL,$6,'oldapps')
     ON CONFLICT (kind, id) DO UPDATE SET doc=$5, slug=$3, updated_at=$6`,
    [kind, id, slug, ord++, JSON.stringify(full), now]);
  fed++;
};

// 1) the kinds themselves, as records
for (const s of specs) await put('kindSpec', s.id, { name: s.name, app: s.app, entity: s.entity, module: s.module, label: s.label, icon: s.icon, accent: s.accent, inferred: s.inferred ?? false, fields: s.fields });
// 2) the full data
for (const [kind, rows] of Object.entries(records)) {
  let i = 0;
  for (const r of rows) await put(kind, r.id ?? 'row' + i++, r);
  console.log(kind, rows.length);
}

// refresh item_meta: keep the existing kind order, append the new kinds, recount everything
const counts = (await client.query('SELECT kind, COUNT(*) AS n FROM items WHERE NOT deleted GROUP BY kind')).rows;
const cur = (await client.query('SELECT kinds, stamp, loaded_at FROM item_meta')).rows[0];
const order = JSON.parse(cur?.kinds ?? '[]').map((k) => k.kind);
for (const r of counts) if (!order.includes(r.kind)) order.push(r.kind);
const m = new Map(order.map((k) => [k, 0])); for (const r of counts) m.set(r.kind, Number(r.n));
const kinds = [...m.entries()].map(([kind, count]) => ({ kind, count }));
await client.query('UPDATE item_meta SET kinds=$1, items=$2', [JSON.stringify(kinds), kinds.reduce((a, k) => a + k.count, 0)]);
console.log('fed', fed, 'records ·', Object.keys(records).length, 'data kinds ·', specs.length, 'kind specs');
await client.end();
