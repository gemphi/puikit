const cache = new Map<string, Intl.NumberFormat>();

/**
 * Compact counts, the way a feed shows them: 1834 -> `1.8K`, 2_400_000 ->
 * `2.4M`. One formatter per locale, cached like the shop's price formatter.
 */
export function formatCount(value: number, locale = 'en-US'): string {
  let nf = cache.get(locale);
  if (!nf) {
    nf = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
    cache.set(locale, nf);
  }
  return nf.format(value);
}
