// Types for lib/catalog.js (plain JavaScript, shared with the data script and Phiora).
export type CatalogRule = { match?: Record<string, string[]>; garment?: string[] };
export type CatalogItem = CatalogRule & { id: string; label: string };
export type Catalog = {
  departments: (CatalogRule & { id: string; label: string })[];
  categories: { id: string; label: string; items?: CatalogItem[]; from?: string }[];
};
export type CatalogProduct = { garments: string[] } & Record<string, unknown>;
/** An entry of a menu: its id is its path (women/rtw/dresses). */
export type CatalogEntry = { id: string; label: string; count: number; items?: CatalogEntry[] };

export function slug(s: string): string;
export function meets(product: CatalogProduct, rule: CatalogRule): boolean;
export function placesOf(product: CatalogProduct, catalog: Catalog): string[];
export function under(product: CatalogProduct, path: string, catalog: Catalog): boolean;
export function catalogMenu(catalog: Catalog, products: CatalogProduct[]): CatalogEntry[];
