import React, { createContext, useContext, useEffect, useId, useState } from 'react';
import { cn } from '../../../utils/cn';
import { clampDeck } from '../../../utils/deck';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export const CARD_VARIANTS = {
  DEFAULT: 'default',
  HERO: 'hero',
  FLAT: 'flat',
  COMPACT: 'compact',
} as const;

export type CardVariant = (typeof CARD_VARIANTS)[keyof typeof CARD_VARIANTS];

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  hoverable?: boolean;
  compact?: boolean;
  selected?: boolean;
  /**
   * When `true`, the Card renders without built-in padding so its own
   * `CardHeader`/`CardBody`/`CardFooter` role children can own the padding.
   *
   * Defaults to `false`: a bare `<Card>content</Card>` gets padding baked in,
   * matching consumer expectations. Compositional callers using role children
   * should pass `flush` to avoid double padding.
   */
  flush?: boolean;
  /**
   * Inner padding step: `sm` 16px, `md` 24px, `lg` 32px, scaled by the density
   * preference. A dense tile and a feature panel should not share one inset.
   */
  padding?: 'sm' | 'md' | 'lg';
  /**
   * Deck depth: this many copies of the card stack behind it, each a level smaller and peeking above the last,
   * so the card reads as the top of a deck (0–8). They fan out on hover.
   */
  depth?: number;
  /** Where the deck peeks out: above the card (default), below it, to the right, to the left, or above and below. */
  deckDirection?: 'up' | 'down' | 'right' | 'left' | 'both';
  /**
   * The card wears a colour (a PFT's, a post's item). Left out, the card takes the colour its content reports with
   * `useCardTint` (a tile, a look image), so a grid card is always the colour of its asset; `'none'` keeps the theme. its surface gradient, wash and deck are mixed from it, so a
   * card that holds a themed tile is the same theme as the tile. Pass the exact hex the inner content uses.
   */
  tint?: string | 'none';
  /** With `tint`, the card's primary (links, likes, tags) is the tint too. */
  tintPrimary?: boolean;
  /** With `tint`, how much of it is mixed into the card background (percent, default 30). */
  tintStrength?: number;
  className?: string;
  children?: React.ReactNode;
};

/** `bare`: the content is a card of its own (a tile), so the card around it drops its surface instead of doubling it. */
type TintReport = { hex?: string; strength?: number; bare?: boolean };
const CardTintContext = createContext<((id: string, t: TintReport | null) => void) | null>(null);
/**
 * Content tells the card around it its colour: a tile or an asset image calls this with the colour it paints, and the
 * nearest Card without an explicit `tint` takes it (same mix, same strength), so parent and content are one colour.
 */
export const useCardTint = (hex?: string | null, strength?: number, bare = false) => {
  const report = useContext(CardTintContext);
  const id = useId();
  useEffect(() => {
    if (!report || !(hex || bare)) return undefined;
    report(id, { hex: hex ?? undefined, strength, bare });
    return () => report(id, null);
  }, [report, id, hex, strength, bare]);
};

/**
 * The custom properties a tinted card sets: its head is the colour mixed into the card background at `strength`
 * percent (30 by default, the same ground a Phiegg tile paints behind its picture), fading to nothing at the foot, so
 * the card and its content read as one colour and the card merges into the page; with `primary` the primary follows.
 */
export const tintVars = (hex: string, primary = false, strength = 30): React.CSSProperties => {
  const ground = `color-mix(in srgb, ${hex} ${strength}%, var(--phi-color-background-card))`;
  return {
    '--phi-gradient-card': `linear-gradient(180deg, ${ground} 0%, color-mix(in srgb, ${hex} ${Math.round(strength / 2)}%, transparent) 55%, transparent 100%)`,
    '--phi-gradient-card-child': `linear-gradient(180deg, ${ground} 0%, transparent 100%)`,
    '--phi-gradient-card-wash': 'none',
    '--pui-card-tint': hex,
    ...(primary ? { '--phi-color-primary': hex } : {}),
  } as React.CSSProperties;
};

/**
 * The foundational surface primitive. Appearance is variant- and token-driven
 * through `styles.module.scss` (all `var(--phi-*)` tokens, no hardcoded colors)
 * plus the `data-variant`/state class hooks. Derivative components compose this
 * surface rather than reinventing card markup.
 *
 * Padding: by default Card is padded at the `md` step (24px); pass `padding`
 * so `<Card>content</Card>` renders correctly with no extra wrapper. Pass
 * `flush` when composing with `CardHeader`/`CardBody`/`CardFooter` role
 * children so those role files own the padding instead.
 */
export const Card = ({
  variant = CARD_VARIANTS.DEFAULT,
  hoverable = true,
  compact = false,
  selected = false,
  flush = false,
  padding = 'md',
  depth,
  deckDirection = 'up',
  tint,
  tintPrimary = false,
  tintStrength = 30,
  className = '',
  children,
  style,
  ...props
}: CardProps) => {
  // Every piece of content that reports, in the order it reported. The first colour wins (a card's own subject comes
  // first). A card holding exactly one card of its own (a tile) has no surface of its own: one card, not a card in a
  // card. A card holding several tiles is a container (a list, a sheet), so it keeps its surface.
  const [reports, setReports] = useState<ReadonlyMap<string, TintReport>>(() => new Map());
  const report = React.useCallback((id: string, t: TintReport | null) => setReports((m) => {
    const was = m.get(id);
    if (t ? was && was.hex === t.hex && was.strength === t.strength && was.bare === t.bare : !was) return m;
    const n = new Map(m); if (t) n.set(id, t); else n.delete(id); return n;
  }), []);
  const list = [...reports.values()];
  const firstHex = list.find((r) => r.hex);
  const reported: TintReport | null = list.length ? { hex: firstHex?.hex, strength: firstHex?.strength, bare: list.filter((r) => r.bare).length === 1 } : null;
  const bare = tint === undefined && !!reported?.bare;
  const deck = bare ? 0 : clampDeck(depth);
  const hex = tint === 'none' || bare ? undefined : tint ?? reported?.hex;
  const tinted = hex ? tintVars(hex, tintPrimary, tint ? tintStrength : reported?.strength ?? tintStrength) : undefined;
  // A card with onClick is a control: pointer, focusable, Enter / Space activate it (no style prop needed in apps).
  const clickable = !!props.onClick;
  const keys = clickable && props.tabIndex === undefined ? { tabIndex: 0, role: props.role ?? 'button',
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(e); if (!e.defaultPrevented && e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); props.onClick?.(e as unknown as React.MouseEvent<HTMLElement>); } } } : {};
  const paddingClass = { sm: styles.paddingSm, md: styles.paddingMd, lg: styles.paddingLg }[padding];
  const card = (
    <article
      className={cn(
        'pui-card',
        styles.card,
        styles[variant],
        !flush && styles.padded,
        paddingClass,
        compact && styles.compact,
        hoverable && styles.hoverable,
        selected && styles.selected,
        clickable && styles.clickable,
        className
      )}
      data-variant={variant}
      data-tint={hex ? (tint ? '' : 'content') : undefined}
      data-surface={bare ? 'none' : undefined}
      style={!deck && tinted ? { ...tinted, ...style } : style}
      {...props}
      {...keys}
    >
      {/* an explicit tint stops the report here, so content never re-colours an outer card */}
      <CardTintContext.Provider value={tint === undefined ? report : null}>{children}</CardTintContext.Provider>
    </article>
  );
  if (!deck) return card;
  return (
    <Box className={styles.deck} data-depth={deck} data-deck-direction={deckDirection} style={{ ...tinted, '--pui-card-deck': String(deck) } as React.CSSProperties}>
      {(deckDirection === 'both' ? ['up', 'down'] : [deckDirection]).flatMap((side) => Array.from({ length: deck }, (_, i) => deck - i).map((k) => (
        <Box key={side + k} className={styles.ghost} style={{ '--pui-card-k': String(k) } as React.CSSProperties} aria-hidden="true" data-deck-level={k} data-deck-side={side} />
      )))}
      {card}
    </Box>
  );
};
