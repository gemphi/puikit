import { useMemo } from 'react';
import type { ShopFacet, ShopProduct } from '../../../types/shop';
import { useCatalogStore } from '../../../store/catalog';
import { useShopConfig } from '../provider';
import { useAsync, useDebounce } from './useAsync';
import { applyFacets, buildFacets, paginate, searchProducts, sortProducts } from '../logic/catalog';

export interface CatalogResult<T extends ShopProduct = ShopProduct> {
  /** Everything in scope before filtering — what facet counts are derived from. */
  scope: T[];
  /** After facets, search and sort. */
  results: T[];
  /** The page of `results` currently shown. */
  items: T[];
  facets: ShopFacet[];
  total: number;
  totalPages: number;
  page: number;
  loading: boolean;
  error: Error | null;
}

/**
 * The whole catalog pipeline: scope → facets → search → sort → paginate.
 *
 * A page calls this and renders the result. Home, category and search pages
 * differ only in the scope they ask for, which is why none of them contains a
 * line of filtering logic.
 */
export function useCatalog<T extends ShopProduct = ShopProduct>(categoryId?: string): CatalogResult<T> {
  const { adapter, facets: definitions, searchFields, pageSize } = useShopConfig<T>();
  const { facets: selection, query, sort, page } = useCatalogStore();
  const debouncedQuery = useDebounce(query, 250);

  const { data, loading, error } = useAsync<T[]>(async () => {
    if (categoryId && adapter.getProductsByCategory) {
      return adapter.getProductsByCategory(categoryId);
    }
    const all = (await adapter.getProducts?.()) ?? [];
    return categoryId ? all.filter((p) => p.category === categoryId) : all;
  }, [categoryId, adapter]);

  const scope = useMemo(() => data ?? [], [data]);
  const facets = useMemo(() => buildFacets(scope, definitions), [scope, definitions]);

  const results = useMemo(() => {
    const filtered = applyFacets(scope, selection, definitions);
    const searched = searchProducts(filtered, debouncedQuery, searchFields);
    return sortProducts(searched, sort);
  }, [scope, selection, definitions, debouncedQuery, searchFields, sort]);

  const paged = useMemo(() => paginate(results, page, pageSize), [results, page, pageSize]);

  return {
    scope,
    results,
    items: paged.items,
    facets,
    total: paged.total,
    totalPages: paged.totalPages,
    page: paged.page,
    loading,
    error,
  };
}

/** A single product plus the pieces a detail page needs alongside it. */
export function useProduct<T extends ShopProduct = ShopProduct>(id: string | number) {
  const { adapter } = useShopConfig<T>();

  const { data: product, loading, error } = useAsync<T | null>(
    () => adapter.getProductById?.(id) ?? Promise.resolve(null),
    [id, adapter]
  );

  const { data: related } = useAsync<T[]>(async () => {
    if (!product) return [];
    if (adapter.getRelatedProducts) return adapter.getRelatedProducts(product);
    const all = (await adapter.getProducts?.()) ?? [];
    return all.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [product, adapter]);

  return { product, related: related ?? [], loading, error };
}

/** The category list, for navigation and landing pages. */
export function useCategories() {
  const { adapter } = useShopConfig();
  const { data, loading } = useAsync(() => adapter.getCategories?.() ?? Promise.resolve([]), [adapter]);
  return { categories: data ?? [], loading };
}
