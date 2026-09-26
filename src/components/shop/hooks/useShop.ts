import { useMemo } from 'react';
import type { ShopProduct } from '../../../types/shop';
import { useCatalogStore } from '../../../store/catalog';
import { useShopConfig } from '../provider';
import { formatDate, formatPrice } from '../logic/format';
import { useCatalog, useCategories, useProduct } from './useCatalog';
import { useCart } from './useCart';
import { useAuth, useAddressBook, usePaymentMethods, useWishlist } from './useAccount';
import { useOrders } from './useCheckout';
import { useFacets } from './useFacets';

/**
 * The single operational entry point for a storefront.
 *
 * Everything a shop page needs is already wired here: catalog pipeline, bag,
 * wishlist, identity, addresses, cards, orders, facets and formatting. It works
 * from the moment the provider is mounted, against whatever data source the
 * adapter names — bundled fixtures during development, a live API in
 * production, swapped by changing the adapter alone.
 *
 * ```tsx
 * const shop = useShop();
 * <ProductList products={shop.catalog.items} variant="card" />
 * ```
 */
export function useShop<T extends ShopProduct = ShopProduct>(categoryId?: string) {
  const config = useShopConfig<T>();
  const catalog = useCatalog<T>(categoryId);
  const { categories, loading: categoriesLoading } = useCategories();
  const cart = useCart();
  const wishlist = useWishlist();
  const auth = useAuth();
  const addresses = useAddressBook();
  const payments = usePaymentMethods();
  const orders = useOrders();
  const facets = useFacets();

  const query = useCatalogStore((s) => s.query);
  const setQuery = useCatalogStore((s) => s.setQuery);
  const sort = useCatalogStore((s) => s.sort);
  const setSort = useCatalogStore((s) => s.setSort);
  const view = useCatalogStore((s) => s.view);
  const setView = useCatalogStore((s) => s.setView);
  const page = useCatalogStore((s) => s.page);
  const setPage = useCatalogStore((s) => s.setPage);

  /** Formatters bound to the shop's locale, so pages never construct Intl. */
  const format = useMemo(
    () => ({
      price: (n: number) => formatPrice(n, config.locale),
      date: (iso: string) => formatDate(iso, config.locale),
      currency: config.locale.currency,
    }),
    [config.locale]
  );

  return {
    /** Products, filtered, sorted and paginated. */
    catalog,
    categories,
    categoriesLoading,
    cart,
    wishlist,
    auth,
    addresses,
    payments,
    orders,
    facets,
    format,
    /** Browse state, for search boxes, sort selects and view switches. */
    browse: { query, setQuery, sort, setSort, view, setView, page, setPage },
    config,
  };
}

/** A single product plus its related pieces, for a detail page. */
export function useShopProduct<T extends ShopProduct = ShopProduct>(id: string | number) {
  const { product, related, loading, error } = useProduct<T>(id);
  const cart = useCart();
  const wishlist = useWishlist();
  const config = useShopConfig<T>();

  return {
    product,
    related,
    loading,
    error,
    cart,
    wishlist,
    format: {
      price: (n: number) => formatPrice(n, config.locale),
      currency: config.locale.currency,
    },
  };
}
