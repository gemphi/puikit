// A shop's menu and which products sit under each entry. The menu is data (the path `shop` in data/menu.json, read by
// lib/menus.ts); the taxonomy (data/catalog.json) and lib/catalog.js say where a product sits. A shop shows the
// entries that hold its own products: the rows of the path's tab that follows the menu (data/route.json).
import taxonomy from '../data/catalog.json';
import { under, type Catalog, type CatalogProduct } from './catalog';
import { menuOf, menuTrail, menuWith, type MenuEntry } from './menus';
import { routeOf, rowsOf } from './route';
import type { ID, ShopLook } from '../types/phiegg';

const CATALOG = taxonomy as unknown as Catalog;

/** Is a look under a menu entry (a department, category or item path)? An empty path holds everything. */
export const inPlace = (l: ShopLook, path: string) => under(l as unknown as CatalogProduct, path, CATALOG);

const MENU = new Map<ID, MenuEntry[]>();
/** The shop's menu: the entries of the path's menu that hold its products, each with its count. */
export const shopMenu = (store: { id: ID }): MenuEntry[] => {
  const hit = MENU.get(store.id); if (hit) return hit;
  const tab = routeOf('shop').tab?.find((x) => x.menu);
  const menu = menuWith(menuOf('shop', store.id), tab ? (rowsOf(tab, store) as unknown as ShopLook[]) : [], inPlace);
  MENU.set(store.id, menu); return menu;
};

/** A menu entry's label for the page's heading: its department, then its own ("Women · Dresses"). */
export const placeLabel = (storeId: ID, path: string): string => {
  const trail = menuTrail(menuOf('shop', storeId), path);
  return trail.length ? [...new Set([trail[0].label, trail[trail.length - 1].label])].join(' · ') : path;
};
