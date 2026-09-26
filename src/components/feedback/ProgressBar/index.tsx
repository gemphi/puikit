'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type ProgressBarIntent = 'primary' | 'success' | 'warning' | 'error' | 'none';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 1, or undefined for indeterminate
  intent?: ProgressBarIntent;
  animate?: boolean;
  striped?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  intent = 'primary',
  animate = false,
  striped = false,
  className,
  ...props
}) => {
  const isIndeterminate = value === undefined;
  const percentage = isIndeterminate ? 100 : Math.min(Math.max(value * 100, 0), 100);

  return (
    <Box
      className={cn(
        styles.progressBar,
        styles[`intent-${intent}`],
        isIndeterminate && styles.indeterminate,
        striped && styles.striped,
        animate && styles.animate,
        className
      )}
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <Box className={styles.meter} style={{ width: `${percentage}%` }} />
    </Box>
  );
};

export default ProgressBar;
