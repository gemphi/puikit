import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';
import styles from './styles.module.scss';

export const ALERT_VARIANTS = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
} as const;

export type AlertVariant = (typeof ALERT_VARIANTS)[keyof typeof ALERT_VARIANTS];

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export const Alert = ({
  variant = ALERT_VARIANTS.INFO,
  dismissible = false,
  onDismiss,
  className = '',
  children,
  ...props
}: AlertProps) => {
  return (
    <Stack direction="row" align="center" justify="between" className={cn(styles.alert, styles[variant], className)} role="alert" {...props}>
      <Text size="sm">{children}</Text>
      {dismissible && onDismiss && (
        <Button variant="icon" onClick={onDismiss} aria-label="Close">
          <X size={14} />
        </Button>
      )}
    </Stack>
  );
};
