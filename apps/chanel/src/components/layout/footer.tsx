import React from 'react';
import { Footer as PuiFooter, Container, Grid, Stack, Text, Title, Link, Divider } from '@pui/components';
import { getFooterColumns } from '../../lib/services';
import { t } from '../../locales/t';
import s from '../../styles/chanel.module.scss';

export const Footer: React.FC = () => {
  const columns = getFooterColumns();

  return (
    <PuiFooter>
      <Container size="xl">
        <Stack direction="column" gap={5}>
          <Grid columns={{ xs: 1, sm: 3 }} gap={6}>
            {columns.map((col) => (
              <Stack key={col.title} direction="column" gap={2}>
                <Title level={6} className={s.label}>
                  {col.title}
                </Title>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} variant="muted">
                    {l.label}
                  </Link>
                ))}
              </Stack>
            ))}
          </Grid>

          <Divider />

          <Stack direction="row" justify="between" wrap gap={2}>
            <Text size="sm" intent="muted">
              {t.brand.disclaimer}
            </Text>
            <Text size="sm" intent="muted">
              © {new Date().getFullYear()}
            </Text>
          </Stack>
        </Stack>
      </Container>
    </PuiFooter>
  );
};
