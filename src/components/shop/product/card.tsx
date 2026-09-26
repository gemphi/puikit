import React from 'react';
import type { ShopId } from '../types';
import { Heart, ShoppingCart } from 'lucide-react';
import { Price } from '../price';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import { Card, CardBody, CardFooter, CardImage } from '../../display/card';

export interface ProductCardProps {
  id: ShopId;
  title: string;
  category?: string;
  price: number;
  salePrice?: number;
  image: string;
  rating?: number;
  inWishlist?: boolean;
  onAddToCart?: (id: ShopId) => void;
  onToggleWishlist?: (id: ShopId) => void;
  onClick?: (id: ShopId) => void;
  className?: string;
}

/**
 * A product card composed exclusively from puijs primitives: the {@link Card}
 * family provides the surface, {@link Stack} the layout, {@link Price} the
 * price treatment and {@link Button} the actions. No per-component stylesheet,
 * no raw layout `<div>`, no inline style, and no hardcoded colors — icon color
 * flows from token-driven {@link Text}/{@link Span} wrappers via `currentColor`.
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  category,
  price,
  salePrice,
  image,
  inWishlist = false,
  onAddToCart,
  onToggleWishlist,
  onClick,
  className,
}) => {
  return (
    <Card className={className} data-clickable={onClick ? 'true' : undefined}>
      <Stack data-media="true" onClick={() => onClick?.(id)}>
        <CardImage src={image} alt={title} loading="lazy" />
        {onToggleWishlist && (
          <Button
            variant="icon"
            size="sm"
            data-wishlist="true"
            data-active={inWishlist ? 'true' : 'false'}
            aria-label="Wishlist"
            aria-pressed={inWishlist}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(id);
            }}
          >
            <Text as="span" intent={inWishlist ? 'danger' : 'muted'}>
              <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
            </Text>
          </Button>
        )}
      </Stack>

      <CardBody>
        <Stack gap={2}>
          {category && (
            <Span variant="muted">{category}</Span>
          )}
          <Text
            as="span"
            weight="semibold"
            data-clickable={onClick ? 'true' : undefined}
            onClick={() => onClick?.(id)}
          >
            {title}
          </Text>
        </Stack>
      </CardBody>

      <CardFooter>
        <Stack direction="row" align="center" justify="between" gap={2}>
          <Price amount={price} saleAmount={salePrice} />
          {onAddToCart && (
            <Button
              variant="primary"
              size="sm"
              icon={<ShoppingCart size={15} />}
              onClick={() => onAddToCart(id)}
            >
              Add
            </Button>
          )}
        </Stack>
      </CardFooter>
    </Card>
  );
};
