'use client';

import React from 'react';
import { Box, Callout, Divider, Stack, Text, Title } from '@pui/components';
import { PageShell } from '../layouts/PageShell';
import { ShopExample } from '../examples/ShopExample';
import { ShoppingCart } from 'lucide-react';

export const ShopPage: React.FC = () => {
  return (
    <PageShell
      title="Shop Suite"
      description="Industrial, high-performance shop primitives and reactive storefront flows for products, carts, pricing, and checkout."
    >
      <Stack direction="column" gap={4}>
        <Callout intent="primary" title="Pure Decoupled Shop Primitives" icon={<ShoppingCart size={18} />}>
          Components are 100% decoupled from backend schemas. All state (cart, wishlist, catalog, currency) is orchestrated reactively through PUI micro-stores and services.
        </Callout>

        <Box>
          <Title level={4}>Interactive Storefront & Cart Drawer</Title>
          <Text variant="muted">
            Add items, toggle wishlist, filter categories, and inspect live cart synchronization.
          </Text>
        </Box>

        <ShopExample />

        <Divider />
      </Stack>
    </PageShell>
  );
};
