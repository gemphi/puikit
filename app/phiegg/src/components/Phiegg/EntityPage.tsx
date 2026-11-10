import React from 'react';
import { Box, Stack, Text, Title } from '@pui/components';
import { Backdrop } from '@pui/components';
import { usePageTheme } from '../../lib/pageTheme';
import styles from './EntityPage.module.scss';

/** One column of an entity page. A column with a `width` sits at the side; the one without is the middle and grows. */
export interface EntityColumn { id: string; title: React.ReactNode; content: React.ReactNode; width?: string; minWidth?: string; label?: string; closable?: boolean; expandable?: boolean }

/**
 * The page a look, an asset, a title or a place opens on. Every entity click lands here, a new page with its own
 * address; only what you do inside it (swap, cart, comments, a person) slides in as a panel.
 *
 * The entity's picture lies under the whole app, blurred to its colour (Backdrop), and every column above is glass.
 * The columns flow in the content's one scroll; the last column, when `stickLast`, stays in view beside them (the
 * chat), its own overflow hidden rather than a second scroll bar.
 */
export const EntityPage: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; picture?: React.ReactNode; columns: EntityColumn[]; stickLast?: boolean; wear?: string }> = ({ title, sub, picture, columns, stickLast, wear }) => {
  // `wear`: a colour the whole app takes while the page is open, for an entity with no theme of its own to set.
  usePageTheme(wear, undefined, 'vivid', 'entity');
  // The columns share the page's width in proportion to their widths (a side column's rem as its weight, the middle
  // half again the widest side), never under 12rem, so a docked sidebar narrows them instead of pushing them sideways.
  const weight = (w?: string) => parseFloat(w ?? '') || 0;
  const middle = Math.max(...columns.map((c) => weight(c.width)), 20) * 1.5;
  const template = columns.map((c) => `minmax(${c.width ? '12rem' : c.minWidth ?? '16rem'}, ${c.width ? weight(c.width) : middle}fr)`).join(' ');
  // A column with a width before the middle one is the left column; one after it is the right column.
  const mid = columns.findIndex((c) => !c.width);
  const side = (c: EntityColumn, i: number) => (!c.width ? styles.middle : i < mid ? styles.left : styles.right);
  return (
    <Box className={styles.page}>
      {picture && <Backdrop>{picture}</Backdrop>}
      <Stack direction="row" gap={3} align="end" wrap className={styles.head}>
        <Title level={1} className={styles.title}>{title}</Title>
        {sub && <Text intent="secondary" className={styles.sub}>{sub}</Text>}
      </Stack>
      <Box className={styles.grid} style={{ '--ph-cols': template } as React.CSSProperties}>
        {columns.map((c, i) => (
          <Box as="section" key={c.id} aria-label={c.label ?? (typeof c.title === 'string' ? c.title : c.id)}
            className={[styles.col, side(c, i), stickLast && i === columns.length - 1 ? styles.stick : ''].join(' ')}>
            <Box className={styles.colHead}>{typeof c.title === 'string' ? <Text weight="semibold">{c.title}</Text> : c.title}</Box>
            <Box className={styles.colBody}>{c.content}</Box>
          </Box>))}
      </Box>
    </Box>
  );
};
