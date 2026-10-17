import React from 'react';
import { cn } from '../../../utils/cn';
import { Span } from '../../primitives/Span';
import styles from './styles.module.scss';

export type SwatchProps = {
  /** Any CSS colour: the exact colour shown (a PFT's theme colour, a dress hex). */
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Read out instead of the colour value. */
  label?: string;
  shape?: 'round' | 'square';
  className?: string;
};

/** One colour, exactly: a dot (or a chip) filled with it and ringed by the theme border. */
export const Swatch = ({ color, size = 'sm', label, shape = 'round', className }: SwatchProps) => (
  <Span role="img" aria-label={label ?? color} title={label ?? color} className={cn(styles.swatch, styles[size], styles[shape], className)} style={{ '--pui-swatch': color } as React.CSSProperties} />
);
