import type { ShopUser } from '@pui/types';
import raw from '../../mocks/api-users.json';
import { resolve } from './client';

const users = raw as ShopUser[];

/**
 * Sign in. The demo storefront has one known customer; a real implementation
 * would post credentials and return the authenticated user.
 */
export const signIn = async (email?: string): Promise<ShopUser | null> =>
  resolve(email ? users.find((u) => u.email === email) ?? users[0] ?? null : users[0] ?? null);

export const getDemoUser = async (): Promise<ShopUser | null> => resolve(users[0] ?? null);
