import React from 'react';
import { Section, Container, Stack, Title } from '@pui/components';
import { useShop, PaymentList } from '@pui/shop';
import { t } from '../locales/t';
import { GuestGate } from '../components/account/guest-gate';
import { PaymentForm } from '../components/payment/payment-form';

export const AccountPaymentsPage: React.FC = () => {
  const shop = useShop();
  if (shop.auth.isGuest) return <GuestGate />;

  return (
    <Section>
      <Container size="lg">
        <Stack direction="column" gap={4}>
          <Title level={2}>{t.account.payments}</Title>
          <PaymentList
            variant="card"
            methods={shop.payments.items}
            onSetDefault={shop.payments.setDefault}
            onRemove={shop.payments.remove}
            labels={{ default: t.account.default, setDefault: t.account.setDefault, remove: t.account.remove }}
            empty={{ title: t.account.paymentsEmptyTitle, description: t.account.paymentsEmptyBody }}
          />
          <PaymentForm />
        </Stack>
      </Container>
    </Section>
  );
};
