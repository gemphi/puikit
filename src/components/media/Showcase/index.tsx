import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import styles from './styles.module.scss';

export type ShowcaseSlide = {
  id: string;
  /** The picture, shown whole: never cropped, whatever the screen's shape. */
  src: string;
  /** A small copy for the picker (defaults to the picture). */
  thumb?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** The slide's mark (a world's emblem), before its title. */
  mark?: string;
};

export type ShowcaseProps = {
  slides: ShowcaseSlide[];
  /** The slide's buttons (Enter, Info), under its title. */
  actions?: (slide: ShowcaseSlide) => React.ReactNode;
  /** Moves to the next slide every this many ms while the pointer is away; 0 holds still. */
  auto?: number;
  /** How tall it stands (default: the screen under the header). */
  height?: string;
  /** A shape instead of a height (a city's square): the stage keeps it at any width. */
  ratio?: string;
  /** The row of small pictures that picks a slide (default on); off, the arrows and keys still step through. */
  picker?: boolean;
  /** Told whenever the slide shown changes (a page can wear the slide's picture as its own background). */
  onChange?: (slide: ShowcaseSlide) => void;
  labels?: { prev?: string; next?: string; picker?: string };
  className?: string;
};

/**
 * A screen-filling stage of pictures (the cities, a drop, a show): each picture fills the stage yet stays whole on the
 * screen, laid over a blur of itself so its own colours run to the edges; its mark, title, line and buttons sit at the
 * bottom left; a row of small pictures at the bottom right picks one; arrows and keys step through, and it moves on by
 * itself until the pointer comes over it.
 */
export const Showcase = ({ slides, actions, auto = 7000, height, ratio, onChange, picker = true, labels = {}, className }: ShowcaseProps) => {
  const [at, setAt] = useState(0); const [held, setHeld] = useState(false);
  const n = slides.length; const go = (k: number) => setAt(((k % n) + n) % n);
  useEffect(() => { if (!auto || held || n < 2) return; const id = setTimeout(() => go(at + 1), auto); return () => clearTimeout(id); }, [at, held, auto, n]);
  useEffect(() => { const x = slides[Math.min(at, n - 1)]; if (x) onChange?.(x); }, [at, n]);
  if (!n) return null;
  const s = slides[Math.min(at, n - 1)];
  // The slide shown and its neighbours, each once (a short show may wrap onto itself).
  const near = [...new Set([at, (at + 1) % n, (at - 1 + n) % n])];
  return (
    <Box as="section" className={cn(styles.root, className)} style={ratio ? ({ height: 'auto', aspectRatio: ratio } as React.CSSProperties) : height ? ({ '--pui-showcase-h': height } as React.CSSProperties) : undefined}
      onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} aria-roledescription="carousel"
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'ArrowRight') go(at + 1); if (e.key === 'ArrowLeft') go(at - 1); }} tabIndex={0}>
      <img key={'f' + s.id} className={styles.fill} src={s.thumb ?? s.src} alt="" aria-hidden="true" />
      {/* The picture inside two bands of light, no lines. The slides either side are already loaded under it, so moving
          on fades from one picture to the next with no empty stage between them. */}
      {near.map((k) => { const x = slides[k]; return (
        <span key={'w' + x.id} className={cn(styles.outer, k === at && styles.shown)} aria-hidden={k !== at || undefined}>
          <span className={styles.frame}><img className={styles.whole} src={x.src} alt="" /></span>
        </span>); })}
      {/* The glass under the words: the picture itself blurs and darkens, more the lower it goes, with no box. */}
      <Box className={styles.glass} aria-hidden="true"><span /><span /><span /></Box>
      <Box className={styles.copy}>
        {s.mark && <img className={styles.mark} src={s.mark} alt="" />}
        <Title level={2} className={styles.title}>{s.title}</Title>
        {s.sub && <Text as="p" className={styles.sub}>{s.sub}</Text>}
        {actions && <Box className={styles.actions}>{actions(s)}</Box>}
      </Box>
      {n > 1 && <>
        <Button variant="glass" className={cn(styles.step, styles.prev)} aria-label={labels.prev ?? 'Previous'} icon={<ChevronLeft size={18} />} onClick={() => go(at - 1)} />
        <Button variant="glass" className={cn(styles.step, styles.next)} aria-label={labels.next ?? 'Next'} icon={<ChevronRight size={18} />} onClick={() => go(at + 1)} />
        {picker && <Box className={styles.picker} role="tablist" aria-label={labels.picker ?? 'Slides'}>
          {slides.map((x, i) => (
            <Pressable key={x.id} role="tab" aria-selected={i === at} aria-label={typeof x.title === 'string' ? x.title : x.id} className={cn(styles.pick, i === at && styles.on)} onClick={() => go(i)}>
              <img src={x.thumb ?? x.src} alt="" loading="lazy" />
              {i === at && !held && auto ? <Box as="span" className={styles.time} style={{ animationDuration: auto + 'ms' }} /> : null}
            </Pressable>
          ))}
        </Box>}
      </>}
    </Box>
  );
};

export default Showcase;
