import React, { useState } from 'react';
import {
  Section, Container, Row, Col, Stack, Title, Text, Button, Select, FormGroup,
  Image, Rating, Tag, Accordion, AccordionItem, Breadcrumbs, NonIdealState, Divider,
  Skeleton, SkeletonText,
} from '@pui/components';
import { useProduct, useCart, useWishlist, Price, ProductList } from '@pui/shop';
import { useRecentStore } from '@pui/store';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { useProductCards } from '../lib/present';
import { productImage } from '../lib/media';
import { type Product } from '../shop';
import { categoriesSync } from '../lib/services';
import { t } from '../locales/t';
import s from '../styles/chanel.module.scss';

export const ProductPage: React.FC<{ id: string }> = ({ id }) => {
  const { navigate } = useRouter();
  const { product, related, loading } = useProduct<Product>(id);
  const toCard = useProductCards();
  const cart = useCart();
  const wishlist = useWishlist();
  const visit = useRecentStore((st) => st.visit);
  const [colour, setColour] = useState<string | undefined>();
  const [size, setSize] = useState<string | undefined>();
  const [panel, setPanel] = useState<string | null>('shipping');

  React.useEffect(() => {
    if (product) visit(product);
  }, [product, visit]);

  // While the product resolves, show its shape rather than a "not found" —
  // an empty NonIdealState during load reads as an error that has not happened.
  if (loading) {
    return (
      <Section>
        <Container size="xl">
          <Row gap={6} align="start" wrap>
            <Col span={7} fill>
              <Skeleton height="32rem" />
            </Col>
            <Col span={5}>
              <SkeletonText lines={6} />
            </Col>
          </Row>
        </Container>
      </Section>
    );
  }

  if (!product) {
    return (
      <Section>
        <Container size="md">
          <NonIdealState
            title={t.product.notFoundTitle}
            description={t.product.notFoundBody}
            action={
              <Button variant="primary" onClick={() => navigate(routes.home())}>
                {t.notFound.home}
              </Button>
            }
          />
        </Container>
      </Section>
    );
  }

  const category = categoriesSync().find((c) => c.slug === product.category);
  const sizes = product.options?.sizes ?? [];
  const colours = product.options?.colors ?? [];
  const needsSize = sizes.length > 0 && !size;

  return (
    <Section>
      <Container size="xl">
        <Stack direction="column" gap={6}>
          <Breadcrumbs
            items={[
              { label: t.nav.home, href: `#${routes.home()}` },
              ...(category ? [{ label: category.name, href: `#${routes.category(category.slug)}` }] : []),
              { label: product.title },
            ]}
          />

          <Row gap={6} align="start" wrap>
            <Col span={7} fill>
              <Image src={productImage(product)} alt={product.title} className={s.productMedia} />
            </Col>

            <Col span={5}>
              <Stack direction="column" gap={3} className={s.stickyPanel}>
                <Stack direction="row" gap={2} align="center" wrap>
                  <Text className={s.label} intent="secondary">{product.line}</Text>
                  {product.isNew && <Tag intent="primary" round>{t.product.new}</Tag>}
                  {product.isExclusive && <Tag round>{t.product.exclusive}</Tag>}
                </Stack>

                <Title level={1} className={`${s.display} ${s['display--md']}`}>{product.title}</Title>
                <Price amount={product.price} currency="EUR" />
                {product.rating && <Rating value={product.rating.rate} count={product.rating.count} />}
                <Text intent="secondary">{product.description}</Text>

                {colours.length > 0 && (
                  <FormGroup label={t.product.colour}>
                    <Stack direction="row" gap={2} wrap>
                      {colours.map((c) => (
                        <Button
                          key={c.name}
                          aria-label={c.name}
                          aria-pressed={colour === c.name}
                          className={s.swatch}
                          variant="ghost"
                          onClick={() => setColour(c.name)}
                        />
                      ))}
                    </Stack>
                  </FormGroup>
                )}

                {sizes.length > 0 && (
                  <FormGroup label={t.product.size}>
                    <Select value={size ?? ''} onChange={(e) => setSize(e.target.value || undefined)}>
                      <option value="">{t.product.selectSize}</option>
                      {sizes.map((sz) => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}

                <Stack direction="row" gap={2}>
                  <Button
                    variant="primary"
                    disabled={needsSize}
                    onClick={() => cart.add(product, { color: colour, size })}
                  >
                    {t.product.addToCart}
                  </Button>
                  <Button variant="outline" onClick={() => wishlist.toggle(product)}>
                    {wishlist.has(product.id) ? t.product.wishlistRemove : t.product.wishlistAdd}
                  </Button>
                </Stack>

                <Accordion>
                  <AccordionItem
                    title={t.product.shipping}
                    open={panel === 'shipping'}
                    onToggle={() => setPanel(panel === 'shipping' ? null : 'shipping')}
                  >
                    <Text size="sm" intent="secondary">{t.product.shippingBody}</Text>
                  </AccordionItem>
                  <AccordionItem
                    title={t.product.care}
                    open={panel === 'care'}
                    onToggle={() => setPanel(panel === 'care' ? null : 'care')}
                  >
                    <Text size="sm" intent="secondary">{t.product.careBody}</Text>
                  </AccordionItem>
                </Accordion>
              </Stack>
            </Col>
          </Row>

          {related.length > 0 && (
            <Stack direction="column" gap={3}>
              <Divider />
              <Title level={3} className={`${s.display} ${s['display--md']}`}>{t.product.relatedTitle}</Title>
              {/* Related pieces are a slider, not a second grid: the same
                  entries, one row deep, from the same list component. */}
              <ProductList
                products={related.map(toCard)}
                variant="overlay"
                layout="carousel"
                columns={4}
                carouselLabels={{ prev: t.nav.prev, next: t.nav.next }}
              />
            </Stack>
          )}
        </Stack>
      </Container>
    </Section>
  );
};
