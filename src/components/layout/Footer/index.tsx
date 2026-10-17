import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';
import styles from './styles.module.scss';

export type FooterProps = React.HTMLAttributes<HTMLElement> & {
  className?: string;
  children?: React.ReactNode;
} & StyleProps;

export const Footer: React.FC<FooterProps> = ({ className = '', style, children, ...props }) => {
  const stylePropsCSS = stylePropsToCSS(props);
  const computedStyle = { ...stylePropsCSS, ...style } as React.CSSProperties;

  const rest = omitStyleProps(props);

  return (
    <footer className={cn(styles.footer, className)} style={computedStyle} {...rest}>
      {children}
    </footer>
  );
};

export default Footer;
