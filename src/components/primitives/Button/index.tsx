import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { BUTTON_SIZES, BUTTON_VARIANTS, type ButtonSize, type ButtonVariant } from './constants';
import styles from './styles.module.scss';

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Where the content sits: centred (default) or at the start, the label taking the rest of the row (a list row). */
  align?: 'center' | 'start';
  /** Grows to its content (two lines, an avatar) instead of the control height. */
  tall?: boolean;
  /** Tree depth: the content starts this many steps (1rem each) in, for rows in a nested list. */
  indent?: number;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = ({
  variant = BUTTON_VARIANTS.PRIMARY,
  size = BUTTON_SIZES.MD,
  fullWidth = false,
  align = 'center',
  tall = false,
  indent,
  loading = false,
  loadingText,
  icon,
  iconLeft,
  iconRight,
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const isIcon = variant === BUTTON_VARIANTS.ICON;
  const iconSize = size === BUTTON_SIZES.SM ? 14 : size === BUTTON_SIZES.LG ? 20 : 16;
  const iconSizeForIconVariant = size === BUTTON_SIZES.SM ? 16 : size === BUTTON_SIZES.LG ? 24 : 20;

  const classes = cn(
    styles.button,
    !isIcon && styles[size],
    isIcon && styles[`icon${size.charAt(0).toUpperCase() + size.slice(1)}`],
    styles[variant],
    fullWidth && styles.fullWidth,
    align === 'start' && styles.alignStart,
    tall && styles.tall,
    indent !== undefined && styles.indent,
    loading && styles.loading,
    'disabled' in props && props.disabled && styles.disabled,
    className
  );

  const merged = indent !== undefined ? { ['--pui-button-indent' as string]: indent, ...(props.style ?? {}) } : props.style;
  const IconLeft = iconLeft;
  const IconRight = iconRight;

  const content = loading ? (
    <>
      <Loader2 className={styles.spin} aria-hidden size={isIcon ? iconSizeForIconVariant : iconSize} />
      {!isIcon && <span>{loadingText || children}</span>}
    </>
  ) : (
    <>
      {icon && <span className={styles.iconNode}>{icon}</span>}
      {!isIcon && IconLeft && <IconLeft aria-hidden size={iconSize} />}
      {!isIcon && children && <span>{children}</span>}
      {!isIcon && IconRight && <IconRight aria-hidden size={iconSize} />}
      {isIcon && IconLeft && <IconLeft aria-hidden size={iconSizeForIconVariant} />}
      {/* Icon buttons written as <Button variant="icon"><X /></Button> (Modal, Drawer, Alert, Stepper, Pagination…) render their child glyph. */}
      {isIcon && !icon && !IconLeft && children}
    </>
  );

  if ('href' in props && props.href) {
    const { href, ...linkProps } = props as ButtonAsLink;
    return (
      <a href={href} className={classes} {...linkProps} style={merged}>
        {content}
      </a>
    );
  }

  const { disabled, ...buttonProps } = props as ButtonAsButton;
  return (
    <button className={classes} disabled={disabled || loading} {...buttonProps} style={merged}>
      {content}
    </button>
  );
};
