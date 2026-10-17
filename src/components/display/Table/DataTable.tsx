import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td } from './index';
import { Skeleton } from '../../feedback/Skeleton';
import { Button } from '../../primitives/Button';
import { Box } from '../../layout/Box';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';
import { EmptyState } from '../../feedback/EmptyState';

export interface DataTableColumn<T> {
  /** Stable key, also used as the React key for the cell. */
  id: string;
  header: React.ReactNode;
  /** Render the cell for a row. Return a primitive or any node. */
  cell: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Fixed column width, e.g. `12rem`. */
  width?: string;
  /** Makes the header sortable (click: ascending, again: descending): the value to compare for a row. */
  sortValue?: (row: T) => number | string | undefined;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getKey: (row: T, index: number) => React.Key;
  loading?: boolean;
  skeletonRows?: number;
  empty?: { title: string; description?: string; action?: React.ReactNode };
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  caption?: string;
  /** Initial sort: a column id and direction. */
  defaultSort?: { id: string; dir: 'asc' | 'desc' };
  /** Keep the header row in view while the rows scroll under it. */
  stickyHeader?: boolean;
  /** Keep the first column in view while the table scrolls sideways (the item's name, the event). */
  stickyFirst?: boolean;
  /** Scroll the rows inside this height (any CSS length) instead of growing the page. */
  maxHeight?: string;
  /** Show this many rows, with a Show all / Show fewer toggle for the rest. */
  limit?: number;
  /** Labels for the limit toggle. */
  moreLabel?: (total: number) => string;
  lessLabel?: string;
  /** Section the rows: each group gets a header row (label · count) that expands and collapses. */
  groupBy?: (row: T) => string;
  /** Groups that start collapsed. */
  collapsed?: string[];
}

/**
 * A column-driven table.
 *
 * `Table` and its parts remain available for bespoke markup, but almost every
 * table in an app is a list of records with a fixed set of columns — declaring
 * those columns once is shorter than hand-writing `Thead`/`Tbody` and keeps the
 * header and the cells from drifting out of alignment. Loading and empty states
 * are handled here for the same reason they are in `Collection`.
 */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  loading = false,
  skeletonRows = 4,
  empty,
  onRowClick,
  className,
  caption,
  defaultSort,
  stickyHeader = false,
  stickyFirst = false,
  maxHeight,
  limit,
  moreLabel = (n) => `Show all ${n}`,
  lessLabel = 'Show fewer',
  groupBy,
  collapsed = [],
}: DataTableProps<T>) {
  const [all, setAll] = React.useState(false);
  const [shut, setShut] = React.useState<Record<string, boolean>>(() => Object.fromEntries(collapsed.map((g) => [g, true])));
  const [sort, setSort] = React.useState<{ id: string; dir: 'asc' | 'desc' } | undefined>(defaultSort);
  const sorter = sort && columns.find((c) => c.id === sort.id)?.sortValue;
  const shown = sorter ? [...rows].sort((a, b) => {
    const x = sorter(a), y = sorter(b); const d = x == null ? 1 : y == null ? -1 : typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return sort!.dir === 'asc' ? d : -d;
  }) : rows;
  const toggle = (id: string) => setSort((cur) => (cur?.id === id ? { id, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: 'asc' }));
  // Groups keep the order the (sorted) rows first meet them in; the limit does not apply inside groups.
  const groups = groupBy ? shown.reduce<{ key: string; rows: T[] }[]>((acc, r) => { const k = groupBy(r); const g = acc.find((x) => x.key === k); if (g) g.rows.push(r); else acc.push({ key: k, rows: [r] }); return acc; }, []) : null;
  const visible = !groups && limit && !all ? shown.slice(0, limit) : shown;
  const scrolls = stickyHeader || stickyFirst || !!maxHeight;
  if (!loading && rows.length === 0 && empty) {
    return <EmptyState title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <>
    <Box className={cn(scrolls && styles.scroller)} style={maxHeight ? { maxHeight } : undefined}>
    <Table className={cn(className, scrolls && styles.sticky, stickyHeader && styles.stickyHead, stickyFirst && styles.stickyFirst)}>
      {caption && <caption>{caption}</caption>}
      <Thead>
        <Tr>
          {columns.map((col) => (
            <Th key={col.id} style={{ textAlign: col.align, width: col.width, cursor: col.sortValue ? 'pointer' : undefined, userSelect: col.sortValue ? 'none' : undefined, whiteSpace: 'nowrap' }} scope="col"
              aria-sort={sort?.id === col.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : col.sortValue ? 'none' : undefined}
              onClick={col.sortValue ? () => toggle(col.id) : undefined}>
              {col.header}{col.sortValue && <span aria-hidden="true" style={{ opacity: sort?.id === col.id ? 1 : 0.35, marginLeft: '0.3em' }}>{sort?.id === col.id ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {loading
          ? Array.from({ length: skeletonRows }).map((_, r) => (
              <Tr key={r} data-skeleton="true" aria-hidden="true">
                {columns.map((col) => (
                  <Td key={col.id}>
                    <Skeleton height="0.875rem" />
                  </Td>
                ))}
              </Tr>
            ))
          : groups ? groups.flatMap((g) => [
              <Tr key={'g:' + g.key} className={styles.groupRow}>
                <Td colSpan={columns.length} className={styles.groupCell}>
                  <Button variant="ghost" size="sm" aria-expanded={!shut[g.key]} onClick={() => setShut((x) => ({ ...x, [g.key]: !x[g.key] }))}>
                    {(shut[g.key] ? '▸ ' : '▾ ') + g.key + ' · ' + g.rows.length}
                  </Button>
                </Td>
              </Tr>,
              ...(shut[g.key] ? [] : g.rows.map((row, i) => (
                <Tr key={getKey(row, i)} onClick={onRowClick ? () => onRowClick(row, i) : undefined} data-clickable={onRowClick ? 'true' : undefined}>
                  {columns.map((col) => (
                    <Td key={col.id} style={{ textAlign: col.align, whiteSpace: col.align === 'right' ? 'nowrap' : undefined }}>{col.cell(row, i)}</Td>
                  ))}
                </Tr>
              ))),
            ])
          : visible.map((row, i) => (
              <Tr
                key={getKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                data-clickable={onRowClick ? 'true' : undefined}
              >
                {columns.map((col) => (
                  <Td key={col.id} style={{ textAlign: col.align, whiteSpace: col.align === 'right' ? 'nowrap' : undefined }}>
                    {col.cell(row, i)}
                  </Td>
                ))}
              </Tr>
            ))}
      </Tbody>
    </Table>
    </Box>
    {!groups && limit && shown.length > limit && (
      <Box className={styles.more}><Button variant="ghost" size="sm" onClick={() => setAll(!all)}>{all ? lessLabel : moreLabel(shown.length)}</Button></Box>
    )}
    </>
  );
}
