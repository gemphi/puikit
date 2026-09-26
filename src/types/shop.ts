/**
 * Shop domain models.
 *
 * These are the *shapes* the shop stores and headless shop components agree on.
 * They are deliberately structural (no classes, no branded ids) so a consuming
 * app can map its own API payloads onto them without adapters, and generic over
 * `id` so numeric-id and string-id backends both fit.
 */

/** Aggregate customer rating for a product. */
export interface ShopRating {
  rate: number;
  count: number;
}

/** A selectable colour option, carrying its own swatch value. */
export interface ShopOptionColor {
  hex: string;
  name: string;
}

/** The option axes a product can be configured along. */
export interface ShopProductOptions {
  colors?: ShopOptionColor[];
  sizes?: string[];
  [axis: string]: unknown;
}

/** The option values a shopper actually chose. */
export interface ShopSelectedOptions {
  color?: string;
  size?: string;
  [axis: string]: string | undefined;
}

/** A catalog product. */
export interface ShopProduct {
  id: string | number;
  title: string;
  price: number;
  description?: string;
  category?: string;
  image?: string;
  images?: string[];
  currency?: string;
  options?: ShopProductOptions;
  rating?: ShopRating;
  /** Escape hatch for backend-specific fields the library never reads. */
  meta?: Record<string, unknown>;
}

/** A product placed in the cart, with quantity and chosen options. */
export interface ShopCartItem extends ShopProduct {
  quantity: number;
  selectedOptions?: ShopSelectedOptions;
}

/** A postal address held against an account. */
export interface ShopAddress {
  id: string;
  label?: string;
  recipient?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

/** A stored payment instrument. Never holds a full card number. */
export interface ShopPaymentMethod {
  id: string;
  cardholderName: string;
  lastFour: string;
  expiry: string;
  brand?: string;
  isDefault?: boolean;
}

/** Lifecycle states an order moves through. */
export type ShopOrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/** A line on a placed order, priced at the moment of purchase. */
export interface ShopOrderItem {
  product: ShopProduct;
  quantity: number;
  priceAtPurchase: number;
  selectedOptions?: ShopSelectedOptions;
}

/** A placed order. */
export interface ShopOrder {
  id: string;
  userId?: string;
  date: string;
  status: ShopOrderStatus;
  totalAmount: number;
  items: ShopOrderItem[];
  shippingAddress?: ShopAddress;
  paymentMethod?: ShopPaymentMethod;
}

/** The signed-in (or guest) shopper. */
export interface ShopUser {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  /** True for the anonymous shopper the app starts with. */
  isGuest?: boolean;
  addresses?: ShopAddress[];
  paymentMethods?: ShopPaymentMethod[];
}

/** Severity of a transient user-facing message. */
export type ShopAlertTone = 'info' | 'success' | 'warning' | 'error';

/** A transient user-facing message. */
export interface ShopAlert {
  id: string;
  tone: ShopAlertTone;
  message: string;
  title?: string;
  /** Auto-dismiss delay in ms. `0` or omitted means it stays until dismissed. */
  timeout?: number;
}

/** A single selectable facet value with its result count. */
export interface ShopFacetValue {
  value: string;
  label?: string;
  count?: number;
  /** Swatch colour, for a dimension drawn as colour chips rather than checkboxes. */
  hex?: string;
}

/** A filterable dimension of the catalog. */
export interface ShopFacet {
  id: string;
  label: string;
  values: ShopFacetValue[];
}

/** How a catalog listing is ordered. */
export type ShopSortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
