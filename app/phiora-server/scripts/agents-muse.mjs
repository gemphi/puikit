// The Phipal muse: feed every agent's full description (spec, tasks, api calls) into the one database as
// kind `agentSpec`, from app/phipal/public/data/agents.json. md5 ids, slugs, origin 'oldapps' rules apply.
// Direct SQL, no change-log rows, idempotent. Run: DATABASE_URL=postgres://... node scripts/agents-muse.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] ?? resolve(here, '..', '..', 'phipal', 'public', 'data', 'agents.json');
const md5 = (s) => createHash('md5').update(String(s)).digest('hex');
const slugify = (n) => String(n).trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const { agents } = JSON.parse(readFileSync(src, 'utf8'));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
let ord = Number((await client.query('SELECT COALESCE(MAX(ord), -1) + 1 AS n FROM items')).rows[0].n);
const now = Date.now();
for (const a of agents) {
  const id = md5('agentSpec:' + a.name);
  const doc = { ...a, id, srcId: a.name, slug: slugify(a.label) };
  await client.query(
    `INSERT INTO items (kind, id, slug, ord, doc, origin, edited, deleted, owner, updated_at, updated_by)
     VALUES ('agentSpec',$1,$2,$3,$4,'oldapps',FALSE,FALSE,NULL,$5,'muse')
     ON CONFLICT (kind, id) DO UPDATE SET doc=$4, slug=$2, updated_at=$5`, [id, doc.slug, ord++, JSON.stringify(doc), now]);
  console.log('agentSpec', a.name, a.tasks.length + ' tasks', a.api.length + ' calls');
}
const counts = (await client.query('SELECT kind, COUNT(*) AS n FROM items WHERE NOT deleted GROUP BY kind')).rows;
const cur = (await client.query('SELECT kinds FROM item_meta')).rows[0];
const order = JSON.parse(cur?.kinds ?? '[]').map((k) => k.kind);
for (const r of counts) if (!order.includes(r.kind)) order.push(r.kind);
const m = new Map(order.map((k) => [k, 0])); for (const r of counts) m.set(r.kind, Number(r.n));
const kinds = [...m.entries()].map(([kind, count]) => ({ kind, count }));
await client.query('UPDATE item_meta SET kinds=$1, items=$2', [JSON.stringify(kinds), kinds.reduce((x, k) => x + k.count, 0)]);
console.log('done');
await client.end();
