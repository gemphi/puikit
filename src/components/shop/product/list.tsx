import React from 'react';
import { Collection, type CollectionEmpty, type CollectionLayout } from '../../display/collection';
import type { CarouselLabels } from '../../display/carousel';
import { ProductItem, type ProductItemProps, type ProductItemVariant } from './item';
import type { ResponsiveValue } from '../../shared/responsive';

export interface ProductListProps {
  products: Array<Omit<ProductItemProps, 'variant'>>;
  /**
   * Presentation applied to the list and propagated to every entry: `card`
   * lays out a responsive grid, `row` and `compact` a vertical list.
   */
  variant?: ProductItemVariant;
  /**
   * Overrides the layout the variant implies. `carousel` turns the same
   * entries into a snapping slider, which is how a "related pieces" or
   * "new in" row is built — no second list component.
   */
  layout?: CollectionLayout;
  columns?: ResponsiveValue<number>;
  /** Rendered beside the carousel's controls. */
  header?: React.ReactNode;
  /** Copy for the carousel's arrows. */
  carouselLabels?: Partial<CarouselLabels>;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven list of products. */
export const ProductList: React.FC<ProductListProps> = ({
  products,
  variant = 'row',
  layout,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  header,
  carouselLabels,
  loading,
  skeletonCount = 4,
  empty,
  className,
}) => (
  <Collection
    items={products}
    getKey={(p) => String(p.id)}
    renderItem={(product) => <ProductItem {...product} variant={variant} />}
    layout={layout ?? (variant === 'card' || variant === 'overlay' ? 'grid' : 'stack')}
    columns={columns}
    loading={loading}
    skeletonCount={skeletonCount}
    skeleton={{ media: true, lines: variant === 'row' || variant === 'compact' ? 2 : 3 }}
    header={header}
    carouselLabels={carouselLabels}
    empty={empty}
    className={className}
  />
);
