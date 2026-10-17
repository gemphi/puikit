import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { spriteVars } from '../Avatar';
import styles from './styles.module.scss';

export type SpriteImageProps = {
  /** The sheet, its grid and the cell (left to right, top to bottom). */
  sprite: { src: string; cols: number; rows?: number; index: number };
  alt: string;
  /** Aspect ratio of the frame (default square). */
  ratio?: string;
  /** Corner radius from the theme. */
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Cap the width (any CSS length); the image centres in its space. Small cells stay sharp. */
  maxWidth?: string;
  className?: string;
};

/** One image cut from a sprite sheet, at any size: many portraits ship as a few files. */
export const SpriteImage = ({ sprite, alt, ratio = '1 / 1', radius = 'lg', maxWidth, className }: SpriteImageProps) => (
  <Box role="img" aria-label={alt} className={cn(styles.sprite, styles['r-' + radius], className)} style={{ ...spriteVars(sprite), aspectRatio: ratio, ...(maxWidth ? { maxWidth, marginInline: 'auto' } : null) }} />
);
