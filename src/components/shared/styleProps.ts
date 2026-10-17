import type React from 'react';

/**
 * Shared style props for puijs components.
 *
 * These props allow consumers to control common visual properties
 * without using inline style={{}} attributes. Components merge them
 * into computed styles internally.
 */

export type BackgroundToken =
  | 'brand-gradient'
  | 'gradient-main'
  | 'gradient-main-lr'
  | 'gradient-secondary'
  | 'gradient-card'
  | 'gradient-navbar'
  | 'gradient-sidebar'
  | 'gradient-footer'
  | 'gradient-accent'
  | 'transparent'
  | 'inherit';

export type ColorToken =
  | 'primary'
  | 'primary-hover'
  | 'secondary'
  | 'text-primary'
  | 'text-secondary'
  | 'text-muted'
  | 'text-inverse'
  | 'inherit'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type SpacingToken = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

export type AlignToken = 'left' | 'center' | 'right';

/** Maps a BackgroundToken to a CSS var string. */
export function resolveBackground(bg?: BackgroundToken | string): string | undefined {
  if (!bg) return undefined;
  if (bg === 'transparent') return 'transparent';
  if (bg === 'inherit') return 'inherit';
  if (bg.startsWith('gradient-') || bg.startsWith('brand-')) {
    return `var(--phi-${bg})`;
  }
  return bg;
}

/** Maps a ColorToken to a CSS var string. */
export function resolveColor(color?: ColorToken | string): string | undefined {
  if (!color) return undefined;
  if (color === 'inherit') return 'inherit';
  const tokenMap: Record<string, string> = {
    'primary': 'var(--phi-color-primary)',
    'primary-hover': 'var(--phi-color-primary-hover)',
    'secondary': 'var(--phi-color-secondary)',
    'text-primary': 'var(--phi-color-text-primary)',
    'text-secondary': 'var(--phi-color-text-secondary)',
    'text-muted': 'var(--phi-color-text-muted)',
    'text-inverse': 'var(--phi-color-text-inverse)',
    'success': 'var(--phi-color-success)',
    'warning': 'var(--phi-color-warning)',
    'error': 'var(--phi-color-error)',
    'info': 'var(--phi-color-info)',
  };
  return tokenMap[color] || color;
}

/** Maps a SpacingToken to a rem value. */
export function resolveSpacing(spacing?: SpacingToken): string | undefined {
  if (spacing === undefined) return undefined;
  return `${spacing * 0.25}rem`;
}

/** Maps a maxWidth string to CSS (supports 'sm'|'md'|'lg'|'xl' or raw value). */
export function resolveMaxWidth(maxWidth?: string): string | undefined {
  if (!maxWidth) return undefined;
  const map: Record<string, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  };
  return map[maxWidth] || maxWidth;
}

export interface StyleProps {
  background?: BackgroundToken | string;
  padding?: SpacingToken;
  paddingTop?: SpacingToken;
  paddingBottom?: SpacingToken;
  paddingLeft?: SpacingToken;
  paddingRight?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  margin?: SpacingToken;
  marginTop?: SpacingToken;
  marginBottom?: SpacingToken;
  color?: ColorToken | string;
  maxWidth?: string;
  minWidth?: string;
  minHeight?: string;
  /** CSS width (a raw value: '100%', '3rem'). */
  width?: string;
  /** CSS height (a raw value: '100vh', '100%'). */
  height?: string;
  /** Centre the element in its row (inline margins auto). */
  centered?: boolean;
  /** Push the element to the end of its row (inline-start margin auto). */
  pushEnd?: boolean;
  /** Push the element to the end of its column (block-start margin auto). */
  pushDown?: boolean;
  maxHeight?: string;
  /** Corner radius from the theme. */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** The flex shorthand inside a flex parent ('1', '1.4 1 20rem', 'none'). */
  flex?: string;
  /** Scroll on overflow: 'y' (a list that scrolls), 'x' (a row that scrolls). */
  scroll?: 'x' | 'y';
  align?: AlignToken;
  textDecoration?: string;
  opacity?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  letterSpacing?: string;
  /** Line height (a number or a CSS value). */
  lineHeight?: number | string;
  /** The theme font: heading, body or mono. */
  font?: 'heading' | 'body' | 'mono';
  /**
   * A theme surface: `card` (the card gradient, theme radius, 1rem padding), `panel` (the solid card colour), `sunken`
   * (the secondary background) or `hero` (the sidebar gradient, roomy padding). Padding props still win.
   */
  surface?: 'card' | 'panel' | 'sunken' | 'hero';
  /** A hairline rule on one side (rows in a list, a header). */
  rule?: 'top' | 'bottom';
  /** Lay the children out as a grid that fits as many columns as stay at least this wide, sharing the row ('220px', '14rem'). */
  autoFill?: string;
}

/** Converts StyleProps into a CSSProperties object. */
export function stylePropsToCSS(props: StyleProps): React.CSSProperties {
  const css: React.CSSProperties = {};

  if (props.background) css.background = resolveBackground(props.background) as any;
  if (props.color) css.color = resolveColor(props.color) as any;

  const pY = props.paddingY ?? props.padding;
  const pX = props.paddingX ?? props.padding;
  if (pY !== undefined) {
    css.paddingTop = css.paddingTop || resolveSpacing(pY);
    css.paddingBottom = css.paddingBottom || resolveSpacing(pY);
  }
  if (pX !== undefined) {
    css.paddingLeft = css.paddingLeft || resolveSpacing(pX);
    css.paddingRight = css.paddingRight || resolveSpacing(pX);
  }
  if (props.paddingTop !== undefined) css.paddingTop = resolveSpacing(props.paddingTop);
  if (props.paddingBottom !== undefined) css.paddingBottom = resolveSpacing(props.paddingBottom);
  if (props.paddingLeft !== undefined) css.paddingLeft = resolveSpacing(props.paddingLeft);
  if (props.paddingRight !== undefined) css.paddingRight = resolveSpacing(props.paddingRight);

  if (props.margin !== undefined) css.margin = resolveSpacing(props.margin) as any;
  if (props.marginTop !== undefined) css.marginTop = resolveSpacing(props.marginTop) as any;
  if (props.marginBottom !== undefined) css.marginBottom = resolveSpacing(props.marginBottom) as any;

  if (props.maxWidth) css.maxWidth = resolveMaxWidth(props.maxWidth) as any;
  if (props.minWidth) css.minWidth = props.minWidth;
  if (props.minHeight) css.minHeight = props.minHeight;
  if (props.width) css.width = props.width;
  if (props.height) css.height = props.height;
  if (props.centered) { css.marginLeft = 'auto'; css.marginRight = 'auto'; }
  if (props.pushEnd) css.marginInlineStart = 'auto';
  if (props.pushDown) css.marginBlockStart = 'auto';
  if (props.maxHeight) css.maxHeight = props.maxHeight;
  if (props.rounded) css.borderRadius = props.rounded === 'full' ? '999px' : `var(--phi-radius-${props.rounded})`;
  if (props.flex) css.flex = props.flex;
  if (props.scroll === 'y') { css.overflowY = 'auto'; css.minHeight = css.minHeight ?? 0; }
  if (props.scroll === 'x') { css.overflowX = 'auto'; css.minWidth = css.minWidth ?? 0; }
  if (props.align) css.textAlign = props.align;
  if (props.textDecoration) css.textDecoration = props.textDecoration;
  if (props.opacity !== undefined) css.opacity = props.opacity;
  if (props.textTransform) css.textTransform = props.textTransform;
  if (props.letterSpacing) css.letterSpacing = props.letterSpacing;
  if (props.lineHeight !== undefined) { css.lineHeight = props.lineHeight; (css as Record<string, unknown>)['--pui-text-lh'] = props.lineHeight; }
  if (props.surface) {
    const bg = { card: 'var(--phi-gradient-card)', panel: 'var(--phi-color-background-card)', sunken: 'var(--phi-color-background-secondary)', hero: 'var(--phi-gradient-sidebar)' }[props.surface];
    css.background = css.background ?? bg; css.borderRadius = css.borderRadius ?? 'var(--phi-radius-lg)';
    const pad = props.surface === 'hero' ? 'clamp(1.25rem, 4cqi, 2.75rem)' : '1rem';
    if (props.padding === undefined && props.paddingX === undefined && props.paddingY === undefined && props.paddingTop === undefined && props.paddingBottom === undefined && props.paddingLeft === undefined && props.paddingRight === undefined) css.padding = pad;
  }
  if (props.rule) css[props.rule === 'top' ? 'borderTop' : 'borderBottom'] = '1px solid var(--phi-color-border-subtle, var(--phi-color-border))';
  if (props.autoFill) { css.display = 'grid'; css.gridTemplateColumns = `repeat(auto-fit, minmax(min(100%, ${props.autoFill}), 1fr))`; css.alignItems = 'stretch'; }
  if (props.font) css.fontFamily = `var(--phi-font-${props.font === 'body' ? 'family' : props.font}, inherit)`;

  return css;
}

/** Every StyleProps key, so components can strip them before the rest reach the DOM. */
export const STYLE_PROP_KEYS = [
  'background', 'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingX', 'paddingY',
  'margin', 'marginTop', 'marginBottom', 'color', 'maxWidth', 'minWidth', 'minHeight', 'width', 'height', 'centered', 'pushEnd',
  'pushDown', 'maxHeight', 'rounded', 'flex', 'scroll', 'align', 'textDecoration', 'opacity', 'textTransform', 'letterSpacing', 'lineHeight', 'font', 'surface', 'autoFill', 'rule',
] as const satisfies readonly (keyof StyleProps)[];

/** The props without their StyleProps keys (consumed into `style` by `stylePropsToCSS`). */
export function omitStyleProps<T extends object>(props: T): Omit<T, keyof StyleProps> {
  const rest: Record<string, unknown> = { ...(props as Record<string, unknown>) };
  for (const k of STYLE_PROP_KEYS) delete rest[k];
  return rest as Omit<T, keyof StyleProps>;
}
