import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { Card } from '../card';
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
 * own record, so the data can be walked in any direction. All of them share one even grid of bank cards (1.586 to 1),
 * each the same width, each the kit's own Card (the theme's radius and surface, tinted by its record's colour): its
 * picture at the top left, its relation at the top right, its name and line at the bottom. A relation with more than
 * `max` ends in a glass card that shows the rest.
 */
export const RelationList = ({ title, groups, max = 6, showAllLabel = (n) => `Show all ${n}`, showLessLabel = 'Show less', emptyLabel, className }: RelationListProps) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const visible = groups.filter((g) => g.items.length > 0);
  return (
    <Box as="section" className={cn(styles.root, className)} data-gradient-child>
      {title && <Title level={4} size="md" className={styles.title}>{title}</Title>}
      {visible.length === 0 && emptyLabel && <Text size="sm" variant="muted">{emptyLabel}</Text>}
      {visible.length > 0 && (
        <Box className={styles.items}>
          {visible.flatMap((g) => {
            const all = !!open[g.id];
            const items = all ? g.items : g.items.slice(0, max);
            const cards = items.map((it) => (
              <Card key={g.id + ':' + it.id} padding="sm" hoverable={!!it.onClick} className={cn(styles.item, it.onClick && styles.click)} onClick={it.onClick}
                role={it.onClick ? 'button' : undefined} tabIndex={it.onClick ? 0 : undefined}
                onKeyDown={it.onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.onClick?.(); } } : undefined}>
                <Box as="span" className={styles.top}>
                  {it.media && <Box as="span" className={styles.media}>{it.media}</Box>}
                  <Text as="span" size="xs" variant="muted" className={styles.kind}>{g.label}</Text>
                </Box>
                <Box as="span" className={styles.text}>
                  <Text size="sm" weight="medium" className={styles.label}>{it.label}</Text>
                  {it.sub && <Text size="xs" variant="muted" className={styles.label}>{it.sub}</Text>}
                </Box>
              </Card>
            ));
            if (g.items.length > max) cards.push(
              <Box key={g.id + ':more'} as="button" className={cn(styles.item, styles.click, styles.more)} onClick={() => setOpen({ ...open, [g.id]: !all })} aria-expanded={all}>
                <Text as="span" size="xs" variant="muted" className={styles.kind}>{g.label}{g.kind && g.kind !== g.label ? <> · {g.kind}</> : null}</Text>
                <Text size="sm" weight="bold">{all ? showLessLabel : showAllLabel(g.items.length)}</Text>
              </Box>,
            );
            return cards;
          })}
        </Box>
      )}
    </Box>
  );
};
