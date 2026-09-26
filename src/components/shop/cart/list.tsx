import React from 'react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { CartItem, type CartItemProps } from './item';

/**
 * - `row`: full line with the quantity stepper (the bag page).
 * - `compact`: dense line for a drawer or a checkout review.
 * - `readonly`: no controls, for a placed order.
 */
export type CartItemVariant = 'row' | 'compact' | 'readonly';

export interface CartListProps {
  items: Array<Omit<CartItemProps, 'readonly'>>;
  variant?: CartItemVariant;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven list of bag lines. */
export const CartList: React.FC<CartListProps> = ({
  items,
  variant = 'row',
  loading,
  skeletonCount = 3,
  empty,
  className,
}) => (
  <Collection
    items={items}
    getKey={(i) => `${i.id}-${i.title}`}
    renderItem={(item) => <CartItem {...item} readonly={variant === 'readonly'} />}
    layout="stack"
    gap={2}
    loading={loading}
    skeletonCount={skeletonCount}
    skeleton={{ media: true, lines: 2 }}
    empty={empty}
    className={className}
  />
);
