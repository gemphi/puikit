'use client';

import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type CalloutIntent = 'primary' | 'success' | 'warning' | 'error' | 'none';

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  intent?: CalloutIntent;
  title?: string;
  icon?: React.ReactNode | null;
  compact?: boolean;
  children?: React.ReactNode;
}

const defaultIcons: Record<string, React.ReactNode> = {
  primary: <Info size={18} />,
  success: <CheckCircle2 size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <AlertCircle size={18} />,
  none: <Info size={18} />,
};

export const Callout: React.FC<CalloutProps> = ({
  intent = 'none',
  title,
  icon,
  compact = false,
  children,
  className,
  ...props
}) => {
  const iconElement = icon !== undefined ? icon : defaultIcons[intent];

  return (
    <Box
      className={cn(
        styles.callout,
        styles[`intent-${intent}`],
        compact && styles.compact,
        className
      )}
      role="region"
      {...props}
    >
      {iconElement && <Box className={styles.iconWrapper}>{iconElement}</Box>}
      <Box className={styles.content}>
        {title && <h5 className={styles.title}>{title}</h5>}
        {children && <Box className={styles.body}>{children}</Box>}
      </Box>
    </Box>
  );
};

export default Callout;
