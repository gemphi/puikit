import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';
import { responsiveCSSVars, type Breakpoint, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';
import { GridContext } from '../Grid';

export type RowGap = 1 | 2 | 3 | 4 | 6 | 8;
export type RowAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type RowJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export type RowColumns = number | { cols?: number };

type RowProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'align'> & {
  gap?: ResponsiveValue<RowGap>;
  align?: ResponsiveValue<RowAlign>;
  justify?: ResponsiveValue<RowJustify>;
  wrap?: ResponsiveValue<boolean>;
  className?: string;
  children?: React.ReactNode;
  xs?: RowColumns;
  sm?: RowColumns;
  md?: RowColumns;
  lg?: RowColumns;
  xl?: RowColumns;
};

const alignMap: Record<RowAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const justifyMap: Record<RowJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const BREAKPOINTS: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const toCols = (spec: RowColumns | undefined): number | undefined => {
  if (spec == null) return undefined;
  if (typeof spec === 'object') return spec.cols;
  return spec;
};

const buildResponsiveClasses = (bp: Breakpoint, spec: RowColumns | undefined): string | null => {
  const cols = toCols(spec);
  if (cols == null) return null;
  const infix = bp === 'xs' ? '' : `-${bp}`;
  return styles[`row-cols${infix}-${cols}`];
};

export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  (
    { gap, align, justify, wrap, className = '', style, children, xs, sm, md, lg, xl, ...props },
    ref
  ) => {
    const responsiveClasses = BREAKPOINTS.map((bp) => buildResponsiveClasses(bp, { xs, sm, md, lg, xl }[bp])).filter(Boolean) as string[];
    const resolvedGap: ResponsiveValue<RowGap> = gap ?? 2;
    const resolvedAlign: ResponsiveValue<RowAlign> = align ?? 'center';
    const resolvedJustify: ResponsiveValue<RowJustify> = justify ?? 'start';
    const resolvedWrap: ResponsiveValue<boolean> = wrap ?? true;

    return (
      <Box
        ref={ref}
        className={cn(styles.row, ...responsiveClasses, className)}
        style={{
          ...responsiveCSSVars('row-gap', resolvedGap, (value: RowGap) => `${value * 0.25}rem`),
          ...responsiveCSSVars('row-align', resolvedAlign, (value: RowAlign) => alignMap[value]),
          ...responsiveCSSVars('row-justify', resolvedJustify, (value: RowJustify) => justifyMap[value]),
          ...responsiveCSSVars('row-wrap', resolvedWrap, (value: boolean) => (value ? 'wrap' : 'nowrap')),
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <GridContext.Provider value={false}>{children}</GridContext.Provider>
      </Box>
    );
  }
);
Row.displayName = 'Row';
