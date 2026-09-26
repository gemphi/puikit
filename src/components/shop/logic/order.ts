import type {
  ShopAddress,
  ShopCartItem,
  ShopOrder,
  ShopPaymentMethod,
} from '../../../types/shop';

/** Mint an order id. Apps can override the prefix; the shape stays consistent. */
export const newOrderId = (prefix = 'ORD'): string =>
  `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

export const newAddressId = (): string => `addr-${Date.now().toString(36)}`;
export const newPaymentMethodId = (): string => `pm-${Date.now().toString(36)}`;

export interface BuildOrderInput {
  items: ShopCartItem[];
  shippingAddress?: ShopAddress;
  paymentMethod?: ShopPaymentMethod;
  userId?: string;
  idPrefix?: string;
}

/**
 * Assemble an order from a bag.
 *
 * Line prices are captured at build time (`priceAtPurchase`), so a later catalog
 * price change never rewrites what someone was charged.
 */
export function buildOrder({
  items,
  shippingAddress,
  paymentMethod,
  userId,
  idPrefix,
}: BuildOrderInput): ShopOrder {
  return {
    id: newOrderId(idPrefix),
    userId,
    date: new Date().toISOString().slice(0, 10),
    status: 'processing',
    totalAmount: items.reduce((n, i) => n + i.price * i.quantity, 0),
    items: items.map((i) => ({
      product: i,
      quantity: i.quantity,
      priceAtPurchase: i.price,
      selectedOptions: i.selectedOptions,
    })),
    shippingAddress,
    paymentMethod,
  };
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

export interface TotalsOptions {
  /** Flat shipping cost. Free when the subtotal reaches `freeShippingOver`. */
  shipping?: number;
  freeShippingOver?: number;
  taxRate?: number;
  discount?: number;
}

/** Compute totals once, so a summary and a review step can never disagree. */
export function calculateTotals(items: ShopCartItem[], options: TotalsOptions = {}): OrderTotals {
  const { shipping = 0, freeShippingOver, taxRate = 0, discount = 0 } = options;
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shippingDue =
    freeShippingOver !== undefined && subtotal >= freeShippingOver ? 0 : items.length ? shipping : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  return {
    subtotal,
    shipping: shippingDue,
    tax,
    discount,
    total: taxable + shippingDue + tax,
  };
}
