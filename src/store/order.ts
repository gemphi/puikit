import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';
import type { ShopOrder, ShopOrderStatus } from '../types/shop';

export interface OrderState {
  items: ShopOrder[];
  /** Set while an order is in flight, so checkout can disable submission. */
  isPlacing: boolean;
  lastPlacedId: string | null;
  error: string | null;

  startPlacing: () => void;
  placed: (order: ShopOrder) => void;
  failPlacing: (message: string) => void;
  clearLastPlaced: () => void;
  setStatus: (id: string, status: ShopOrderStatus) => void;
  hydrate: (items: ShopOrder[]) => void;

  byId: (id: string) => ShopOrder | null;
  byStatus: (status: ShopOrderStatus) => ShopOrder[];
  lastPlaced: () => ShopOrder | null;
}

export const orderStore = createStore<OrderState>(
  persist<OrderState>('shop:order')((set, get) => ({
    items: [],
    isPlacing: false,
    lastPlacedId: null,
    error: null,

    startPlacing: () => set({ isPlacing: true, error: null }),
    placed: (order) =>
      set({ items: [order, ...get().items], isPlacing: false, lastPlacedId: order.id, error: null }),
    failPlacing: (message) => set({ isPlacing: false, error: message }),
    clearLastPlaced: () => set({ lastPlacedId: null }),
    setStatus: (id, status) =>
      set({ items: get().items.map((o) => (o.id === id ? { ...o, status } : o)) }),
    hydrate: (items) => set({ items }),

    byId: (id) => get().items.find((o) => o.id === id) ?? null,
    byStatus: (status) => get().items.filter((o) => o.status === status),
    lastPlaced: () => {
      const id = get().lastPlacedId;
      return id ? get().items.find((o) => o.id === id) ?? null : null;
    },
  }))
);

/** Subscribe to the order store. Pass a selector to narrow the subscription. */
export function useOrderStore(): OrderState;
export function useOrderStore<T>(selector: (state: OrderState) => T): T;
export function useOrderStore<T>(selector?: (state: OrderState) => T) {
  return useStore(orderStore, selector as (state: OrderState) => T);
}
