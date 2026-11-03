import type { ShopPaymentMethod } from '@pui/types';
import raw from '../../mocks/api-payment-methods.json';
import { resolve } from './client';

interface PaymentRecord extends ShopPaymentMethod {
  userId: string;
}

const methods = raw as PaymentRecord[];

export const getPaymentMethods = async (userId: string): Promise<ShopPaymentMethod[]> =>
  resolve(methods.filter((m) => m.userId === userId).map(({ userId: _u, ...m }) => m));

export const newPaymentMethodId = (): string => `pm-${Date.now().toString(36)}`;

/**
 * Infer the card brand from its leading digits, so the UI can show the right
 * mark without asking the shopper to pick one.
 */
export function detectBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'card';
}
