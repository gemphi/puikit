import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import styles from './styles.module.scss';

export type IconMenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** A count beside the label (how many posts, hosts, events…). */
  count?: number | string;
};

export type IconMenuProps = {
  items: IconMenuItem[];
  /** The entry for the part of the page in view, marked as current. */
  activeId?: string;
  onPick: (id: string) => void;
  'aria-label': string;
  className?: string;
};

/**
 * A record's menu of icons (a world's About, Zones, Posts, Hosts…): a centred row of round icons, each with its name
 * under it, that stays under the header while the page scrolls. More entries than fit scroll sideways in place.
 */
export const IconMenu = ({ items, activeId, onPick, className, ...rest }: IconMenuProps) => (
  <Box as="nav" className={cn(styles.menu, className)} aria-label={rest['aria-label']}>
    {items.map((it) => (
      <Pressable key={it.id} className={cn(styles.item, it.id === activeId && styles.on)} onClick={() => onPick(it.id)}
        aria-current={it.id === activeId ? 'true' : undefined} aria-label={it.count != null ? `${it.label} (${it.count})` : it.label}>
        <Box as="span" className={styles.icon} aria-hidden="true">{it.icon}</Box>
        <Text as="span" size="xs" weight="semibold" className={styles.label}>{it.label}{it.count != null && <Text as="span" size="xs" intent="muted"> {it.count}</Text>}</Text>
      </Pressable>
    ))}
  </Box>
);

export default IconMenu;
