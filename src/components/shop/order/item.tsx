import React from 'react';
import type { ShopId } from '../types';
import { Package } from 'lucide-react';
import { Price } from '../price';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Tag } from '../../primitives/Tag';
import { Stack } from '../../layout/Stack';
import { Card, CardBody } from '../../display/card';
import type { ShopOrderStatus } from '../../../types/shop';

/**
 * - `card`: full presentation with the line items listed.
 * - `row`: horizontal summary line.
 * - `compact`: id, status and total only.
 */
export type OrderItemVariant = 'card' | 'row' | 'compact';

export interface OrderLineSummary {
  id: ShopId;
  title: string;
  quantity: number;
  price: number;
}

export interface OrderItemProps {
  id: ShopId;
  date: string;
  total: number;
  status: ShopOrderStatus;
  items?: OrderLineSummary[];
  currency?: string;
  /** Localised status label. Falls back to the raw status when absent. */
  statusLabel?: string;
  variant?: OrderItemVariant;
  onViewDetails?: (id: ShopId) => void;
  detailsLabel?: string;
  className?: string;
}

/** Terminal states read as settled; anything mid-flight reads as in progress. */
const STATUS_INTENT: Record<ShopOrderStatus, 'success' | 'warning' | 'error' | 'primary'> = {
  pending: 'warning',
  processing: 'warning',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'error',
};

export const OrderItem: React.FC<OrderItemProps> = ({
  id,
  date,
  total,
  status,
  items = [],
  currency,
  statusLabel,
  variant = 'card',
  onViewDetails,
  detailsLabel = 'View details',
  className,
}) => {
  const isRow = variant === 'row' || variant === 'compact';

  return (
    <Card className={className} variant={variant === 'card' ? 'default' : 'flat'} data-variant={variant}>
      <CardBody>
        <Stack direction={isRow ? 'row' : 'column'} gap={3} align={isRow ? 'center' : 'stretch'}>
          <Stack direction="row" align="center" justify="between" gap={3} data-grow="true">
            <Stack direction="row" align="center" gap={2}>
              <Text as="span" intent="muted">
                <Package size={16} />
              </Text>
              <Stack gap={0}>
                <Text as="span" weight="semibold">
                  {id}
                </Text>
                <Span variant="muted">{date}</Span>
              </Stack>
            </Stack>
            <Tag intent={STATUS_INTENT[status]} round>
              {statusLabel ?? status}
            </Tag>
          </Stack>

          {variant === 'card' && items.length > 0 && (
            <Stack gap={1}>
              {items.map((line) => (
                <Stack key={String(line.id)} direction="row" justify="between" gap={2}>
                  <Span variant="muted">
                    {line.title} × {line.quantity}
                  </Span>
                  <Price amount={line.price * line.quantity} currency={currency} />
                </Stack>
              ))}
            </Stack>
          )}

          <Stack direction="row" align="center" justify="between" gap={3}>
            <Price amount={total} currency={currency} />
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={() => onViewDetails(id)}>
                {detailsLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
};
