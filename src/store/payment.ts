import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';
import type { ShopPaymentMethod } from '../types/shop';

export interface PaymentState {
  items: ShopPaymentMethod[];
  selectedId: string | null;

  add: (method: ShopPaymentMethod) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
  select: (id: string | null) => void;
  hydrate: (items: ShopPaymentMethod[]) => void;

  selected: () => ShopPaymentMethod | null;
  defaultMethod: () => ShopPaymentMethod | null;
}

export const paymentStore = createStore<PaymentState>(
  persist<PaymentState>('shop:payment')((set, get) => ({
    items: [],
    selectedId: null,

    add: (method) => {
      const items = get().items;
      const isFirst = items.length === 0;
      set({ items: [...items, { ...method, isDefault: method.isDefault ?? isFirst }] });
    },
    remove: (id) =>
      set({
        items: get().items.filter((m) => m.id !== id),
        selectedId: get().selectedId === id ? null : get().selectedId,
      }),
    setDefault: (id) => set({ items: get().items.map((m) => ({ ...m, isDefault: m.id === id })) }),
    select: (id) => set({ selectedId: id }),
    hydrate: (items) => set({ items }),

    selected: () => get().items.find((m) => m.id === get().selectedId) ?? null,
    defaultMethod: () => get().items.find((m) => m.isDefault) ?? get().items[0] ?? null,
  }))
);

/** Subscribe to the payment store. Pass a selector to narrow the subscription. */
export function usePaymentStore(): PaymentState;
export function usePaymentStore<T>(selector: (state: PaymentState) => T): T;
export function usePaymentStore<T>(selector?: (state: PaymentState) => T) {
  return useStore(paymentStore, selector as (state: PaymentState) => T);
}
