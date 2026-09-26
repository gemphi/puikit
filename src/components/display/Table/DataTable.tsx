import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td } from './index';
import { Skeleton } from '../../feedback/Skeleton';
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
}: DataTableProps<T>) {
  if (!loading && rows.length === 0 && empty) {
    return <EmptyState title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <Table className={className}>
      {caption && <caption>{caption}</caption>}
      <Thead>
        <Tr>
          {columns.map((col) => (
            <Th key={col.id} style={{ textAlign: col.align, width: col.width }} scope="col">
              {col.header}
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
          : rows.map((row, i) => (
              <Tr
                key={getKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                data-clickable={onRowClick ? 'true' : undefined}
              >
                {columns.map((col) => (
                  <Td key={col.id} style={{ textAlign: col.align }}>
                    {col.cell(row, i)}
                  </Td>
                ))}
              </Tr>
            ))}
      </Tbody>
    </Table>
  );
}
