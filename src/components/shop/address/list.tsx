import React from 'react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { AddressItem, type AddressItemProps, type AddressItemVariant } from './item';

export interface AddressListProps extends Omit<AddressItemProps, 'address' | 'variant'> {
  addresses: AddressItemProps['address'][];
  variant?: AddressItemVariant;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A variant-driven list of addresses. Shared handlers apply to every entry. */
export const AddressList: React.FC<AddressListProps> = ({
  addresses,
  variant = 'card',
  loading,
  skeletonCount = 2,
  empty,
  className,
  ...itemProps
}) => (
  <Collection
    items={addresses}
    getKey={(a) => a.id}
    renderItem={(address) => <AddressItem address={address} variant={variant} {...itemProps} />}
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
