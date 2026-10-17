import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
  className?: string;
  /** The smallest height, in lines, before it grows (`rows` stays the native attribute). */
  minRows?: number;
  /** Size of the field in its row (raw CSS: '280px', '100%'); `flex` is the flex shorthand ('1', 'none'). */
  width?: string;
  maxWidth?: string;
  flex?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', minRows, width, maxWidth, flex, style, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(styles.textarea, error && styles.error, className)}
        style={{ width, maxWidth, flex, minHeight: minRows ? `calc(${minRows} * 1.5em + 1.25rem)` : undefined, ...style }}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
