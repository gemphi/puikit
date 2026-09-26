/**
 * Identifier accepted by every shop component.
 *
 * Backends disagree about whether a product id is a number or a string, and a
 * UI library has no business forcing that choice on the app. Both are accepted
 * and passed back out through callbacks unchanged.
 */
export type ShopId = string | number;
