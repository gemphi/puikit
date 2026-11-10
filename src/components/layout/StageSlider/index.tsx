import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { ProgressBar } from '../../feedback/ProgressBar';
import { useShell } from '../../navigation/AppShell/context';
import { useStageFit } from './useStageFit';
import styles from './styles.module.scss';

export type StageSlide = { id: string; node: React.ReactNode; label?: string };
export type StageSliderProps = {
  items: StageSlide[];
  /** Controlled position; leave out to let the slider keep its own. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Slides shown on each side of the centre (0–3). `auto` (the default): two, so five in view, while the shell's menu
      panel is closed; one, so three, while it is open or the stage is phone-narrow. */
  sides?: number | 'auto';
  /** Each side level is this fraction of the one before it (0.5: a side slide is half the centre's height). */
  sideScale?: number;
  /** How much of each side slide tucks under the one in front of it (0.5: half of it). */
  overlap?: number;
  /** Width of the centre slide (any CSS length); with `fill`, only the most it may take (no limit by default). */
  stageWidth?: string;
  /** On by default: the centre is as large as the row and the page's visible height allow, and the sides grow into
      whatever width is left, so the stage uses its whole space. Off: the centre is `stageWidth`. */
  fill?: boolean;
  /** Progress bar and position under the stage (default on). */
  progress?: boolean;
  /** Actions beside the progress bar (a watch button, a buy button). */
  footer?: React.ReactNode;
  prevLabel?: string; nextLabel?: string;
  positionLabel?: (i: number, n: number) => string;
  'aria-label'?: string;
  className?: string;
};

const wrap = (k: number, n: number) => ((k % n) + n) % n;
/** Offsets of each level from the centre, in centre widths (a level sits beside the one in front, `overlap` of it
    under), and the row's whole width: the outermost level's offset and its half, on both sides. */
const rowOf = (s: number, reach: number, overlap: number) => {
  const off: number[] = [0]; for (let k = 1; k <= reach; k++) off[k] = off[k - 1] + Math.pow(s, k - 1) / 2 + Math.pow(s, k) / 2 - overlap * Math.pow(s, k);
  return { off, span: 2 * (off[reach] + Math.pow(s, reach) / 2) };
};
/** The largest side scale, from `s` up to 0.8, whose row still fits `room` centre widths (halving the gap each step). */
const growTo = (s: number, reach: number, overlap: number, room: number) => {
  if (!reach || rowOf(s, reach, overlap).span >= room) return s;
  let lo = s, hi = 0.8; for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (rowOf(mid, reach, overlap).span <= room) lo = mid; else hi = mid; }
  return lo;
};

/**
 * StageSlider: one slide in the centre and its neighbours either side, each side level `sideScale` of the one in front
 * (half its height by default) with `overlap` of it tucked underneath, so the row reads as a deck seen from the front.
 * Arrows sit on the sides, the keyboard arrows step, a side slide steps when clicked, and a progress bar in the
 * theme's primary (one colour, track and meter) shows where you are. Tokens only.
 */
export const StageSlider = ({ items, index, defaultIndex = 0, onIndexChange, sides = 'auto', sideScale = 0.5, overlap = 0.5, stageWidth, fill = true, progress = true, footer,
  prevLabel = 'Previous', nextLabel = 'Next', positionLabel = (i, n) => `${i} / ${n}`, className, ...rest }: StageSliderProps) => {
  const [own, setOwn] = useState(defaultIndex);
  const n = items.length; const at = wrap(index ?? own, Math.max(1, n));
  useEffect(() => { if (index === undefined && own >= n && n) setOwn(0); }, [n]);
  // Fill: the stage measures its width, the height its page shows and the centre's own shape (useStageFit).
  const { navOpen } = useShell(); const root = useRef<HTMLElement>(null); const stage = useRef<HTMLElement>(null);
  const fit = useStageFit(fill, root, stage, at);
  const narrow = fit.free > 0 && fit.free < 640;
  const go = (d: number) => { if (!n) return; const k = wrap(at + d, n); if (index === undefined) setOwn(k); onIndexChange?.(k); };
  if (!n) return null;
  const want = sides === 'auto' ? (navOpen || narrow ? 1 : 2) : sides;
  const reach = Math.max(0, Math.min(3, want, Math.floor((n - 1) / 2) || (n > 1 ? 1 : 0)));
  const base = rowOf(sideScale, reach, overlap);
  const grown = fill && fit.room && !narrow ? growTo(sideScale, reach, overlap, fit.room) : sideScale;
  const scale = (k: number) => Math.pow(grown, Math.abs(k)); const { off } = rowOf(grown, reach, overlap);
  const shown = Array.from({ length: reach * 2 + 1 }, (_, j) => j - reach).filter((d) => n > 1 || d === 0);
  const dup = n < reach * 2 + 1;
  return (
    <Box className={cn(styles.root, fill && styles.fill, className)} ref={root} style={{ '--pui-stage-w': stageWidth ?? (fill ? undefined : 'min(35rem, 64vw)'), '--pui-stage-span': String(narrow ? 1 : base.span), '--pui-stage-hcap': fit.cap ? `${Math.round(fit.cap)}px` : undefined } as React.CSSProperties} role="region" aria-roledescription="carousel" aria-label={rest['aria-label']}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); }}>
      <Box ref={stage} className={styles.stage}>
        {shown.map((d) => {
          const it = items[wrap(at + d, n)]; const k = Math.abs(d);
          return (
            <Box key={dup ? `${it.id}:${d}` : it.id} className={cn(styles.slide, d === 0 && styles.centre)} data-offset={d} aria-hidden={d !== 0 || undefined}
              style={{ transform: `translateX(${Math.sign(d) * off[k] * 100}%) scale(${scale(k)})`, zIndex: 10 - k } as React.CSSProperties}
              onClickCapture={d !== 0 ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); go(d); } : undefined}>
              {it.node}
            </Box>
          );
        })}
        {n > 1 && <>
          <Button variant="icon" className={cn(styles.arrow, styles.prev)} onClick={() => go(-1)} aria-label={prevLabel}><ChevronLeft size={20} /></Button>
          <Button variant="icon" className={cn(styles.arrow, styles.next)} onClick={() => go(1)} aria-label={nextLabel}><ChevronRight size={20} /></Button>
        </>}
      </Box>
      {(progress || footer) && (
        <Box className={styles.foot}>
          {progress && <Box className={styles.meter}><ProgressBar value={(at + 1) / n} size="sm" animate={false} intent="primary" /></Box>}
          {progress && <Text as="span" size="xs" intent="muted" numeric>{positionLabel(at + 1, n)}</Text>}
          {footer}
        </Box>
      )}
    </Box>
  );
};
