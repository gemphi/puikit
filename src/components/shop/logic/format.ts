/**
 * Money and date formatting for the shop module.
 *
 * Locale and currency are resolved from the shop configuration, never from a
 * literal at a call site, so an app changes them in one place.
 */
export interface ShopLocaleConfig {
  locale: string;
  currency: string;
  /** Whole units by default — most fashion catalogs never show cents. */
  fractionDigits?: number;
}

export const DEFAULT_LOCALE_CONFIG: ShopLocaleConfig = {
  locale: 'en-US',
  currency: 'USD',
  fractionDigits: 0,
};

const cache = new Map<string, Intl.NumberFormat>();

function moneyFormatter(config: ShopLocaleConfig, digits?: number): Intl.NumberFormat {
  const d = digits ?? config.fractionDigits ?? 0;
  const key = `${config.locale}:${config.currency}:${d}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
    cache.set(key, f);
  }
  return f;
}

export const formatPrice = (amount: number, config = DEFAULT_LOCALE_CONFIG): string =>
  moneyFormatter(config).format(amount);

export const formatPriceExact = (amount: number, config = DEFAULT_LOCALE_CONFIG): string =>
  moneyFormatter(config, 2).format(amount);

export const formatDate = (iso: string, config = DEFAULT_LOCALE_CONFIG): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(config.locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};
