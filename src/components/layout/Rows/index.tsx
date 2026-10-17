import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type RowsProps = {
  children: React.ReactNode;
  /** Cards per full row (desktop). */
  cols?: number;
  /** Cards per full row under 640px. */
  colsSm?: number;
  /** Fixed row height (any CSS length); cards should fill it (ratio "auto"). Omit to let cards size the row. */
  rowHeight?: string;
  /** First row is a feature: one large card beside two stacked ones. */
  feature?: boolean;
  /** Everything in one sideways slider row. */
  slider?: boolean;
  /** Slider card width (defaults to one column's width). */
  itemWidth?: string;
  /** Slider: this many cards fill the row (overrides itemWidth). */
  perView?: number;
  /**
   * Responsive: the narrowest a card may get (rem or px, e.g. "15rem"). The row measures its own width and fits as many
   * cards as stay at least this wide, up to `cols`, so a narrow column or a phone never squeezes too many cards in.
   */
  minItemWidth?: string;
  className?: string;
  'aria-label'?: string;
};

/**
 * Rows — a grid that never leaves holes. Cards are laid out in rows that are always full: an optional feature row
 * (one large card + two stacked), then as many complete rows of `cols` as the cards fill, and whatever is left over
 * goes into a sideways slider row at the same card width instead of a half-empty row. `slider` puts everything in one
 * scrolling row (creators, people, stories). Gaps, radius and motion are theme tokens.
 */
const toPx = (len: string) => { const n = parseFloat(len); if (!Number.isFinite(n)) return 0;
  if (len.endsWith('px')) return n; const root = typeof document !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16; return n * root; };
/** Cards per row that keep each card at least `min` wide (gap included), between 1 and `max`. */
export const fitCols = (width: number, min: number, gap: number, max: number) => (width > 0 && min > 0 ? Math.max(1, Math.min(max, Math.floor((width + gap) / (min + gap)))) : max);

export const Rows = ({ children, cols = 4, colsSm = 2, rowHeight, feature, slider, itemWidth, perView, minItemWidth, className, ...rest }: RowsProps) => {
  const ref = useRef<HTMLElement | null>(null); const [width, setWidth] = useState(0);
  // The grid answers to its own width, not the window's: in a narrow drawer on a wide screen it lays out narrow.
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width))); ro.observe(el); return () => ro.disconnect();
  }, []);
  const narrow = width > 0 && width < 640;
  if (minItemWidth && width) cols = colsSm = fitCols(width, toPx(minItemWidth), toPx('0.75rem'), cols);
  else if (width) { if (narrow) cols = colsSm; else colsSm = cols; }
  if (perView) itemWidth = `calc((100% - var(--pui-rows-gap) * ${perView - 1}) / ${perView})`;
  const items = React.Children.toArray(children).filter(Boolean);
  const vars = { '--pui-rows-cols': String(cols), '--pui-rows-cols-sm': String(colsSm), ...(rowHeight ? { '--pui-rows-h': rowHeight } : {}), ...(itemWidth ? { '--pui-rows-item-w': itemWidth } : {}) } as React.CSSProperties;
  const cell = (node: React.ReactNode, k: React.Key) => <Box key={k} className={styles.cell}>{node}</Box>;
  if (slider) return <Box ref={ref} className={cn(styles.rows, className)} style={vars} aria-label={rest['aria-label']}><Box className={styles.slider} role="list">{items.map((n, i) => cell(n, i))}</Box></Box>;
  const head = feature && items.length >= 3 ? items.slice(0, 3) : [];
  const rest_ = items.slice(head.length);
  const full = Math.floor(rest_.length / cols) * cols;
  const grid = rest_.slice(0, full), left = rest_.slice(full);
  return (
    <Box ref={ref} className={cn(styles.rows, className, rowHeight && styles.fixed)} style={vars} aria-label={rest['aria-label']} data-cols={cols} data-narrow={narrow || undefined}>
      {head.length > 0 && (
        <Box className={styles.feature}>
          <Box className={cn(styles.cell, styles.big)}>{head[0]}</Box>
          <Box className={styles.stack}>{cell(head[1], 'f1')}{cell(head[2], 'f2')}</Box>
        </Box>
      )}
      {grid.length > 0 && <Box className={styles.grid}>{grid.map((n, i) => cell(n, i))}</Box>}
      {left.length > 0 && <Box className={styles.slider} role="list">{left.map((n, i) => cell(n, 'l' + i))}</Box>}
    </Box>
  );
};
