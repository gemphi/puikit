'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export interface NonIdealStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const NonIdealState: React.FC<NonIdealStateProps> = ({
  icon,
  title,
  description,
  action,
  children,
  className,
  ...props
}) => {
  return (
    <Box className={cn(styles.nonIdealState, className)} {...props}>
      {icon && <Box className={styles.visual}>{icon}</Box>}
      {title && <h4 className={styles.heading}>{title}</h4>}
      {description && <Box className={styles.description}>{description}</Box>}
      {action && <Box className={styles.action}>{action}</Box>}
      {children}
    </Box>
  );
};

export default NonIdealState;
