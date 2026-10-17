// Apps as records. Every Phiace app is the same shell; what differs is its menus and pages, and those live in the
// one database like every other record, as four kinds linked by reference props:
//   app   { key, name, ...the app's own props }
//   menu  { appId, parentId, pageId, key, label, icon, order, group? }   a menu entry: parentId links a sub-menu to
//         its group, pageId to the page it opens
//   page  { appId, key, title, sub, ... }                        one page of an app
//   block { pageId, order, type, ...the block's props }          one section of a page (hero, grid, news, form …)
// The app files (apps/<key>/public/data/<key>.json) only seed them. GET /app/<key> composes the same document back
// from the records, so an edit to a menu label or a block's items (PATCH /tree/item/menu/<id>) shows in the app
// on its next load; with no records for a key it falls back to the file.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { slugify } from './tree.mjs';

export const APP_KINDS = ['app', 'menu', 'page', 'block'];
const cap = (k) => k.charAt(0).toUpperCase() + k.slice(1);

/** The app documents in the apps folder: every apps/<key>/public/data/<key>.json with a nav and views, or, for an app
    that bundles its menus (phiegg), apps/<key>/src/data/<key>.json. */
export function appFiles(appsDir) {
  if (!appsDir || !existsSync(appsDir)) return [];
  const fileOf = (key) => [join(appsDir, key, 'public', 'data', key + '.json'), join(appsDir, key, 'src', 'data', key + '.json')].find((f) => existsSync(f));
  return readdirSync(appsDir).sort().map((key) => ({ key, file: fileOf(key) }))
    .filter(({ file }) => file)
    .map(({ key, file }) => { try { return { key, file, doc: JSON.parse(readFileSync(file, 'utf8')) }; } catch { return null; } })
    .filter((a) => a && Array.isArray(a.doc.nav) && a.doc.views && typeof a.doc.views === 'object');
}

/** A fingerprint of the app files, joined to the data files' stamp so a changed app file reseeds. */
export const appStamp = (appsDir) => appFiles(appsDir).map(({ key, file }) => { const s = statSync(file); return 'app:' + key + ':' + s.size + ':' + Math.round(s.mtimeMs); }).join('|');

/** One app document as rows of the four kinds, on original ids (normalizeSources gives them md5 ids and slugs). */
export function appRows(key, doc) {
  const App = cap(key); const appId = 'app:' + key;
  const { nav, views, ...own } = doc;
  const app = [{ id: appId, slug: slugify(App), key, name: App, ...own }];
  const menu = [];
  const walk = (list, parentId, path) => list.forEach((n, i) => {
    const { id: navKey, items, ...rest } = n;
    const id = 'menu:' + key + ':' + path.concat(navKey).join('/');
    menu.push({ id, slug: slugify(App + ' ' + path.concat(rest.label ?? navKey).join(' ')), appId, parentId, ...(views[navKey] ? { pageId: 'page:' + key + ':' + navKey } : {}), key: navKey, order: i, ...(Array.isArray(items) ? { group: true } : {}), ...rest });
    if (Array.isArray(items)) walk(items, id, path.concat(rest.label ?? navKey));
  });
  walk(nav, null, []);
  const page = [], block = [];
  for (const [pageKey, v] of Object.entries(views)) {
    const { blocks, ...rest } = v ?? {};
    const pageId = 'page:' + key + ':' + pageKey; const name = App + ' ' + (rest.title || pageKey);
    page.push({ id: pageId, slug: slugify(App + ' ' + pageKey), appId, key: pageKey, ...rest });
    (blocks ?? []).forEach((b, i) => { const { kind: type, ...props } = b ?? {}; block.push({ id: pageId + ':' + i, slug: slugify(name + ' ' + (type ?? 'block') + ' ' + (i + 1)), pageId, order: i, type, ...props }); });
  }
  return { app, menu, page, block };
}

/** Seed sources for every app in the folder. */
export function appSources(appsDir) {
  const all = { app: [], menu: [], page: [], block: [] };
  for (const { key, doc } of appFiles(appsDir)) { const r = appRows(key, doc); for (const k of APP_KINDS) all[k].push(...r[k]); }
  return APP_KINDS.map((kind) => ({ kind, rows: all[kind] })).filter((s) => s.rows.length);
}

const omit = (r, keys) => Object.fromEntries(Object.entries(r).filter(([k]) => !keys.includes(k)));
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

/** The list of apps in the database: { key, name } each. */
export const appList = (rows) => (rows.app ?? []).map((a) => ({ key: a.key, name: a.name, slug: a.slug }));

/**
 * The app document of `key`, composed from the records ({ kind: rows }): the same shape the file had
 * ({ ...own props, nav, views }), or null when the database holds no app of that key.
 */
export function composeApp(rows, key) {
  const app = (rows.app ?? []).find((a) => a.key === key); if (!app) return null;
  const menus = (rows.menu ?? []).filter((m) => m.appId === app.id);
  const navOf = (parentId) => menus.filter((m) => (m.parentId ?? null) === parentId).sort(byOrder).map((m) => {
    const { key: id, group, ...rest } = omit(m, ['id', 'slug', 'appId', 'parentId', 'pageId', 'order']);
    return group ? { id, ...rest, items: navOf(m.id) } : { id, ...rest };
  });
  const pages = (rows.page ?? []).filter((p) => p.appId === app.id);
  const blocksOf = new Map(); for (const b of rows.block ?? []) (blocksOf.get(b.pageId) ?? blocksOf.set(b.pageId, []).get(b.pageId)).push(b);
  const views = Object.fromEntries(pages.map((p) => [p.key, {
    ...omit(p, ['id', 'slug', 'appId', 'key']),
    blocks: (blocksOf.get(p.id) ?? []).sort(byOrder).map((b) => { const { type, ...props } = omit(b, ['id', 'slug', 'pageId', 'order']); return { kind: type, ...props }; }),
  }]));
  return { ...omit(app, ['id', 'slug', 'key', 'name']), nav: navOf(null), views };
}
