import React from 'react';
import { Section, Container, Card, CardBody, Stack, Title, Text, Button, Divider, NonIdealState } from '@pui/components';
import { useOrders, Price } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';

export const CheckoutSuccessPage: React.FC = () => {
  const { navigate } = useRouter();
  const { lastPlaced } = useOrders();

  if (!lastPlaced) {
    return (
      <Section>
        <Container size="md">
          <NonIdealState
            title={t.success.noOrderTitle}
            description={t.success.noOrderBody}
            action={
              <Button variant="primary" onClick={() => navigate(routes.home())}>
                {t.success.continue}
              </Button>
            }
          />
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container size="md">
        <Stack direction="column" gap={4}>
          <Title level={1}>{t.success.title}</Title>
          <Text intent="secondary">{t.success.body.replace('{id}', lastPlaced.id)}</Text>

          <Card>
            <CardBody>
              <Stack direction="column" gap={3}>
                {lastPlaced.items.map((line) => (
                  <Stack key={String(line.product.id)} direction="row" justify="between" gap={3}>
                    <Text>
                      {line.product.title} × {line.quantity}
                    </Text>
                    <Price amount={line.priceAtPurchase * line.quantity} currency="EUR" />
                  </Stack>
                ))}
                <Divider />
                <Stack direction="row" justify="between">
                  <Text weight="semibold">{t.cart.total}</Text>
                  <Price amount={lastPlaced.totalAmount} currency="EUR" />
                </Stack>
              </Stack>
            </CardBody>
          </Card>

          <Stack direction="row" gap={2}>
            <Button variant="primary" onClick={() => navigate(routes.home())}>
              {t.success.continue}
            </Button>
            <Button variant="outline" onClick={() => navigate(routes.accountOrders())}>
              {t.success.viewOrders}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Section>
  );
};
