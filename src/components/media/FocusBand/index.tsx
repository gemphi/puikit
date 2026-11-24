import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import styles from './styles.module.scss';

export type FocusItem = {
  id: string;
  /** The picture. */
  node: React.ReactNode;
  /** Read out for it. */
  label?: string;
  /** Where it floats in the band (the band's own classes), and its own variables. */
  className?: string;
  style?: React.CSSProperties;
};

export type FocusBandProps = {
  items: FocusItem[];
  /** A press on the picture in the middle: open it (its post). */
  onOpen: (id: string) => void;
  labels?: { prev?: string; next?: string; close?: string };
  /** The band's element and look; its other content (words, buttons) goes as children and steps back in focus. */
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
};

/**
 * A band of pictures floating where the band places them, that become a slider when one is chosen:
 *   resting  each picture floats in its place and grows under the pointer;
 *   chosen   a press moves it to the middle, half the band wide, and everything else steps back: the other pictures, the
 *            band's words; only the arrows and the way back stay. The arrows bring the next or the one before, from the
 *            side they point to; Escape or the way back returns the band as it was.
 *   opened   a press on the picture in the middle opens it (`onOpen`: its post).
 */
export const FocusBand = ({ items, onOpen, labels = {}, as = 'section', className, children }: FocusBandProps) => {
  const [chosen, setChosen] = useState<number | null>(null);
  const [from, setFrom] = useState<'next' | 'prev' | 'here'>('here');
  const step = (by: number) => { setFrom(by > 0 ? 'next' : 'prev'); setChosen((at) => (at === null ? 0 : (at + by + items.length) % items.length)); };
  useEffect(() => {
    if (chosen === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChosen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const press = (at: number) => {
    if (chosen === at) onOpen(items[at].id);
    else { setFrom('here'); setChosen(at); }
  };
  return (
    <Box as={as} className={cn(styles.band, className)} data-focused={chosen !== null || undefined}>
      <Box className={styles.layer}>
        {items.map((it, at) => (
          <Box key={it.id} role="button" tabIndex={chosen === null || chosen === at ? 0 : -1} aria-label={it.label} data-from={chosen === at ? from : undefined}
            className={cn(it.className, styles.item, chosen === at && styles.chosen, chosen !== null && chosen !== at && styles.gone)} style={it.style}
            onClick={() => press(at)} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(at); } }}>
            {it.node}
          </Box>
        ))}
        {chosen !== null && <>
          <Button variant="glass" className={cn(styles.arrow, styles.prev)} iconLeft={ChevronLeft} aria-label={labels.prev ?? 'Before'} onClick={() => step(-1)} />
          <Button variant="glass" className={cn(styles.arrow, styles.next)} iconLeft={ChevronRight} aria-label={labels.next ?? 'Next'} onClick={() => step(1)} />
          <Button variant="glass" className={styles.close} iconLeft={X} aria-label={labels.close ?? 'Back'} onClick={() => setChosen(null)} />
        </>}
      </Box>
      {children}
    </Box>
  );
};
