import React, { createContext, useContext, useMemo } from 'react';
import type {
  ShopAddress,
  ShopOrder,
  ShopPaymentMethod,
  ShopProduct,
  ShopUser,
} from '../../types/shop';
import type { FacetDefinition } from './logic/catalog';
import { DEFAULT_LOCALE_CONFIG, type ShopLocaleConfig } from './logic/format';
import { DEFAULT_MESSAGES, type ValidationMessages } from './logic/validation';
import type { TotalsOptions } from './logic/order';

/**
 * The data seam between an app and the shop module.
 *
 * An app implements this and supplies nothing else — no filtering, no sorting,
 * no faceting, no order assembly. Everything above the adapter is the library's
 * job. Every method is optional so a storefront can adopt the module a surface
 * at a time.
 */
export interface ShopAdapter<T extends ShopProduct = ShopProduct> {
  getProducts?: () => Promise<T[]>;
  getProductById?: (id: string | number) => Promise<T | null>;
  getProductsByCategory?: (categoryId: string) => Promise<T[]>;
  getRelatedProducts?: (product: T) => Promise<T[]>;

  getCategories?: () => Promise<Array<{ slug: string; name: string; tagline?: string }>>;

  signIn?: (email?: string) => Promise<ShopUser | null>;
  getAddresses?: (userId: string) => Promise<ShopAddress[]>;
  getPaymentMethods?: (userId: string) => Promise<ShopPaymentMethod[]>;
  getOrders?: (userId: string) => Promise<ShopOrder[]>;
}

export interface ShopConfig<T extends ShopProduct = ShopProduct> {
  adapter: ShopAdapter<T>;
  /** Facet dimensions, declared as data. See `attributeFacet` / `priceBandFacet`. */
  facets?: FacetDefinition<T>[];
  /** Fields free-text search reads. Defaults to title, description and category. */
  searchFields?: (product: T) => Array<string | undefined>;
  locale?: ShopLocaleConfig;
  /** Shipping, tax and discount rules used by every totals calculation. */
  totals?: TotalsOptions;
  validationMessages?: ValidationMessages;
  /** Prefix for generated order ids. */
  orderIdPrefix?: string;
  pageSize?: number;
}

/** A `ShopConfig` with every optional field resolved to its default. */
export interface ResolvedShopConfig<T extends ShopProduct = ShopProduct>
  extends Required<Omit<ShopConfig<T>, 'searchFields'>> {
  searchFields?: (product: T) => Array<string | undefined>;
}

const ShopContext = createContext<ResolvedShopConfig<ShopProduct> | null>(null);

export interface ShopProviderProps<T extends ShopProduct = ShopProduct> extends ShopConfig<T> {
  children: React.ReactNode;
}

/**
 * Supplies the shop module with its data source and its rules.
 *
 * Wrap the app once; every shop hook and view reads from here.
 */
export function ShopProvider<T extends ShopProduct = ShopProduct>({
  children,
  adapter,
  facets = [],
  searchFields,
  locale = DEFAULT_LOCALE_CONFIG,
  totals = {},
  validationMessages = DEFAULT_MESSAGES,
  orderIdPrefix = 'ORD',
  pageSize = 24,
}: ShopProviderProps<T>) {
  const value = useMemo(
    () => ({
      adapter,
      facets,
      searchFields,
      locale,
      totals,
      validationMessages,
      orderIdPrefix,
      pageSize,
    }),
    [adapter, facets, searchFields, locale, totals, validationMessages, orderIdPrefix, pageSize]
  );

  return (
    <ShopContext.Provider value={value as unknown as ResolvedShopConfig<ShopProduct>}>
      {children}
    </ShopContext.Provider>
  );
}

/**
 * The shop config when inside a `ShopProvider`, otherwise `null`.
 *
 * Presentational components use this so they pick up the app's locale and
 * currency automatically, while still rendering standalone in a docs page or a
 * test with sensible defaults.
 */
export function useOptionalShopConfig<T extends ShopProduct = ShopProduct>(): ResolvedShopConfig<T> | null {
  return useContext(ShopContext) as unknown as ResolvedShopConfig<T> | null;
}

export function useShopConfig<T extends ShopProduct = ShopProduct>(): ResolvedShopConfig<T> {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error('Shop components must be rendered inside <ShopProvider>.');
  }
  return ctx as unknown as ResolvedShopConfig<T>;
}
