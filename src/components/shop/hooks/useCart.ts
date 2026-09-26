import { useCartStore } from '../../../store/cart';
import type { ShopCartItem, ShopProduct, ShopSelectedOptions } from '../../../types/shop';
import { useShopConfig } from '../provider';
import { calculateTotals, type OrderTotals } from '../logic/order';
import { formatPrice } from '../logic/format';

export interface CartResult {
  items: ShopCartItem[];
  isOpen: boolean;
  count: number;
  hasItems: boolean;
  totals: OrderTotals;
  /** Totals pre-formatted with the shop's locale, for direct rendering. */
  formatted: { subtotal: string; shipping: string; tax: string; total: string };
  add: (product: ShopProduct, options?: ShopSelectedOptions, quantity?: number) => void;
  remove: (id: string | number, options?: ShopSelectedOptions) => void;
  updateQuantity: (id: string | number, quantity: number, options?: ShopSelectedOptions) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  has: (id: string | number, options?: ShopSelectedOptions) => boolean;
}

/**
 * The bag.
 *
 * Totals are computed once here from the shop's shipping and tax rules, so a
 * cart summary, a checkout review and an order confirmation cannot disagree.
 */
export function useCart(): CartResult {
  const store = useCartStore();
  const { totals: rules, locale } = useShopConfig();
  const totals = calculateTotals(store.items, rules);

  return {
    items: store.items,
    isOpen: store.isOpen,
    count: store.totalCount(),
    hasItems: store.items.length > 0,
    totals,
    formatted: {
      subtotal: formatPrice(totals.subtotal, locale),
      shipping: formatPrice(totals.shipping, locale),
      tax: formatPrice(totals.tax, locale),
      total: formatPrice(totals.total, locale),
    },
    add: store.addItem,
    remove: store.removeItem,
    updateQuantity: store.updateQuantity,
    clear: store.clear,
    setOpen: store.setOpen,
    has: store.has,
  };
}
