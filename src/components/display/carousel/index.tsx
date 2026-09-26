'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { responsiveCSSVars, type ResponsiveValue } from '../../shared/responsive';
import styles from './styles.module.scss';

/** Copy for the arrow controls, supplied by the app. */
export interface CarouselLabels {
  prev: string;
  next: string;
}

export const DEFAULT_CAROUSEL_LABELS: CarouselLabels = { prev: 'Previous', next: 'Next' };

export interface CarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode;
  /** How many slides are visible at once on wide screens. Narrower viewports step down to 2, then 1. */
  slidesPerView?: ResponsiveValue<number>;
  /** Space between slides, in the same 4px scale the rest of the system uses. */
  gap?: 1 | 2 | 3 | 4 | 6 | 8;
  /** Rendered above the track, opposite the arrows. */
  header?: React.ReactNode;
  /** Copy overrides; defaults to {@link DEFAULT_CAROUSEL_LABELS}. */
  labels?: Partial<CarouselLabels>;
  /** Hides the arrows for a track meant to be swiped only. */
  showControls?: boolean;
  className?: string;
}

/**
 * A horizontally snapping track.
 *
 * The scrolling is the browser's own — `overflow-x` plus scroll snapping —
 * rather than a transform the component has to animate, so it is swipeable on
 * touch, scrollable with a trackpad, reachable by keyboard, and correct at any
 * width without measuring anything. The arrows are a convenience layered on
 * top, and they disable themselves at each end rather than wrapping, so the
 * control never lies about what it will do.
 */
export const Carousel: React.FC<CarouselProps> = ({
  children,
  slidesPerView = 4,
  gap = 4,
  header,
  labels,
  showControls = true,
  className,
  style,
  ...props
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const copy = { ...DEFAULT_CAROUSEL_LABELS, ...labels };

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const page = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9 });
  };

  const slides = React.Children.toArray(children).filter(Boolean);
  const trackStyle: React.CSSProperties = {
    ...responsiveCSSVars('carousel-slides', slidesPerView, (v: number) => String(v)),
    '--carousel-gap': `${gap * 0.25}rem`,
  } as React.CSSProperties;

  // With nothing to scroll past, the arrows would be permanently dead weight.
  const scrollable = !(atStart && atEnd);

  return (
    <Box className={cn(styles.carousel, className)} style={style} {...props}>
      {header && <Box className={styles.header}>{header}</Box>}

      <Box className={styles.viewport}>
        {showControls && scrollable && (
          <Button
            variant="outline"
            size="sm"
            className={styles.control}
            aria-label={copy.prev}
            disabled={atStart}
            onClick={() => page(-1)}
            icon={<ChevronLeft size={16} />}
          />
        )}

        <Box ref={trackRef} className={styles.track} style={trackStyle} onScroll={measure}>
          {slides.map((slide, i) => (
            <Box key={i} className={styles.slide}>
              {slide}
            </Box>
          ))}
        </Box>

        {showControls && scrollable && (
          <Button
            variant="outline"
            size="sm"
            className={styles.control}
            aria-label={copy.next}
            disabled={atEnd}
            onClick={() => page(1)}
            icon={<ChevronRight size={16} />}
          />
        )}
      </Box>
    </Box>
  );
};
