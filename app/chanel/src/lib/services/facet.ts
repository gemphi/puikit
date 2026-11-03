import type { ShopFacet } from '@pui/types';
import { t } from '../../locales/t';
import type { Product } from './product';

/** Selected facet values, keyed by facet id. Mirrors the catalog store. */
export type FacetSelection = Record<string, string[]>;

export const FACET_LINE = 'line';
export const FACET_COLOUR = 'colour';
export const FACET_PRICE = 'price';

/**
 * Price bands, defined once as data.
 *
 * The band label is also its selection value, so a facet chip and its predicate
 * can never drift apart — which is the usual bug when bands are declared in one
 * place and matched in another.
 */
export const PRICE_BANDS: Array<{ label: string; test: (n: number) => boolean }> = [
  { label: 'Under €500', test: (n) => n < 500 },
  { label: '€500 – €3,000', test: (n) => n >= 500 && n < 3000 },
  { label: '€3,000 – €7,000', test: (n) => n >= 3000 && n < 7000 },
  { label: '€7,000 and above', test: (n) => n >= 7000 },
];

const priceBand = (label: string) => PRICE_BANDS.find((b) => b.label === label);

/** Derive facets from the products in scope, so counts are always truthful. */
export function buildFacets(products: Product[]): ShopFacet[] {
  const tally = (values: string[]) => {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  };

  const lines = tally(products.map((p) => p.line));
  const colours = tally(products.flatMap((p) => p.options?.colors?.map((c) => c.name) ?? []));

  return [
    {
      id: FACET_LINE,
      label: t.catalog.facetLine,
      values: lines.map(([value, count]) => ({ value, count })),
    },
    {
      id: FACET_COLOUR,
      label: t.catalog.facetColour,
      values: colours.map(([value, count]) => ({ value, count })),
    },
    {
      id: FACET_PRICE,
      label: t.catalog.facetPrice,
      values: PRICE_BANDS.map((b) => ({
        value: b.label,
        count: products.filter((p) => b.test(p.price)).length,
      })).filter((v) => v.count > 0),
    },
  ].filter((f) => f.values.length > 0);
}

/** Apply a selection. An empty selection for a dimension means "no constraint". */
export function applyFacets(products: Product[], selection: FacetSelection): Product[] {
  const lines = selection[FACET_LINE] ?? [];
  const colours = selection[FACET_COLOUR] ?? [];
  const bands = selection[FACET_PRICE] ?? [];

  return products.filter((p) => {
    if (lines.length && !lines.includes(p.line)) return false;
    if (colours.length && !p.options?.colors?.some((c) => colours.includes(c.name))) return false;
    if (bands.length && !bands.some((label) => priceBand(label)?.test(p.price))) return false;
    return true;
  });
}
