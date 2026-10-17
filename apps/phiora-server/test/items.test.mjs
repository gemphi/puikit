import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhiora } from '../src/server.mjs';

const ORIGIN = 'http://localhost:3101';
let root, base, phiora;
before(async () => {
  root = mkdtempSync(join(tmpdir(), 'phiora-items-'));
  const shop = join(root, 'shop'); mkdirSync(shop);
  writeFileSync(join(shop, 'ls.json'), JSON.stringify({ looks: [{ id: 'lk1', name: 'Indigo Tier', usd: 1000, floor: 900, specs: { provenance: { designerId: 'u_noor' } } }] }));
  writeFileSync(join(shop, 'stores.json'), JSON.stringify({ stores: [{ looks: [{ id: 'lk2', name: 'Rose', usd: 600, floor: 500, specs: { provenance: { designerId: 'u_kai' } } }] }] }));
  writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale', handle: 'noor.hale' }, { id: 'u_kai', name: 'Kai M', handle: 'kai.m' }] }));
  phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_STORE: 'json' }, dataDir: join(root, 'data'), shopDataDir: shop, appsDir: root });
  await new Promise((ok) => phiora.server.listen(0, ok)); base = 'http://localhost:' + phiora.server.address().port;
});
after(() => { phiora.server.close(); rmSync(root, { recursive: true, force: true }); });

const client = () => {
  let cookie = '';
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    const text = await r.text(); return { status: r.status, body: text ? JSON.parse(text) : undefined };
  };
  return { get: (p) => call('GET', p), put: (p, b) => call('PUT', p, b), post: (p, b) => call('POST', p, b) };
};

test('activity is recorded per user, newest first, and is server-owned', async () => {
  const a = client(); const b = client();
  const now = Date.now();
  const r = await a.post('/activity', { events: [{ kind: 'view', ref: 'lk1', at: now - 1000 }, { kind: 'cart.add', ref: 'lk1', at: now, usd: 1000 }] });
  assert.equal(r.status, 200); assert.equal(r.body.total, 2);
  const mine = (await a.get('/activity?ref=lk1')).body.events;
  assert.deepEqual(mine.map((e) => e.kind), ['cart.add', 'view']);
  assert.equal((await b.get('/activity')).body.events.length, 0);
  assert.equal((await a.get('/state/activity')).body.events.length, 2);
  assert.equal((await a.put('/state/activity', { events: [] })).status, 403);
});

test('activity refuses unknown kinds and oversized batches', async () => {
  const a = client();
  assert.equal((await a.post('/activity', { events: [{ kind: 'hack', ref: 'lk1' }] })).body.error, 'bad_kind');
  assert.equal((await a.post('/activity', { events: Array.from({ length: 101 }, () => ({ kind: 'view', ref: 'lk1' })) })).body.error, 'bad_events');
  const far = await a.post('/activity', { events: [{ kind: 'view', ref: 'lk1', at: Date.now() + 864e5 }] }); assert.equal(far.status, 200);
  const e = (await a.get('/activity')).body.events[0]; assert.ok(e.at <= Date.now());
});

test('only the designer sets thematic kinds; anyone reads them', async () => {
  const guest = client();
  assert.equal((await guest.put('/items/lk1/theme', { kinds: ['Romantic'] })).status, 401);
  const kai = client(); await kai.post('/auth/demo', { userId: 'u_kai' });
  assert.equal((await kai.put('/items/lk1/theme', { kinds: ['Romantic'] })).body.error, 'not_designer');
  const noor = client(); await noor.post('/auth/demo', { userId: 'u_noor' });
  const ok = await noor.put('/items/lk1/theme', { kinds: ['Romantic', 'Ballet', 'Romantic'], mood: 'Moonlit' });
  assert.equal(ok.status, 200); assert.deepEqual(ok.body.kinds, ['Romantic', 'Ballet']); assert.equal(ok.body.by, 'u_noor');
  const worn = await noor.put('/items/lk1/theme', { kinds: ['Romantic'], colours: ['#C2185B', 'red', '#00e5ff', '#111111', '#222222'] });
  assert.deepEqual(worn.body.colours, ['#c2185b', '#00e5ff', '#111111']);
  await noor.put('/items/lk1/theme', { kinds: ['Romantic', 'Ballet'], mood: 'Moonlit' });
  assert.equal((await noor.put('/items/lk1/theme', { kinds: ['<script>'] })).body.error, 'bad_kinds');
  assert.equal((await noor.put('/items/nope/theme', { kinds: ['A'] })).status, 404);
  const all = (await client().get('/items/themes')).body; assert.deepEqual(all.lk1.kinds, ['Romantic', 'Ballet']); assert.equal(all.lk1.mood, 'Moonlit');
});
