import React, { useEffect, useState } from 'react';
import { ArrowLeft, Maximize2, Minimize2, MoreHorizontal, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { columnStore, dragWidth, useColumnEntries } from './store';
import styles from './styles.module.scss';

export * from './store';

export type ColumnDef = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  /** CSS width when not expanded, e.g. '18rem'. Omit for the flexible column. */
  width?: string;
  minWidth?: string;
  /** Show a close button. With `onClose` the caller owns closing; otherwise the column leaves the row and comes back
   *  from a menu (columnStore: the shell's right sidebar lists the page's columns). */
  closable?: boolean;
  onClose?: () => void;
  /** Show an expand button: the column takes the whole row (others fold away) and back. */
  expandable?: boolean;
  /** Show a back arrow in the header. */
  onBack?: () => void;
  backLabel?: string;
  /** Extra header controls. */
  actions?: React.ReactNode;
  /** Not rendered at all (caller-controlled visibility). */
  hidden?: boolean;
  /** Name in a menu; defaults to `title` when it is a string. */
  label?: string;
};

export type ColumnsProps = {
  columns: ColumnDef[];
  className?: string;
  expandLabel?: string;
  collapseLabel?: string;
  closeLabel?: string;
  moreLabel?: string;
};

/**
 * A row of columns, each with a header that can go back, expand to the full row and close. Every edge between two
 * columns drags, on any screen, so a column is as wide as it is pulled. A header's actions show while the pointer is
 * over its column (or it holds the focus); on a narrow screen they sit behind three dots. A closed column leaves the
 * row with no strip in its place: it is listed in columnStore, and a menu brings it back.
 */
export const Columns = ({ columns, className, expandLabel = 'Expand', collapseLabel = 'Restore', closeLabel = 'Close', moreLabel = 'More' }: ColumnsProps) => {
  const known = useColumnEntries();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [width, setWidth] = useState<Record<string, number>>({});
  const [more, setMore] = useState<string | null>(null);
  const live = columns.filter((c) => !c.hidden);
  const nameOf = (c: ColumnDef) => c.label ?? (typeof c.title === 'string' ? c.title : c.id);
  // The columns that close on their own are known to the page's menus while this row is on the page.
  const own = live.filter((c) => c.closable && !c.onClose); const ids = own.map((c) => c.id).join('|');
  useEffect(() => { own.forEach((c) => columnStore.add(c.id, nameOf(c))); return () => columnStore.remove(ids.split('|')); }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  const closed = (c: ColumnDef) => !c.onClose && known.find((e) => e.id === c.id)?.open === false;
  const shown = live.filter((c) => !closed(c)).filter((c) => !expanded || c.id === expanded || !live.some((x) => x.id === expanded));
  return (
    <Box className={cn('pui-columns', styles.row, className)} data-expanded={expanded ?? undefined}>
      {shown.map((c, i) => {
        const isExp = expanded === c.id; const px = width[c.id]; const acts = c.actions || c.expandable || c.closable;
        const style = isExp ? { minWidth: c.minWidth } : px ? { width: px, minWidth: 0, flex: '0 0 auto' } : c.width ? { width: c.width, minWidth: c.minWidth ?? `min(${c.width}, 14rem)` } : { minWidth: c.minWidth };
        return (
          <React.Fragment key={c.id}>
            <Box as="section" className={cn(styles.col, 'phi-region', !c.width && !px && styles.flex, isExp && styles.exp)} style={style} aria-label={typeof c.title === 'string' ? c.title : c.label}>
              <Box className={styles.head}>
                {c.onBack && <Button variant="icon" onClick={c.onBack} aria-label={c.backLabel ?? 'Back'}><ArrowLeft size={16} /></Button>}
                <Box className={styles.title}>{typeof c.title === 'string' ? <Text size="sm" weight="semibold">{c.title}</Text> : c.title}</Box>
                {acts && <Button variant="icon" className={styles.dots} aria-label={moreLabel} aria-expanded={more === c.id} onClick={() => setMore(more === c.id ? null : c.id)}><MoreHorizontal size={16} /></Button>}
                <Box className={cn(styles.acts, more === c.id && styles.actsOpen)}>
                  {c.actions}
                  {c.expandable && (
                    <Button variant="icon" onClick={() => setExpanded(isExp ? null : c.id)} aria-label={isExp ? collapseLabel : expandLabel} aria-pressed={isExp}>
                      {isExp ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    </Button>
                  )}
                  {c.closable && (
                    <Button variant="icon" onClick={() => { if (isExp) setExpanded(null); if (c.onClose) c.onClose(); else columnStore.set(c.id, false); }} aria-label={closeLabel}>
                      <X size={16} />
                    </Button>
                  )}
                </Box>
              </Box>
              <Box className={styles.body}>{c.content}</Box>
            </Box>
            {i < shown.length - 1 && !expanded && (
              <Box role="separator" aria-orientation="vertical" className={styles.grip}
                onPointerDown={(e: React.PointerEvent) => { const el = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null; if (el) dragWidth(e, el.getBoundingClientRect().width, 1, (w) => setWidth((x) => ({ ...x, [c.id]: w }))); }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};
