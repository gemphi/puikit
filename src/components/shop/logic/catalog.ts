import type { ShopProduct, ShopFacet, ShopSortKey } from '../../../types/shop';

// `FacetSelection` is owned by the catalog store — re-exported here so the
// pipeline and the store can never define it differently.
export type { FacetSelection } from '../../../store/catalog';
import type { FacetSelection } from '../../../store/catalog';

/**
 * How a facet dimension reads and matches a product.
 *
 * Declaring both halves together is what stops the chip a shopper clicks and
 * the predicate that filters by it from drifting apart — the classic faceting
 * bug. An app describes its dimensions; it never writes filter code.
 */
export interface FacetDefinition<T extends ShopProduct = ShopProduct> {
  id: string;
  label: string;
  /** Values this product contributes to the facet. */
  values: (product: T) => string[];
  /** Optional fixed value list (price bands and the like) instead of derived values. */
  buckets?: Array<{ value: string; test: (product: T) => boolean }>;
  /**
   * Resolves a value to a swatch colour. Supplying it is what lets a colour
   * dimension render as chips without the rail knowing what a colour is.
   */
  swatch?: (value: string, product?: T) => string | undefined;
}

/** A facet over a single string attribute — the common case. */
export const attributeFacet = <T extends ShopProduct>(
  id: string,
  label: string,
  read: (product: T) => string | undefined,
  swatch?: (value: string, product?: T) => string | undefined
): FacetDefinition<T> => ({
  id,
  label,
  values: (p) => {
    const v = read(p);
    return v ? [v] : [];
  },
  swatch,
});

/** A facet over price ranges. */
export const priceBandFacet = <T extends ShopProduct>(
  id: string,
  label: string,
  bands: Array<{ value: string; min?: number; max?: number }>
): FacetDefinition<T> => ({
  id,
  label,
  values: () => [],
  buckets: bands.map((b) => ({
    value: b.value,
    test: (p: T) => (b.min === undefined || p.price >= b.min) && (b.max === undefined || p.price < b.max),
  })),
});

/** Build facets with truthful counts from the products currently in scope. */
export function buildFacets<T extends ShopProduct>(
  products: T[],
  definitions: FacetDefinition<T>[]
): ShopFacet[] {
  return definitions
    .map((def) => {
      if (def.buckets) {
        return {
          id: def.id,
          label: def.label,
          values: def.buckets
            .map((b) => ({ value: b.value, count: products.filter(b.test).length }))
            .filter((v) => v.count > 0),
        };
      }
      const tally = new Map<string, number>();
      const source = new Map<string, T>();
      for (const p of products) {
        for (const v of def.values(p)) {
          tally.set(v, (tally.get(v) ?? 0) + 1);
          if (!source.has(v)) source.set(v, p);
        }
      }
      return {
        id: def.id,
        label: def.label,
        values: [...tally.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([value, count]) => ({
            value,
            count,
            hex: def.swatch?.(value, source.get(value)),
          })),
      };
    })
    .filter((f) => f.values.length > 0);
}

/** Apply a selection. An empty selection for a dimension means "no constraint". */
export function applyFacets<T extends ShopProduct>(
  products: T[],
  selection: FacetSelection,
  definitions: FacetDefinition<T>[]
): T[] {
  const active = definitions.filter((d) => (selection[d.id] ?? []).length > 0);
  if (active.length === 0) return products;

  return products.filter((p) =>
    active.every((def) => {
      const chosen = selection[def.id] ?? [];
      if (def.buckets) {
        return def.buckets.filter((b) => chosen.includes(b.value)).some((b) => b.test(p));
      }
      const values = def.values(p);
      return values.some((v) => chosen.includes(v));
    })
  );
}

/** Fields searched by default when an app does not name its own. */
const DEFAULT_SEARCH_FIELDS = <T extends ShopProduct>(p: T): Array<string | undefined> => [
  p.title,
  p.description,
  p.category,
];

export function searchProducts<T extends ShopProduct>(
  products: T[],
  query: string,
  fields: (product: T) => Array<string | undefined> = DEFAULT_SEARCH_FIELDS
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => fields(p).some((f) => f?.toLowerCase().includes(q)));
}

export function sortProducts<T extends ShopProduct>(products: T[], sort: ShopSortKey): T[] {
  const arr = [...products];
  switch (sort) {
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'rating':
      return arr.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0));
    case 'newest':
      return arr.sort((a, b) => (b.meta?.createdAt ? 1 : 0) - (a.meta?.createdAt ? 1 : 0));
    case 'relevance':
    default:
      return arr;
  }
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paged<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageSize,
    totalPages,
    total: items.length,
  };
}
