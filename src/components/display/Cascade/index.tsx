import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type CascadeProps = {
  /** Copies stacked behind the item (0–6). */
  depth?: number;
  /** Space between levels, any CSS length. */
  step?: string;
  /**
   * Inset cascade at the bottom, inside the item (0–6): stacked sheets in front of its lower edge, each level up
   * one step smaller — the same shrink as the stack above — so the picture reads as slipped inside the stack.
   */
  pocket?: number;
  /** The pocket mirrored at the TOP, inside the item (0–6): sheets hang from the top edge, each level down one
      step smaller, so the picture sits between the two stacks. */
  cap?: number;
  /** The item's own colour. Sheets ramp it: strongest at the card's edge, lightest beside the centre, so both
      stacks merge into the card's own background instead of standing grey. */
  tint?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Cascade: the same element repeated behind itself, each copy one level narrower, higher and darker, so an item
 * card reads as the top of a stack. The copies are aria-hidden and ignore the pointer; they fan out on hover.
 */
export const Cascade = ({ depth = 3, step = '0.45rem', pocket = 0, cap = 0, tint, className, children }: CascadeProps) => {
  const n = Math.max(0, Math.min(6, Math.round(depth)));
  const pn = Math.max(0, Math.min(6, Math.round(pocket)));
  const cn2 = Math.max(0, Math.min(6, Math.round(cap)));
  if (!n && !pn && !cn2) return <>{children}</>;
  return (
    <Box className={cn(styles.cascade, className)} style={{ '--pui-cascade': String(n), '--pui-cascade-step': step, '--pui-pocket': String(pn), '--pui-cap': String(cn2), ...(tint ? { '--pui-cascade-tint': tint } : {})  } as React.CSSProperties} data-cascade={n} data-pocket={pn || undefined} data-cap={cn2 || undefined} data-tinted={tint ? '' : undefined}>
      {Array.from({ length: n }, (_, i) => n - i).map((k) => (
        <Box key={k} className={styles.copy} style={{ '--pui-cascade-k': String(k) } as React.CSSProperties} aria-hidden="true">{children}</Box>
      ))}
      <Box className={styles.top}>{children}</Box>
      {pn > 0 && (
        <Box className={styles.pocket} aria-hidden="true">
          {Array.from({ length: pn }, (_, i) => pn - i).map((k) => (
            <Box key={'p' + k} className={styles.sheet} style={{ '--pui-pocket-k': String(k) } as React.CSSProperties} data-pocket-sheet={k} />
          ))}
        </Box>
      )}
      {cn2 > 0 && (
        <Box className={styles.pocket} aria-hidden="true">
          {Array.from({ length: cn2 }, (_, i) => cn2 - i).map((k) => (
            <Box key={'c' + k} className={styles.capSheet} style={{ '--pui-pocket-k': String(k) } as React.CSSProperties} data-cap-sheet={k} />
          ))}
        </Box>
      )}
    </Box>
  );
};
