import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../primitives/Button';
import { Pressable } from '../../primitives/Pressable';
import { Box } from '../Box';
import { Stack } from '../Stack';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { ShownTitle, useTitleShown } from '../ShownTitle';
import styles from './styles.module.scss';

/** One column of an entity page. A column with a `width` sits at the side; the one without is the middle and grows. */
export interface EntityColumn { id: string; title: React.ReactNode; content: React.ReactNode; width?: string; minWidth?: string; label?: string; closable?: boolean; expandable?: boolean;
  /** A side column that starts folded to its strip (a chat, comments): the middle takes the room until it is opened. */
  folded?: boolean;
  /** The column stays in view under the header while the page scrolls by its neighbours (a profile's feed); it
   *  scrolls inside itself, with no scroll bar of its own. */
  stick?: boolean }

export type EntityLayoutProps = {
  title: React.ReactNode;
  sub?: React.ReactNode;
  columns: EntityColumn[];
  /** The last column (a chat) stays in view beside the others, its own overflow hidden. */
  stickLast?: boolean;
  /** What lies under the whole page (a blurred picture). */
  backdrop?: React.ReactNode;
};

const ColumnHead: React.FC<{ title: React.ReactNode; fold?: { side: 'left' | 'right'; label: string; onFold: () => void } }> = ({ title, fold }) => {
  const shown = useTitleShown(title);
  if (shown && !fold) return null;
  const Icon = fold?.side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <Box className={styles.colHead}>
      {!shown && (typeof title === 'string' ? <Text weight="semibold">{title}</Text> : title)}
      {fold && <Button variant="glass" size="sm" className={styles.fold} icon={<Icon size={16} />} aria-label={fold.label} title={fold.label} onClick={fold.onFold} />}
    </Box>
  );
};

/**
 * EntityLayout: the page an entity opens on, in every app. Its title over glass columns that share the page's width:
 * side columns by their widths, and on a desktop the middle as wide as the screen is tall, so the square picture in it
 * fits the screen. A title is never said twice: a column or section header that would repeat the page's title (or its
 * column's) is left out (ShownTitle). Every side column folds: a glass button in its head slides it in to a strip
 * with its name, the middle takes the room, and a click on the strip slides it back (a column can start `folded`).
 */
export const EntityLayout: React.FC<EntityLayoutProps> = ({ title, sub, columns, stickLast, backdrop }) => {
  // The columns share the page's width in proportion to their widths (a side column's rem as its weight, the middle
  // half again the widest side), never under 12rem, so a docked sidebar narrows them instead of pushing them sideways.
  const weight = (w?: string) => parseFloat(w ?? '') || 0;
  // The middle is half again the widest side, and never narrower than both sides together (a feed between two columns).
  const middle = Math.max(Math.max(...columns.map((c) => weight(c.width)), 20) * 1.5, columns.reduce((n, c) => n + weight(c.width), 0));
  const [folded, setFolded] = useState<Record<string, boolean>>(() => Object.fromEntries(columns.map((c) => [c.id, !!c.folded])));
  const isFolded = (c: EntityColumn) => !!c.width && !!folded[c.id];
  const anyFolded = columns.some(isFolded);
  const nameOf = (c: EntityColumn) => c.label ?? (typeof c.title === 'string' ? c.title : c.id);
  // On a desktop the middle takes --pui-entity-middle (styles): as wide as the screen is tall, so it is square.
  // A folded side column is a strip; with one folded, the middle takes all the room it leaves (no longer kept square).
  const template = columns.map((c) => isFolded(c) ? 'var(--pui-entity-strip)' : c.width ? `minmax(12rem, ${weight(c.width)}fr)`
    : anyFolded ? `minmax(${c.minWidth ?? '16rem'}, ${middle * 2}fr)` : `var(--pui-entity-middle, minmax(${c.minWidth ?? '16rem'}, ${middle}fr))`).join(' ');
  // The middle column (no width) comes first on a narrow page (styles).
  const side = (c: EntityColumn) => (!c.width ? styles.middle : '');
  return (
    <Box className={styles.page}>
      {backdrop}
      <Stack direction="row" gap={3} align="end" wrap className={styles.head}>
        <Title level={1} className={styles.title}>{title}</Title>
        {sub && <Text intent="secondary" className={styles.sub}>{sub}</Text>}
      </Stack>
      <ShownTitle title={title}>
        <Box className={styles.grid} style={{ '--pui-entity-cols': template } as React.CSSProperties}>
          {columns.map((c, i) => {
            const sideOf: 'left' | 'right' = columns.findIndex((x) => !x.width) > i ? 'left' : 'right';
            if (isFolded(c)) return (
              <Pressable key={c.id} className={[styles.col, styles.strip, 'phi-layers'].join(' ')} aria-label={nameOf(c)} aria-expanded={false} onClick={() => setFolded({ ...folded, [c.id]: false })}>
                <span className="pui-label-icon" aria-hidden="true">{sideOf === 'left' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</span><Text as="span" size="sm" weight="semibold" className={styles.stripName}>{nameOf(c)}</Text>
              </Pressable>);
            return (
            <Box as="section" key={c.id} aria-label={nameOf(c)}
              className={[styles.col, 'phi-layers', side(c), stickLast && i === columns.length - 1 ? styles.stick : '', c.stick ? styles.hold : ''].join(' ')}>
              <ColumnHead title={c.title} fold={c.width ? { side: sideOf, label: nameOf(c), onFold: () => setFolded({ ...folded, [c.id]: true }) } : undefined} />
              <ShownTitle title={c.title}><Box className={styles.colBody}>{c.content}</Box></ShownTitle>
            </Box>);
          })}
        </Box>
      </ShownTitle>
    </Box>
  );
};
