// Checks the shop taxonomy (data/catalog.json) against the products and writes each shop's menu as data.
// It prints every department's menu (its categories and how many items each holds), fails when a product has no place
// in it, so a new product kind is never lost from a shop's menu, and writes data/menu.json: the menu the path `shop`
// has, as an array of entries. The app's rail and Phiora's GET /menu read that array; neither works a menu out.
//   node scripts/catalog.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { placesOf, catalogMenu } from '../src/lib/catalog.js';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const catalog = read('catalog.json');
const flagship = read('ls.json');
const all = [...flagship.looks, ...read('stores.json').stores.flatMap((s) => s.looks ?? [])];
for (const d of catalogMenu(catalog, all)) console.log(`catalog: ${d.label} ${d.count} - ` + d.items.map((c) => `${c.label} ${c.items.length}`).join(', '));
const bare = all.filter((l) => !placesOf(l, catalog).length);
console.log(`catalog: ${all.length} products, ${bare.length} with no place`);
if (bare.length) { console.error('catalog: no place for ' + bare.slice(0, 10).map((l) => l.id).join(', ')); process.exit(1); }

// data/menu.json: the path `shop` is rewritten (one menu for every shop: all the products', a category on each line);
// any other path's menu in the file is kept as it is.
const file = join(DATA, 'menu.json');
const kept = existsSync(file) ? read('menu.json').path ?? {} : {};
const about = 'The menu each path of the site has, as arrays of entries { id, label, count, items }, keyed by path. A path whose menu differs by the record it shows keeps an object of arrays by that record\'s id. The app\'s rail reads it (lib/menus.ts menuOf; a rail shows the entries that hold rows of the record on the page) and Phiora answers it (GET /menu?path=&id=). The path `shop` is written by scripts/catalog.mjs from data/catalog.json and the products; never edit it by hand.';
const lines = (entries, pad) => entries.map((e) => (e.items && pad.length < 5
  ? `${pad}{"id":${JSON.stringify(e.id)},"label":${JSON.stringify(e.label)},"count":${e.count},"items":[\n${lines(e.items, pad + ' ')}\n${pad}]}`
  : pad + JSON.stringify(e))).join(',\n');
const others = Object.entries(kept).filter(([path]) => path !== 'shop').map(([path, menu]) => `  ${JSON.stringify(path)}: ${JSON.stringify(menu)},\n`).join('');
const menu = catalogMenu(catalog, all);
writeFileSync(file, `{\n "_": ${JSON.stringify(about)},\n "path": {\n${others}  "shop": [\n${lines(menu, '   ')}\n  ]\n }\n}\n`);
console.log(`catalog: menu.json holds the shop menu, ${menu.reduce((n, d) => n + d.items.reduce((m, c) => m + c.items.length, 0), 0)} items`);
