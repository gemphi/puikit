import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';
import { responsiveCSSVars, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type StackDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type StackGap = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8;

export type StackProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'align'> & {
  direction?: ResponsiveValue<StackDirection>;
  gap?: ResponsiveValue<StackGap>;
  align?: ResponsiveValue<StackAlign>;
  justify?: ResponsiveValue<StackJustify>;
  wrap?: ResponsiveValue<boolean>;
  /** flex-grow of the stack itself inside a flex parent. */
  grow?: number;
  /** CSS overflow of the stack (e.g. 'auto' for a scrolling row). */
  overflow?: React.CSSProperties['overflow'];
  ref?: React.Ref<HTMLDivElement>;
  /** The element it renders (a form, a list, a section, a header); a div by default. */
  as?: React.ElementType;
} & Omit<StyleProps, 'align'>;

const justifyMap: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const alignMap: Record<StackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(({
  children,
  direction = 'column',
  gap = 2,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  grow,
  overflow,
  className = '',
  style,
  as,
  ...props
}, ref) => {
  const stylePropsCSS = stylePropsToCSS(props);
  const computedStyle: React.CSSProperties = {
    ...responsiveCSSVars('stack-direction', direction),
    ...responsiveCSSVars('stack-align', align, (value: StackAlign) => alignMap[value]),
    ...responsiveCSSVars('stack-justify', justify, (value: StackJustify) => justifyMap[value]),
    ...responsiveCSSVars('stack-wrap', wrap, (value) => (value ? 'wrap' : 'nowrap')),
    ...responsiveCSSVars('stack-gap', gap, (value) => `${value * 0.25}rem`),
    ...(grow !== undefined ? { flexGrow: grow } : null),
    ...(overflow !== undefined ? { overflow } : null),
    ...stylePropsCSS,
    ...style,
  };

  const rest = omitStyleProps(props);

  return (
    <Box ref={ref} as={as} className={cn(styles.stack, className)} style={computedStyle} data-dir={typeof direction === 'string' ? direction : undefined} {...rest}>
      {children}
    </Box>
  );
});

Stack.displayName = 'Stack';
