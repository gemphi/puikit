import React from 'react';
import { Section, Container, Stack, Title, Button } from '@pui/components';
import { useShop, OrderList } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';
import { GuestGate } from '../components/account/guest-gate';

export const AccountOrdersPage: React.FC = () => {
  const { navigate } = useRouter();
  const shop = useShop();

  if (shop.auth.isGuest) return <GuestGate />;

  return (
    <Section>
      <Container size="lg">
        <Stack direction="column" gap={4}>
          <Title level={2}>{t.account.orders}</Title>
          <OrderList
            variant="card"
            orders={shop.orders.items.map((o) => ({
              id: o.id,
              date: shop.format.date(o.date),
              total: o.totalAmount,
              status: o.status,
              statusLabel: t.order.status[o.status],
              currency: shop.format.currency,
              detailsLabel: t.order.viewDetails,
              items: o.items.map((line) => ({
                id: line.product.id,
                title: line.product.title,
                quantity: line.quantity,
                price: line.priceAtPurchase,
              })),
            }))}
            empty={{
              title: t.account.ordersEmptyTitle,
              description: t.account.ordersEmptyBody,
              action: (
                <Button variant="primary" onClick={() => navigate(routes.home())}>
                  {t.cart.continue}
                </Button>
              ),
            }}
          />
        </Stack>
      </Container>
    </Section>
  );
};
