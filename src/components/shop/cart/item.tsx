import React from 'react';
import type { ShopId } from '../types';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Price } from '../price';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';
import { Card, CardImage } from '../../display/card';

export interface CartItemProps {
  id: ShopId;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  readonly?: boolean;
  onUpdateQuantity?: (id: ShopId, qty: number) => void;
  onRemove?: (id: ShopId) => void;
  className?: string;
}

/**
 * A cart line item composed exclusively from puijs primitives
 * ({@link Card}, {@link Stack}, {@link Text}, {@link Price}, {@link Button}).
 * No per-component stylesheet, no raw layout `<div>`, no inline style, and no
 * hardcoded colors — the quantity stepper and remove action are icon buttons.
 */
export const CartItem: React.FC<CartItemProps> = ({
  id,
  title,
  price,
  quantity,
  image,
  readonly = false,
  onUpdateQuantity,
  onRemove,
  className,
}) => {
  return (
    <Card variant="flat" hoverable={false} className={className} data-cart-item="true">
      <Stack direction="row" align="center" gap={3}>
        <Stack data-media="true">
          {image ? <CardImage src={image} alt={title} /> : null}
        </Stack>

        <Stack gap={1} data-grow="true">
          <Text as="span" weight="semibold">{title}</Text>
          <Price amount={price * quantity} />
        </Stack>

        <Stack direction="row" align="center" gap={2} data-actions="true">
          {!readonly && onUpdateQuantity ? (
            <Stack direction="row" align="center" gap={2}>
              <Button
                variant="icon"
                size="sm"
                aria-label="Decrease quantity"
                onClick={() => onUpdateQuantity(id, quantity - 1)}
              >
                <Minus size={12} />
              </Button>
              <Text as="span" weight="medium" data-quantity="true">{quantity}</Text>
              <Button
                variant="icon"
                size="sm"
                aria-label="Increase quantity"
                onClick={() => onUpdateQuantity(id, quantity + 1)}
              >
                <Plus size={12} />
              </Button>
            </Stack>
          ) : (
            <Text as="span" intent="muted" data-quantity="true">x{quantity}</Text>
          )}

          {!readonly && onRemove && (
            <Button
              variant="icon"
              size="sm"
              aria-label="Remove item"
              onClick={() => onRemove(id)}
            >
              <Text as="span" intent="danger">
                <Trash2 size={16} />
              </Text>
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};
