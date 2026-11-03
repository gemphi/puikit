import React from 'react';
import { Section, Container, Card, CardBody, Stack, Title, Text, Button } from '@pui/components';
import { useAuth } from '@pui/shop';
import { t } from '../../locales/t';

/**
 * What an account route shows to a guest.
 *
 * Every account surface routes through this rather than crashing or rendering
 * an empty shell, because a guest reaching /account/orders directly is normal.
 */
export const GuestGate: React.FC = () => {
  const { signIn, status } = useAuth();

  return (
    <Section>
      <Container size="sm">
        <Card>
          <CardBody>
            <Stack direction="column" gap={3}>
              <Title level={3}>{t.account.guestTitle}</Title>
              <Text intent="secondary">{t.account.guestBody}</Text>
              <Stack direction="row">
                <Button
                  variant="primary"
                  loading={status === 'authenticating'}
                  onClick={() => void signIn()}
                >
                  {t.account.signInDemo}
                </Button>
              </Stack>
            </Stack>
          </CardBody>
        </Card>
      </Container>
    </Section>
  );
};
