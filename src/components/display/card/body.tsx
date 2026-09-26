import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

type CardBodyProps = React.HTMLAttributes<HTMLElement> & {
  className?: string;
  children?: React.ReactNode;
};

/** Card body role file. */
export const CardBody = ({ className = '', children, ...props }: CardBodyProps) => {
  return (
    <section className={cn('pui-card-body', styles.body, className)} {...props}>
      {children}
    </section>
  );
};
