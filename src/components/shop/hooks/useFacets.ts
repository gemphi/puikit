import { useCatalogStore } from '../../../store/catalog';

/**
 * Facet selection, adapted for `FacetFilter`.
 *
 * `FacetFilter` reports the full next selection for a dimension while the store
 * toggles one value at a time. Diffing the two here keeps the store's
 * single-value API — which is what a URL layer wants — without the component
 * needing to know about it.
 */
export function useFacets() {
  const selected = useCatalogStore((s) => s.facets);
  const toggleFacet = useCatalogStore((s) => s.toggleFacet);
  const clearFacet = useCatalogStore((s) => s.clearFacet);
  const reset = useCatalogStore((s) => s.reset);
  const activeCount = useCatalogStore((s) => s.activeFacetCount());

  return {
    selected,
    activeCount,
    clearFacet,
    reset,
    setSelection: (facetId: string, next: string[]) => {
      const current = selected[facetId] ?? [];
      if (next.length === 0) {
        clearFacet(facetId);
        return;
      }
      for (const v of next) if (!current.includes(v)) toggleFacet(facetId, v);
      for (const v of current) if (!next.includes(v)) toggleFacet(facetId, v);
    },
  };
}
