import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';
import type { ShopCartItem, ShopProduct, ShopSelectedOptions } from '../types/shop';

/** Identity of a cart line: same product *and* same chosen options. */
const lineKey = (id: string | number, options?: ShopSelectedOptions): string =>
  `${id}::${JSON.stringify(options ?? {})}`;

export interface CartState {
  items: ShopCartItem[];
  isOpen: boolean;

  addItem: (product: ShopProduct, selectedOptions?: ShopSelectedOptions, quantity?: number) => void;
  removeItem: (id: string | number, selectedOptions?: ShopSelectedOptions) => void;
  updateQuantity: (id: string | number, quantity: number, selectedOptions?: ShopSelectedOptions) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  hydrate: (items: ShopCartItem[]) => void;

  totalCount: () => number;
  totalPrice: () => number;
  has: (id: string | number, selectedOptions?: ShopSelectedOptions) => boolean;
}

export const cartStore = createStore<CartState>(
  persist<CartState>('shop:cart')((set, get) => ({
    items: [],
    isOpen: false,

    addItem: (product, selectedOptions, quantity = 1) => {
      const key = lineKey(product.id, selectedOptions);
      const items = get().items;
      const existing = items.find((i) => lineKey(i.id, i.selectedOptions) === key);
      set({
        items: existing
          ? items.map((i) =>
              lineKey(i.id, i.selectedOptions) === key ? { ...i, quantity: i.quantity + quantity } : i
            )
          : [...items, { ...product, quantity, selectedOptions }],
        isOpen: true,
      });
    },

    removeItem: (id, selectedOptions) => {
      const key = lineKey(id, selectedOptions);
      set({ items: get().items.filter((i) => lineKey(i.id, i.selectedOptions) !== key) });
    },

    updateQuantity: (id, quantity, selectedOptions) => {
      const key = lineKey(id, selectedOptions);
      const next = Math.max(0, quantity);
      set({
        items:
          next === 0
            ? get().items.filter((i) => lineKey(i.id, i.selectedOptions) !== key)
            : get().items.map((i) =>
                lineKey(i.id, i.selectedOptions) === key ? { ...i, quantity: next } : i
              ),
      });
    },

    clear: () => set({ items: [] }),
    setOpen: (open) => set({ isOpen: open }),
    hydrate: (items) => set({ items }),

    totalCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
    totalPrice: () => get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    has: (id, selectedOptions) => {
      const key = lineKey(id, selectedOptions);
      return get().items.some((i) => lineKey(i.id, i.selectedOptions) === key);
    },
  }))
);

/** Subscribe to the cart store. Pass a selector to narrow the subscription. */
export function useCartStore(): CartState;
export function useCartStore<T>(selector: (state: CartState) => T): T;
export function useCartStore<T>(selector?: (state: CartState) => T) {
  return useStore(cartStore, selector as (state: CartState) => T);
}
