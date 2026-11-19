// The menu a path of a site has, answered as the data it is:
//   GET /menu?path=shop&id=<record>  → { path, id, items }
// `items` is an array of entries { id, label, count, items }, nested to any depth. The arrays live in menu.json beside
// the app's data, keyed by path and then by the id of the record the path shows (a path whose menu is the same for
// every record keeps one array). Nothing here knows what a shop, a look or any other kind is.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ItemError } from './items.mjs';

export function loadMenus(dataDir) {
  const file = join(dataDir, 'menu.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')).path ?? {}) : {};
}

export function menuOf(menus, path, id) {
  const at = menus[path ?? ''];
  if (!at) throw new ItemError(404, 'no_menu', 'No menu for the path ' + String(path) + '.');
  const items = Array.isArray(at) ? at : at[id ?? ''];
  if (!items) throw new ItemError(404, 'no_record', 'The path ' + path + ' has no menu for ' + String(id) + '.');
  return { path, id: Array.isArray(at) ? null : id, items };
}
