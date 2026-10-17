import React, { useRef } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Image } from '../Image';
import styles from './styles.module.scss';

/** One layer of a DepthMedia: an image, a CSS background (tone, gradient), or any node (an Avatar). */
export type DepthLayer = {
  src?: string;
  alt?: string;
  /** CSS background behind / instead of the image. */
  background?: string;
  fit?: 'cover' | 'contain';
  node?: React.ReactNode;
};

export type DepthMediaProps = {
  /** Parent layer — fills the frame. */
  back?: DepthLayer;
  /** Second layer — a framed image nested in the parent (≈ ¾ of its height). */
  mid?: DepthLayer;
  /** Third layer — a round photo nested in the mid layer (≈ 40 % of its width). */
  front?: DepthLayer;
  /** CSS aspect-ratio of the frame, e.g. "4/5", "16/9", "auto". */
  ratio?: string;
  /** Pointer parallax: layers move by depth, the frame tilts. */
  tilt?: boolean;
  /** Perspective floor grid on the parent layer. */
  grid?: boolean;
  /** Game-style hover: lift, glow edge, shine sweep, spinning ring on the photo. */
  game?: boolean;
  /** Mid layer height as a fraction of the frame (0.4–0.95). */
  midSize?: number;
  /** Front layer width as a fraction of the mid layer (0.2–0.7). */
  frontSize?: number;
  /**
   * Deck: this many copies of the card's own image stacked behind it, each one level narrower and lower
   * and peeking out above the last, so the card is the top of a deck (0–8). They fan out in 3D on hover.
   */
  deck?: number;
  /**
   * Cascade behind the slanted mid card: this many copies of it fanned out behind, each smaller and turned further
   * (0–5, default 3). Opens wider on hover.
   */
  midDeck?: number;
  /** Where the deck sits: above the card (default) or hanging below it — the opposite cascade (posts, shots). */
  deckDirection?: 'up' | 'down';
  /** Icon at the bottom-left of the footer, beside the caption (the world's / record's icon). */
  footerIcon?: React.ReactNode;
  /** Chips over the top-left corner. */
  badges?: React.ReactNode;
  /** Caption over the bottom-left corner (title, subtitle). */
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
};

/** A colour fills under the theme's layer gradient; a gradient replaces it. */
const bg = (v?: string): React.CSSProperties | undefined => (!v ? undefined : /gradient\(|url\(/.test(v) ? { backgroundImage: v } : { backgroundColor: v });

const Layer: React.FC<{ layer?: DepthLayer; className: string; fit: 'cover' | 'contain'; children?: React.ReactNode }> = ({ layer, className, fit, children }) => (
  <Box className={className} style={bg(layer?.background)}>
    <Box className={styles.clip}>
      {layer?.src && <Image src={layer.src} alt={layer.alt ?? ''} loading="lazy" draggable={false} className={styles.img} style={{ objectFit: layer.fit ?? fit }} />}
      {layer?.node}
    </Box>
    {children}
  </Box>
);

/**
 * Media with depth: three nested layers in decreasing size — parent image, a framed image inside it,
 * a round photo inside that — with pointer parallax so the stack reads as a little 3D scene.
 */
export const DepthMedia = ({
  back, mid, front, ratio = '4/5', tilt = true, grid = false, game = true, midSize = 0.74, frontSize = 0.42,
  deck = 0, midDeck = 3, deckDirection = 'up', footerIcon, badges, children, onClick, className, style, ...rest
}: DepthMediaProps) => {
  const n = Math.max(0, Math.min(8, Math.round(deck)));
  const m = mid ? Math.max(0, Math.min(5, Math.round(midDeck))) : 0;
  const ref = useRef<HTMLElement | null>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current; if (!el || !tilt) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--pui-depth-x', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--pui-depth-y', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const leave = () => { ref.current?.style.setProperty('--pui-depth-x', '0'); ref.current?.style.setProperty('--pui-depth-y', '0'); };
  const vars = { aspectRatio: ratio, '--pui-depth-mid': String(Math.min(0.95, Math.max(0.4, midSize))), '--pui-depth-front': String(Math.min(0.7, Math.max(0.2, frontSize))) } as React.CSSProperties;
  const frame = (
    <Box
      ref={n ? undefined : ref}
      className={cn(styles.depth, tilt && styles.tilt, game && styles.game, onClick && styles.click, !n && className)}
      style={n ? vars : { ...vars, ...style }}
      onPointerMove={n ? undefined : move}
      onPointerLeave={n ? undefined : leave}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      data-layers={[back, mid, front].filter(Boolean).length}
      {...rest}
    >
      <Layer layer={back} className={cn(styles.back, grid && styles.grid)} fit="cover" />
      {Array.from({ length: m }, (_, i) => m - i).map((k) => (
        <Box key={'m' + k} className={styles.midGhost} style={{ '--pui-mid-k': String(k), ...bg(mid?.background) } as React.CSSProperties} aria-hidden="true" data-mid-ghost={k}>
          <Box className={styles.clip}>{mid?.src && <Image src={mid.src} alt="" loading="lazy" draggable={false} className={styles.img} style={{ objectFit: mid.fit ?? 'contain' }} />}</Box>
        </Box>
      ))}
      {mid && (
        <Layer layer={mid} className={styles.mid} fit="contain">
          {front && <Layer layer={front} className={styles.front} fit="cover" />}
        </Layer>
      )}
      {badges && <Box className={styles.badges}>{badges}</Box>}
      {(children || footerIcon) && (
        <Box className={styles.caption}>
          {footerIcon && <Box className={styles.footIcon}>{footerIcon}</Box>}
          {children && <Box className={styles.captionText}>{children}</Box>}
        </Box>
      )}
    </Box>
  );
  if (!n) return frame;
  return (
    <Box ref={ref} className={cn(styles.deck, className)} style={{ '--pui-deck': String(n), ...style } as React.CSSProperties} onPointerMove={move} onPointerLeave={leave} data-deck={n} data-deck-dir={deckDirection}>
      {Array.from({ length: n }, (_, i) => n - i).map((k) => (
        <Box key={k} className={styles.ghost} style={{ '--pui-deck-k': String(k) } as React.CSSProperties} aria-hidden="true">
          <Layer layer={back} className={styles.ghostBack} fit="cover" />
        </Box>
      ))}
      {frame}
    </Box>
  );
};
