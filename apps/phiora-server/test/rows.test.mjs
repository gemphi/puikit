import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rowsOf, refKind } from '../src/rows.mjs';
import { rowsOf as manifestRows } from '../src/tree.mjs';
import { dress } from '../scripts/fictional.mjs';

const store = { itemsOf: async (kinds) => Object.fromEntries(kinds.map((k) => [k, {
  pool: [{ id: 'p1', name: 'Bold Pups', supply: 10000, worldId: 'w1', status: 'live' }, { id: 'p2', name: 'Satin', supply: 777, worldId: 'w2', status: 'live' }, { id: 'p3', name: 'Ash', supply: '1.2k', status: 'draft' }],
  world: [{ id: 'w1', name: 'Opalia', image: 'assets/worlds/w_opalia.png' }],
}[k] ?? []])) };

test('GET /tree/rows: a page of one kind, filtered, sorted (numbers and "1.2k"), with joined references', async () => {
  const r = await rowsOf(store, new URLSearchParams('kind=pool&n=2&sort=supply&join=worldId'));
  assert.equal(r.total, 3);
  assert.deepEqual(r.rows.map((x) => x.id), ['p1', 'p3']);
  assert.deepEqual(r.rows[0].world, { id: 'w1', name: 'Opalia', image: 'assets/worlds/w_opalia.png' });
  const live = await rowsOf(store, new URLSearchParams('kind=pool&where=status:live&sort=supply&dir=asc'));
  assert.deepEqual(live.rows.map((x) => x.id), ['p2', 'p1']);
  assert.equal(await rowsOf(store, new URLSearchParams('')), null);
  assert.equal(refKind('sponsorClubId'), 'club'); assert.equal(refKind('name'), null);
});

test('a manifest entry with { map } reads an object keyed by name, a row each', () => {
  const rows = manifestRows({ kind: 'kindSpec', file: 'kinds', map: true, prefix: 'phiegg.', set: { app: 'phiegg' } }, { kinds: { pool: { label: 'Pool', fields: [] }, about: 'text' } });
  assert.deepEqual(rows, [{ id: 'phiegg.pool', name: 'pool', label: 'Pool', fields: [], app: 'phiegg' }]);
});

test('placeholder sample rows are dressed in fictional content; real rows are left alone', () => {
  const d = dress('phihubApp', { srcId: 'app-002', name: 'App 2', desc: 'Description 2', version: 'Version 2', author: 'Author 2' });
  assert.equal(d.name, 'Ride Desk'); assert.match(d.desc, /rides/); assert.equal(d.version, '1.3.0');
  const real = { name: 'Bold Pups', desc: 'Ten thousand pups' }; assert.equal(dress('pool', real), real);
});
