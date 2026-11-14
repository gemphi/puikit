import React from 'react';
import { Box } from '../Box';
import { Stack } from '../Stack';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { ShownTitle, useTitleShown } from '../ShownTitle';
import styles from './styles.module.scss';

/** One column of an entity page. A column with a `width` sits at the side; the one without is the middle and grows. */
export interface EntityColumn { id: string; title: React.ReactNode; content: React.ReactNode; width?: string; minWidth?: string; label?: string; closable?: boolean; expandable?: boolean }

export type EntityLayoutProps = {
  title: React.ReactNode;
  sub?: React.ReactNode;
  columns: EntityColumn[];
  /** The last column (a chat) stays in view beside the others, its own overflow hidden. */
  stickLast?: boolean;
  /** What lies under the whole page (a blurred picture). */
  backdrop?: React.ReactNode;
};

const ColumnHead: React.FC<{ title: React.ReactNode }> = ({ title }) =>
  useTitleShown(title) ? null : <Box className={styles.colHead}>{typeof title === 'string' ? <Text weight="semibold">{title}</Text> : title}</Box>;

/**
 * EntityLayout: the page an entity opens on, in every app. Its title over glass columns that share the page's width:
 * side columns by their widths, and on a desktop the middle as wide as the screen is tall, so the square picture in it
 * fits the screen. A title is never said twice: a column or section header that would repeat the page's title (or its
 * column's) is left out (ShownTitle).
 */
export const EntityLayout: React.FC<EntityLayoutProps> = ({ title, sub, columns, stickLast, backdrop }) => {
  // The columns share the page's width in proportion to their widths (a side column's rem as its weight, the middle
  // half again the widest side), never under 12rem, so a docked sidebar narrows them instead of pushing them sideways.
  const weight = (w?: string) => parseFloat(w ?? '') || 0;
  const middle = Math.max(...columns.map((c) => weight(c.width)), 20) * 1.5;
  // On a desktop the middle takes --pui-entity-middle (styles): as wide as the screen is tall, so it is square.
  const template = columns.map((c) => c.width ? `minmax(12rem, ${weight(c.width)}fr)` : `var(--pui-entity-middle, minmax(${c.minWidth ?? '16rem'}, ${middle}fr))`).join(' ');
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
          {columns.map((c, i) => (
            <Box as="section" key={c.id} aria-label={c.label ?? (typeof c.title === 'string' ? c.title : c.id)}
              className={[styles.col, 'phi-layers', side(c), stickLast && i === columns.length - 1 ? styles.stick : ''].join(' ')}>
              <ColumnHead title={c.title} />
              <ShownTitle title={c.title}><Box className={styles.colBody}>{c.content}</Box></ShownTitle>
            </Box>))}
        </Box>
      </ShownTitle>
    </Box>
  );
};
