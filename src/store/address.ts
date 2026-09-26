import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';
import type { ShopAddress } from '../types/shop';

export interface AddressState {
  items: ShopAddress[];
  selectedId: string | null;

  add: (address: ShopAddress) => void;
  update: (id: string, patch: Partial<ShopAddress>) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
  select: (id: string | null) => void;
  hydrate: (items: ShopAddress[]) => void;

  selected: () => ShopAddress | null;
  defaultAddress: () => ShopAddress | null;
}

export const addressStore = createStore<AddressState>(
  persist<AddressState>('shop:address')((set, get) => ({
    items: [],
    selectedId: null,

    add: (address) => {
      const items = get().items;
      // The first address saved becomes the default automatically.
      const isFirst = items.length === 0;
      set({ items: [...items, { ...address, isDefault: address.isDefault ?? isFirst }] });
    },
    update: (id, patch) =>
      set({ items: get().items.map((a) => (a.id === id ? { ...a, ...patch } : a)) }),
    remove: (id) =>
      set({
        items: get().items.filter((a) => a.id !== id),
        selectedId: get().selectedId === id ? null : get().selectedId,
      }),
    setDefault: (id) =>
      set({ items: get().items.map((a) => ({ ...a, isDefault: a.id === id })) }),
    select: (id) => set({ selectedId: id }),
    hydrate: (items) => set({ items }),

    selected: () => get().items.find((a) => a.id === get().selectedId) ?? null,
    defaultAddress: () => get().items.find((a) => a.isDefault) ?? get().items[0] ?? null,
  }))
);

/** Subscribe to the address store. Pass a selector to narrow the subscription. */
export function useAddressStore(): AddressState;
export function useAddressStore<T>(selector: (state: AddressState) => T): T;
export function useAddressStore<T>(selector?: (state: AddressState) => T) {
  return useStore(addressStore, selector as (state: AddressState) => T);
}
