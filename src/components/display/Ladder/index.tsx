import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../../primitives/Text';
import { ProgressBar } from '../../feedback/ProgressBar';
import styles from './styles.module.scss';

export type LadderRow = {
  id: string;
  /** What the step is (a unit, a person, a team). */
  label: React.ReactNode;
  /** The step's share of the top one, 0 to 1: the length of its bar. */
  share: number;
  /** What the share stands for, as people read it (a price, a score). */
  amount: React.ReactNode;
  /** The bar's own colour (the unit's shade); the theme's primary without it. */
  color?: string;
  /** What can be done with the step (buy it). */
  action?: React.ReactNode;
};
export type LadderProps = {
  rows: LadderRow[];
  /** The first step's number (1 by default). */
  from?: number;
  /** `compact`: the name over the bar in one cell, for a narrow card. */
  variant?: 'table' | 'compact';
  'aria-label'?: string;
  className?: string;
};

/**
 * Ladder: a ranked table. Every row is its number, a bar, a name, an amount and an action, and every one of those
 * stands on a card of its own, lit from the left and from the right in turn across the row, so each column reads as a
 * band of light down the table. The grounds are the theme's (the row ground and its holder), so the bands turn over
 * with the depth the ladder sits at, like every other grouped thing.
 */
export const Ladder = ({ rows, from = 1, variant = 'table', className, ...rest }: LadderProps) => (
  <Box role="table" aria-label={rest['aria-label']} className={cn(styles.wrap, className)}><Box role="rowgroup" className={cn(styles.ladder, styles[variant], rows.some((r) => r.action) && styles.acts)}>
    {rows.map((r, k) => (
      <Box role="row" key={r.id} className={styles.row}>
        <Box role="cell" className={cn(styles.cell, styles.rank)}><Text as="span" size="xs" weight="bold" numeric>{from + k}</Text></Box>
        <Box role="cell" className={cn(styles.cell, styles.bar)}><ProgressBar value={r.share} color={r.color} size="lg" animate={false} /></Box>
        <Box role="cell" className={cn(styles.cell, styles.name)}><Text as="span" size="xs" truncate>{r.label}</Text></Box>
        <Box role="cell" className={cn(styles.cell, styles.amount)}><Text as="span" size="xs" weight="bold" numeric>{r.amount}</Text></Box>
        {r.action && <Box role="cell" className={styles.action}>{r.action}</Box>}
      </Box>
    ))}
  </Box></Box>
);
