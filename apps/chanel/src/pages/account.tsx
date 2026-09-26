import React from 'react';
import { Section, Container, Grid, Card, CardBody, Stack, Title, Text, Button } from '@pui/components';
import { useAuth } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { getAccountNav } from '../lib/services';
import { t } from '../locales/t';
import { GuestGate } from '../components/account/guest-gate';

const PANEL_BODY: Record<string, string> = {
  '/account/orders': t.account.ordersBody,
  '/account/addresses': t.account.addressesBody,
  '/account/payments': t.account.paymentsBody,
};

export const AccountPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isGuest, displayName, signOut } = useAuth();

  if (isGuest) return <GuestGate />;

  return (
    <Section>
      <Container size="lg">
        <Stack direction="column" gap={5}>
          <Stack direction="row" justify="between" align="center" wrap gap={3}>
            <Title level={1}>{t.account.greeting.replace('{name}', displayName)}</Title>
            <Button variant="outline" size="sm" onClick={signOut}>
              {t.nav.signOut}
            </Button>
          </Stack>

          <Grid columns={{ xs: 1, md: 3 }} gap={3}>
            {getAccountNav().map((item) => (
              <Card key={item.path} hoverable onClick={() => navigate(item.path)}>
                <CardBody>
                  <Stack direction="column" gap={1}>
                    <Title level={5}>{item.label}</Title>
                    <Text size="sm" intent="secondary">
                      {PANEL_BODY[item.path]}
                    </Text>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
};
