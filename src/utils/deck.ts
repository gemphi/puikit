/**
 * Deck of cards from one element: `n` copies of the surface stacked behind it, each one level smaller in width and
 * peeking out above the previous one, so a single card reads as the top of a deck. Built from box-shadows (no extra
 * DOM): for each level a fill in the card's own colour, a step darker per level, edged by a hairline.
 */
export const DECK_MAX = 8;
export const clampDeck = (n?: number) => Math.max(0, Math.min(DECK_MAX, Math.round(n ?? 0)));

/**
 * `dir` 'up' (default) stacks the copies above the card; 'down' hangs them below it — the opposite cascade, used
 * where a parent cascades up so the child reads as cut out of it (a 3D step). Each level is the card colour tinted
 * a little more by the theme primary, so the deck is visible on gradient surfaces too.
 */
export function deckShadow(n: number, stepPx = 7, shrinkPx = 6, dir: 'up' | 'down' = 'up'): string {
  const out: string[] = []; const s = dir === 'down' ? 1 : -1;
  for (let k = 1; k <= n; k++) {
    const y = s * k * stepPx, spread = -k * shrinkPx;
    const shade = Math.max(46, 90 - k * 9); const tint = 8 + k * 7;
    out.push(`0 ${y}px 0 ${spread}px color-mix(in srgb, color-mix(in srgb, var(--phi-color-primary, #0071e3) ${tint}%, var(--phi-color-background-card, #fff)) ${shade}%, var(--phi-color-text-primary, #000))`);
    out.push(`0 ${y + s}px 0 ${spread}px color-mix(in srgb, var(--phi-color-primary, #0071e3) 22%, var(--phi-color-border, #ccc))`);
  }
  return out.join(', ');
}
