import React from 'react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { PaymentItem, type PaymentItemProps, type PaymentItemVariant } from './item';

export interface PaymentListProps extends Omit<PaymentItemProps, 'method' | 'variant'> {
  methods: PaymentItemProps['method'][];
  variant?: PaymentItemVariant;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven list of saved cards. */
export const PaymentList: React.FC<PaymentListProps> = ({
  methods,
  variant = 'card',
  loading,
  skeletonCount = 2,
  empty,
  className,
  ...itemProps
}) => (
  <Collection
    items={methods}
    getKey={(m) => m.id}
    renderItem={(method) => <PaymentItem method={method} variant={variant} {...itemProps} />}
    layout={variant === 'card' ? 'grid' : 'stack'}
    columns={{ xs: 1, md: 2 }}
    gap={3}
    loading={loading}
    skeletonCount={skeletonCount}
    skeleton={{ lines: 2 }}
    empty={empty}
    className={className}
    role={itemProps.selectable ? 'radiogroup' : undefined}
  />
);
