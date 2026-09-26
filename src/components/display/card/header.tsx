import React from 'react';
import { cn } from '../../../utils/cn';
import { Stack } from '../../layout/Stack';
import styles from './styles.module.scss';

type CardHeaderProps = React.HTMLAttributes<HTMLElement> & {
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/** Card header role file. Layout is delegated to the {@link Stack} primitive. */
export const CardHeader = ({ action, className = '', children, ...props }: CardHeaderProps) => {
  return (
    <header className={cn('pui-card-header', styles.header, className)} {...props}>
      <Stack direction="row" align="center" gap={2} className={styles.headerContent}>
        {children}
      </Stack>
      {action && (
        <Stack direction="row" align="center" className={styles.headerAction}>
          {action}
        </Stack>
      )}
    </header>
  );
};
