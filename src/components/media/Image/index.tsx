import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  aspect?: 'square' | 'video' | 'auto';
  /** How the picture fills its box: whole (contain) or cropped (cover). */
  fit?: 'contain' | 'cover';
  /** Fill the parent (width and height 100%). */
  fill?: boolean;
  className?: string;
};

export const Image = ({ src, alt, aspect = 'auto', fit, fill = false, className = '', ...props }: ImageProps) => {
  return <img src={src} alt={alt} className={cn(styles.image, styles[aspect], fit && styles[`fit-${fit}`], fill && styles.fill, className)} {...props} />;
};
