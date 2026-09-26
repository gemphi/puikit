import { createStore } from './createStore';
import { useStore } from '../hooks/useStore';
import type { ShopAlert, ShopAlertTone } from '../types/shop';

let seq = 0;
const nextId = (): string => `alert-${++seq}`;

export interface AlertState {
  items: ShopAlert[];

  push: (alert: Omit<ShopAlert, 'id'> & { id?: string }) => string;
  notify: (tone: ShopAlertTone, message: string, title?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

/**
 * Transient user-facing messages. Deliberately *not* persisted — an alert that
 * survives a reload is a stale alert.
 */
export const alertStore = createStore<AlertState>((set, get) => ({
  items: [],

  push: (alert) => {
    const id = alert.id ?? nextId();
    set({ items: [...get().items, { ...alert, id }] });
    return id;
  },
  notify: (tone, message, title) => get().push({ tone, message, title }),
  dismiss: (id) => set({ items: get().items.filter((a) => a.id !== id) }),
  clear: () => set({ items: [] }),
}));

/** Subscribe to the alert store. Pass a selector to narrow the subscription. */
export function useAlertStore(): AlertState;
export function useAlertStore<T>(selector: (state: AlertState) => T): T;
export function useAlertStore<T>(selector?: (state: AlertState) => T) {
  return useStore(alertStore, selector as (state: AlertState) => T);
}
