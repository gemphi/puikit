import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { FitRatioProvider } from '../Fit';
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
  /**
   * Mosaic (on by default from three a row): never a grid of cards all the same size. The rows cycle through blocks:
   * a big square the size of four (two by two), a plain row, a card three tall beside a big square, two cards two tall
   * at the ends; each block mirrors the one before it, and every row stays full. `mosaic={false}` keeps every card the
   * same size.
   */
  mosaic?: boolean;
  /**
   * Which kind of list this is (left out, it is worked out):
   *  - `mosaic`: the main lists of a page, mixed sizes on bank-card cells (the default);
   *  - `thumbs`: small even thumbnails, several a row, for side columns, related media, angles, swatches (the default
   *    when the page asks for cards under 12rem wide, and where a mosaic would get under two columns);
   *  - `even`: cards all one size (`mosaic={false}` too).
   * `slider` (one sideways row) stays its own switch. `scripts/list-variants.mjs` in an app lists every list and its kind.
   */
  variant?: 'mosaic' | 'thumbs' | 'even';
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
  /**
   * Paging: how many cards to render before more are needed (default six rows' worth, at least 24). The next batch
   * comes in on its own as the reader scrolls near the end, so a list of hundreds never builds hundreds of cards.
   */
  pageSize?: number;
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

/** A card bigger than one cell in a mosaic block: its column, width, row and height in cells. */
type Span = { c: number; w: number; r: number; h: number };
/**
 * Every template a row of n cards can take, two or three rows high: the mosaic picks among them evenly. Built in
 * levels: a block is cut into columns, each column into a stack, each piece of a stack cut again, down to pieces that
 * are a small card or a shape. So vertical combinations come at every level (a bar of two over a small card, two bars
 * of three side by side, a square over two small cards…). Shapes come from what the cards look like: `a` a cell's
 * width over its height, `ch` its height, `room` the screen's height, `g` the gap (pixels). A shape keeps a card's
 * proportions (no flatter than a bank card, 1.6 to 1, no narrower than a bar of three bank cards, about 1 to 2) and fits the screen whole.
 * Small cards never more than half a block, never four across a row. Responsive: fewer columns, fewer templates.
 */
const MOSAIC = (n: number, a: number, ch: number, room: number, g: number): { rows: number; spans: Span[] }[] => {
  if (!ch || !a) return [];
  const ok = (w: number, h: number) => {
    if (w === 1 && h === 1) return true;
    const r = (a * w * ch + (w - 1) * g) / (h * ch + (h - 1) * g);
    return w < n && r >= 0.45 && r <= 1.6 && h * ch + (h - 1) * g <= room;
  };
  // Every way to fill a w by h box, as cells relative to its corner; memoised, duplicates dropped.
  const memo = new Map<string, Span[][]>();
  const fill = (w: number, h: number): Span[][] => {
    const key = w + 'x' + h; const hit = memo.get(key); if (hit) return hit;
    const seen = new Map<string, Span[]>();
    const keep = (l: Span[]) => { const s = [...l].sort((x, y) => x.r - y.r || x.c - y.c); seen.set(JSON.stringify(s), s); };
    if (ok(w, h)) keep([{ c: 1, w, r: 1, h }]);
    for (let k = 1; k < h; k++) for (const top of fill(w, k)) for (const low of fill(w, h - k)) keep([...top, ...low.map((s) => ({ ...s, r: s.r + k }))]);
    for (let k = 1; k < w; k++) for (const lft of fill(k, h)) for (const rgt of fill(w - k, h)) keep([...lft, ...rgt.map((s) => ({ ...s, c: s.c + k }))]);
    const out = [...seen.values()]; memo.set(key, out); return out;
  };
  const tops = Math.min(3, Math.max(2, Math.floor((room + g) / (ch + g))));
  const out: { rows: number; spans: Span[] }[] = [];
  for (let rows = 2; rows <= tops; rows++) for (const spans of fill(n, rows)) {
    const big = spans.filter((s) => s.w * s.h > 1);
    const smallAcross = Array.from({ length: rows }, (_, r) => spans.filter((s) => s.w * s.h === 1 && s.r === r + 1).length);
    const small = spans.length - big.length;
    // Small cards never more than half a block's cells, never four across.
    if (big.length && small <= (n * rows) / 2 && smallAcross.every((x) => x < 4)) out.push({ rows, spans });
  }
  return out;
};
/** A steady pick for block k among m templates: the same list always lays out the same way, spread evenly. */
const pickOf = (k: number, m: number, salt: number) => { let x = (k + 1) * 2654435761 ^ salt * 40503; x = Math.imul(x ^ (x >>> 15), 2246822507); x ^= x >>> 13; return (x >>> 0) % m; };
/** How many cards a block holds: its cells, less what its spans take, plus the spans themselves. */
const holds = (_n: number, m: { rows: number; spans: Span[] }) => m.spans.length;

export const Rows = ({ children, cols = 4, colsSm = 2, rowHeight, feature, mosaic = true, variant, slider, itemWidth, perView, minItemWidth, pageSize, className, ...rest }: RowsProps) => {
  const ref = useRef<HTMLElement | null>(null); const [width, setWidth] = useState(0);
  // The grid answers to its own width, not the window's: in a narrow drawer on a wide screen it lays out narrow.
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width))); ro.observe(el); return () => ro.disconnect();
  }, []);
  const narrow = width > 0 && width < 640;
  if (minItemWidth && width) cols = colsSm = fitCols(width, toPx(minItemWidth), toPx('0.75rem'), cols);
  // The kind of list: asked for, else thumbnails when the page wants small cards, else a mosaic.
  let kind: 'mosaic' | 'thumbs' | 'even' = variant ?? (!mosaic ? 'even' : minItemWidth && toPx(minItemWidth) < toPx('12rem') ? 'thumbs' : 'mosaic');
  // A mosaic's cards are bank cards: never narrower than 17rem (about 11rem high), so a card's content always fits. A
  // space too narrow for two such columns (a side column, a sheet) shows thumbnails instead, never one giant card a row.
  if (kind === 'mosaic' && !slider && width) {
    const n = fitCols(width, Math.max(toPx('17rem'), minItemWidth ? toPx(minItemWidth) : 0), toPx('0.75rem'), cols);
    if (n >= 2) cols = colsSm = n;
    else { kind = 'thumbs'; cols = colsSm = fitCols(width, toPx('6rem'), toPx('0.75rem'), Math.max(cols, 3)); }
  }
  else if (width) { if (narrow) cols = colsSm; else colsSm = cols; }
  if (perView) itemWidth = `calc((100% - var(--pui-rows-g) * ${perView - 1}) / ${perView})`;
  const all = React.Children.toArray(children).filter(Boolean);
  // Paging: render a batch, then the next as the end nears. No IntersectionObserver (tests, the server): render all.
  const canPage = !slider && typeof IntersectionObserver !== 'undefined';
  const batch = Math.max(pageSize ?? cols * 6, cols);
  const [shown, setShown] = useState(batch);
  const more = useRef<HTMLElement | null>(null);
  useEffect(() => { setShown(batch); }, [all.length, batch]); // a new filter or sort starts from the top again
  const hasMore = canPage && shown < all.length;
  useEffect(() => {
    const el = more.current; if (!hasMore || !el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown((n) => n + batch); }, { rootMargin: '600px 0px' });
    io.observe(el); return () => io.disconnect();
  }, [hasMore, batch, shown]);
  // The mosaic comes first: a fixed row height and the old feature row apply only where a page turns it off.
  const mixed = kind === 'mosaic' && cols >= 2 && width > 0;
  // In a mosaic every cell is a bank card (1.586 to 1) and every card fills its cell, or the cells its big block takes,
  // exactly: content never moves the rows, so a big card is always an exact multiple of a small one. The gap grows
  // with the cards (the theme's gap up to 2rem, 8% of a column); the screen's height caps how tall a big card may be.
  const BANK = 1.586;
  const gapPx = Math.round(Math.max(toPx('0.75rem'), Math.min(toPx('2rem'), (width ? width / cols : 0) * 0.08)));
  // Cards with a picture and words (a look, an item) need more height than one bank card gives, or the picture is a
  // thin strip: when a one-cell card's picture frame gets less than about half its cell, the cells become two bank
  // cards high (a portrait cell) for this list, and every template is built on that.
  const [tallCells, setTallCells] = useState(false);
  const cellW = width ? (width - gapPx * (cols - 1)) / cols : 0, cellH = tallCells ? (cellW / BANK) * 2 + gapPx : cellW / BANK;
  const screen = (typeof window !== 'undefined' ? window.innerHeight : 800) - toPx('8rem');
  useEffect(() => {
    if (tallCells || !ref.current) return;
    const frame = ref.current.querySelector<HTMLElement>('[data-one] .pui-frame');
    const box = frame?.closest<HTMLElement>('[data-one]');
    if (frame && box && box.clientHeight > 0 && frame.clientHeight < box.clientHeight * 0.55) setTallCells(true);
  });
  const kinds = React.useMemo(() => MOSAIC(cols, BANK, cellH, screen, gapPx), [cols, Math.round(cellH / 8), Math.round(screen / 8), gapPx]), plan = mixed ? kinds.map((m) => holds(cols, m)) : [];
  const unit = cols;
  // While more are coming, keep the shown cards to whole cycles so no half row (or leftover slider) appears mid-list.
  const items = hasMore ? all.slice(0, Math.max(unit, Math.floor(shown / unit) * unit)) : all;
  // No card thinner than a bank card: every cell is at least its column's width over 1.586 tall.
  const colW = width ? (width - toPx('0.75rem') * (cols - 1)) / cols : 0;
  const vars = { ...(colW > 0 && (!rowHeight || mixed) ? { '--pui-rows-min-h': `${Math.round(colW / 1.586)}px` } : {}),
    ...(mixed ? { '--pui-rows-mg': `${gapPx}px`, '--pui-rows-cell-h': `${Math.round(cellH)}px` } : {}), '--pui-rows-cols': String(cols), '--pui-rows-cols-sm': String(colsSm), ...(rowHeight && !mixed ? { '--pui-rows-h': rowHeight } : {}), ...(itemWidth ? { '--pui-rows-item-w': itemWidth } : {}) } as React.CSSProperties;
  const cell = (node: React.ReactNode, k: React.Key) => <Box key={k} className={styles.cell} data-one>{mixed ? <FitRatioProvider value="auto">{node}</FitRatioProvider> : node}</Box>;
  if (slider) return <Box ref={ref} className={cn(styles.rows, className)} style={vars} aria-label={rest['aria-label']}><Box className={styles.slider} role="list">{items.map((n, i) => cell(n, i))}</Box></Box>;
  const head = feature && !mixed && items.length >= 3 ? items.slice(0, 3) : [];
  const rest_ = items.slice(head.length);
  // The mosaic's blocks, in turn, while the next one fits whole; then whole plain rows; then the slider.
  const blocks: { rows: number; spans: Span[]; nodes: React.ReactNode[] }[] = [];
  let at = 0;
  // Each block a template picked evenly from all that work, never the one just used; near the end, among those the
  // cards left can fill (so the end is a block too).
  let last = -1;
  for (let k = 0; mixed && kinds.length; k++) {
    const room = rest_.length - at;
    const fit = kinds.map((_, i) => i).filter((i) => plan[i] <= room && i !== last);
    if (!fit.length) break;
    const pick = fit[pickOf(k, fit.length, cols)];
    blocks.push({ rows: kinds[pick].rows, spans: kinds[pick].spans, nodes: rest_.slice(at, at + plan[pick]) });
    at += plan[pick]; last = pick;
  }
  const tail = rest_.slice(at);
  const full = Math.floor(tail.length / cols) * cols;
  const grid = tail.slice(0, full), left = tail.slice(full);
  return (
    <Box ref={ref} className={cn(styles.rows, className, rowHeight && !mixed && styles.fixed, mixed && styles.mosaic)} style={vars} aria-label={rest['aria-label']} data-cols={cols} data-variant={slider ? 'slider' : kind} data-narrow={narrow || undefined}>
      {head.length > 0 && (
        <Box className={styles.feature}>
          <Box className={cn(styles.cell, styles.big)}>{head[0]}</Box>
          <Box className={styles.stack}>{cell(head[1], 'f1')}{cell(head[2], 'f2')}</Box>
        </Box>
      )}
      {blocks.map((b, k) => (
        <Box key={'m' + k} className={styles.grid}>
          {b.nodes.map((n, i) => {
            const s = b.spans[i];
            return s ? <Box key={i} className={cn(styles.cell, styles.span)} data-one={s.w * s.h === 1 || undefined} style={{ gridColumn: `${s.c} / span ${s.w}`, gridRow: `${s.r} / span ${s.h}` }}>
              <FitRatioProvider value="auto">{n}</FitRatioProvider></Box> : cell(n, i);
          })}
        </Box>
      ))}
      {grid.length > 0 && <Box className={styles.grid}>{grid.map((n, i) => cell(n, i))}</Box>}
      {left.length > 0 && <Box className={styles.slider} role="list">{left.map((n, i) => cell(n, 'l' + i))}</Box>}
      {hasMore && <Box ref={more} aria-hidden="true" style={{ height: 1 }} />}
    </Box>
  );
};
