import React from 'react';
import type { ShopId } from '../types';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Price } from '../price';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';
import { Card, CardImage } from '../../display/card';

export interface WishlistItemProps {
  id: ShopId;
  title: string;
  price: number;
  image?: string;
  onMoveToCart?: (id: ShopId) => void;
  onRemove?: (id: ShopId) => void;
  className?: string;
}

/**
 * A wishlist line item composed exclusively from puijs primitives
 * ({@link Card}, {@link Stack}, {@link Text}, {@link Price}, {@link Button}).
 * No per-component stylesheet, no raw layout `<div>`, no inline style, and no
 * hardcoded colors — the remove action's danger color flows through
 * token-driven {@link Text}.
 */
export const WishlistItem: React.FC<WishlistItemProps> = ({
  id,
  title,
  price,
  image,
  onMoveToCart,
  onRemove,
  className,
}) => {
  return (
    <Card variant="flat" hoverable={false} className={className} data-wishlist-item="true">
      <Stack direction="row" align="center" gap={3}>
        <Stack data-media="true">
          {image ? <CardImage src={image} alt={title} /> : null}
        </Stack>

        <Stack gap={1} data-grow="true">
          <Text as="span" weight="semibold">{title}</Text>
          <Price amount={price} />
        </Stack>

        <Stack direction="row" align="center" gap={2} data-actions="true">
          {onMoveToCart && (
            <Button
              variant="primary"
              size="sm"
              icon={<ShoppingCart size={14} />}
              onClick={() => onMoveToCart(id)}
            >
              Move to Cart
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={() => onRemove(id)} aria-label="Remove">
              <Text as="span" intent="danger">
                <Trash2 size={15} />
              </Text>
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};
