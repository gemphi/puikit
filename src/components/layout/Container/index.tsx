import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';
import { responsiveCSSVars, type ResponsiveValue } from '../../shared/responsive';
import { Box } from '../Box';
import styles from './styles.module.scss';

export const CONTAINER_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  FULL: 'full',
} as const;

export type ContainerSize = (typeof CONTAINER_SIZES)[keyof typeof CONTAINER_SIZES];

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: ResponsiveValue<ContainerSize>;
  fluid?: boolean;
  className?: string;
  children?: React.ReactNode;
} & StyleProps;

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size, fluid = false, className = '', style, children, ...props }, ref) => {
    const sizeClass = fluid || !size ? styles.full : typeof size === 'object' ? '' : styles[size];
    const stylePropsCSS = stylePropsToCSS(props);
    const computedStyle = {
      ...responsiveCSSVars('container-max-width', fluid ? 'full' : size, (value: ContainerSize) => ({
        xs: '576px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        full: 'none',
      })[value]),
      ...stylePropsCSS,
      ...style,
    };

    const rest = omitStyleProps(props);

    return (
      <Box ref={ref} className={cn(styles.container, sizeClass, className)} style={computedStyle} {...rest}>
        {children}
      </Box>
    );
  }
);
Container.displayName = 'Container';
