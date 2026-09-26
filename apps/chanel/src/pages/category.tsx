import React from 'react';
import { Section, Container, Stack, Title, Text, Select, Pagination, Row, EmptyState } from '@pui/components';
import { useShop, ProductList, ActiveFilters, type ActiveFilter } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { useProductCards } from '../lib/present';
import { type Product } from '../shop';
import { t } from '../locales/t';
import s from '../styles/chanel.module.scss';

const SORT_OPTIONS: Array<[string, string]> = [
  ['relevance', t.catalog.sortRelevance],
  ['price-asc', t.catalog.sortPriceAsc],
  ['price-desc', t.catalog.sortPriceDesc],
  ['rating', t.catalog.sortRating],
  ['newest', t.catalog.sortNewest],
];

/** A category listing. Same pipeline as home, scoped by slug. */
export const CategoryPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { navigate } = useRouter();
  const shop = useShop<Product>(slug);
  const toCard = useProductCards();
  const category = shop.categories.find((c) => c.slug === slug);
  const { selected, setSelection, reset, activeCount } = shop.facets;

  // What is filtered, flattened back into chips. The facet supplies the label,
  // so a value never shows up here in a form the rail did not display.
  const active: ActiveFilter[] = shop.catalog.facets.flatMap((facet) =>
    (selected[facet.id] ?? []).map((value) => ({
      facet: facet.id,
      value,
      label: facet.values.find((v) => v.value === value)?.label ?? value,
    }))
  );

  return (
    <Section>
      <Container size="xl">
        <Stack direction="column" gap={5}>
          <Stack direction="column" gap={1}>
            <Title level={1} className={`${s.display} ${s['display--lg']}`}>{category?.name ?? slug}</Title>
            {category?.tagline && <Text intent="secondary">{category.tagline}</Text>}
          </Stack>

          {activeCount > 0 && (
            <ActiveFilters
              filters={active}
              onRemove={(f) => setSelection(f.facet, (selected[f.facet] ?? []).filter((v) => v !== f.value))}
              onClearAll={reset}
              labels={{
                clearAll: t.catalog.clearFilters,
                remove: (label) => t.catalog.removeFilter.replace('{label}', label),
              }}
            />
          )}

          <Row justify="between" align="center" gap={3} wrap>
            <Text size="sm" intent="secondary">
              {shop.catalog.total === 1
                ? t.catalog.resultCountOne
                : t.catalog.resultCount.replace('{count}', String(shop.catalog.total))}
            </Text>
            <Select
              value={shop.browse.sort}
              aria-label={t.catalog.sortLabel}
              className={s.sortControl}
              onChange={(e) => shop.browse.setSort(e.target.value as typeof shop.browse.sort)}
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Row>

          {shop.catalog.total === 0 && !shop.catalog.loading ? (
            <EmptyState title={t.catalog.emptyTitle} description={t.catalog.emptyBody} />
          ) : (
            <ProductList
              products={shop.catalog.items.map(toCard)}
              loading={shop.catalog.loading}
              variant={shop.browse.view === 'list' ? 'row' : 'card'}
            />
          )}

          {shop.catalog.totalPages > 1 && (
            <Pagination
              currentPage={shop.catalog.page}
              totalPages={shop.catalog.totalPages}
              onPageChange={shop.browse.setPage}
            />
          )}
        </Stack>
      </Container>
    </Section>
  );
};
