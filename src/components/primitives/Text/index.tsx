import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';
import styles from './styles.module.scss';

export type TextIntent =
  | 'default'
  | 'muted'
  | 'secondary'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  /** The colour of what holds it. */
  | 'inherit';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'inherit';
export type TextAlign = 'left' | 'center' | 'right';

export type TextProps = Omit<React.HTMLAttributes<HTMLElement>, 'align'> & {
  intent?: TextIntent;
  variant?: TextIntent;
  size?: TextSize;
  weight?: TextWeight;
  align?: TextAlign;
  as?: 'p' | 'span' | 'div' | 'label' | 'strong' | 'em' | 'b' | 'small' | 'kbd' | 'figcaption' | 'li' | 'dt' | 'dd' | 'time';
  /** Monospace type (token --phi-font-mono). */
  mono?: boolean;
  /** Tabular figures, so numbers line up and do not jitter as they change. */
  numeric?: boolean;
  /** One line, cut with an ellipsis. */
  truncate?: boolean;
  /** Keep line breaks and indentation (code, JSON), wrapping long words anywhere. */
  pre?: boolean;
  children?: React.ReactNode;
} & StyleProps;

export const Text = ({
  intent,
  variant,
  size = 'md',
  weight = 'normal',
  align = 'left',
  as: Component = 'p',
  mono = false,
  numeric = false,
  truncate = false,
  pre = false,
  className = '',
  style,
  children,
  ...props
}: TextProps) => {
  const resolvedIntent = intent || variant || 'default';
  const stylePropsCSS = stylePropsToCSS(props);
  const computedStyle = { ...stylePropsCSS, ...style };

  const rest = omitStyleProps(props);

  return React.createElement(
    Component,
    {
      className: cn(
        styles.text,
        styles[`intent-${resolvedIntent}`],
        styles[`size-${size}`],
        styles[`weight-${weight}`],
        styles[`align-${align}`],
        mono && styles.mono,
        numeric && styles.numeric,
        truncate && styles.truncate,
        pre && styles.pre,
        className
      ),
      style: computedStyle,
      ...rest,
    },
    children
  );
};
