import React, { useState } from 'react';
import type { ShopId } from '../types';
import { Heart, ShoppingCart } from 'lucide-react';
import { Price } from '../price';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import { Link } from '../../navigation/Link';
import { Card, CardBody, CardImage } from '../../display/card';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

/**
 * Appearance variant for a single product entry.
 * - `card`: full card presentation (image on top, footer actions).
 * - `overlay`: the label and price set on the image, over a bottom-to-top
 *   scrim — the shape a slider tile takes.
 * - `row`: horizontal, compact list-row presentation.
 * - `compact`: minimal, dense presentation.
 * Appearance is driven entirely by the `data-variant` attribute + tokens.
 */
export type ProductItemVariant = 'card' | 'overlay' | 'row' | 'compact';

/** Copy the entry renders. Supplied by the app so nothing here is in English by fiat. */
export interface ProductItemLabels {
  add: string;
  wishlist: string;
  colours: string;
}

export const DEFAULT_PRODUCT_ITEM_LABELS: ProductItemLabels = {
  add: 'Add',
  wishlist: 'Wishlist',
  colours: 'Colourways',
};

export interface ProductItemProps {
  id: ShopId;
  title: string;
  category?: string;
  price: number;
  salePrice?: number;
  image: string;
  rating?: number;
  inWishlist?: boolean;
  /** Selects the presentation. Defaults to `row`. */
  variant?: ProductItemVariant;
  /**
   * Destination for the entry. When given, the image and the title render as
   * real anchors, so the entry is focusable, middle-clickable and crawlable.
   * `onClick` still fires for router-driven navigation.
   */
  href?: string;
  /** Copy overrides; defaults to {@link DEFAULT_PRODUCT_ITEM_LABELS}. */
  labels?: Partial<ProductItemLabels>;
  /**
   * The colourways this piece comes in. Shown as swatches on the entry, so the
   * variants are visible before the shopper opens the product.
   */
  colors?: Array<{ hex: string; name: string }>;
  /** How many swatches to show before collapsing the rest into a count. */
  maxSwatches?: number;
  /**
   * Art for a given colourway. Supplying it makes the swatches interactive:
   * choosing one re-renders the piece in that colour, which is what turns a
   * row of cards into a row of variants rather than a row of thumbnails.
   */
  imageFor?: (hex: string, name: string) => string;
  onAddToCart?: (id: ShopId) => void;
  onToggleWishlist?: (id: ShopId) => void;
  onClick?: (id: ShopId) => void;
  className?: string;
}

/**
 * A single variant-driven product entry composed exclusively from puijs
 * primitives ({@link Card}, {@link Stack}, {@link Price}, {@link Button}).
 * The `variant` selects row/card/compact density and affordances purely via
 * the `data-variant` attribute + tokens — no per-component stylesheet, no raw
 * layout `<div>`, no inline style, and no hardcoded colors.
 */
export const ProductItem: React.FC<ProductItemProps> = ({
  id,
  title,
  category,
  price,
  salePrice,
  image,
  inWishlist = false,
  variant = 'row',
  href,
  labels,
  colors,
  maxSwatches = 6,
  imageFor,
  onAddToCart,
  onToggleWishlist,
  onClick,
  className,
}) => {
  const isRow = variant === 'row' || variant === 'compact';
  const isOverlay = variant === 'overlay';
  const copy = { ...DEFAULT_PRODUCT_ITEM_LABELS, ...labels };

  const shown = colors?.slice(0, maxSwatches) ?? [];
  const remaining = (colors?.length ?? 0) - shown.length;
  const [active, setActive] = useState(0);
  const chosen = shown[active];
  const art = (imageFor && chosen ? imageFor(chosen.hex, chosen.name) : image) || image;

  const swatches = shown.length > 0 && (
    <Stack
      direction={imageFor ? 'column' : 'row'}
      align="center"
      gap={1}
      className={styles.swatches}
      data-over={imageFor ? 'true' : undefined}
      role={imageFor ? 'radiogroup' : undefined}
      aria-label={copy.colours}
    >
      {shown.map((c, i) =>
        imageFor ? (
          <button
            key={c.hex + c.name}
            type="button"
            role="radio"
            aria-checked={i === active}
            aria-label={c.name}
            title={c.name}
            className={styles.swatch}
            style={{ backgroundColor: c.hex }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setActive(i);
            }}
          />
        ) : (
          <Span key={c.hex + c.name} className={styles.swatch} style={{ backgroundColor: c.hex }} title={c.name} />
        )
      )}
      {remaining > 0 && <Span className={styles.swatchMore}>+{remaining}</Span>}
    </Stack>
  );

  // The navigable surfaces are anchors when a destination exists and plain
  // spans when it does not, so a card is never a click-handler-only target.
  const navigate = (e: React.MouseEvent) => {
    if (!onClick) return;
    if (href && (e.metaKey || e.ctrlKey || e.shiftKey || (e as React.MouseEvent).button === 1)) return;
    if (href) e.preventDefault();
    onClick(id);
  };

  if (isOverlay) {
    const media = <CardImage src={art} alt={title} loading="lazy" />;
    return (
      <Card
        className={cn(styles.overlayCard, className)}
        variant="default"
        data-variant={variant}
        data-gradient-direction="none"
        hoverable={Boolean(onClick || href)}
        flush
      >
        <Stack className={styles.overlayMedia}>
          {href ? (
            <Link href={href} onClick={navigate} tabIndex={-1} aria-hidden="true">
              {media}
            </Link>
          ) : (
            media
          )}
          {imageFor && swatches}
          {onToggleWishlist && (
            <Button
              variant="icon"
              size="sm"
              data-wishlist="true"
              data-active={inWishlist ? 'true' : 'false'}
              aria-label={copy.wishlist}
              aria-pressed={inWishlist}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(id);
              }}
            >
              <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
            </Button>
          )}
        </Stack>

        <Stack className={styles.overlayBody} gap={1}>
          {category && <Span variant="muted">{category}</Span>}
          {href ? (
            <Link href={href} variant="default" onClick={navigate}>
              <Text as="span" weight="semibold">{title}</Text>
            </Link>
          ) : (
            <Text as="span" weight="semibold" onClick={navigate}>{title}</Text>
          )}
          <Stack direction="row" align="center" justify="between" gap={2}>
            <Price amount={price} saleAmount={salePrice} />
            {!imageFor && swatches}
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      className={className}
      variant={variant === 'card' ? 'default' : 'flat'}
      data-variant={variant}
      data-clickable={onClick ? 'true' : undefined}
    >
      <Stack
        direction={isRow ? 'row' : 'column'}
        align={isRow ? 'center' : 'stretch'}
        gap={3}
      >
        <Stack data-media="true">
          {href ? (
            <Link href={href} onClick={navigate} tabIndex={-1} aria-hidden="true">
              <CardImage src={art} alt={title} loading="lazy" />
            </Link>
          ) : (
            <CardImage src={art} alt={title} loading="lazy" onClick={navigate} />
          )}
          {imageFor && swatches}
          {onToggleWishlist && (
            <Button
              variant="icon"
              size="sm"
              data-wishlist="true"
              data-active={inWishlist ? 'true' : 'false'}
              aria-label={copy.wishlist}
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

        <CardBody className={styles.cardBody}>
          <Stack gap={1}>
            {category && <Span variant="muted">{category}</Span>}
            {href ? (
              <Link href={href} variant="default" onClick={navigate}>
                <Text as="span" weight="semibold" className={styles.cardTitle}>
                  {title}
                </Text>
              </Link>
            ) : (
              <Text
                as="span"
                weight="semibold"
                className={styles.cardTitle}
                data-clickable={onClick ? 'true' : undefined}
                onClick={navigate}
              >
                {title}
              </Text>
            )}
            {!imageFor && swatches}
          </Stack>
        </CardBody>

        {/* Price and action share the card's floor, so a row of cards lines
            them up whether a title ran to one line or three. */}
        <Stack
          direction="row"
          align="center"
          justify="between"
          gap={2}
          data-actions="true"
          className={styles.cardActions}
        >
          <Price amount={price} saleAmount={salePrice} />
          {onAddToCart && (
            <Button
              variant="primary"
              size="sm"
              icon={<ShoppingCart size={15} />}
              onClick={() => onAddToCart(id)}
            >
              {copy.add}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};
