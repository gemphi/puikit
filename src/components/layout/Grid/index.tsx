import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';
import { responsiveCSSVars, type Breakpoint, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';

export type GridGap = 1 | 2 | 3 | 4 | 6 | 8;

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Column count, or a raw track list such as 'repeat(auto-fit, minmax(240px, 1fr))'. */
  columns?: ResponsiveValue<number | string>;
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

/** True inside a Grid, so a child `Col` spans grid tracks instead of sizing as a flex column. */
export const GridContext = React.createContext(false);

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
      ...responsiveCSSVars('grid-columns', columns, (value: number | string) => (typeof value === 'number' ? `repeat(${value}, minmax(0, 1fr))` : value)),
      ...responsiveCSSVars('grid-gap', resolvedGap, (value: GridGap) => `${value * 0.25}rem`),
      ...(typeof columns === 'number' ? { '--pui-grid-cols': String(columns) } : null),
      ...style,
    };

    return (
      <Box
        ref={ref}
        className={cn(styles.grid, ...responsiveClasses, className)}
        style={baseStyle}
        {...props}
      >
        <GridContext.Provider value={true}>{children}</GridContext.Provider>
      </Box>
    );
  }
);
Grid.displayName = 'Grid';
