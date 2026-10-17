import React from 'react';
import { cn } from '../../../utils/cn';
import { StyleProps, omitStyleProps, stylePropsToCSS } from '../../shared/styleProps';

/**
 * The set of StyleProps keys. Box strips these from the rest props so they are
 * not forwarded to the underlying DOM element (they are consumed into `style`).
 * Kept in sync with the `StyleProps` interface in `../../shared/styleProps`.
 */
// The StyleProps keys come from the shared helper (`STYLE_PROP_KEYS`), so Box and every component strip the same set.

export type BoxOwnProps = {
  /**
   * Polymorphic element to render. Defaults to `'div'`.
   *
   * `Box` is the SINGLE sanctioned place in puijs that names the raw `'div'`
   * literal. All other components compose `Box` (or a primitive that composes
   * `Box`) instead of emitting their own raw `<div>` (Requirement 16.1, 16.2).
   */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
} & StyleProps;

export type BoxProps = BoxOwnProps &
  Omit<React.HTMLAttributes<HTMLElement>, keyof BoxOwnProps> & {
    [key: `data-${string}`]: unknown;
    [key: `aria-${string}`]: unknown;
  };

/**
 * The single base primitive.
 *
 * `Box` renders the element named by its `as` prop (default `'div'`), forwards
 * its `ref` to that element, and passes `className`, `style`, and the remaining
 * DOM props (`data-*`, `aria-*`, event handlers, etc.) straight through. It is a
 * drop-in replacement for a bare `<div ref className style {...rest}>`.
 *
 * `Box` optionally integrates the shared `StyleProps` helper so callers may pass
 * token-driven style props (`background`, `padding`, `color`, …) the same way
 * `Stack` does. Computed StyleProps CSS is merged first and an explicit `style`
 * prop wins over it. No hardcoded colors are introduced — all color/background
 * values resolve to `--phi-*` custom properties via the shared helpers
 * (Requirement 16.1, 16.3).
 */
export const Box = React.forwardRef<HTMLElement, BoxProps>(function Box(
  { as, className, style, children, ...props },
  ref,
) {
  const Component = (as ?? 'div') as React.ElementType;

  const stylePropsCSS = stylePropsToCSS(props as StyleProps);
  const computedStyle: React.CSSProperties = {
    ...stylePropsCSS,
    ...style,
  };

  // Strip StyleProps keys so they are not forwarded to the DOM element.
  const domRest = omitStyleProps(props);

  return (
    <Component ref={ref} className={cn(className)} style={computedStyle} {...domRest}>
      {children}
    </Component>
  );
});

Box.displayName = 'Box';
