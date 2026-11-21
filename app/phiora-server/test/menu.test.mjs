import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadMenus, menuOf } from '../src/menu.mjs';

const entry = (id, label, items) => ({ id, label, count: 1, ...(items ? { items } : {}) });
const withMenus = (doc, run) => {
  const dir = mkdtempSync(join(tmpdir(), 'phiora-menu-'));
  try { if (doc) writeFileSync(join(dir, 'menu.json'), JSON.stringify(doc)); return run(loadMenus(dir)); }
  finally { rmSync(dir, { recursive: true, force: true }); }
};

test('a path answers the menu its data holds, for the record it shows', () => {
  const women = entry('women', 'Women', [entry('women/rtw', 'Ready-to-wear', [entry('women/rtw/dresses', 'Dresses')])]);
  withMenus({ path: { shop: { s1: [women], s2: [] }, help: [entry('faq', 'Questions')] } }, (menus) => {
    assert.deepEqual(menuOf(menus, 'shop', 's1'), { path: 'shop', id: 's1', items: [women] });
    assert.deepEqual(menuOf(menus, 'shop', 's2').items, [], 'a record with nothing to list has an empty menu');
    assert.deepEqual(menuOf(menus, 'help'), { path: 'help', id: null, items: [entry('faq', 'Questions')] }, 'one menu for every record of a path');
    assert.throws(() => menuOf(menus, 'shop', 'nope'), { code: 'no_record', status: 404 });
    assert.throws(() => menuOf(menus, 'nowhere', 's1'), { code: 'no_menu', status: 404 });
    assert.throws(() => menuOf(menus, null, null), { code: 'no_menu' });
  });
});

test('a server with no menu data has no menus', () => {
  withMenus(null, (menus) => assert.throws(() => menuOf(menus, 'shop', 's1'), { code: 'no_menu' }));
});

// The menus are written by the app's data pipeline (scripts/catalog.mjs) with the app's own placing code.
const lib = await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'phiegg', 'src', 'lib', 'catalog.js')).href);
const TAXONOMY = {
  departments: [{ id: 'women', label: 'Women', match: { 'specs.gender': ['Womenswear', 'Unisex'] } }, { id: 'men', label: 'Men', match: { 'specs.gender': ['Menswear', 'Unisex'] } }],
  categories: [
    { id: 'rtw', label: 'Ready-to-wear', items: [{ id: 'dresses', label: 'Dresses', match: { 'specs.category': ['dress'] } }, { id: 'coats', label: 'Coats', garment: ['coat'] }] },
    { id: 'shoes', label: 'Shoes', items: [{ id: 'boots', label: 'Boots', garment: ['boots'] }] },
    { id: 'collections', label: 'Collections', from: 'specs.collection' },
  ],
};
const look = (id, gender, category, garments, collection) => ({ id, name: id, garments, specs: { gender, category, collection } });

test("a shop's menu holds only the departments, categories and items its products fill", () => {
  const menu = lib.catalogMenu(TAXONOMY, [look('a', 'Womenswear', 'dress', ['Ankle boots'], 'Ember Line'), look('b', 'Unisex', 'outerwear', ['Long coat'], 'Ember Line')]);
  const women = menu.find((d) => d.id === 'women'); const men = menu.find((d) => d.id === 'men');
  assert.equal(women.count, 2); assert.equal(men.count, 1, 'a unisex product is in both departments');
  assert.deepEqual(women.items.map((c) => c.id), ['women/rtw', 'women/shoes', 'women/collections']);
  assert.deepEqual(women.items[0].items.map((x) => [x.id, x.count]), [['women/rtw/dresses', 1], ['women/rtw/coats', 1]]);
  assert.deepEqual(women.items[2].items.map((x) => [x.id, x.label]), [['women/collections/ember-line', 'Ember Line']], 'a collection takes its own name');
  assert.deepEqual(men.items.map((c) => c.id), ['men/rtw', 'men/collections'], 'no shoes for men in this shop');
  assert.deepEqual(lib.catalogMenu(TAXONOMY, []), [], 'no products, no menu');
});
