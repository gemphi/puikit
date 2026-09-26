import React from 'react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { WishlistItem, type WishlistItemProps } from './item';

export type WishlistItemVariant = 'card' | 'row';

export interface WishlistListProps {
  items: WishlistItemProps[];
  variant?: WishlistItemVariant;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven list of saved pieces. */
export const WishlistList: React.FC<WishlistListProps> = ({
  items,
  variant = 'row',
  loading,
  skeletonCount = 3,
  empty,
  className,
}) => (
  <Collection
    items={items}
    getKey={(i) => String(i.id)}
    renderItem={(item) => <WishlistItem {...item} />}
    layout={variant === 'card' ? 'grid' : 'stack'}
    columns={{ xs: 1, sm: 2, md: 3 }}
    loading={loading}
    skeletonCount={skeletonCount}
    skeleton={{ media: true, lines: 2 }}
    empty={empty}
    className={className}
  />
);
