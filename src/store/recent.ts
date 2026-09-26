import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';
import type { ShopProduct } from '../types/shop';

/** How many recently-viewed products are retained. */
export const RECENT_LIMIT = 12;

export interface RecentState {
  items: ShopProduct[];
  limit: number;

  visit: (product: ShopProduct) => void;
  clear: () => void;
  setLimit: (limit: number) => void;
}

export const recentStore = createStore<RecentState>(
  persist<RecentState>('shop:recent')((set, get) => ({
    items: [],
    limit: RECENT_LIMIT,

    // Most recent first, de-duplicated, capped at `limit`.
    visit: (product) =>
      set({
        items: [product, ...get().items.filter((i) => i.id !== product.id)].slice(0, get().limit),
      }),
    clear: () => set({ items: [] }),
    setLimit: (limit) => set({ limit, items: get().items.slice(0, limit) }),
  }))
);

/** Subscribe to the recently-viewed store. Pass a selector to narrow it. */
export function useRecentStore(): RecentState;
export function useRecentStore<T>(selector: (state: RecentState) => T): T;
export function useRecentStore<T>(selector?: (state: RecentState) => T) {
  return useStore(recentStore, selector as (state: RecentState) => T);
}
