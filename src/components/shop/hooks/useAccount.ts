import { useAuthStore } from '../../../store/auth';
import { useAddressStore } from '../../../store/address';
import { usePaymentStore } from '../../../store/payment';
import { useOrderStore } from '../../../store/order';
import { useWishlistStore } from '../../../store/wishlist';
import { useCartStore } from '../../../store/cart';
import type { ShopAddress, ShopPaymentMethod, ShopProduct } from '../../../types/shop';
import { useShopConfig } from '../provider';
import { detectCardBrand, lastFour } from '../logic/validation';
import { newAddressId, newPaymentMethodId } from '../logic/order';

/**
 * Identity, plus the hydration that must accompany it.
 *
 * Signing in is not only an auth change: the address book, saved cards and
 * order history all belong to that identity. Doing it in one place is what
 * stops a page from showing the previous user's data after a switch.
 */
export function useAuth() {
  const auth = useAuthStore();
  const address = useAddressStore();
  const payment = usePaymentStore();
  const order = useOrderStore();
  const { adapter } = useShopConfig();

  const signIn = async (email?: string) => {
    auth.startAuth();
    const user = (await adapter.signIn?.(email)) ?? null;
    if (!user) {
      auth.failAuth('Sign in failed');
      return null;
    }
    auth.signIn(user);
    const [addresses, methods, orders] = await Promise.all([
      adapter.getAddresses?.(user.id) ?? Promise.resolve([]),
      adapter.getPaymentMethods?.(user.id) ?? Promise.resolve([]),
      adapter.getOrders?.(user.id) ?? Promise.resolve([]),
    ]);
    address.hydrate(addresses);
    payment.hydrate(methods);
    order.hydrate(orders);
    return user;
  };

  const signOut = () => {
    auth.signOut();
    address.hydrate([]);
    payment.hydrate([]);
    order.hydrate([]);
  };

  return {
    user: auth.user,
    status: auth.status,
    error: auth.error,
    isGuest: auth.isGuest(),
    displayName: auth.user.firstName ?? auth.user.username ?? '',
    signIn,
    signOut,
  };
}

export function useAddressBook() {
  const store = useAddressStore();
  return {
    items: store.items,
    hasItems: store.items.length > 0,
    selected: store.selected() ?? store.defaultAddress(),
    selectedId: store.selectedId,
    select: store.select,
    setDefault: store.setDefault,
    remove: store.remove,
    /** Add and select — an address captured during checkout is the one in use. */
    add: (address: Omit<ShopAddress, 'id'>) => {
      const id = newAddressId();
      store.add({ ...address, id });
      store.select(id);
      return id;
    },
  };
}

export function usePaymentMethods() {
  const store = usePaymentStore();
  return {
    items: store.items,
    hasItems: store.items.length > 0,
    selected: store.selected() ?? store.defaultMethod(),
    selectedId: store.selectedId,
    select: store.select,
    setDefault: store.setDefault,
    remove: store.remove,
    /**
     * Capture a card. Only the last four digits and the detected brand are
     * retained — a full card number never enters the store or localStorage.
     */
    add: (input: { cardholderName: string; cardNumber: string; expiry: string }) => {
      const id = newPaymentMethodId();
      const method: ShopPaymentMethod = {
        id,
        cardholderName: input.cardholderName,
        lastFour: lastFour(input.cardNumber),
        expiry: input.expiry,
        brand: detectCardBrand(input.cardNumber),
      };
      store.add(method);
      store.select(id);
      return id;
    },
  };
}

export function useWishlist() {
  const store = useWishlistStore();
  const cart = useCartStore();
  return {
    items: store.items,
    count: store.count(),
    hasItems: store.items.length > 0,
    has: store.has,
    toggle: store.toggle,
    remove: store.remove,
    clear: store.clear,
    /** Moving to the bag is a wishlist affordance, so it belongs here. */
    moveToCart: (product: ShopProduct) => {
      cart.addItem(product);
      store.remove(product.id);
    },
  };
}
