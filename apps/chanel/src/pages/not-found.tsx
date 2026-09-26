import React from 'react';
import { Section, Container, NonIdealState, Button } from '@pui/components';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <Section>
      <Container size="md">
        <NonIdealState
          title={t.notFound.title}
          description={t.notFound.body}
          action={
            <Button variant="primary" onClick={() => navigate(routes.home())}>
              {t.notFound.home}
            </Button>
          }
        />
      </Container>
    </Section>
  );
};
