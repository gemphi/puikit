import React from 'react';
import { Grid } from '../../layout/Grid';
import { Stack } from '../../layout/Stack';
import { Carousel } from '../carousel';
import { SkeletonCard, type SkeletonCardProps } from '../../feedback/Skeleton';
import { EmptyState } from '../../feedback/EmptyState';
import type { ResponsiveValue } from '../../shared/responsive';
import type { CarouselLabels } from '../carousel';
import styles from './styles.module.scss';
import { Box } from '../../layout/Box';

/**
 * How a collection lays itself out.
 * - `grid`: a responsive grid of cards.
 * - `stack`: a vertical list of rows.
 * - `carousel`: a horizontally snapping track — the same cards, one row deep.
 */
export type CollectionLayout = 'grid' | 'stack' | 'carousel';

export interface CollectionEmpty {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export interface CollectionProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => React.Key;
  layout?: CollectionLayout;
  columns?: ResponsiveValue<number>;
  gap?: 1 | 2 | 3 | 4 | 6 | 8;
  loading?: boolean;
  skeletonCount?: number;
  /** Shape of each placeholder while loading. */
  skeleton?: SkeletonCardProps;
  /** Rendered when there is nothing to show and nothing is loading. */
  empty?: CollectionEmpty;
  className?: string;
  /** Rendered beside the carousel's controls. Ignored by the other layouts. */
  header?: React.ReactNode;
  /** Copy for the carousel's arrows. Ignored by the other layouts. */
  carouselLabels?: Partial<CarouselLabels>;
  /** Set for selectable collections so the group is announced correctly. */
  role?: string;
  'aria-label'?: string;
}

const DEFAULT_COLUMNS: ResponsiveValue<number> = { xs: 1, sm: 2, md: 3, lg: 4 };

/**
 * The one collection renderer in the library.
 *
 * Every list — products, orders, addresses, cards, saved pieces, categories —
 * is this component with a different `renderItem`. It owns the three states a
 * collection actually has (loading, empty, populated) and the two layouts it
 * can take, so no domain list re-implements them and they cannot drift apart.
 */
export function Collection<T>({
  items,
  renderItem,
  getKey,
  layout = 'stack',
  columns = DEFAULT_COLUMNS,
  gap,
  loading = false,
  skeletonCount = 4,
  skeleton,
  empty,
  className,
  header,
  carouselLabels,
  role,
  'aria-label': ariaLabel,
}: CollectionProps<T>) {
  const isGrid = layout === 'grid';
  const isCarousel = layout === 'carousel';
  const resolvedGap = gap ?? (isGrid ? 6 : 3);

  const wrap = (children: React.ReactNode, extra?: Record<string, string>) =>
    isCarousel ? (
      <Carousel
        slidesPerView={columns}
        gap={resolvedGap}
        header={header}
        labels={carouselLabels}
        className={className}
        role={role}
        aria-label={ariaLabel}
        {...extra}
      >
        {children}
      </Carousel>
    ) : isGrid ? (
      <Grid columns={columns} gap={resolvedGap} className={className} role={role} aria-label={ariaLabel} {...extra}>
        {children}
      </Grid>
    ) : (
      <Stack gap={resolvedGap} className={className} role={role} aria-label={ariaLabel} {...extra}>
        {children}
      </Stack>
    );

  if (loading) {
    return wrap(
      Array.from({ length: skeletonCount }).map((_, i) => (
        <SkeletonCard
          key={i}
          direction={isGrid || isCarousel ? 'column' : 'row'}
          media={isGrid || isCarousel}
          {...skeleton}
        />
      )),
      { 'data-loading': 'true' }
    );
  }

  if (items.length === 0) {
    return empty ? (
      <EmptyState title={empty.title} description={empty.description} action={empty.action} />
    ) : null;
  }

  // Each entry is given a cell that stretches to the row's height, so a card
  // with two lines of title is the same height as one with four.
  return wrap(
    items.map((item, i) => (
      <Box key={getKey(item, i)} className={styles.cell}>
        {renderItem(item, i)}
      </Box>
    ))
  );
}
