import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

export type PictureProps = {
  src: string;
  alt?: string;
  className?: string;
};

/**
 * A picture on a card, the one way everywhere (a post's tile, a related record's card): the picture never sits bare.
 * A blurred copy of it is the ground, so the card wears the picture's own colours; over that a room of the kit's
 * surface; in the room the picture itself, whole (never stretched or cropped), with its own rounded corners. It fills
 * the positioned box it is put in. Both copies load and decode only as they come into view, so a page of fifty cards
 * never decodes fifty large pictures at once.
 */
export const Picture = ({ src, alt = '', className }: PictureProps) => (
  <span className={cn(styles.root, className)}>
    <img className={styles.ground} src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
    <span className={styles.room}><img src={src} alt={alt} loading="lazy" decoding="async" /></span>
  </span>
);

export default Picture;
