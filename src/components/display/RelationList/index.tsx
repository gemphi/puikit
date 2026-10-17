import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import styles from './styles.module.scss';

export type RelationItem = {
  id: string;
  label: React.ReactNode;
  sub?: React.ReactNode;
  /** Thumbnail, avatar or glyph. */
  media?: React.ReactNode;
  onClick?: () => void;
};

export type RelationGroup = {
  /** Relation name, e.g. "Worlds", "Founder", "Shots". */
  id: string;
  label: React.ReactNode;
  /** What the related records are (shown as a muted kind tag). */
  kind?: React.ReactNode;
  items: RelationItem[];
};

export type RelationListProps = {
  title?: React.ReactNode;
  groups: RelationGroup[];
  /** Items shown per group before "Show all". */
  max?: number;
  showAllLabel?: (n: number) => React.ReactNode;
  showLessLabel?: React.ReactNode;
  emptyLabel?: React.ReactNode;
  className?: string;
};

/**
 * The records a record links to, and the records that link to it, grouped by relation. Each item opens its
 * own record, so the data can be walked in any direction.
 */
export const RelationList = ({ title, groups, max = 6, showAllLabel = (n) => `Show all ${n}`, showLessLabel = 'Show less', emptyLabel, className }: RelationListProps) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const visible = groups.filter((g) => g.items.length > 0);
  return (
    <Box as="section" className={cn(styles.root, className)} data-gradient-child>
      {title && <Title level={4} size="md" className={styles.title}>{title}</Title>}
      {visible.length === 0 && emptyLabel && <Text size="sm" variant="muted">{emptyLabel}</Text>}
      {visible.map((g) => {
        const all = !!open[g.id];
        const items = all ? g.items : g.items.slice(0, max);
        return (
          <Box key={g.id} className={styles.group} role="group" aria-label={typeof g.label === 'string' ? g.label : undefined}>
            <Box className={styles.head}>
              <Text size="xs" weight="bold" className={styles.rel}>{g.label}</Text>
              <Text size="xs" variant="muted">{g.kind ? <>{g.kind} · </> : null}{g.items.length}</Text>
            </Box>
            <Box className={styles.items}>
              {items.map((it) => (
                <Box key={it.id} as={it.onClick ? 'button' : 'span'} className={cn(styles.item, it.onClick && styles.click)} onClick={it.onClick} data-gradient-grandchild>
                  {it.media && <Box as="span" className={styles.media}>{it.media}</Box>}
                  <Box as="span" className={styles.text}>
                    <Text size="sm" weight="medium" className={styles.label}>{it.label}</Text>
                    {it.sub && <Text size="xs" variant="muted" className={styles.label}>{it.sub}</Text>}
                  </Box>
                </Box>
              ))}
              {g.items.length > max && (
                <Box as="button" className={cn(styles.item, styles.click, styles.more)} onClick={() => setOpen({ ...open, [g.id]: !all })} aria-expanded={all}>
                  <Text size="xs" weight="bold">{all ? showLessLabel : showAllLabel(g.items.length)}</Text>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
