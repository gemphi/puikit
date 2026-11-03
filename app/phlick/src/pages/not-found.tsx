import React from 'react';
import { Button, EmptyState } from '@pui/components';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <EmptyState
      title={t.profile.notFoundTitle}
      description={t.profile.notFoundBody}
      action={
        <Button variant="primary" onClick={() => navigate(routes.forYou())}>
          {t.profile.back}
        </Button>
      }
    />
  );
};
