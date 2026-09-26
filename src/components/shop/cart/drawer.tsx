import React from 'react';
import type { ShopId } from '../types';
import { ShoppingBag } from 'lucide-react';
import { Drawer } from '../../overlays/Drawer';
import { CartItem, CartItemProps } from './item';
import { CartSummary } from './summary';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';

/** Copy for the drawer chrome. */
export interface CartDrawerLabels {
  /** Receives the line count, e.g. `(n) => \`Your bag (${n})\``. */
  title?: (count: number) => string;
  empty?: string;
  /** Label on the empty state's dismiss action. */
  continueShopping?: string;
  summary?: import('./summary').CartSummaryLabels;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemProps[];
  onUpdateQuantity?: (id: ShopId, qty: number) => void;
  onRemoveItem?: (id: ShopId) => void;
  onCheckout?: () => void;
  /** Copy for the drawer. Supplied by the app so the library ships no English. */
  labels?: CartDrawerLabels;
  /** Passed through to the summary. */
  currency?: string;
}

/**
 * A cart drawer composed exclusively from puijs primitives: the
 * {@link Drawer} overlay hosts a {@link Stack} layout of {@link CartItem}s and
 * a {@link CartSummary}, with {@link Button}/{@link Text} for the header and
 * empty state. No per-component stylesheet, no raw layout `<div>`, no inline
 * style, and no hardcoded colors.
 */
export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  labels,
  currency,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    // The title and the dismiss control belong to `Drawer`; repeating them here
    // produced a second close button under an empty header band.
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      size="md"
      title={labels?.title ? labels.title(items.length) : `Your bag (${items.length})`}
    >
      <Stack gap={4} data-cart-drawer="true">
        {items.length === 0 ? (
          <Stack align="center" justify="center" gap={3} data-empty="true">
            <Text as="span" intent="muted">
              <ShoppingBag size={48} strokeWidth={1.5} />
            </Text>
            <Text as="span" intent="muted">{labels?.empty ?? 'Your bag is empty'}</Text>
            <Button variant="secondary" size="sm" onClick={onClose}>
              {labels?.continueShopping ?? 'Continue shopping'}
            </Button>
          </Stack>
        ) : (
          <>
            <Stack gap={2} data-item-list="true">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  {...item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </Stack>

            <CartSummary
              subtotal={subtotal}
              currency={currency}
              labels={labels?.summary}
              onCheckout={onCheckout}
            />
          </>
        )}
      </Stack>
    </Drawer>
  );
};
