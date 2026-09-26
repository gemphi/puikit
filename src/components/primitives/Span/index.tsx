import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

export const SPAN_VARIANTS = {
  DEFAULT: 'default',
  BOLD: 'bold',
  MUTED: 'muted',
  SM: 'sm',
  CODE: 'code',
} as const;

export type SpanVariant = (typeof SPAN_VARIANTS)[keyof typeof SPAN_VARIANTS];

type SpanProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: SpanVariant;
  children?: React.ReactNode;
};

export const Span = ({ variant = SPAN_VARIANTS.DEFAULT, className = '', children, ...props }: SpanProps) => {
  return (
    <span className={cn(styles.span, styles[variant], className)} {...props}>
      {children}
    </span>
  );
};
