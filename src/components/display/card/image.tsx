import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

type CardImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  className?: string;
};

/** Card image role file. */
export const CardImage = ({ src, alt, className = '', ...props }: CardImageProps) => {
  return <img src={src} alt={alt} className={cn(styles.image, className)} {...props} />;
};
