import React from 'react';
import { CreditCard, Check } from 'lucide-react';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Tag } from '../../primitives/Tag';
import { Stack } from '../../layout/Stack';
import { Card, CardBody } from '../../display/card';
import type { ShopPaymentMethod } from '../../../types/shop';

export type PaymentItemVariant = 'card' | 'row' | 'compact';

export interface PaymentItemProps {
  method: ShopPaymentMethod;
  variant?: PaymentItemVariant;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  labels?: { default?: string; setDefault?: string; remove?: string; expires?: string };
  className?: string;
}

/** A saved card. Only ever renders the last four digits. */
export const PaymentItem: React.FC<PaymentItemProps> = ({
  method,
  variant = 'card',
  selectable = false,
  selected = false,
  onSelect,
  onRemove,
  onSetDefault,
  labels = {},
  className,
}) => {
  const isRow = variant === 'row' || variant === 'compact';

  return (
    <Card
      className={className}
      variant={variant === 'card' ? 'default' : 'flat'}
      data-variant={variant}
      data-selected={selected ? 'true' : undefined}
      onClick={selectable && onSelect ? () => onSelect(method.id) : undefined}
      role={selectable ? 'radio' : undefined}
      aria-checked={selectable ? selected : undefined}
    >
      <CardBody>
        <Stack direction={isRow ? 'row' : 'column'} gap={2} align={isRow ? 'center' : 'stretch'}>
          <Stack direction="row" align="center" justify="between" gap={2} data-grow="true">
            <Stack direction="row" align="center" gap={2}>
              <Text as="span" intent={selected ? 'primary' : 'muted'}>
                {selected ? <Check size={16} /> : <CreditCard size={16} />}
              </Text>
              <Stack gap={0}>
                <Text as="span" weight="semibold">
                  ···· {method.lastFour}
                </Text>
                <Span variant="muted">{method.cardholderName}</Span>
              </Stack>
            </Stack>
            {method.isDefault && (
              <Tag intent="primary" round>
                {labels.default ?? 'Default'}
              </Tag>
            )}
          </Stack>

          {variant !== 'compact' && (
            <Span variant="muted">
              {labels.expires ?? 'Expires'} {method.expiry}
            </Span>
          )}

          {(onRemove || onSetDefault) && (
            <Stack direction="row" gap={2}>
              {onSetDefault && !method.isDefault && (
                <Button variant="ghost" size="sm" onClick={() => onSetDefault(method.id)}>
                  {labels.setDefault ?? 'Set as default'}
                </Button>
              )}
              {onRemove && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(method.id)}>
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
