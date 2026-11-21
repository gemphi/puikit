import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type BandsProps = { children: React.ReactNode; className?: string; style?: React.CSSProperties };

/**
 * Bands: a child (a picture, a card) inside two bands of the page's light, close to it like a tight grid and with no
 * lines: the outer band 32px round the inner at the top and right (half at the left and bottom), the inner 24px round
 * the child (half at the left and bottom). Each band's light runs the other way from the one round it, so the child
 * merges into its parent; under the pointer the bands brighten with a spring. The stage (Showcase) uses the same gaps.
 */
export const Bands = ({ children, className, style }: BandsProps) => (
  <Box className={cn(styles.outer, className)} style={style}><Box className={styles.inner}>{children}</Box></Box>
);

export default Bands;
