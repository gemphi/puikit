import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, stylePropsToCSS } from '../../shared/styleProps';
import { responsiveCSSVars, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type StackDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;

export type StackProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'align'> & {
  direction?: ResponsiveValue<StackDirection>;
  gap?: ResponsiveValue<StackGap>;
  align?: ResponsiveValue<StackAlign>;
  justify?: ResponsiveValue<StackJustify>;
  wrap?: ResponsiveValue<boolean>;
  ref?: React.Ref<HTMLDivElement>;
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
  className = '',
  style,
  ...props
}, ref) => {
  const stylePropsCSS = stylePropsToCSS(props);
  const computedStyle: React.CSSProperties = {
    ...responsiveCSSVars('stack-direction', direction),
    ...responsiveCSSVars('stack-align', align, (value: StackAlign) => alignMap[value]),
    ...responsiveCSSVars('stack-justify', justify, (value: StackJustify) => justifyMap[value]),
    ...responsiveCSSVars('stack-wrap', wrap, (value) => (value ? 'wrap' : 'nowrap')),
    ...responsiveCSSVars('stack-gap', gap, (value) => `${value * 0.25}rem`),
    ...stylePropsCSS,
    ...style,
  };

  const { background, padding, paddingTop, paddingBottom, paddingLeft, paddingRight, paddingX, paddingY, margin, marginTop, marginBottom, color, maxWidth, minWidth, minHeight, textDecoration, opacity, textTransform, letterSpacing, ...rest } = props;

  return (
    <Box ref={ref} className={cn(styles.stack, className)} style={computedStyle} {...rest}>
      {children}
    </Box>
  );
});

Stack.displayName = 'Stack';
