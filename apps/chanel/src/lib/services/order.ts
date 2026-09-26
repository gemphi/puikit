import type { ShopOrder, ShopOrderStatus, ShopCartItem, ShopAddress, ShopPaymentMethod } from '@pui/types';
import rawOrders from '../../mocks/api-orders.json';
import { resolve } from './client';
import { getProductById } from './product';
import { getAddresses } from './address';
import { getPaymentMethods } from './payment';

interface OrderRecord {
  id: string;
  userId: string;
  date: string;
  status: string;
  addressId: string;
  paymentMethodId: string;
  lines: Array<{ productId: string; quantity: number }>;
}

const records = rawOrders as OrderRecord[];

/**
 * Hydrate stored order records into full domain orders.
 *
 * The payload stores ids and quantities only — the product, address and card
 * are resolved through their own services, so an order can never disagree with
 * the catalog it references.
 */
export async function getOrders(userId: string): Promise<ShopOrder[]> {
  const [addresses, methods] = await Promise.all([getAddresses(userId), getPaymentMethods(userId)]);

  const hydrated = await Promise.all(
    records
      .filter((r) => r.userId === userId)
      .map(async (r) => {
        const items = (
          await Promise.all(
            r.lines.map(async (line) => {
              const product = await getProductById(line.productId);
              return product
                ? { product, quantity: line.quantity, priceAtPurchase: product.price }
                : null;
            })
          )
        ).filter((i): i is NonNullable<typeof i> => i !== null);

        const order: ShopOrder = {
          id: r.id,
          userId: r.userId,
          date: r.date,
          status: r.status as ShopOrderStatus,
          totalAmount: items.reduce((n, i) => n + i.priceAtPurchase * i.quantity, 0),
          items,
          shippingAddress: addresses.find((a) => a.id === r.addressId),
          paymentMethod: methods.find((m) => m.id === r.paymentMethodId),
        };
        return order;
      })
  );

  return resolve(hydrated.sort((a, b) => b.date.localeCompare(a.date)));
}

/** Order ids are minted here so the format lives in one place. */
export const newOrderId = (): string =>
  `CH-${Math.floor(1000 + Math.random() * 9000)}`;

/** Assemble an order from the current bag. Placement itself is the store's job. */
export function buildOrder(
  items: ShopCartItem[],
  shippingAddress?: ShopAddress,
  paymentMethod?: ShopPaymentMethod,
  userId?: string
): ShopOrder {
  return {
    id: newOrderId(),
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
