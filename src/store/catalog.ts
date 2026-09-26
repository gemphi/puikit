import { createStore } from './createStore';
import { useStore } from '../hooks/useStore';
import type { ShopSortKey } from '../types/shop';

/** Selected facet values, keyed by facet id. */
export type FacetSelection = Record<string, string[]>;

export interface CatalogState {
  query: string;
  category: string | null;
  facets: FacetSelection;
  sort: ShopSortKey;
  page: number;
  pageSize: number;
  view: 'grid' | 'list';

  setQuery: (query: string) => void;
  setCategory: (category: string | null) => void;
  toggleFacet: (facetId: string, value: string) => void;
  clearFacet: (facetId: string) => void;
  setSort: (sort: ShopSortKey) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setView: (view: 'grid' | 'list') => void;
  reset: () => void;

  activeFacetCount: () => number;
  hasFilters: () => boolean;
}

const INITIAL = {
  query: '',
  category: null as string | null,
  facets: {} as FacetSelection,
  sort: 'relevance' as ShopSortKey,
  page: 1,
  pageSize: 24,
  view: 'grid' as const,
};

/**
 * Catalog browse state: search, category, facets, sort, pagination and view.
 * Not persisted — this is URL-shaped state an app usually mirrors into the
 * address bar, and restoring a stale filter set on reload surprises people.
 *
 * Any mutation that changes the result set resets pagination to page 1.
 */
export const catalogStore = createStore<CatalogState>((set, get) => ({
  ...INITIAL,

  setQuery: (query) => set({ query, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
  toggleFacet: (facetId, value) => {
    const current = get().facets[facetId] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const facets = { ...get().facets };
    if (next.length) facets[facetId] = next;
    else delete facets[facetId];
    set({ facets, page: 1 });
  },
  clearFacet: (facetId) => {
    const facets = { ...get().facets };
    delete facets[facetId];
    set({ facets, page: 1 });
  },
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page: Math.max(1, page) }),
  setPageSize: (pageSize) => set({ pageSize: Math.max(1, pageSize), page: 1 }),
  setView: (view) => set({ view }),
  reset: () => set({ ...INITIAL }),

  activeFacetCount: () =>
    Object.values(get().facets).reduce((n, values) => n + values.length, 0),
  hasFilters: () =>
    Boolean(get().query || get().category) || get().activeFacetCount() > 0,
}));

/** Subscribe to the catalog store. Pass a selector to narrow the subscription. */
export function useCatalogStore(): CatalogState;
export function useCatalogStore<T>(selector: (state: CatalogState) => T): T;
export function useCatalogStore<T>(selector?: (state: CatalogState) => T) {
  return useStore(catalogStore, selector as (state: CatalogState) => T);
}
