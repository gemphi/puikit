import React from 'react';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Price } from '../price';
import { Stack } from '../../layout/Stack';
import { Card } from '../../display/card';

/** Copy for the summary. Supplied by the app so the library ships no English. */
export interface CartSummaryLabels {
  subtotal?: string;
  discount?: string;
  shipping?: string;
  free?: string;
  tax?: string;
  total?: string;
  checkout?: string;
}

const DEFAULT_LABELS: Required<CartSummaryLabels> = {
  subtotal: 'Subtotal',
  discount: 'Discount',
  shipping: 'Shipping',
  free: 'Free',
  tax: 'Tax',
  total: 'Total',
  checkout: 'Checkout',
};

export interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  /** ISO 4217 currency code. Defaults to the surrounding ShopProvider's. */
  currency?: string;
  /** Override any label; anything omitted falls back to a neutral English default. */
  labels?: CartSummaryLabels;
  onCheckout?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * An order/cart summary composed exclusively from puijs primitives
 * ({@link Card}, {@link Stack}, {@link Text}, {@link Price}, {@link Button}).
 * No per-component stylesheet, no raw layout `<div>`, no inline style, and no
 * hardcoded colors — discount/free emphasis flows through token-driven Text.
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  shipping = 0,
  tax = 0,
  discount = 0,
  currency,
  labels,
  onCheckout,
  loading = false,
  className,
}) => {
  const total = Math.max(0, subtotal + shipping + tax - discount);
  const l = { ...DEFAULT_LABELS, ...labels };

  return (
    <Card variant="flat" hoverable={false} className={className} data-cart-summary="true">
      <Stack gap={2}>
        <Stack direction="row" align="center" justify="between">
          <Text as="span">{l.subtotal}</Text>
          <Price amount={subtotal} currency={currency} />
        </Stack>

        {discount > 0 && (
          <Stack direction="row" align="center" justify="between">
            <Text as="span">{l.discount}</Text>
            <Text as="span" intent="danger" weight="semibold">
              -<Price amount={discount} currency={currency} />
            </Text>
          </Stack>
        )}

        <Stack direction="row" align="center" justify="between">
          <Text as="span">{l.shipping}</Text>
          {shipping === 0 ? (
            <Text as="span" intent="success" weight="semibold" data-free="true">{l.free}</Text>
          ) : (
            <Price amount={shipping} currency={currency} />
          )}
        </Stack>

        {tax > 0 && (
          <Stack direction="row" align="center" justify="between">
            <Text as="span">{l.tax}</Text>
            <Price amount={tax} currency={currency} />
          </Stack>
        )}

        <Stack direction="row" align="center" justify="between" data-total="true">
          <Text as="span" weight="bold">{l.total}</Text>
          <Price amount={total} currency={currency} />
        </Stack>

        {onCheckout && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={subtotal <= 0}
            onClick={onCheckout}
          >
            {l.checkout}
          </Button>
        )}
      </Stack>
    </Card>
  );
};
