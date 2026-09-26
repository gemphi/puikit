import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

export const CARD_VARIANTS = {
  DEFAULT: 'default',
  HERO: 'hero',
  FLAT: 'flat',
  COMPACT: 'compact',
} as const;

export type CardVariant = (typeof CARD_VARIANTS)[keyof typeof CARD_VARIANTS];

type CardProps = React.HTMLAttributes<HTMLElement> & {
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
  className?: string;
  children?: React.ReactNode;
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
  className = '',
  children,
  ...props
}: CardProps) => {
  const paddingClass = { sm: styles.paddingSm, md: styles.paddingMd, lg: styles.paddingLg }[padding];
  return (
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
        className
      )}
      data-variant={variant}
      {...props}
    >
      {children}
    </article>
  );
};
