import { useCallback } from 'react';
import { useShop } from '@pui/shop';
import { useRouter } from '../router';
import { routes, href } from './routes';
import { productImage } from './media';
import { t } from '../locales/t';
import type { Product } from '../shop';

/**
 * The one place a product becomes list-entry props.
 *
 * Three pages used to carry an identical inline mapper; the presentation of a
 * product is a single decision, so it is made once here. Pages pass the result
 * straight to `ProductList` and choose only the variant.
 */
export const useProductCards = () => {
  const { navigate } = useRouter();
  const shop = useShop<Product>();

  return useCallback(
    (p: Product) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      price: p.price,

      image: productImage(p),
      // Choosing a colourway re-renders the piece in that colour.
      imageFor: (hex: string) => productImage(p, hex),
      rating: p.rating?.rate,
      inWishlist: shop.wishlist.has(p.id),
      // The colourways, so the variants are visible before the product opens.
      colors: p.options?.colors,
      // A real destination: the entry is focusable and middle-clickable, and
      // `onClick` still routes without a reload.
      href: href(routes.product(String(p.id))),
      labels: { add: t.catalog.add, wishlist: t.nav.wishlist },
      onClick: (id: string | number) => navigate(routes.product(String(id))),
      onAddToCart: () => shop.cart.add(p),
      onToggleWishlist: () => shop.wishlist.toggle(p),
    }),
    [navigate, shop]
  );
};

/**
 * The one place a bag line becomes list-entry props. Shared by the cart page
 * and the bag drawer, so the two can never drift apart.
 */
export const useCartLines = () => {
  const shop = useShop<Product>();

  return useCallback(
    () =>
      shop.cart.items.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: productImage(item),
        onUpdateQuantity: (id: string | number, qty: number) =>
          shop.cart.updateQuantity(id, qty, item.selectedOptions),
        onRemove: (id: string | number) => shop.cart.remove(id, item.selectedOptions),
      })),
    [shop]
  );
};
