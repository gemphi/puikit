import React, { useState } from 'react';
import { GalleryHorizontal, LayoutGrid } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { Card } from '../card';
import { Picture } from '../../media/Picture';
import styles from './styles.module.scss';

export type RelationItem = {
  id: string;
  label: React.ReactNode;
  sub?: React.ReactNode;
  /** The record's picture (a URL, or a node such as a sprite cell): fills the top of its card, centred. */
  image?: string | React.ReactNode;
  /** Avatar or glyph: the card's face when it has no picture. */
  media?: React.ReactNode;
  onClick?: () => void;
};

export type RelationGroup = {
  /** Relation name, e.g. "Worlds", "Founder", "Shots". */
  id: string;
  label: React.ReactNode;
  /** What the related records are, when the relation's name does not say it (shown after the name). */
  kind?: React.ReactNode;
  /** The relation's glyph, before its name. */
  icon?: React.ReactNode;
  /** The shape of its cards' pictures (a person tall, a world wide, a post 4/5); default 4/3. */
  ratio?: string;
  /** How this relation starts (grid or slider), over the list's own default. */
  layout?: RelationLayout;
  items: RelationItem[];
};

export type RelationLayout = 'grid' | 'slider';

export type RelationListProps = {
  title?: React.ReactNode;
  groups: RelationGroup[];
  /** Cards a relation shows in its grid before "Show all" (one row of three by default). */
  max?: number;
  /** How every relation starts: an even grid three across, or a slider of three at a time. */
  layout?: RelationLayout;
  showAllLabel?: (n: number) => React.ReactNode;
  showLessLabel?: React.ReactNode;
  emptyLabel?: React.ReactNode;
  labels?: { grid?: string; slider?: string };
  className?: string;
};

const Item = ({ it }: { it: RelationItem }) => (
  <Card flush hoverable={!!it.onClick} className={cn(styles.item, it.onClick && styles.click)} onClick={it.onClick}
    role={it.onClick ? 'button' : undefined} tabIndex={it.onClick ? 0 : undefined}
    onKeyDown={it.onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.onClick?.(); } } : undefined}>
    <Box as="span" className={cn(styles.picture, !it.image && styles.face)}>
      {typeof it.image === 'string' ? <Picture src={it.image} /> : it.image ? <Box as="span" className={styles.fill}>{it.image}</Box> : it.media && <Box as="span" className={styles.glyph}>{it.media}</Box>}
    </Box>
    <Box as="span" className={styles.glass} aria-hidden="true" />
    <Box as="span" className={styles.text}>
      <Text size="sm" weight="medium" className={styles.label}>{it.label}</Text>
      {it.sub && <Text size="xs" variant="muted" className={styles.label}>{it.sub}</Text>}
    </Box>
  </Card>
);

/**
 * The records a record links to, and the records that link to it: one row per relation, never one heap. Each
 * relation has its own heading (a relation of one record joins a strip of small cards instead) (its glyph, its name, how many) with its layout icons and "Show all" on the right,
 * clear of the edge; its records are picture-first cards three across, as an even grid or a slider. Each card opens
 * its own record, so the data can be walked in any direction.
 */
export const RelationList = ({ title, groups, max = 3, layout = 'grid', showAllLabel = (n) => `Show all ${n}`, showLessLabel = 'Show less', emptyLabel, labels = {}, className }: RelationListProps) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [shape, setShape] = useState<Record<string, RelationLayout>>({});
  const visible = groups.filter((g) => g.items.length > 1);
  // A relation of one record is no grid: every such record joins one strip of small cards (By, Club, World …).
  const ones = groups.filter((g) => g.items.length === 1);
  return (
    <Box as="section" className={cn(styles.root, className)}>
      {title && <Box className="phi-region"><Title level={4} size="md" className={styles.title}>{title}</Title></Box>}
      {visible.length === 0 && ones.length === 0 && emptyLabel && <Text size="sm" variant="muted">{emptyLabel}</Text>}
      {ones.length > 0 && (
        <Box className={styles.strip}>{ones.map((g) => { const it = g.items[0]; return (
          <Card key={g.id + ':' + it.id} flush hoverable={!!it.onClick} className={cn(styles.one, it.onClick && styles.click)} onClick={it.onClick}
            role={it.onClick ? 'button' : undefined} tabIndex={it.onClick ? 0 : undefined}
            onKeyDown={it.onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.onClick?.(); } } : undefined}>
            <Box as="span" className={styles.oneArt}>{typeof it.image === 'string' ? <img src={it.image} alt="" loading="lazy" /> : it.image ?? it.media}</Box>
            <Box as="span" className={styles.oneText}>
              <Text as="span" size="xs" variant="muted" className={styles.label}>{g.icon}{g.label}</Text>
              <Text as="span" size="sm" weight="medium" className={styles.label}>{it.label}</Text>
            </Box>
          </Card>); })}</Box>
      )}
      {visible.map((g) => {
        const all = !!open[g.id]; const how = shape[g.id] ?? g.layout ?? layout;
        const items = how === 'slider' || all ? g.items : g.items.slice(0, max);
        const pick = (to: RelationLayout, I: typeof LayoutGrid, label: string) => (
          <Button variant="icon" aria-label={label} title={label} aria-pressed={how === to} onClick={() => setShape({ ...shape, [g.id]: to })}><I size={16} /></Button>
        );
        return (
          <Box key={g.id} className={styles.group}>
            <Box className={styles.head}>
              <Box as="span" className={styles.name}>
                {g.icon != null && <span className="pui-label-icon" aria-hidden="true">{g.icon}</span>}
                <Text as="span" size="sm" weight="semibold">{g.label}{g.kind && g.kind !== g.label ? <Text as="span" size="sm" variant="muted"> · {g.kind}</Text> : null}</Text>
                <Text as="span" size="xs" variant="muted">{g.items.length}</Text>
              </Box>
              <Box as="span" className={styles.tools}>
                {g.items.length > 3 && <>{pick('grid', LayoutGrid, labels.grid ?? 'Grid')}{pick('slider', GalleryHorizontal, labels.slider ?? 'Slider')}</>}
                {how === 'grid' && g.items.length > max && <Button variant="glass" aria-expanded={all} onClick={() => setOpen({ ...open, [g.id]: !all })}>{all ? showLessLabel : showAllLabel(g.items.length)}</Button>}
              </Box>
            </Box>
            <Box className={how === 'slider' ? styles.slider : styles.grid} style={g.ratio ? ({ '--pui-rel-ratio': g.ratio } as React.CSSProperties) : undefined}>{items.map((it) => <Item key={g.id + ':' + it.id} it={it} />)}</Box>
          </Box>
        );
      })}
    </Box>
  );
};
