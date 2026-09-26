import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';
import { responsiveCSSVars, type Breakpoint, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';

export type GridGap = 1 | 2 | 3 | 4 | 6 | 8;

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<GridGap>;
  className?: string;
  children?: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

const BREAKPOINTS: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ columns, gap, className = '', style, children, xs, sm, md, lg, xl, ...props }, ref) => {
    const responsiveProps = { xs, sm, md, lg, xl };
    const responsiveClasses: string[] = [];
    const resolvedGap: ResponsiveValue<GridGap> = gap ?? 4;

    for (const bp of BREAKPOINTS) {
      const cols = responsiveProps[bp];
      if (cols != null) {
        const infix = bp === 'xs' ? '' : `-${bp}`;
        responsiveClasses.push(styles[`grid-cols${infix}-${cols}`]);
      }
    }

    const baseStyle: React.CSSProperties = {
      ...responsiveCSSVars('grid-columns', columns, (value: number) => `repeat(${value}, minmax(0, 1fr))`),
      ...responsiveCSSVars('grid-gap', resolvedGap, (value: GridGap) => `${value * 0.25}rem`),
      ...style,
    };

    return (
      <Box
        ref={ref}
        className={cn(styles.grid, ...responsiveClasses, className)}
        style={baseStyle}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
Grid.displayName = 'Grid';
