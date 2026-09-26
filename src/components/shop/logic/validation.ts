/**
 * Form validation for shop flows.
 *
 * Messages are injected rather than written here, so the library stays free of
 * user-facing copy and an app supplies its own translated strings.
 */
export type Validator = (value: string) => string | null;

export interface ValidationMessages {
  required: string;
  email: string;
  card: string;
  expiry: string;
  postalCode: string;
}

export const DEFAULT_MESSAGES: ValidationMessages = {
  required: 'This field is required',
  email: 'Enter a valid email address',
  card: 'Enter a 16-digit card number',
  expiry: 'Use MM/YY',
  postalCode: 'Enter a valid postal code',
};

export const validators = (messages: ValidationMessages = DEFAULT_MESSAGES) => ({
  required: ((v) => (v.trim() ? null : messages.required)) as Validator,
  email: ((v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : messages.email) as Validator,
  card: ((v) => (/^\d{16}$/.test(v.replace(/\s+/g, '')) ? null : messages.card)) as Validator,
  expiry: ((v) => (/^(0[1-9]|1[0-2])\/\d{2}$/.test(v.trim()) ? null : messages.expiry)) as Validator,
  postalCode: ((v) =>
    /^[A-Za-z0-9][A-Za-z0-9\s-]{1,9}$/.test(v.trim()) ? null : messages.postalCode) as Validator,
});

/** Run validators in order, returning the first failure. */
export const all =
  (...list: Validator[]): Validator =>
  (value) => {
    for (const v of list) {
      const error = v(value);
      if (error) return error;
    }
    return null;
  };

export function validateFields(
  values: Record<string, string>,
  rules: Record<string, Validator>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, rule] of Object.entries(rules)) {
    const error = rule(values[field] ?? '');
    if (error) errors[field] = error;
  }
  return errors;
}

/** Keep only the last four digits — a full card number is never stored. */
export const lastFour = (cardNumber: string): string => cardNumber.replace(/\D/g, '').slice(-4);

/** Infer the card brand from leading digits, so shoppers need not pick one. */
export function detectCardBrand(cardNumber: string): string {
  const d = cardNumber.replace(/\D/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return 'card';
}
