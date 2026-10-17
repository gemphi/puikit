import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type FrameProps = Omit<React.HTMLAttributes<HTMLElement>, 'color'> & {
  /** Aspect ratio ('3/4', '1/1', '16/9'). */
  ratio?: string;
  /** Corner radius from the theme. */
  rounded?: 'none' | 'md' | 'lg' | 'full';
  /** Where the content sits: the centre (default) or the bottom-left corner (a banner's name). */
  place?: 'center' | 'end-start';
  /** A colour mixed into the card ground behind the content (a look's colour), at `tintStrength` percent. */
  tint?: string;
  tintStrength?: number;
  /** The colour of what it holds (a glyph's currentColor), e.g. white on a solid tint. */
  ink?: string;
  /** Width of the frame ('5rem', '100%'). Defaults to the width of its parent. */
  width?: string;
  /** How the frame sizes in a flex row ('none', '0 1 26rem'). */
  flex?: string;
  /** Centre the frame in its row, up to `maxWidth`. */
  maxWidth?: string;
  children?: React.ReactNode;
};

/**
 * A box of a fixed shape that centres what it holds (an image, a name) on a ground: a picture frame for media that are
 * not a full card. Images inside fill it and keep their proportions (`Image fit="contain"`).
 */
export const Frame = ({ ratio = '3/4', rounded = 'lg', place = 'center', tint, tintStrength = 24, ink, width, flex, maxWidth, className, children, ...props }: FrameProps) => (
  <Box className={cn('pui-frame', styles.frame, styles[`r-${rounded}`], place === 'end-start' && styles.endStart, maxWidth && styles.centered, className)}
    style={{ aspectRatio: ratio, width, flex, maxWidth, color: ink, ['--pui-frame-tint' as string]: tint, ['--pui-frame-strength' as string]: tint ? `${tintStrength}%` : undefined }}
    data-tint={tint ? '' : undefined} {...props}>
    {children}
  </Box>
);
