import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import type { StyleProps } from '../../shared/styleProps';
import styles from './styles.module.scss';

export type PressableGap = 0 | 1 | 2 | 3 | 4;

export type PressableProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & StyleProps & {
  /** Lay the content out in a row, centred on the cross axis. */
  row?: boolean;
  /** Gap between children in a row (the Stack scale, 0.25rem steps). */
  gap?: PressableGap;
  /** Take the full width of its parent. */
  fill?: boolean;
  /** Inner padding. */
  pad?: 'none' | 'sm' | 'md';
  /** Theme radius, and a soft shade on hover and focus. */
  hover?: boolean;
  /** Shown as the chosen one (a soft primary shade). */
  selected?: boolean;
  /** A link instead of a button. */
  href?: string;
  /** Inline (a span-level control inside text) rather than a block. */
  inline?: boolean;
  /** A rule under it, for rows in a list. */
  divider?: boolean;
  /** Lay the content out in a column (a clickable card). */
  column?: boolean;
  /** A clickable card: the card gradient, theme radius, padding and a lifted shadow on hover. */
  card?: boolean;
  /** Highlighted (the keyboard row in a list, the page you are on) without claiming to be a pressed toggle. */
  current?: boolean;
  /** An accent bar on the inline start when selected or current (a nav item). */
  accent?: boolean;
};

/**
 * A control with no look of its own: no border, background or padding, the text colour of its parent, a pointer and a
 * focus ring. For anything clickable that is not a Button (an avatar, a list row, a card face), so apps never style a
 * raw button.
 */
export const Pressable = React.forwardRef<HTMLElement, PressableProps>(function Pressable(
  { row = false, gap = 2, fill = false, pad = 'none', hover = false, selected = false, inline = false, divider = false, column = false, card = false, current = false, accent = false, href, className, type, children, ...props }, ref) {
  return (
    <Box
      ref={ref}
      as={href ? 'a' : 'button'}
      className={cn('pui-pressable', styles.pressable, row && styles.row, column && styles.column, (row || column) && styles[`gap${gap}`], card && styles.card, fill && styles.fill,
        pad !== 'none' && styles[`pad-${pad}`], hover && styles.hover, selected && styles.selected, inline && styles.inline, divider && styles.divider, current && styles.current, accent && styles.accent, className)}
      aria-pressed={selected || undefined}
      aria-current={current ? 'true' : undefined}
      {...({ ...props, ...(href ? { href } : { type: type ?? 'button' }) } as Record<string, unknown>)}
    >
      {children}
    </Box>
  );
});
