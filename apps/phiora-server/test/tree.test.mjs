import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhiora } from '../src/server.mjs';
import { enrichSources, md5, normalizeSources, rowsOf, seedItems, slugify } from '../src/tree.mjs';
import { createStore } from '../src/store.mjs';

const ORIGIN = 'http://localhost:3101';
let root, base, phiora, items;
before(async () => {
  root = mkdtempSync(join(tmpdir(), 'phiora-tree-'));
  const shop = join(root, 'shop'); mkdirSync(shop);
  writeFileSync(join(shop, 'ls.json'), JSON.stringify({ looks: [{ id: 'lk1', name: 'Indigo Tier', usd: 1000, floor: 900, specs: { provenance: { designerId: 'u_noor' } } }] }));
  writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale', handle: 'noor.hale' }] }));
  items = join(root, 'items'); mkdirSync(items);
  writeFileSync(join(items, 'tree.json'), JSON.stringify({ sources: [
    { kind: 'person', file: 'core', list: 'users' }, { kind: 'world', file: 'core', list: 'worlds' },
    { kind: 'city', file: 'core', list: 'worlds', each: 'cities', parent: 'worldId' }, { kind: 'store', file: 'ls', one: 'store' }, { kind: 'look', file: 'ls', list: 'looks' },
  ] }));
  writeFileSync(join(items, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale' }], worlds: [{ id: 'w1', name: 'Opalia', cities: [{ id: 'c1', name: 'Pearl Quay' }] }] }));
  writeFileSync(join(items, 'ls.json'), JSON.stringify({ store: { id: 's_ls', name: 'LS' }, looks: [{ id: 'lk1', name: 'Indigo Tier', storeId: 's_ls' }] }));
  phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_STORE: 'json', PHI_DESIGNERS: '' }, dataDir: join(root, 'data'), shopDataDir: shop, appsDir: root, itemsDir: items });
  await new Promise((ok) => phiora.server.listen(0, ok)); base = 'http://localhost:' + phiora.server.address().port;
});
after(() => { phiora.server.close(); rmSync(root, { recursive: true, force: true }); });

const call = async (method, path, body, cookie = '') => {
  const r = await fetch(base + path, { method, headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text(); return { status: r.status, cookie: (r.headers.get('set-cookie') || '').split(';')[0], body: text ? JSON.parse(text) : undefined };
};

test('rows come from the manifest: lists, nested lists with their parent, single objects, omitted fields', () => {
  const files = { core: { worlds: [{ id: 'w1', cities: [{ id: 'c1' }, { id: 'c2' }] }] }, ls: { store: { id: 's' } } };
  assert.deepEqual(rowsOf({ file: 'core', list: 'worlds', each: 'cities', parent: 'worldId' }, files), [{ id: 'c1', worldId: 'w1' }, { id: 'c2', worldId: 'w1' }]);
  assert.deepEqual(rowsOf({ file: 'ls', one: 'store' }, files), [{ id: 's' }]);
  assert.deepEqual(rowsOf({ file: 'missing', list: 'x' }, files), []);
  assert.deepEqual(rowsOf({ file: 'core', list: 'worlds', omit: ['cities'] }, files), [{ id: 'w1' }]);
});

test('normalize: md5 ids, slugs from the full name, every reference follows (deeply)', () => {
  const { sources, idmap } = normalizeSources([
    { kind: 'person', rows: [{ id: 'u1', name: 'Noor Hale' }] },
    { kind: 'club', rows: [{ id: 'c1', name: 'Maison Opal!', founderId: 'u1', members: [{ userId: 'u1', role: 'Founder' }], tags: ['u1'] }] },
  ]);
  assert.equal(idmap.u1, md5('person:u1'));
  const club = sources[1].rows[0];
  assert.equal(club.id, md5('club:c1'));
  assert.equal(club.slug, 'maison_opal');
  assert.equal(club.founderId, idmap.u1);
  assert.equal(club.members[0].userId, idmap.u1);          // nested ref follows
  assert.deepEqual(club.tags, ['u1']);                     // not a ref field: untouched
  assert.equal(slugify('Côte d’Azur 7'), 'cote_d_azur_7');
  assert.equal(sources[0].rows[0].slug, 'noor_hale');
});

test('GET /tree serves every kind from the one database, md5 ids and slugs, filters by kind, live themes follow the map', async () => {
  const t = (await call('GET', '/tree')).body;
  assert.ok(t.loadedAt);
  assert.deepEqual(t.sources.map((s) => [s.kind, s.rows.length]), [['person', 1], ['world', 1], ['city', 1], ['store', 1], ['look', 1], ['theme', 0]]);
  assert.deepEqual(t.live, ['theme']);
  const city = t.sources.find((s) => s.kind === 'city').rows[0];
  assert.equal(city.id, md5('city:c1')); assert.equal(city.slug, 'pearl_quay'); assert.equal(city.worldId, md5('world:w1'));
  assert.deepEqual((await call('GET', '/tree?kind=look,theme')).body.sources.map((s) => s.kind), ['look', 'theme']);
  const info = (await call('GET', '/tree/info')).body;
  assert.equal(info.items, 5);

  // the designer (signed in under her md5 id) sets a theme: it shows in the tree, linked through the map
  const g = await call('GET', '/me'); const ck = g.cookie;
  await call('POST', '/auth/demo', { userId: 'u_noor' }, ck);
  assert.equal((await call('GET', '/me', undefined, ck)).body.id, md5('person:u_noor'));
  assert.equal((await call('PUT', '/item/lk1/theme', { kinds: ['Couture'], mood: 'Night out' }, ck)).status, 200);
  const th = (await call('GET', '/tree?kind=theme')).body.sources[0];
  assert.equal(th.live, true);
  assert.deepEqual(th.rows.map((r) => [r.id, r.slug, r.lookId, r.byId]), [['theme:' + md5('look:lk1'), 'indigo_tier_theme', md5('look:lk1'), md5('person:u_noor')]]);
});

for (const kind of ['sqlite', 'json']) {
  test(`seeding the ${kind} store: once, again only when the files change, force always`, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'phiora-seed-'));
    try {
      const data = join(dir, 'files'); mkdirSync(data);
      writeFileSync(join(data, 'tree.json'), JSON.stringify({ sources: [{ kind: 'user', file: 'core', list: 'users' }, { kind: 'user', file: 'more', list: 'users' }] }));
      writeFileSync(join(data, 'core.json'), JSON.stringify({ users: [{ id: 'u1', name: 'A' }, { name: 'no id' }] }));
      writeFileSync(join(data, 'more.json'), JSON.stringify({ users: [{ id: 'u2', name: 'B' }, { id: 'u1', name: 'again' }] }));
      const store = createStore(join(dir, 'db'), kind);
      const first = await seedItems(store, data);
      assert.deepEqual([first.loaded, first.items, first.skipped], [true, 2, 2]);
      assert.equal((await seedItems(store, data)).loaded, false);
      writeFileSync(join(data, 'core.json'), JSON.stringify({ users: [{ id: 'u1', name: 'A2' }] }));
      assert.equal((await seedItems(store, data)).loaded, true);
      assert.equal((await store.getItem('user', md5('user:u1'))).doc.name, 'A2');
      assert.equal((await seedItems(store, data, { force: true })).loaded, true);
      assert.equal((await seedItems(store, data, { onlyMissing: true })).loaded, false);
      await store.close?.();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('enrich: clubs break out of their pool, every PFT names its pool, as props only', () => {
  const sources = enrichSources([
    { kind: 'club', rows: [{ id: 'c1', name: 'Apes North' }] },
    { kind: 'egg', rows: [{ id: 'e1' }] }, { kind: 'sum', rows: [{ id: 'm1' }] }, { kind: 'profilePft', rows: [{ id: 'pp1' }] },
    { kind: 'pool', rows: [{ id: 'pl1', clubId: 'c1', eggIds: ['e1'], sumIds: ['m1'], profileIds: ['pp1'] }] },
  ]);
  const row = (k, i) => sources.find((s) => s.kind === k).rows[i];
  assert.equal(row('club', 0).poolId, 'pl1');
  assert.equal(row('egg', 0).poolId, 'pl1');
  assert.equal(row('sum', 0).poolId, 'pl1');
  assert.equal(row('profilePft', 0).poolId, 'pl1');
  // and after normalization the new props follow the id map like any other reference
  const { sources: out } = normalizeSources(sources);
  assert.equal(out.find((s) => s.kind === 'club').rows[0].poolId, md5('pool:pl1'));
});
