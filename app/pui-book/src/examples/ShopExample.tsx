'use client';

import React, { useState } from 'react';
import { Stack, Row, Button, Callout, Select, Text } from '@pui/components';
import {
  ShopProvider,
  useShop,
  ProductList,
  CartDrawer,
  CartList,
  CategoryList,
  createMockShopAdapter,
} from '@pui/shop';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';

/** One adapter instance, so the fixtures are not rebuilt on every render. */
const adapter = createMockShopAdapter();

/**
 * The shop module driving itself.
 *
 * Everything below comes from `useShop` — catalog pipeline, bag, wishlist and
 * formatting — against the bundled mock adapter. Swapping `adapter` for a live
 * one is the only change needed to point this at a real backend.
 */
const Storefront: React.FC = () => {
  const shop = useShop();
  const [orderId, setOrderId] = useState<string | null>(null);

  const checkout = () => {
    setOrderId(`ORD-${Date.now().toString(36).toUpperCase()}`);
    shop.cart.clear();
    shop.cart.setOpen(false);
  };

  return (
    <Stack direction="column" gap={4}>
      <Row justify="between" align="center" gap={3} wrap>
        <Select
          value={shop.browse.sort}
          aria-label="Sort"
          onChange={(e) => shop.browse.setSort(e.target.value as typeof shop.browse.sort)}
          options={[
            { value: 'relevance', label: 'Featured' },
            { value: 'price-asc', label: 'Price, low to high' },
            { value: 'price-desc', label: 'Price, high to low' },
            { value: 'rating', label: 'Best rated' },
          ]}
        />

        <Button variant="primary" icon={<ShoppingBag size={16} />} onClick={() => shop.cart.setOpen(true)}>
          Bag ({shop.cart.count}) — {shop.cart.formatted.total}
        </Button>
      </Row>

      <CategoryList
        variant="row"
        categories={shop.categories}
        loading={shop.categoriesLoading}
        activeSlug={undefined}
        onSelect={(slug) => shop.browse.setQuery(slug)}
      />

      {orderId && (
        <Callout intent="success" title="Order placed" icon={<CheckCircle2 size={18} />}>
          <Text as="span">Order {orderId} was recorded and the bag cleared.</Text>
        </Callout>
      )}

      <ProductList
        variant="card"
        loading={shop.catalog.loading}
        products={shop.catalog.items.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          price: p.price,
          image: p.image ?? '',
          rating: p.rating?.rate,
          inWishlist: shop.wishlist.has(p.id),
          onAddToCart: () => shop.cart.add(p),
          onToggleWishlist: () => shop.wishlist.toggle(p),
        }))}
        empty={{ title: 'Nothing matches', description: 'Clear the filters to see everything.' }}
      />

      <CartDrawer
        isOpen={shop.cart.isOpen}
        onClose={() => shop.cart.setOpen(false)}
        onCheckout={checkout}
        items={shop.cart.items.map((i) => ({
          id: i.id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        }))}
        onUpdateQuantity={(id, qty) => shop.cart.updateQuantity(id, qty)}
        onRemoveItem={(id) => shop.cart.remove(id)}
      />
    </Stack>
  );
};

export const ShopExample: React.FC = () => (
  <ShopProvider adapter={adapter} locale={{ locale: 'en-US', currency: 'USD', fractionDigits: 0 }} pageSize={6}>
    <Storefront />
  </ShopProvider>
);
