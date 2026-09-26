import React from 'react';
import { Collection, type CollectionEmpty, type CollectionLayout } from '../../display/collection';
import { EditorialItem, type EditorialItemProps, type EditorialItemVariant } from './item';
import type { CarouselLabels } from '../../display/carousel';
import type { ResponsiveValue } from '../../shared/responsive';

export interface EditorialListProps {
  entries: Array<Omit<EditorialItemProps, 'variant' | 'onSelect'>>;
  variant?: EditorialItemVariant;
  /** Defaults to a carousel — an editorial row is a slider by nature. */
  layout?: CollectionLayout;
  columns?: ResponsiveValue<number>;
  onSelect?: (id: string) => void;
  header?: React.ReactNode;
  carouselLabels?: Partial<CarouselLabels>;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven row of editorial entries. */
export const EditorialList: React.FC<EditorialListProps> = ({
  entries,
  variant = 'card',
  layout = 'carousel',
  columns = variant === 'feature' ? 1 : 4,
  onSelect,
  header,
  carouselLabels,
  loading,
  skeletonCount = 4,
  empty,
  className,
}) => (
  <Collection
    items={entries}
    getKey={(e) => e.id}
    renderItem={(entry) => <EditorialItem {...entry} variant={variant} onSelect={onSelect} />}
    layout={layout}
    columns={columns}
    loading={loading}
    skeletonCount={variant === 'feature' ? 1 : skeletonCount}
    skeleton={{ media: true, lines: variant === 'feature' ? 3 : 2 }}
    header={header}
    carouselLabels={carouselLabels}
    empty={empty}
    className={className}
  />
);
