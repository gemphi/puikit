import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

type ListProps = React.HTMLAttributes<HTMLUListElement | HTMLOListElement> & {
  ordered?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/**
 * The foundational list surface. Rendered as `ul`/`ol`; appearance is
 * token-driven through `styles.module.scss` (no hardcoded colors, no inline
 * style). Rows are provided by the shared {@link ListItem} composition.
 */
export const List = ({ ordered = false, className = '', children, ...props }: ListProps) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={cn(styles.list, className)} {...props}>
      {children}
    </Tag>
  );
};
