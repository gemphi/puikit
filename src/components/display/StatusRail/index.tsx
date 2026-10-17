import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type StatusItem = {
  id: string;
  /** Thumbnail: an avatar, an image, any node. */
  thumb: React.ReactNode;
  label: React.ReactNode;
  /** Second line (a count, a time, "Live"). */
  sub?: React.ReactNode;
  /** Already viewed: the ring goes quiet. */
  seen?: boolean;
  /** Live / new: the ring spins. */
  live?: boolean;
  onClick?: () => void;
  /** The item's own colour (a person's, a pool's): its capsule, copies and ring take it instead of the theme primary. */
  color?: string;
};

export type StatusRailProps = { items: StatusItem[]; 'aria-label'?: string; className?: string };

/**
 * StatusRail — the stories / status slider. One scrolling row; every item is a capsule on the theme's gradient (with
 * two copies cascading above it, like the card decks) that holds its thumbnail (ringed: bright when new, quiet when seen, spinning when live) and its caption, so the
 * thumbnail and the caption read as one card. Colours, radius and motion are theme tokens.
 */
export const StatusRail = ({ items, className, ...rest }: StatusRailProps) => (
  <Box className={cn(styles.rail, className)} role="list" aria-label={rest['aria-label']}>
    {items.map((it) => (
      <Box key={it.id} as="button" role="listitem" className={cn(styles.item, it.seen && styles.seen, it.live && styles.live)} onClick={it.onClick}
        style={it.color ? ({ '--phi-color-primary': it.color, '--phi-color-accent-2': it.color } as React.CSSProperties) : undefined}>
        {/* the capsule cascades upward, like the cards it sits above */}
        <Box as="span" className={styles.ghost} style={{ '--pui-status-k': '2' } as React.CSSProperties} aria-hidden="true" />
        <Box as="span" className={styles.ghost} style={{ '--pui-status-k': '1' } as React.CSSProperties} aria-hidden="true" />
        <Box as="span" className={styles.capsule}>
          <Box as="span" className={styles.ring}><Box as="span" className={styles.thumb}>{it.thumb}</Box></Box>
          <Box as="span" className={styles.label}>{it.label}</Box>
          {it.sub != null && <Box as="span" className={styles.sub}>{it.sub}</Box>}
        </Box>
      </Box>
    ))}
  </Box>
);
