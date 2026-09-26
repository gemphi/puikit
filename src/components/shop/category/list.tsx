import React from 'react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { CategoryItem, type CategoryItemProps, type CategoryItemVariant } from './item';
import type { ResponsiveValue } from '../../shared/responsive';

export interface CategoryListProps {
  categories: Array<Omit<CategoryItemProps, 'variant' | 'onSelect' | 'active'>>;
  variant?: CategoryItemVariant;
  activeSlug?: string;
  onSelect?: (slug: string) => void;
  columns?: ResponsiveValue<number>;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven list of categories. */
export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  variant = 'card',
  activeSlug,
  onSelect,
  columns = { xs: 2, sm: 3, md: 5 },
  loading,
  skeletonCount = 5,
  empty,
  className,
}) => (
  <Collection
    items={categories}
    getKey={(c) => c.slug}
    renderItem={(c) => (
      <CategoryItem {...c} variant={variant} active={c.slug === activeSlug} onSelect={onSelect} />
    )}
    layout={variant === 'card' ? 'grid' : 'stack'}
    columns={columns}
    gap={3}
    loading={loading}
    skeletonCount={skeletonCount}
    skeleton={{ lines: 1, media: false }}
    empty={empty}
    className={className}
  />
);
