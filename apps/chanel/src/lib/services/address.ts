import type { ShopAddress } from '@pui/types';
import raw from '../../mocks/api-addresses.json';
import { resolve } from './client';

interface AddressRecord extends ShopAddress {
  userId: string;
}

const addresses = raw as AddressRecord[];

export const getAddresses = async (userId: string): Promise<ShopAddress[]> =>
  resolve(addresses.filter((a) => a.userId === userId).map(({ userId: _u, ...a }) => a));

/** Mint an id for an address captured in checkout. */
export const newAddressId = (): string => `addr-${Date.now().toString(36)}`;
