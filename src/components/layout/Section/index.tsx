import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';
import styles from './styles.module.scss';

export type SectionTag = 'header' | 'main' | 'footer' | 'section' | 'article' | 'nav' | 'aside' | 'div';

type SectionProps = Omit<React.HTMLAttributes<HTMLElement>, 'align'> & {
  as?: SectionTag;
  className?: string;
  children?: React.ReactNode;
} & StyleProps;

export const Section = ({
  as: Tag = 'section',
  className = '',
  style,
  children,
  ...props
}: SectionProps) => {
  const stylePropsCSS = stylePropsToCSS(props);
  const computedStyle = { ...stylePropsCSS, ...style };

  const rest = omitStyleProps(props);

  return (
    <Tag className={cn(styles.section, className)} style={computedStyle} {...rest}>
      {children}
    </Tag>
  );
};
