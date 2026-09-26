import React from 'react';
import { BrandMark, BRAND_MARKS, BRAND_MARK_ORDER, Card, Collection, Container, Stack, Text, Title } from '@pui/components';
import { t } from '../locales/t';
import s from '../styles/phlick.module.scss';

/**
 * The ecosystem, on one wall: sixteen brand marks, each drawn from pure SVG
 * paths in the library (`BRAND_MARKS`) with its identity hue carried as data
 * — the tile's wash and the mark's color both derive from that one number.
 */
export const BrandsPage: React.FC = () => (
  <Container size="xl" className={s.pagePad}>
    <Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}>
        <Title level={2}>{t.brands.title}</Title>
        <Text intent="secondary">{t.brands.body}</Text>
      </Stack>

      <Collection
        items={BRAND_MARK_ORDER}
        getKey={(slug) => slug}
        layout="grid"
        columns={{ xs: 1, sm: 2, md: 3, lg: 3 }}
        gap={3}
        renderItem={(slug) => {
          const def = BRAND_MARKS[slug];
          return (
            <Card hoverable={false} padding="md" className={s.brandCard}>
              <Stack direction="column" align="center" gap={2}>
                {/* Four options: base, concave, waves, recursion / Greek. */}
                <Stack direction="row" align="center" gap={2}>
                  {def.variants.map((_, i) => (
                    <span
                      key={i}
                      className={s.brandTile}
                      style={{
                        background: `hsl(${def.hue} 80% 55% / 0.14)`,
                        color: `hsl(${def.hue} 85% 60%)`,
                      }}
                    >
                      <BrandMark brand={slug} variant={i} size={26} title={`${def.name} ${i + 1}`} />
                    </span>
                  ))}
                </Stack>
                <Text as="span" weight="semibold">{def.name}</Text>
                <Text as="span" size="sm" intent="secondary" className={s.brandTag}>
                  {def.tagline}
                </Text>
              </Stack>
            </Card>
          );
        }}
      />
    </Stack>
  </Container>
);
