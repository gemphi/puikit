import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhiora } from '../src/server.mjs';
import { md5, seedItems } from '../src/tree.mjs';

const ORIGIN = 'http://localhost:3101';
// PHI_TEST_PG_URL runs the same tests against a real Postgres (each run on its own schema would be nicer; tests
// clean up by dropping their tables through a fresh seed, so point it at a scratch database only).
const BACKENDS = ['sqlite', 'json', ...(process.env.PHI_TEST_PG_URL ? ['postgres'] : [])];

for (const backend of BACKENDS) {
  test(`records on ${backend}: owners and editors change them, guests cannot, changes are logged, seeding keeps edits`, async () => {
    const root = mkdtempSync(join(tmpdir(), 'phiora-records-'));
    const shop = join(root, 'shop'); mkdirSync(shop);
    writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale', handle: 'noor.hale' }, { id: 'u_kai', name: 'Kai M', handle: 'kai.m' }] }));
    const items = join(root, 'items'); mkdirSync(items);
    const files = (clubs) => writeFileSync(join(items, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale' }, { id: 'u_kai', name: 'Kai M' }], clubs }));
    writeFileSync(join(items, 'tree.json'), JSON.stringify({ sources: [{ kind: 'person', file: 'core', list: 'users' }, { kind: 'club', file: 'core', list: 'clubs' }] }));
    files([{ id: 'c_opal', name: 'Maison Opal', founderId: 'u_noor' }, { id: 'c_fern', name: 'Fern', founderId: 'u_kai' }]);
    const env = backend === 'postgres' ? { PHI_QUIET: '1', DATABASE_URL: process.env.PHI_TEST_PG_URL } : { PHI_QUIET: '1', PHI_STORE: backend };
    const phiora = createPhiora({ env, dataDir: join(root, 'data'), shopDataDir: shop, appsDir: root, itemsDir: items });
    if (backend === 'postgres') { await phiora.init; await phiora.store.putItems([], null); await seedItems(phiora.store, items, { force: true }); } // a clean slate in the scratch database
    await new Promise((ok) => phiora.server.listen(0, ok)); const base = 'http://localhost:' + phiora.server.address().port;
    const OPAL = md5('club:c_opal'), FERN = md5('club:c_fern'), NOOR = md5('person:u_noor');
    const client = () => { let cookie = ''; return async (method, path, body) => {
      const r = await fetch(base + path, { method, headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
      const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : undefined }; }; };
    const clubs = async () => (await fetch(base + '/tree?kind=club').then((r) => r.json())).sources.find((s) => s.kind === 'club')?.rows ?? [];
    try {
      const guest = client(); await guest('GET', '/me');
      assert.equal((await guest('POST', '/tree/item', { kind: 'club', fields: { name: 'X' } })).status, 401);
      assert.equal((await guest('GET', `/tree/item/club/${OPAL}`)).body.editable, false);

      const noor = client(); await noor('GET', '/me'); await noor('POST', '/auth/demo', { userId: 'u_noor' });
      const kai = client(); await kai('GET', '/me'); await kai('POST', '/auth/demo', { userId: 'u_kai' });
      // Noor founded Opal (ids and refs are md5 now): she may edit it; Kai may not
      assert.equal((await noor('GET', `/tree/item/club/${OPAL}`)).body.item.founderId, NOOR);
      assert.equal((await noor('GET', `/tree/item/club/${OPAL}`)).body.editable, true);
      const up = await noor('PATCH', `/tree/item/club/${OPAL}`, { set: { tagline: 'Iridescent couture' } });
      assert.equal(up.status, 200); assert.deepEqual(up.body.changed, ['tagline']);
      assert.equal((await kai('PATCH', `/tree/item/club/${OPAL}`, { set: { name: 'Mine' } })).status, 403);
      assert.equal((await noor('PATCH', `/tree/item/club/${OPAL}`, { set: { id: 'other' } })).status, 400);
      // anyone signed in may create; the creator owns it; the id is md5, the slug is the name with underscores
      const made = await kai('POST', '/tree/item', { kind: 'club', fields: { name: 'Kite Club' } });
      assert.equal(made.status, 201);
      assert.match(made.body.item.id, /^[0-9a-f]{32}$/);
      assert.equal(made.body.item.slug, 'kite_club');
      assert.equal(made.body.owner, md5('person:u_kai'));
      const KITE = made.body.item.id;
      assert.deepEqual((await clubs()).map((c) => c.slug).sort(), ['fern', 'kite_club', 'maison_opal']);
      // Kai deletes his file club: a tombstone
      assert.equal((await kai('DELETE', `/tree/item/club/${FERN}`)).status, 200);
      assert.deepEqual((await clubs()).map((c) => c.slug).sort(), ['kite_club', 'maison_opal']);
      assert.equal((await guest('GET', `/tree/item/club/${FERN}`)).status, 404);
      // the change log, newest first, with who did it
      const log = (await guest('GET', '/tree/change')).body.changes;
      assert.deepEqual(log.slice(0, 3).map((c) => [c.action, c.id, c.byHandle]), [['delete', FERN, 'kai.m'], ['create', KITE, 'kai.m'], ['update', OPAL, 'noor.hale']]);
      assert.deepEqual(log[2].fields, ['tagline']);
      // the files change and are seeded again: the edit, the new club and the deletion all stay; new file rows arrive
      files([{ id: 'c_opal', name: 'Maison Opal (files)', founderId: 'u_noor' }, { id: 'c_fern', name: 'Fern', founderId: 'u_kai' }, { id: 'c_new', name: 'New', founderId: 'u_noor' }]);
      const r = await seedItems(phiora.store, items);
      assert.equal(r.loaded, true); assert.equal(r.kept, 3);
      const after = await clubs();
      assert.deepEqual(after.map((c) => c.slug).sort(), ['kite_club', 'maison_opal', 'new']);
      assert.equal(after.find((c) => c.id === OPAL).name, 'Maison Opal'); // the edit wins over the file
    } finally { phiora.server.close(); rmSync(root, { recursive: true, force: true }); }
  });
}

test('in production a start seeds only an empty database; seed brings file changes in', async () => {
  const root = mkdtempSync(join(tmpdir(), 'phiora-prod-'));
  try {
    const items = join(root, 'items'); mkdirSync(items);
    writeFileSync(join(items, 'tree.json'), JSON.stringify({ sources: [{ kind: 'club', file: 'core', list: 'clubs' }] }));
    writeFileSync(join(items, 'core.json'), JSON.stringify({ clubs: [{ id: 'c1', name: 'One' }] }));
    const start = async () => { const p = createPhiora({ env: { PHI_QUIET: '1', PHI_ENV: 'production' }, dataDir: join(root, 'data'), shopDataDir: join(root, 'shop'), appsDir: root, itemsDir: items }); await p.init; return p; };
    let p = await start(); assert.equal((await p.store.itemInfo()).items, 1); p.server.close();
    writeFileSync(join(items, 'core.json'), JSON.stringify({ clubs: [{ id: 'c1', name: 'One' }, { id: 'c2', name: 'Two' }] }));
    p = await start(); assert.equal((await p.store.itemInfo()).items, 1);
    assert.equal((await seedItems(p.store, items)).loaded, true);
    assert.equal((await p.store.itemInfo()).items, 2); p.server.close();
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('editors work by handle, and PHI_CREATE_KINDS closes other kinds to non-editors', async () => {
  const root = mkdtempSync(join(tmpdir(), 'phiora-editors-'));
  try {
    const shop = join(root, 'shop'); mkdirSync(shop);
    writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale', handle: 'noor.hale' }, { id: 'u_kai', name: 'Kai M', handle: 'kai.m' }] }));
    const items = join(root, 'items'); mkdirSync(items);
    writeFileSync(join(items, 'tree.json'), JSON.stringify({ sources: [{ kind: 'person', file: 'core', list: 'users' }, { kind: 'club', file: 'core', list: 'clubs' }] }));
    writeFileSync(join(items, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale' }, { id: 'u_kai', name: 'Kai M' }], clubs: [{ id: 'c1', name: 'Fern', founderId: 'u_noor' }] }));
    const phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_STORE: 'json', PHI_EDITORS: 'kai.m', PHI_CREATE_KINDS: 'proposal' }, dataDir: join(root, 'data'), shopDataDir: shop, appsDir: root, itemsDir: items });
    await new Promise((ok) => phiora.server.listen(0, ok)); const base = 'http://localhost:' + phiora.server.address().port;
    const client = () => { let cookie = ''; return async (method, path, body) => {
      const r = await fetch(base + path, { method, headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
      const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : undefined }; }; };
    const kai = client(); await kai('GET', '/me'); await kai('POST', '/auth/demo', { userId: 'u_kai' });
    const noor = client(); await noor('GET', '/me'); await noor('POST', '/auth/demo', { userId: 'u_noor' });
    const FERN = md5('club:c1');
    // Kai is an editor by handle: he edits Noor's club and creates any kind
    assert.equal((await kai('PATCH', `/tree/item/club/${FERN}`, { set: { tagline: 'Edited by an editor' } })).status, 200);
    assert.equal((await kai('POST', '/tree/item', { kind: 'club', fields: { name: 'Kite' } })).status, 201);
    // Noor is not: proposals are open to her, clubs are not
    assert.equal((await noor('POST', '/tree/item', { kind: 'proposal', fields: { title: 'Open the gates' } })).status, 201);
    const refused = await noor('POST', '/tree/item', { kind: 'club', fields: { name: 'Mine' } });
    assert.equal(refused.status, 403); assert.equal(refused.body.error, 'kind_closed');
    phiora.server.close();
  } finally { rmSync(root, { recursive: true, force: true }); }
});
