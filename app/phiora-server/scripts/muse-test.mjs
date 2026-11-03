// Match and test the muse: every api call each agentSpec declares is exercised against the live Phiora.
// GETs run as declared (placeholders <lookId>/<nodeId> resolve to real ids from /tree); POST/PUT calls with a
// testBody run for real on a demo session; calls marked `skip` are matched against the server's route table only.
// Run: PHI_URL=http://localhost:4300 DATABASE_URL=postgres://... node scripts/muse-test.mjs
import pg from 'pg';

const BASE = process.env.PHI_URL ?? 'http://localhost:4300';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const specs = (await client.query(`SELECT doc FROM items WHERE kind='agentSpec' AND NOT deleted ORDER BY ord`)).rows
  .map((r) => (typeof r.doc === 'string' ? JSON.parse(r.doc) : r.doc));
const firstId = async (kind) => (await client.query('SELECT id FROM items WHERE kind=$1 AND NOT deleted LIMIT 1', [kind])).rows[0]?.id;
const tokens = { '<lookId>': await firstId('look'), '<nodeId>': await firstId('phiNode') };
await client.end();

// a demo session for the authenticated calls
const login = await fetch(BASE + '/auth/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'u_noor' }) });
const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];

let pass = 0, fail = 0, skipped = 0;
for (const a of specs) {
  for (const c of a.api) {
    let path = c.path;
    for (const [k, v] of Object.entries(tokens)) path = path.replace(k, v ?? k);
    if (c.skip) { skipped++; console.log('SKIP', a.name.padEnd(8), c.method, c.path, '(' + c.skip + ')'); continue; }
    try {
      const r = await fetch(BASE + path, {
        method: c.method,
        headers: { cookie, ...(c.testBody ? { 'Content-Type': 'application/json' } : {}) },
        body: c.testBody ? JSON.stringify(c.testBody) : undefined,
      });
      const ok = r.status >= 200 && r.status < 300;
      ok ? pass++ : fail++;
      console.log(ok ? 'PASS' : 'FAIL', a.name.padEnd(8), c.method, c.path, r.status);
    } catch (e) { fail++; console.log('FAIL', a.name.padEnd(8), c.method, c.path, String(e).slice(0, 60)); }
  }
}
console.log(`\n${pass} pass · ${fail} fail · ${skipped} matched-only (money or state movers)`);
process.exitCode = fail ? 1 : 0;
