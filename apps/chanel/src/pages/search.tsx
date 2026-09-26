import React from 'react';
import { Section, Container, Stack, Title, EmptyState, Button } from '@pui/components';
import { useShop, ProductList } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { useProductCards } from '../lib/present';
import { type Product } from '../shop';
import { t } from '../locales/t';
import s from '../styles/chanel.module.scss';

/** Search results. The query already lives in the catalog store. */
export const SearchPage: React.FC = () => {
  const { navigate } = useRouter();
  const shop = useShop<Product>();
  const toCard = useProductCards();
  const q = shop.browse.query;

  return (
    <Section>
      <Container size="xl">
        <Stack direction="column" gap={5}>
          <Title level={1} className={`${s.display} ${s['display--lg']}`}>
            {t.search.title.replace('{query}', q)}
          </Title>

          {shop.catalog.total === 0 && !shop.catalog.loading ? (
            <EmptyState
              title={t.search.emptyTitle.replace('{query}', q)}
              description={t.search.emptyBody}
              action={
                <Button variant="primary" onClick={() => navigate(routes.home())}>
                  {t.search.browse}
                </Button>
              }
            />
          ) : (
            <ProductList
              products={shop.catalog.items.map(toCard)}
              loading={shop.catalog.loading}
              variant="card"
            />
          )}
        </Stack>
      </Container>
    </Section>
  );
};
