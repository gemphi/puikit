'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  labelFor?: string;
  labelInfo?: React.ReactNode;
  helperText?: React.ReactNode;
  intent?: 'none' | 'primary' | 'success' | 'warning' | 'error';
  inline?: boolean;
  /**
   * Floating label: the label rests inside the field and floats to its top
   * edge once the field is focused or holds a value. Purely CSS-driven —
   * `:focus-within` plus `:placeholder-shown` for native controls, and the
   * `data-filled` attribute the library's own Select exposes.
   */
  floating?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  labelFor,
  labelInfo,
  helperText,
  intent = 'none',
  inline = false,
  floating = false,
  disabled = false,
  children,
  className,
  ...props
}) => {
  return (
    <Box
      className={cn(
        styles.formGroup,
        styles[`intent-${intent}`],
        inline && styles.inline,
        floating && styles.floating,
        disabled && styles.disabled,
        className
      )}
      {...props}
    >
      {label && !floating && (
        <label htmlFor={labelFor} className={styles.label}>
          {label}
          {labelInfo && <span className={styles.labelInfo}>{labelInfo}</span>}
        </label>
      )}
      <Box className={styles.controlWrapper}>
        {floating ? (
          <Box className={styles.field}>
            {/* `:placeholder-shown` only exists on controls that HAVE a
                placeholder; without one the label would float permanently.
                A blank placeholder is injected where the app supplied none. */}
            {React.Children.map(children, (child) =>
              React.isValidElement(child) && (child.props as { placeholder?: string }).placeholder === undefined
                ? React.cloneElement(child as React.ReactElement<{ placeholder?: string }>, { placeholder: ' ' })
                : child
            )}
            {label && (
              <label htmlFor={labelFor} className={styles.floatingLabel}>
                {label}
                {labelInfo && <span className={styles.labelInfo}>{labelInfo}</span>}
              </label>
            )}
          </Box>
        ) : (
          children
        )}
        {helperText && <Box className={styles.helperText}>{helperText}</Box>}
      </Box>
    </Box>
  );
};

export default FormGroup;
