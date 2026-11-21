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
  /** The narrowest the centre may get to make room for side slides (px, 352 by default): a stage too narrow for that
      shows fewer a side, down to the centre alone. */
  minCentre?: number;
  /** Each side level is this fraction of the one before it (0.75, the default: a side slide is three quarters of the centre). */
  sideScale?: number;
  /** How much of each side slide tucks under the one in front of it (0.5: half of it). */
  overlap?: number;
  /** How much of the outermost slides tucks under when two show a side (0.8 by default: a thin edge shows), so three read as in view and the next peek. */
  outerOverlap?: number;
  /** Width of the centre slide (any CSS length); with `fill`, only the most it may take (no limit by default). */
  stageWidth?: string;
  /** On by default: the centre is as large as the row and the page's visible height allow. Off: the centre is
      `stageWidth`. The sides keep `sideScale` either way. */
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
const rowOf = (s: number, reach: number, overlap: number, outer = overlap) => {
  // The outermost level may tuck further under (outer), so it shows as a thin edge past the slides in view.
  const ov = (k: number) => (k === reach ? outer : overlap);
  const off: number[] = [0]; for (let k = 1; k <= reach; k++) off[k] = off[k - 1] + Math.pow(s, k - 1) / 2 + Math.pow(s, k) / 2 - ov(k) * Math.pow(s, k);
  return { off, span: 2 * (off[reach] + Math.pow(s, reach) / 2) };
};

/**
 * StageSlider: one slide in the centre and its neighbours either side, each side level `sideScale` of the one in front
 * (three quarters by default) with `overlap` of it tucked underneath, so the row reads as a deck seen from the front.
 * The arrows stand in the gap at either end, outside the slides; the keyboard arrows step, a side slide steps when
 * clicked, and under the stage, on a ground of their own, a progress bar and the position show where you are. A stage
 * too narrow to keep its centre readable shows fewer slides a side, and one of a phone's width shows the centre alone
 * at its full width with the arrows in the row under it. Tokens only.
 */
export const StageSlider = ({ items, index, defaultIndex = 0, onIndexChange, sides = 'auto', sideScale = 0.75, overlap = 0.5, outerOverlap, minCentre = 352, stageWidth, fill = true, progress = true, footer,
  prevLabel = 'Previous', nextLabel = 'Next', positionLabel = (i, n) => `${i} / ${n}`, className, ...rest }: StageSliderProps) => {
  const [own, setOwn] = useState(defaultIndex);
  const n = items.length; const at = wrap(index ?? own, Math.max(1, n));
  useEffect(() => { if (index === undefined && own >= n && n) setOwn(0); }, [n]);
  // Fill: the stage measures its width, the height its page shows and the centre's own shape (useStageFit).
  const { navOpen } = useShell(); const root = useRef<HTMLElement>(null); const stage = useRef<HTMLElement>(null);
  const fit = useStageFit(fill, root, stage, at);
  const phone = fit.width > 0 && fit.width < 480;
  const go = (d: number) => { if (!n) return; const k = wrap(at + d, n); if (index === undefined) setOwn(k); onIndexChange?.(k); };
  if (!n) return null;
  const want = sides === 'auto' ? (navOpen ? 1 : 2) : sides;
  const most = phone ? 0 : Math.max(0, Math.min(3, want, Math.floor((n - 1) / 2) || (n > 1 ? 1 : 0)));
  const outerOf = (r: number) => outerOverlap ?? (r > 1 ? 0.8 : overlap);
  // As many a side as leave the centre at least `minCentre` wide (measured; unmeasured, as many as asked).
  let reach = most; while (reach > 0 && fit.free > 0 && fit.free / rowOf(sideScale, reach, overlap, outerOf(reach)).span < minCentre) reach--;
  // FILL THE ROW. A centre kept small by the page's height (a picture, which keeps its shape) leaves the row wider
  // than its slides: then more slides show a side (up to three), and each tucks less under the one in front, until
  // the row reaches both ends. `room` is the row's width in centre widths (measured).
  let tuck = overlap; let outer = outerOf(reach);
  if (fill && !phone && fit.room > 0 && n > 1) {
    const cap = Math.max(0, Math.min(3, sides === 'auto' ? 3 : want, Math.floor((n - 1) / 2) || 1));
    while (reach < cap && rowOf(sideScale, reach + 1, overlap, overlap).span <= fit.room) reach++;
    outer = outerOf(reach);
    if (reach > 0 && rowOf(sideScale, reach, tuck, outer).span < fit.room) {
      let lo = -0.08, hi = tuck;                       // lo: slides apart by a little; hi: as tucked as asked
      if (rowOf(sideScale, reach, lo, lo).span > fit.room) { for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (rowOf(sideScale, reach, mid, mid).span > fit.room) lo = mid; else hi = mid; } tuck = hi; } else tuck = lo;
      outer = tuck;
    }
  }
  const base = rowOf(sideScale, reach, tuck, outer);
  // What lies under the slide in front is not drawn at all, so a slide needs no colour of its own to hide it: each
  // side slide is cut at the edge of the one in front (less a little, for that one's rounded corners).
  const hidden = (k: number) => Math.max(0, ((k === reach ? outer : tuck) - 0.04) * 100);
  const arrows = n > 1 && <>
    <Button variant="icon" className={cn(styles.arrow, styles.prev)} onClick={() => go(-1)} aria-label={prevLabel}><ChevronLeft size={20} /></Button>
    <Button variant="icon" className={cn(styles.arrow, styles.next)} onClick={() => go(1)} aria-label={nextLabel}><ChevronRight size={20} /></Button>
  </>;
  const scale = (k: number) => Math.pow(sideScale, Math.abs(k)); const { off } = base;
  const shown = Array.from({ length: reach * 2 + 1 }, (_, j) => j - reach).filter((d) => n > 1 || d === 0);
  const dup = n < reach * 2 + 1;
  return (
    <Box className={cn(styles.root, fill && styles.fill, phone && styles.phone, className)} ref={root} style={{ '--pui-stage-w': stageWidth ?? (fill ? undefined : 'min(35rem, 64vw)'), '--pui-stage-span': String(base.span), '--pui-stage-hcap': fit.cap ? `${Math.round(fit.cap)}px` : undefined } as React.CSSProperties} role="region" aria-roledescription="carousel" aria-label={rest['aria-label']}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); }}>
      <Box ref={stage} className={styles.stage}>
        {shown.map((d) => {
          const it = items[wrap(at + d, n)]; const k = Math.abs(d);
          return (
            <Box key={dup ? `${it.id}:${d}` : it.id} className={cn(styles.slide, d === 0 && styles.centre)} data-offset={d} aria-hidden={d !== 0 || undefined}
              style={{ transform: `translateX(${Math.sign(d) * off[k] * 100}%) scale(${scale(k)})`, zIndex: 10 - k,
                clipPath: d > 0 ? `inset(0 0 0 ${hidden(k)}%)` : d < 0 ? `inset(0 ${hidden(k)}% 0 0)` : undefined } as React.CSSProperties}
              onClickCapture={d !== 0 ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); go(d); } : undefined}>
              {it.node}
            </Box>
          );
        })}
        {!phone && arrows}
      </Box>
      {(progress || footer || (phone && n > 1)) && (
        <Box className={cn(styles.foot, 'phi-region')}>
          {phone && arrows}
          {progress && <Box className={styles.meter}><ProgressBar value={(at + 1) / n} size="md" animate={false} intent="primary" /></Box>}
          {progress && <Text as="span" size="xs" weight="bold" numeric className={styles.position}>{positionLabel(at + 1, n)}</Text>}
          {footer}
        </Box>
      )}
    </Box>
  );
};
