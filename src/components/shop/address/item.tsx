import React from 'react';
import type { ShopId } from '../types';
import { MapPin, Check } from 'lucide-react';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Tag } from '../../primitives/Tag';
import { Stack } from '../../layout/Stack';
import { Card, CardBody } from '../../display/card';
import type { ShopAddress } from '../../../types/shop';

/**
 * - `card`: full address block.
 * - `row`: single-line summary.
 * - `compact`: recipient and city only.
 */
export type AddressItemVariant = 'card' | 'row' | 'compact';

export interface AddressItemProps {
  address: ShopAddress;
  variant?: AddressItemVariant;
  /** Renders as a selectable option, for checkout. */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  labels?: { default?: string; setDefault?: string; edit?: string; remove?: string; select?: string };
  className?: string;
}

/** A single address, in card, row or compact form. */
export const AddressItem: React.FC<AddressItemProps> = ({
  address,
  variant = 'card',
  selectable = false,
  selected = false,
  onSelect,
  onEdit,
  onRemove,
  onSetDefault,
  labels = {},
  className,
}) => {
  const isRow = variant === 'row' || variant === 'compact';
  const lines = [address.street, `${address.postalCode} ${address.city}`, address.country];

  return (
    <Card
      className={className}
      variant={variant === 'card' ? 'default' : 'flat'}
      data-variant={variant}
      data-selected={selected ? 'true' : undefined}
      onClick={selectable && onSelect ? () => onSelect(address.id) : undefined}
      role={selectable ? 'radio' : undefined}
      aria-checked={selectable ? selected : undefined}
    >
      <CardBody>
        <Stack direction={isRow ? 'row' : 'column'} gap={2} align={isRow ? 'center' : 'stretch'}>
          <Stack direction="row" align="center" justify="between" gap={2} data-grow="true">
            <Stack direction="row" align="center" gap={2}>
              <Text as="span" intent={selected ? 'primary' : 'muted'}>
                {selected ? <Check size={16} /> : <MapPin size={16} />}
              </Text>
              <Text as="span" weight="semibold">
                {address.recipient ?? address.label ?? address.street}
              </Text>
            </Stack>
            {address.isDefault && (
              <Tag intent="primary" round>
                {labels.default ?? 'Default'}
              </Tag>
            )}
          </Stack>

          {variant !== 'compact' && (
            <Stack gap={0}>
              {lines.map((line) => (
                <Span key={line} variant="muted">
                  {line}
                </Span>
              ))}
            </Stack>
          )}

          {(onEdit || onRemove || onSetDefault) && (
            <Stack direction="row" gap={2}>
              {onSetDefault && !address.isDefault && (
                <Button variant="ghost" size="sm" onClick={() => onSetDefault(address.id)}>
                  {labels.setDefault ?? 'Set as default'}
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(address.id)}>
                  {labels.edit ?? 'Edit'}
                </Button>
              )}
              {onRemove && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(address.id)}>
                  {labels.remove ?? 'Remove'}
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
