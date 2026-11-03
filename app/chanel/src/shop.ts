import {
  attributeFacet,
  priceBandFacet,
  type ShopAdapter,
  type ShopConfig,
} from '@pui/shop';
import type { ShopProduct } from '@pui/types';
import { t } from './locales/t';
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  getRelatedProducts,
  getCategories,
  signIn,
  getAddresses,
  getPaymentMethods,
  getOrders,
  type Product,
} from './lib/services';

/**
 * Everything this storefront tells the shop module.
 *
 * The adapter supplies data; the facets and rules are declared as data too.
 * There is no filtering, sorting, faceting, totalling, validation or order
 * assembly anywhere in this app — all of that lives in `@pui/shop`, which is
 * the point: a new storefront is this file plus its pages.
 */
const adapter: ShopAdapter<Product> = {
  getProducts,
  getProductById: (id) => getProductById(String(id)),
  getProductsByCategory,
  getRelatedProducts,
  getCategories,
  signIn,
  getAddresses,
  getPaymentMethods,
  getOrders,
};

export const shopConfig: ShopConfig<Product> = {
  adapter,

  facets: [
    attributeFacet<Product>('line', t.catalog.facetLine, (p) => p.line),
    {
      id: 'colour',
      label: t.catalog.facetColour,
      values: (p) => p.options?.colors?.map((c) => c.name) ?? [],
      // The rail draws this dimension as swatches; the colour comes from the
      // product's own option data, so nothing here hardcodes a palette.
      swatch: (value, product) =>
        product?.options?.colors?.find((c) => c.name === value)?.hex,
    },
    attributeFacet<Product>('category', t.catalog.facetCategory, (p) => p.category),
    attributeFacet<Product>('material', t.catalog.facetMaterial, (p) => p.material),
    attributeFacet<Product>('collection', t.catalog.facetCollection, (p) => p.collection),
    {
      id: 'size',
      label: t.catalog.facetSize,
      values: (p) => p.options?.sizes ?? [],
    },
    priceBandFacet<Product>('price', t.catalog.facetPrice, [
      { value: 'Under €500', max: 500 },
      { value: '€500 – €3,000', min: 500, max: 3000 },
      { value: '€3,000 – €7,000', min: 3000, max: 7000 },
      { value: '€7,000 and above', min: 7000 },
    ]),
  ],

  searchFields: (p: Product) => [p.title, p.description, p.line, p.category],

  locale: { locale: 'en-IE', currency: 'EUR', fractionDigits: 0 },

  /** Complimentary delivery on everything, as the maison does. */
  totals: { shipping: 0 },

  validationMessages: {
    required: t.checkout.requiredField,
    email: t.checkout.invalidEmail,
    card: t.checkout.invalidCard,
    expiry: t.checkout.invalidExpiry,
    postalCode: t.checkout.invalidPostal,
  },

  orderIdPrefix: 'CH',
  pageSize: 12,
};

/** Labels shared by every catalog surface, resolved from the locale once. */
export const catalogLabels = {
  sort: t.catalog.sortLabel,
  sortOptions: {
    relevance: t.catalog.sortRelevance,
    'price-asc': t.catalog.sortPriceAsc,
    'price-desc': t.catalog.sortPriceDesc,
    rating: t.catalog.sortRating,
    newest: t.catalog.sortNewest,
  },
  resultCount: (n: number) =>
    n === 1 ? t.catalog.resultCountOne : t.catalog.resultCount.replace('{count}', String(n)),
  emptyTitle: t.catalog.emptyTitle,
  emptyBody: t.catalog.emptyBody,
  clearFilters: t.catalog.clearFilters,
};

export type { Product };
export type { ShopProduct };
