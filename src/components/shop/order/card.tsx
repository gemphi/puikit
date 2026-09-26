import React from 'react';
import type { ShopId } from '../types';
import { Package, ArrowRight } from 'lucide-react';
import { Price } from '../price';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';
import { Card, CardHeader, CardBody, CardFooter } from '../../display/card';

export type OrderStatus = 'completed' | 'processing' | 'cancelled';

export interface OrderItemSummary {
  id: ShopId;
  title: string;
  quantity: number;
  price: number;
}

export interface OrderCardProps {
  id: ShopId;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItemSummary[];
  onViewDetails?: (id: ShopId) => void;
  className?: string;
}

const STATUS_INTENT: Record<OrderStatus, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  processing: 'warning',
  cancelled: 'danger',
};

/**
 * An order card composed exclusively from puijs primitives: the {@link Card}
 * family provides the surface/regions, {@link Stack} the layout, {@link Text}
 * the typography (status via token-driven `intent`), {@link Price} the money,
 * and {@link Button} the action. No per-component stylesheet, no raw layout
 * `<div>`, no inline style, and no hardcoded colors.
 */
export const OrderCard: React.FC<OrderCardProps> = ({
  id,
  date,
  total,
  status,
  items,
  onViewDetails,
  className,
}) => {
  return (
    <Card hoverable={false} className={className} data-order-card="true">
      <CardHeader
        action={
          <Text as="span" intent={STATUS_INTENT[status]} weight="semibold" data-status={status}>
            {status.toUpperCase()}
          </Text>
        }
      >
        <Stack gap={1}>
          <Text as="span" weight="semibold">
            <Package size={16} aria-hidden /> Order #{id}
          </Text>
          <Text as="span" intent="muted" size="sm">{date}</Text>
        </Stack>
      </CardHeader>

      <CardBody>
        <Stack gap={2}>
          {items.map((item) => (
            <Stack key={item.id} direction="row" align="center" justify="between" data-item-row="true">
              <Text as="span">
                {item.title} <Text as="span" intent="muted">x{item.quantity}</Text>
              </Text>
              <Price amount={item.price * item.quantity} />
            </Stack>
          ))}
        </Stack>
      </CardBody>

      <CardFooter>
        <Stack direction="row" align="center" justify="between" data-total="true">
          <Stack direction="row" align="center" gap={2}>
            <Text as="span" intent="secondary" size="sm">Total Paid:</Text>
            <Price amount={total} />
          </Stack>
          {onViewDetails && (
            <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => onViewDetails(id)}>
              Details
            </Button>
          )}
        </Stack>
      </CardFooter>
    </Card>
  );
};
