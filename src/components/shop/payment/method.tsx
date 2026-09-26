import React from 'react';
import type { ShopId } from '../types';
import { CreditCard, Check } from 'lucide-react';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';
import { Card, CardBody } from '../../display/card';

export interface PaymentMethodModel {
  id: ShopId;
  type: 'card' | 'bank' | 'wallet';
  label: string;
  last4?: string;
  expiry?: string;
  brand?: string;
}

export interface PaymentMethodProps {
  method: PaymentMethodModel;
  selected?: boolean;
  onSelect?: (id: ShopId) => void;
  className?: string;
}

/**
 * A payment method row composed exclusively from puijs primitives: the
 * {@link Card} family provides the selectable surface, {@link Stack} the
 * layout, and {@link Text} the typography (icon color via token-driven
 * `intent`). No per-component stylesheet, no raw layout `<div>`, no inline
 * style, and no hardcoded colors.
 */
export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  method,
  selected = false,
  onSelect,
  className,
}) => {
  return (
    <Card
      className={className}
      hoverable={!!onSelect}
      selected={selected}
      onClick={() => onSelect?.(method.id)}
      data-payment-method="true"
      data-clickable={onSelect ? 'true' : undefined}
    >
      <CardBody>
        <Stack direction="row" align="center" gap={3}>
          <Text as="span" intent="primary">
            <CreditCard size={20} aria-hidden />
          </Text>
          <Stack gap={1} data-grow="true">
            <Text as="span" weight="semibold">
              {method.label} {method.last4 ? `•••• ${method.last4}` : ''}
            </Text>
            {method.expiry && (
              <Text as="span" intent="muted" size="sm">Expires {method.expiry}</Text>
            )}
          </Stack>
          {selected && (
            <Text as="span" intent="primary">
              <Check size={18} aria-hidden />
            </Text>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
