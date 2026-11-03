import React from 'react';
import { Section, Container, Stack, Row, Col, Title, Text } from '@pui/components';
import { useShop, useAsync, CategoryList, ProductList, EditorialList, EditorialItem } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { useProductCards } from '../lib/present';
import { editorialImage } from '../lib/media';
import { getBanners, getLooks, getShows, type EditorialEntry } from '../lib/services';
import { type Product } from '../shop';
import { t } from '../locales/t';
import s from '../styles/chanel.module.scss';

/** Section heading + strapline. Used four times here, so it is written once. */
const Heading: React.FC<{ title: string; body?: string }> = ({ title, body }) => (
  <Stack direction="column" gap={1}>
    <Title level={2} className={`${s.display} ${s['display--md']}`}>{title}</Title>
    {body && <Text intent="secondary">{body}</Text>}
  </Stack>
);

/** The landing page. Data and pipeline come from the services; this is layout. */
export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const shop = useShop<Product>();
  const toCard = useProductCards();

  const banners = useAsync(getBanners, []);
  const looks = useAsync(getLooks, []);
  const shows = useAsync(getShows, []);

  const arrows = { prev: t.nav.prev, next: t.nav.next };
  const toPanel = (e: EditorialEntry) => ({
    id: e.id,
    eyebrow: e.eyebrow,
    title: e.title,
    body: e.body,
    href: e.href,
    image: editorialImage(e),
  });
  const open = (href: string) => navigate(href.replace(/^#/, ''));
  const openEntry = (list: EditorialEntry[] | null) => (id: string) => {
    const entry = list?.find((e) => e.id === id);
    if (entry) open(entry.href);
  };

  return (
    <Stack direction="column" gap={8}>
      {/* Three campaign panels, the middle one carrying two thirds of the row
          on wide screens. The weighting is the layout's job, so it is expressed
          in `Col` spans rather than in the panel component. */}
      <Section className={s.hero} data-gradient-parent>
        <Container size="xl">
          <Row gap={4} align="stretch" wrap>
            {(banners.data ?? []).slice(0, 3).map((b, i) => (
              <Col key={b.id} xs={12} md={i === 1 ? 8 : 2} lg={i === 1 ? 8 : 2}>
                <EditorialItem
                  id={b.id}
                  eyebrow={b.eyebrow}
                  title={b.title}
                  body={b.body}
                  ctaLabel={b.ctaLabel}
                  href={b.ctaHref}
                  variant={i === 1 ? 'feature' : 'card'}
                  onSelect={() => open(b.ctaHref)}
                />
              </Col>
            ))}
          </Row>
        </Container>
      </Section>

      <Section>
        <Container size="xl">
          <Stack direction="column" gap={4}>
            <Heading title={t.home.exploreTitle} />
            <CategoryList
              categories={shop.categories}
              loading={shop.categoriesLoading}
              variant="card"
              columns={{ xs: 2, sm: 3, md: 5 }}
              onSelect={(slug) => navigate(routes.category(slug))}
            />
          </Stack>
        </Container>
      </Section>

      {/* New in: the same entries as the grid below, one row deep, as overlay
          tiles — the product slider. */}
      <Section>
        <Container size="xl">
          <ProductList
            products={shop.catalog.items.slice(0, 8).map(toCard)}
            loading={shop.catalog.loading}
            variant="overlay"
            layout="carousel"
            columns={4}
            carouselLabels={arrows}
            header={<Heading title={t.home.newTitle} body={t.home.newBody} />}
          />
        </Container>
      </Section>

      <Section>
        <Container size="xl">
          <EditorialList
            entries={(looks.data ?? []).map(toPanel)}
            loading={looks.loading}
            columns={4}
            carouselLabels={arrows}
            onSelect={openEntry(looks.data)}
            header={<Heading title={t.home.looksTitle} body={t.home.looksBody} />}
          />
        </Container>
      </Section>

      <Section>
        <Container size="xl">
          <EditorialList
            entries={(shows.data ?? []).map(toPanel)}
            loading={shows.loading}
            columns={4}
            carouselLabels={arrows}
            onSelect={openEntry(shows.data)}
            header={<Heading title={t.home.showsTitle} body={t.home.showsBody} />}
          />
        </Container>
      </Section>

      <Section>
        <Container size="xl">
          <Stack direction="column" gap={4}>
            <Heading title={t.home.allTitle} body={t.home.allBody} />
            <ProductList
              products={shop.catalog.items.map(toCard)}
              loading={shop.catalog.loading}
              columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
              variant={shop.browse.view === 'list' ? 'row' : 'card'}
            />
          </Stack>
        </Container>
      </Section>
    </Stack>
  );
};
