import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

type CardFooterProps = React.HTMLAttributes<HTMLElement> & {
  className?: string;
  children?: React.ReactNode;
};

/** Card footer role file. */
export const CardFooter = ({ className = '', children, ...props }: CardFooterProps) => {
  return (
    <footer className={cn('pui-card-footer', styles.footer, className)} {...props}>
      {children}
    </footer>
  );
};
