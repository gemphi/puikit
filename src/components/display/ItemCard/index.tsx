import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Card, type CardProps } from '../card';
import styles from './styles.module.scss';

export type ItemCardProps = Omit<CardProps, 'children' | 'title'> & {
  /** Avatar, icon, image or a small block (a date). Leads the header. */
  media?: React.ReactNode;
  title: React.ReactNode;
  /** One line under the title: a kind, a handle, a time. */
  meta?: React.ReactNode;
  /** The body: description, tags, numbers. */
  children?: React.ReactNode;
  /** Stays in the header row at its end: a price, a count, a badge. */
  aside?: React.ReactNode;
  /** Buttons. Beside the body when wide; their own row under the body when stacked. */
  actions?: React.ReactNode;
  /**
   * Below this card width the header (media + title) and the body become two rows, so a narrow card never squeezes the
   * media and the text side by side. `sm` 16rem, `md` 22rem (default), `lg` 30rem; `never` keeps one row, `always` stacks.
   */
  stackBelow?: 'sm' | 'md' | 'lg' | 'never' | 'always';
  /** Media size in the header. */
  mediaSize?: 'sm' | 'md' | 'lg';
  /**
   * `vertical`: a product card, the media full width on top, then the title row (title · aside), body and actions.
   * Cards narrower than 10rem take it on their own.
   */
  layout?: 'auto' | 'vertical';
};

/**
 * ItemCard: the one card for a record in a list (search hits, events, coins, people, lots). Wide, it is one row:
 * media · title, meta and body · actions. Narrow, it is two: the header (media and title) above, the body and actions
 * below. It reads its own width (a container query), so the same card works in a 1-, 3- or 6-column grid.
 */
export const ItemCard = ({ media, title, meta, children, aside, actions, stackBelow = 'md', mediaSize = 'md', layout = 'auto', className, ...card }: ItemCardProps) => (
  <Card {...card} className={cn(styles.card, className)}>
    <Box className={styles.frame}>
      <Box className={cn(styles.item, styles['stack-' + stackBelow], styles['media-' + mediaSize], layout === 'vertical' && styles.vertical)} data-stack={stackBelow} data-layout={layout}>
        {media != null && <Box className={styles.media}>{media}</Box>}
        <Box className={styles.head}>
          <Box className={styles.title}>{title}</Box>
          {meta != null && <Box className={styles.meta}>{meta}</Box>}
        </Box>
        {aside != null && <Box className={styles.aside}>{aside}</Box>}
        {children != null && <Box className={styles.body}>{children}</Box>}
        {actions != null && <Box className={styles.actions}>{actions}</Box>}
      </Box>
    </Box>
  </Card>
);
