import React from 'react';
import { Section, Container, Stack, Title } from '@pui/components';
import { useShop, AddressList } from '@pui/shop';
import { t } from '../locales/t';
import { GuestGate } from '../components/account/guest-gate';
import { AddressForm } from '../components/address/address-form';

export const AccountAddressesPage: React.FC = () => {
  const shop = useShop();
  if (shop.auth.isGuest) return <GuestGate />;

  return (
    <Section>
      <Container size="lg">
        <Stack direction="column" gap={4}>
          <Title level={2}>{t.account.addresses}</Title>
          <AddressList
            variant="card"
            addresses={shop.addresses.items}
            onSetDefault={shop.addresses.setDefault}
            onRemove={shop.addresses.remove}
            labels={{ default: t.account.default, setDefault: t.account.setDefault, remove: t.account.remove }}
            empty={{ title: t.account.addressesEmptyTitle, description: t.account.addressesEmptyBody }}
          />
          <AddressForm />
        </Stack>
      </Container>
    </Section>
  );
};
