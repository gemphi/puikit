import React from 'react';
import { cn } from '../../../utils/cn';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import styles from './styles.module.scss';

type AvatarProps = {
  src?: string;
  /** A photo cut from a sprite sheet: `cols` × `rows` cells, `index` counted left to right, top to bottom. */
  sprite?: { src: string; cols: number; rows?: number; index: number };
  alt?: string;
  initials?: string;
  /** A glyph shown instead of initials (agents, kinds). */
  icon?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Default profile icon without a photo: the disc is cut by a horizontal line — one shade on the top
   * semicircle — and the bottom semicircle is cut in half again into two shades, all inside an outer ring
   * of a fourth shade. `false` keeps the single flat circle.
   */
  shades?: boolean;
  /** Picks the shade set (stable per person / record). Defaults to alt + initials. */
  seed?: string;
  /** The record's own colours (taken from its pictures), first and second: the shades are mixed from them instead of
   *  a theme pair picked by `seed`, and a mark or logo stands on glass of those two colours. */
  colors?: string[];
  /** Deck: this many smaller circles stacked behind, peeking out above (0–3). Defaults to 2 on the shaded icon. */
  deck?: number;
  /** How a picture fills the circle: cropped to it (cover, a photo) or whole inside it (contain, a mark or logo). */
  fit?: 'cover' | 'contain';
  /** Whether the person is about, as a dot at the picture's foot: here, away, busy (not to be disturbed) or off. */
  presence?: AvatarPresence;
  /** The dot's name for assistive tech ("Here now"); without one the dot is decoration. */
  presenceLabel?: string;
  className?: string;
};
export type AvatarPresence = 'here' | 'away' | 'busy' | 'off';

const TONES = 6;
/** Background position of one sprite cell, as CSS variables (the sheet scales to cols × rows of the avatar). */
export const spriteVars = ({ src, cols, rows = cols, index }: { src: string; cols: number; rows?: number; index: number }) => {
  const c = index % cols, r = Math.floor(index / cols);
  return { '--pui-sprite': `url("${src}")`, '--pui-sprite-size': `${cols * 100}% ${rows * 100}%`,
    '--pui-sprite-pos': `${cols > 1 ? (c / (cols - 1)) * 100 : 0}% ${rows > 1 ? (r / (rows - 1)) * 100 : 0}%` } as React.CSSProperties;
};
const toneOf = (seed: string) => { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return h % TONES; };

export const Avatar = ({ src, sprite, alt = '', initials, icon, size = 'md', shades = true, seed, colors, deck, fit = 'cover', presence, presenceLabel, className = '' }: AvatarProps) => {
  const split = shades && !src && !sprite;
  const levels = Math.max(0, Math.min(3, deck ?? (split ? 2 : 0)));
  const disc = (
    <Stack
      direction="row" align="center" justify="center"
      className={cn(styles.avatar, styles[size], split && styles.split, src && fit === 'contain' && styles.mark, colors?.length && styles.tinted, levels > 0 && styles['deck' + levels], className)}
      aria-label={alt || initials}
      data-tone={split && !colors?.length ? toneOf(seed ?? alt + (initials ?? '')) : undefined}
      style={colors?.length ? ({ '--av-a': colors[0], '--av-b': colors[1] ?? colors[0] } as React.CSSProperties) : undefined}
    >
      {sprite ? (
        <Span role="img" aria-label={alt} className={styles.sprite} style={spriteVars(sprite)} />
      ) : src ? (
        <img src={src} alt={alt} className={cn(styles.image, fit === 'contain' && styles.contain)} />
      ) : (
        <>
          {split && (
            <Span className={styles.disc} aria-hidden="true">
              <Span className={styles.top} />
              <Span className={styles.left} />
              <Span className={styles.right} />
            </Span>
          )}
          {icon ? <Span className={styles.icon}>{icon}</Span> : <Span className={styles.initials}>{initials}</Span>}
        </>
      )}
    </Stack>
  );
  // The dot stands outside the disc, which cuts whatever leaves its circle.
  return presence ? (
    <Span className={cn(styles.held, styles[size])}>
      {disc}
      <Span className={styles.presence} data-presence={presence} role={presenceLabel ? 'img' : undefined} aria-label={presenceLabel} aria-hidden={presenceLabel ? undefined : true} />
    </Span>
  ) : disc;
};
