'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type ProgressBarIntent = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'none';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 1, or undefined for indeterminate
  intent?: ProgressBarIntent;
  animate?: boolean;
  striped?: boolean;
  /** Track height: sm 4px · md 8px (default) · lg 12px. */
  size?: 'sm' | 'md' | 'lg';
  /** One colour for the meter (a hex); the track is a faint shade of it. Wins over `intent`. */
  color?: string;
  /** A second colour for the rest of the track, so the bar shows two shares (for and against). */
  rest?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  intent = 'primary',
  animate = false,
  striped = false,
  size = 'md',
  color,
  rest,
  className,
  style,
  ...props
}) => {
  const isIndeterminate = value === undefined;
  const percentage = isIndeterminate ? 100 : Math.min(Math.max(value * 100, 0), 100);

  return (
    <Box
      className={cn(
        styles.progressBar,
        styles[`intent-${intent}`],
        styles[`size-${size}`],
        isIndeterminate && styles.indeterminate,
        striped && styles.striped,
        animate && styles.animate,
        className
      )}
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={color || rest ? { ...(color ? { ['--pui-progress' as string]: color } : {}), ...(rest ? { backgroundColor: rest } : {}), ...style } : style}
      {...props}
    >
      <Box className={styles.meter} style={{ width: `${percentage}%` }} />
    </Box>
  );
};

export default ProgressBar;
