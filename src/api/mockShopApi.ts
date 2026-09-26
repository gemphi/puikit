import type {
  ShopAddress,
  ShopOrder,
  ShopPaymentMethod,
  ShopProduct,
  ShopUser,
} from '../types/shop';
import type { ShopAdapter } from '../components/shop/provider';

/**
 * A working in-memory shop backend.
 *
 * Its purpose is that `useShop` is operational the moment `ShopProvider` is
 * mounted — a new storefront renders real products, a real bag and a real
 * checkout before anyone writes an API client. Swapping to a live backend
 * means passing a different adapter; nothing above it changes.
 *
 * No external image URLs: product imagery is generated from the product id, so
 * the demo data works offline and cannot rot when a remote asset moves.
 */

/** FNV-1a — small, stable, and enough to spread ids across the variants. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

/**
 * Generate a product image as a data URI: a soft brand-tinted field with the
 * product's initials. Deterministic, so a product always looks the same.
 */
export function placeholderImage(seed: string, label: string): string {
  const h = hash(seed);
  const hue = h % 360;
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 30% 92%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 25% 82%)"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="url(#g)"/>
  <text x="150" y="168" text-anchor="middle" font-family="system-ui, sans-serif"
        font-size="72" font-weight="600" fill="hsl(${hue} 35% 35%)" fill-opacity="0.55">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(doc)}`;
}

const initials = (title: string): string =>
  title.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const product = (
  id: string,
  title: string,
  category: string,
  price: number,
  description: string,
  rate: number,
  count: number
): ShopProduct => ({
  id,
  title,
  category,
  price,
  description,
  image: placeholderImage(id, initials(title)),
  currency: 'USD',
  rating: { rate, count },
});

export const MOCK_PRODUCTS: ShopProduct[] = [
  product('prod-1', 'Quantum Neural Accelerator', 'Hardware', 4999, 'Ultra-high throughput tensor processing unit for low-latency inference.', 4.9, 142),
  product('prod-2', 'Cybernetic Workstation Node', 'Systems', 3200, 'Enterprise rackmount system preloaded with the platform kernel.', 4.8, 88),
  product('prod-3', 'Precision Optical Matrix Sensor', 'Sensors', 890, 'Sub-micron optical array for high-fidelity spatial capture.', 4.6, 214),
  product('prod-4', 'Thermal Regulation Module', 'Hardware', 640, 'Closed-loop liquid cooling for sustained full-load operation.', 4.4, 97),
  product('prod-5', 'Distributed Ledger Appliance', 'Systems', 5400, 'Tamper-evident append-only storage with hardware attestation.', 4.7, 63),
  product('prod-6', 'Inertial Reference Unit', 'Sensors', 1250, 'Six-axis inertial measurement with temperature compensation.', 4.5, 121),
];

export const MOCK_CATEGORIES = [
  { slug: 'Hardware', name: 'Hardware', tagline: 'Accelerators, cooling and interconnect.' },
  { slug: 'Systems', name: 'Systems', tagline: 'Complete rackmount and edge systems.' },
  { slug: 'Sensors', name: 'Sensors', tagline: 'Optical, inertial and environmental capture.' },
];

export const MOCK_USER: ShopUser = {
  id: 'demo',
  email: 'demo@example.com',
  username: 'demo',
  firstName: 'Demo',
  lastName: 'Customer',
  isGuest: false,
};

export const MOCK_ADDRESSES: ShopAddress[] = [
  { id: 'addr-1', label: 'Office', recipient: 'Demo Customer', street: '1 Example Way', city: 'Lisbon', postalCode: '1100-001', country: 'Portugal', isDefault: true },
];

export const MOCK_PAYMENT_METHODS: ShopPaymentMethod[] = [
  { id: 'pm-1', cardholderName: 'Demo Customer', lastFour: '4242', expiry: '09/29', brand: 'visa', isDefault: true },
];

export const MOCK_ORDERS: ShopOrder[] = [
  {
    id: 'ORD-1042',
    userId: 'demo',
    date: '2026-08-18',
    status: 'delivered',
    totalAmount: 5889,
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 1, priceAtPurchase: 4999 },
      { product: MOCK_PRODUCTS[2], quantity: 1, priceAtPurchase: 890 },
    ],
    shippingAddress: MOCK_ADDRESSES[0],
    paymentMethod: MOCK_PAYMENT_METHODS[0],
  },
];

/** Resolve on a microtask, so loading states are exercised rather than skipped. */
const resolve = <T>(value: T): Promise<T> => Promise.resolve(value);

/**
 * A complete `ShopAdapter` over the fixtures above.
 *
 * ```tsx
 * <ShopProvider adapter={createMockShopAdapter()}>
 * ```
 */
export function createMockShopAdapter(products: ShopProduct[] = MOCK_PRODUCTS): ShopAdapter {
  return {
    getProducts: () => resolve(products),
    getProductById: (id) => resolve(products.find((p) => String(p.id) === String(id)) ?? null),
    getProductsByCategory: (category) => resolve(products.filter((p) => p.category === category)),
    getRelatedProducts: (p) =>
      resolve(products.filter((o) => o.category === p.category && o.id !== p.id).slice(0, 4)),
    getCategories: () => resolve(MOCK_CATEGORIES),
    signIn: () => resolve(MOCK_USER),
    getAddresses: () => resolve(MOCK_ADDRESSES),
    getPaymentMethods: () => resolve(MOCK_PAYMENT_METHODS),
    getOrders: () => resolve(MOCK_ORDERS),
  };
}
