import React from 'react';
import { cn } from '../../../utils/cn';
import { responsiveCSSVars, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';
import styles from './styles.module.scss';

type StickyProps = {
  children: React.ReactNode;
  top?: ResponsiveValue<number>;
  bottom?: ResponsiveValue<number>;
  offset?: number;
  zIndex?: number;
  /** The card ground behind it and a little room above and below, so what scrolls under it is hidden (a composer). */
  surface?: boolean;
  className?: string;
};

export const Sticky = ({
  children,
  top,
  bottom,
  offset = 0,
  zIndex = 100,
  surface = false,
  className = '',
}: StickyProps) => {
  const style: React.CSSProperties = {
    zIndex,
    ...responsiveCSSVars('sticky-top', top, (value: number) => `${value + offset}px`),
    ...responsiveCSSVars('sticky-bottom', bottom, (value: number) => `${value + offset}px`),
  };

  return (
    <Box className={cn(styles.sticky, surface && styles.surface, className)} style={style}>
      {children}
    </Box>
  );
};

Sticky.displayName = 'Sticky';
