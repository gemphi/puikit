import React from 'react';
import type { ShopId } from '../types';
import { MapPin, Check } from 'lucide-react';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import { Card, CardBody } from '../../display/card';

export interface AddressModel {
  id: ShopId;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface AddressCardProps {
  address: AddressModel;
  selected?: boolean;
  onSelect?: (id: ShopId) => void;
  onEdit?: (id: ShopId) => void;
  className?: string;
}

/**
 * An address card composed exclusively from puijs primitives: the {@link Card}
 * family provides the selectable surface, {@link Stack} the layout,
 * {@link Text}/{@link Span} the typography (icon color via token-driven
 * `intent`), and {@link Button} the edit action. No per-component stylesheet,
 * no raw layout `<div>`, no inline style, and no hardcoded colors.
 */
export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  selected = false,
  onSelect,
  onEdit,
  className,
}) => {
  return (
    <Card
      className={className}
      hoverable={!!onSelect}
      selected={selected}
      onClick={() => onSelect?.(address.id)}
      data-address-card="true"
      data-clickable={onSelect ? 'true' : undefined}
    >
      <CardBody>
        <Stack gap={2}>
          <Stack direction="row" align="center" justify="between">
            <Stack direction="row" align="center" gap={2}>
              <Text as="span" intent="primary">
                <MapPin size={16} aria-hidden />
              </Text>
              <Text as="span" weight="semibold">{address.name}</Text>
            </Stack>
            {selected && (
              <Text as="span" intent="primary">
                <Check size={16} aria-hidden />
              </Text>
            )}
          </Stack>

          <Text as="div" intent="secondary" size="sm">
            {address.street}
            <br />
            {address.city}, {address.state} {address.postalCode}
            <br />
            {address.country}
          </Text>

          <Stack direction="row" align="center" justify="between">
            {address.isDefault ? (
              <Span variant="muted" data-default-badge="true">Default</Span>
            ) : (
              <span />
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(address.id);
                }}
              >
                Edit
              </Button>
            )}
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
};
