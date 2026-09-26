import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';
import type { ShopUser } from '../types/shop';

/**
 * The anonymous shopper every session starts as. A guest can browse, filter,
 * fill a cart and reach checkout; only order placement requires identifying.
 */
export const GUEST_USER: ShopUser = { id: 'guest', isGuest: true };

export interface AuthState {
  user: ShopUser;
  status: 'guest' | 'authenticating' | 'authenticated';
  error: string | null;

  signIn: (user: ShopUser) => void;
  signOut: () => void;
  startAuth: () => void;
  failAuth: (message: string) => void;
  update: (patch: Partial<ShopUser>) => void;

  isGuest: () => boolean;
}

export const authStore = createStore<AuthState>(
  persist<AuthState>('shop:auth')((set, get) => ({
    user: GUEST_USER,
    status: 'guest',
    error: null,

    signIn: (user) => set({ user: { ...user, isGuest: false }, status: 'authenticated', error: null }),
    signOut: () => set({ user: GUEST_USER, status: 'guest', error: null }),
    startAuth: () => set({ status: 'authenticating', error: null }),
    failAuth: (message) => set({ status: 'guest', error: message }),
    update: (patch) => set({ user: { ...get().user, ...patch } }),

    isGuest: () => get().user.isGuest !== false,
  }))
);

/** Subscribe to the auth store. Pass a selector to narrow the subscription. */
export function useAuthStore(): AuthState;
export function useAuthStore<T>(selector: (state: AuthState) => T): T;
export function useAuthStore<T>(selector?: (state: AuthState) => T) {
  return useStore(authStore, selector as (state: AuthState) => T);
}
