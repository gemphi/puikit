import React from 'react';
import { Box, Button } from '@pui/components';
import { Hero } from '../components/kit';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import s from '../styles/uaia.module.scss';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <Hero
      pattern="notfound"
      label="404 — Uncharted sector"
      title={<>This route is <Box as="span" className={s.gradText}>not in the registry.</Box></>}
      sub="The page you asked for has not been authorized for this market. Return to base."
    >
      <Box style={{ marginTop: 24 }}>
        <Button variant="primary" onClick={() => navigate(routes.home())}>Return home</Button>
      </Box>
    </Hero>
  );
};
