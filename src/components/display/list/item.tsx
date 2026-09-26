import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

type ListItemProps = React.HTMLAttributes<HTMLLIElement> & {
  className?: string;
  children?: React.ReactNode;
};

/** A single list row. Token-driven appearance, no inline style. */
export const ListItem = ({ className = '', children, ...props }: ListItemProps) => {
  return (
    <li className={cn(styles.item, className)} {...props}>
      {children}
    </li>
  );
};
