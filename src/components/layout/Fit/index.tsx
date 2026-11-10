import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type FitProps = {
  /** Width over height of the box (1: a square, 0.75: portrait 3:4, 16/9: wide). */
  ratio?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Fit: the largest box of `ratio` that fits the space its parent leaves, centred in it. It grows to fill a flex
 * column (an expanded section, a full-page pane), measures that space as a size container and sizes its box by
 * the narrower side, so a picture uses the whole stage without stretching or scrolling. The parent gives the height.
 */
export const Fit = ({ ratio = 1, className, children }: FitProps) => (
  <Box className={cn('pui-fit', styles.fit, className)} style={{ '--pui-fit-ratio': String(ratio) } as React.CSSProperties}>
    <Box className={styles.box}>{children}</Box>
  </Box>
);
