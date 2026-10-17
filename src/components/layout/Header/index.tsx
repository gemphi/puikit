import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';
import styles from './styles.module.scss';

export type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  sticky?: boolean;
  className?: string;
  children?: React.ReactNode;
} & StyleProps;

export const Header: React.FC<HeaderProps> = ({ sticky = false, className = '', style, children, ...props }) => {
  const stylePropsCSS = stylePropsToCSS(props);
  const computedStyle = { ...stylePropsCSS, ...style } as React.CSSProperties;

  const rest = omitStyleProps(props);

  return (
    <header className={cn(styles.header, sticky && styles.sticky, className)} style={computedStyle} {...rest}>
      {children}
    </header>
  );
};

export default Header;
