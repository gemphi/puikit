import React from 'react';
import { cn } from '../../../utils/cn';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import styles from './styles.module.scss';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  /** Right-hand adornment inside the field (shortcut hint, clear button, unit). */
  trailing?: React.ReactNode;
  error?: boolean;
  className?: string;
  /** Size of the field in its row (raw CSS: '280px', '100%'); `flex` is the flex shorthand ('1', 'none'). */
  width?: string;
  maxWidth?: string;
  flex?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, trailing, error, className = '', width, maxWidth, flex, ...props }, ref) => {
    return (
      <Stack direction="row" align="center" className={styles.wrapper} width={width} maxWidth={maxWidth} flex={flex}>
        {icon && <Span className={styles.icon}>{icon}</Span>}
        <input
          ref={ref}
          className={cn(styles.input, icon && styles.withIcon, trailing && styles.withTrailing, error && styles.error, className)}
          {...props}
        />
        {trailing && <Span className={styles.trailing}>{trailing}</Span>}
      </Stack>
    );
  }
);
Input.displayName = 'Input';
