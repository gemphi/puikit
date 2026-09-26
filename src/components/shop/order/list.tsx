import React from 'react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { OrderItem, type OrderItemProps, type OrderItemVariant } from './item';

export interface OrderListProps {
  orders: Array<Omit<OrderItemProps, 'variant'>>;
  /** Propagated to every entry. Defaults to `card`. */
  variant?: OrderItemVariant;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven list of orders. */
export const OrderList: React.FC<OrderListProps> = ({
  orders,
  variant = 'card',
  loading,
  skeletonCount = 3,
  empty,
  className,
}) => (
  <Collection
    items={orders}
    getKey={(o) => String(o.id)}
    renderItem={(o) => <OrderItem {...o} variant={variant} />}
    layout={variant === 'card' ? 'grid' : 'stack'}
    columns={{ xs: 1, md: 2 }}
    gap={4}
    loading={loading}
    skeletonCount={skeletonCount}
    skeleton={{ lines: 3 }}
    empty={empty}
    className={className}
  />
);
