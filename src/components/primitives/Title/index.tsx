import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';
import styles from './styles.module.scss';

export type TitleVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type TitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  variant?: TitleVariant;
  level?: 1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  children?: React.ReactNode;
} & StyleProps;

export const Title = ({ variant, level, size, className = '', style, children, ...props }: TitleProps) => {
  const resolvedVariant: TitleVariant = variant || (level ? (`h${level}` as TitleVariant) : 'h1');
  const Tag = resolvedVariant;
  const sizeClass = size ? styles[`size-${size}`] : '';
  const stylePropsCSS = stylePropsToCSS(props);
  const computedStyle = { ...stylePropsCSS, ...style };

  const rest = omitStyleProps(props);

  return (
    <Tag className={cn(styles.title, styles[resolvedVariant], sizeClass, className)} style={computedStyle} {...rest}>
      {children}
    </Tag>
  );
};
