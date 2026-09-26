import type { ShopProduct, ShopSortKey } from '@pui/types';
import raw from '../../mocks/api-products.json';
import { resolve } from './client';

/**
 * A catalog product as this storefront models it: the shared `ShopProduct`
 * plus the two attributes the maison cares about — the `line` a piece belongs
 * to, and whether it is new or boutique-exclusive.
 */
export interface Product extends ShopProduct {
  id: string;
  category: string;
  line: string;
  material?: string;
  collection?: string;
  inStock?: boolean;
  isNew?: boolean;
  isExclusive?: boolean;
}

/** The single place that knows the payload shape. */
const products: Product[] = (raw as Product[]).map((p) => ({ ...p, currency: 'EUR' }));

export const getProducts = async (limit = products.length): Promise<Product[]> =>
  resolve(products.slice(0, limit));

export const getProductById = async (id: string): Promise<Product | null> =>
  resolve(products.find((p) => p.id === id) ?? null);

export const getProductsByCategory = async (slug: string, limit = products.length): Promise<Product[]> =>
  resolve(products.filter((p) => p.category === slug).slice(0, limit));

export const getNewArrivals = async (limit = 8): Promise<Product[]> =>
  resolve(products.filter((p) => p.isNew).slice(0, limit));

export const getRelatedProducts = async (product: Product, limit = 4): Promise<Product[]> =>
  resolve(products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit));

export const getBestSellers = async (limit = 8): Promise<Product[]> =>
  resolve([...products].sort((a, b) => (b.rating?.count ?? 0) - (a.rating?.count ?? 0)).slice(0, limit));

/** Free-text match across the fields a shopper would plausibly type. */
export function searchProducts(list: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) =>
    [p.title, p.description, p.line, p.category].some((f) => f?.toLowerCase().includes(q))
  );
}

export function sortProducts(list: Product[], sort: ShopSortKey): Product[] {
  const arr = [...list];
  switch (sort) {
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'rating':
      return arr.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0));
    case 'newest':
      return arr.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    case 'relevance':
    default:
      return arr;
  }
}
