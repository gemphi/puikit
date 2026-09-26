import React from 'react';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';
import { useOptionalShopConfig } from '../provider';
import { DEFAULT_LOCALE_CONFIG, formatPrice } from '../logic/format';

export interface PriceProps {
  amount: number;
  /**
   * ISO 4217 currency **code** (`EUR`, `USD`, `JPY`) — not a symbol. The symbol
   * and its placement are derived from the locale, because they differ by
   * locale even for the same currency.
   *
   * Defaults to the surrounding `ShopProvider`'s currency.
   */
  currency?: string;
  /** BCP 47 locale. Defaults to the surrounding `ShopProvider`'s locale. */
  locale?: string;
  /** Decimal places. Defaults to the provider's setting (0 for most catalogs). */
  fractionDigits?: number;
  saleAmount?: number;
  className?: string;
  showDiscount?: boolean;
}

/**
 * A price treatment composed exclusively from puijs primitives.
 *
 * Formatting goes through `Intl.NumberFormat`, so `EUR` renders as `€9,700` in
 * `en-IE` and `9.700 €` in `de-DE` — a hardcoded symbol prefix cannot do that,
 * and gets grouping and decimal conventions wrong everywhere but en-US.
 */
export const Price: React.FC<PriceProps> = ({
  amount,
  currency,
  locale,
  fractionDigits,
  saleAmount,
  className,
  showDiscount = true,
}) => {
  const config = useOptionalShopConfig();
  const base = config?.locale ?? DEFAULT_LOCALE_CONFIG;
  const resolved = {
    locale: locale ?? base.locale,
    currency: currency ?? base.currency,
    fractionDigits: fractionDigits ?? base.fractionDigits ?? 0,
  };

  const hasDiscount = saleAmount !== undefined && saleAmount < amount;
  const current = hasDiscount ? saleAmount : amount;
  const discountPercent = hasDiscount ? Math.round(((amount - saleAmount) / amount) * 100) : 0;

  return (
    <Stack direction="row" align="baseline" gap={2} className={className} data-price="true">
      <Text as="span" weight="bold" data-price-amount="true">
        {formatPrice(current, resolved)}
      </Text>
      {hasDiscount && (
        <>
          <Text as="span" intent="muted" textDecoration="line-through" data-price-original="true">
            {formatPrice(amount, resolved)}
          </Text>
          {showDiscount && (
            <Text as="span" intent="danger" weight="semibold" data-price-discount="true">
              -{discountPercent}%
            </Text>
          )}
        </>
      )}
    </Stack>
  );
};
