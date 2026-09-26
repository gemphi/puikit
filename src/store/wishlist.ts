import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';
import type { ShopProduct } from '../types/shop';

export interface WishlistState {
  items: ShopProduct[];
  toggle: (product: ShopProduct) => void;
  add: (product: ShopProduct) => void;
  remove: (id: string | number) => void;
  clear: () => void;
  has: (id: string | number) => boolean;
  count: () => number;
}

export const wishlistStore = createStore<WishlistState>(
  persist<WishlistState>('shop:wishlist')((set, get) => ({
    items: [],
    toggle: (product) =>
      get().items.some((i) => i.id === product.id) ? get().remove(product.id) : get().add(product),
    add: (product) =>
      set({ items: get().items.some((i) => i.id === product.id) ? get().items : [...get().items, product] }),
    remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    clear: () => set({ items: [] }),
    has: (id) => get().items.some((i) => i.id === id),
    count: () => get().items.length,
  }))
);

/** Subscribe to the wishlist store. Pass a selector to narrow the subscription. */
export function useWishlistStore(): WishlistState;
export function useWishlistStore<T>(selector: (state: WishlistState) => T): T;
export function useWishlistStore<T>(selector?: (state: WishlistState) => T) {
  return useStore(wishlistStore, selector as (state: WishlistState) => T);
}
