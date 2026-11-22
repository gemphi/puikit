import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../Text';
import styles from './styles.module.scss';

type DividerProps = React.HTMLAttributes<HTMLHRElement> & {
  orientation?: 'horizontal' | 'vertical';
  /** Words in the middle of the line (a day in a chat, "or" between two ways in): the line runs to both sides of them. */
  label?: React.ReactNode;
  className?: string;
};

export const Divider = ({ orientation = 'horizontal', label, className = '', ...props }: DividerProps) => {
  if (label != null) return <Box role="separator" className={cn(styles.labelled, className)}><Text as="span" size="xs" intent="muted">{label}</Text></Box>;
  return <hr className={cn(styles.divider, styles[orientation], className)} {...props} />;
};
