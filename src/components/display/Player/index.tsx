import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type PlayerProps = {
  /** The picture: a file (`image`), or something drawn (`children`: a ground, a small window). Each layer is it. */
  image?: string;
  children?: React.ReactNode;
  /** Read out for the picture. */
  label?: string;
  /** The picture's shape, width to height. */
  ratio?: string;
  /** Marked as the one chosen: its rim lit. */
  selected?: boolean;
  /** The face fills the whole player, edge to edge (a card's picture): it still draws back under the pointer. */
  fill?: boolean;
  className?: string;
};

/**
 * A picture with depth, as the house's cards and letters have it: three layers of the same picture.
 *   ground  the picture again, blurred wide and larger, a haze of its own colours the card stands in;
 *   depth   the picture blurred a little and set down and right, as the 3D font sets its letter again behind it;
 *   face    the picture, sharp, held a little large.
 * Under the pointer the face draws back to its size (it zooms out), the depth follows it in, the ground brightens and
 * a light crosses the face. Nothing moves where the person asked for less motion.
 */
export const Player = ({ image, children, label, ratio = '16/10', selected, fill, className }: PlayerProps) => {
  const layer = (kind: string) => (
    <Box as="span" className={cn(styles.layer, styles[kind])} aria-hidden={kind !== 'face'}>
      {image ? <img src={image} alt={kind === 'face' ? label ?? '' : ''} draggable={false} /> : children}
    </Box>
  );
  return (
    <Box as="span" role={label && !image ? 'img' : undefined} aria-label={label && !image ? label : undefined}
      className={cn(styles.player, selected && styles.selected, fill && styles.fill, className)} style={{ '--pui-player-ratio': ratio } as React.CSSProperties}>
      {layer('ground')}
      {layer('depth')}
      {layer('face')}
      <Box as="span" className={styles.sheen} aria-hidden="true" />
    </Box>
  );
};
