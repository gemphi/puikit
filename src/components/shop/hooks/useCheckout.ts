import { useState } from 'react';
import { useCartStore } from '../../../store/cart';
import { useOrderStore } from '../../../store/order';
import { useAuthStore } from '../../../store/auth';
import { useShopConfig } from '../provider';
import { buildOrder } from '../logic/order';
import { validateFields, type Validator } from '../logic/validation';
import { useAddressBook, usePaymentMethods } from './useAccount';

/** The steps a checkout moves through, in order. */
export const CHECKOUT_STEPS = ['contact', 'shipping', 'payment', 'review'] as const;
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

/**
 * The whole checkout flow: step machine, per-step validation, and placement.
 *
 * A page renders the fields for the current step and calls `next()`. It owns no
 * ordering, no validation and no order assembly — which is what makes a
 * storefront's checkout page a layout exercise rather than a rewrite.
 */
export function useCheckout() {
  const [step, setStep] = useState<CheckoutStep>('contact');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cart = useCartStore();
  const order = useOrderStore();
  const auth = useAuthStore();
  const address = useAddressBook();
  const payment = usePaymentMethods();
  const { orderIdPrefix } = useShopConfig();

  const index = CHECKOUT_STEPS.indexOf(step);

  /** What must hold before leaving the current step. */
  const stepRules = (current: CheckoutStep): Record<string, Validator> => {
    switch (current) {
      case 'contact':
        return {
          email: (v) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'Enter a valid email address',
        };
      default:
        return {};
    }
  };

  const canAdvance = (): boolean => {
    if (step === 'shipping') return Boolean(address.selected);
    if (step === 'payment') return Boolean(payment.selected);
    return true;
  };

  const next = (): boolean => {
    const found = validateFields({ email }, stepRules(step));
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return false;
    }
    if (!canAdvance()) return false;
    setErrors({});
    if (index < CHECKOUT_STEPS.length - 1) setStep(CHECKOUT_STEPS[index + 1]);
    return true;
  };

  const back = () => {
    setErrors({});
    if (index > 0) setStep(CHECKOUT_STEPS[index - 1]);
  };

  const place = async () => {
    order.startPlacing();
    try {
      const built = buildOrder({
        items: cart.items,
        shippingAddress: address.selected ?? undefined,
        paymentMethod: payment.selected ?? undefined,
        userId: auth.user.id,
        idPrefix: orderIdPrefix,
      });
      order.placed(built);
      // The bag is cleared only after the order is recorded, so a failure
      // mid-flight leaves the shopper's bag intact rather than emptying it.
      cart.clear();
      return built;
    } catch (e) {
      order.failPlacing(e instanceof Error ? e.message : 'Could not place the order');
      return null;
    }
  };

  return {
    step,
    stepIndex: index,
    steps: CHECKOUT_STEPS,
    isFirst: index === 0,
    isLast: index === CHECKOUT_STEPS.length - 1,
    email,
    setEmail,
    errors,
    canAdvance: canAdvance(),
    next,
    back,
    goTo: setStep,
    place,
    isPlacing: order.isPlacing,
    placeError: order.error,
    address,
    payment,
    isGuest: auth.isGuest(),
  };
}

export function useOrders() {
  const store = useOrderStore();
  return {
    items: store.items,
    hasItems: store.items.length > 0,
    isPlacing: store.isPlacing,
    error: store.error,
    lastPlaced: store.lastPlaced(),
    byId: store.byId,
    byStatus: store.byStatus,
  };
}
