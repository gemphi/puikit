import type { ShopSortKey } from '@pui/types';

type CatalogParams = { q?: string; sort?: ShopSortKey; page?: number };

function toQuery(params?: CatalogParams): string {
  if (!params) return '';
  const q = new URLSearchParams();
  if (params.q) q.set('q', params.q);
  if (params.sort && params.sort !== 'relevance') q.set('sort', params.sort);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Every path in the app. Nothing constructs a URL by hand — a route change is
 * a one-line edit here rather than a search across pages.
 */
export const routes = {
  home: () => '/',
  catalog: (params?: CatalogParams) => `/${toQuery(params)}`,
  category: (slug: string, params?: CatalogParams) => `/category/${slug}${toQuery(params)}`,
  product: (id: string) => `/product/${id}`,
  search: (q: string) => `/search?q=${encodeURIComponent(q)}`,
  cart: () => '/cart',
  checkout: () => '/checkout',
  checkoutSuccess: () => '/checkout/success',
  wishlist: () => '/wishlist',
  account: () => '/account',
  accountOrders: () => '/account/orders',
  accountAddresses: () => '/account/addresses',
  accountPayments: () => '/account/payments',
  about: () => '/about',
} as const;

/** Hash-router href for the same path, for `Link` and anchor targets. */
export const href = (path: string): string => `#${path}`;
