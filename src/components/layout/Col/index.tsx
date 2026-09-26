import React from 'react';
import { cn } from '../../../utils/cn';
import { responsiveCSSVars, type Breakpoint, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type ColGap = 1 | 2 | 3 | 4 | 6 | 8;
export type ColAlign = 'start' | 'center' | 'end' | 'stretch';
export type ColJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type ColSize = boolean | 'auto' | number;
export type ColSpec = ColSize | { span?: ColSize; offset?: number; order?: number | 'first' | 'last' };

export type ColProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'align'> & {
  span?: ColSize;
  gap?: ResponsiveValue<ColGap>;
  align?: ResponsiveValue<ColAlign>;
  justify?: ResponsiveValue<ColJustify>;
  fill?: boolean;
  xs?: ColSpec;
  sm?: ColSpec;
  md?: ColSpec;
  lg?: ColSpec;
  xl?: ColSpec;
};

const alignMap: Record<ColAlign, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch',
};

const justifyMap: Record<ColJustify, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  between: 'space-between', around: 'space-around', evenly: 'space-evenly',
};

const toSpan = (s?: ColSpec) => (typeof s === 'object' ? s.span : s);
const toOffset = (s?: ColSpec) => (typeof s === 'object' ? s.offset : undefined);
const toOrder = (s?: ColSpec) => (typeof s === 'object' ? s.order : undefined);

export const Col: React.FC<ColProps> = ({
  span, gap, align, justify, fill, className, children, xs, sm, md, lg, xl, style, ...props
}) => {
  const bp = { xs, sm, md, lg, xl };
  const bpClasses: string[] = [];

  if (span != null) {
    if (span === true) bpClasses.push(styles['col']);
    else if (span === 'auto') bpClasses.push(styles['col-auto']);
    else if (typeof span === 'number') bpClasses.push(styles[`col-${span}`]);
  }

  (Object.keys(bp) as Breakpoint[]).forEach((b) => {
    const spec = bp[b];
    const s = toSpan(spec);
    const offset = toOffset(spec);
    const order = toOrder(spec);

    if (s === true) bpClasses.push(styles[`col-${b}`]);
    else if (s === 'auto') bpClasses.push(styles[`col-${b}-auto`]);
    else if (typeof s === 'number') bpClasses.push(styles[`col-${b}-${s}`]);

    if (offset != null) bpClasses.push(styles[`offset-${b}-${offset}`]);
    if (order != null) bpClasses.push(styles[`order-${b}-${order}`]);
  });

  const hasSpan = bpClasses.some((c) => c && c.includes('col-'));
  const dynamicStyle: React.CSSProperties = {
    ...responsiveCSSVars('col-gap', gap, (value: ColGap) => `${value * 0.25}rem`),
    ...responsiveCSSVars('col-align', align, (value: ColAlign) => alignMap[value]),
    ...responsiveCSSVars('col-justify', justify, (value: ColJustify) => justifyMap[value]),
    ...style,
  };

  return (
    <Box
      className={cn(styles.col, !hasSpan && styles.colAuto, fill && styles.fill, ...bpClasses, className)}
      style={dynamicStyle}
      {...props}
    >
      {children}
    </Box>
  );
};
