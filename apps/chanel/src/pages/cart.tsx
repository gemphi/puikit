import React from 'react';
import { Section, Container, Row, Col, Stack, Title, Button } from '@pui/components';
import { useShop, CartList, CartSummary } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { productImage } from '../lib/media';
import { t } from '../locales/t';

export const CartPage: React.FC = () => {
  const { navigate } = useRouter();
  const shop = useShop();

  return (
    <Section>
      <Container size="lg">
        <Stack direction="column" gap={4}>
          <Title level={2}>{t.cart.title}</Title>
          <Row gap={6} align="start" wrap>
            <Col span={8} fill>
              <CartList
                variant="row"
                items={shop.cart.items.map((item) => ({
                  id: item.id,
                  title: item.title,
                  price: item.price,
                  quantity: item.quantity,
                  image: productImage(item),
                  onUpdateQuantity: (id, qty) => shop.cart.updateQuantity(id, qty, item.selectedOptions),
                  onRemove: (id) => shop.cart.remove(id, item.selectedOptions),
                }))}
                empty={{
                  title: t.cart.emptyTitle,
                  description: t.cart.emptyBody,
                  action: (
                    <Button variant="primary" onClick={() => navigate(routes.home())}>
                      {t.cart.continue}
                    </Button>
                  ),
                }}
              />
            </Col>
            {shop.cart.hasItems && (
              <Col span={4}>
                <CartSummary
                  subtotal={shop.cart.totals.subtotal}
                  shipping={shop.cart.totals.shipping}
                  tax={shop.cart.totals.tax}
                  currency={shop.format.currency}
                  labels={{
                    subtotal: t.cart.subtotal,
                    shipping: t.cart.shipping,
                    free: t.cart.shippingFree,
                    total: t.cart.total,
                    checkout: t.cart.checkout,
                  }}
                  onCheckout={() => navigate(routes.checkout())}
                />
              </Col>
            )}
          </Row>
        </Stack>
      </Container>
    </Section>
  );
};
