import React from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

export type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  className?: string;
  children?: React.ReactNode;
  /**
   * Header cells. Supplying `headers`/`rows` renders a simple table without
   * hand-writing `Thead`/`Tbody` — the shape most tables actually are. Pass
   * `children` instead when a table needs bespoke markup, and
   * {@link DataTable} when it is a list of records with typed columns.
   */
  headers?: React.ReactNode[];
  rows?: React.ReactNode[][];
  /** Make each shorthand row a control: called with the row index on click or Enter. */
  onRow?: (index: number) => void;
};

export const Table = ({ className = '', children, headers, rows, onRow, ...props }: TableProps) => {
  const shorthand = Boolean(headers || rows);

  return (
    <table className={cn(styles.table, className)} {...props}>
      {shorthand ? (
        <>
          {headers && (
            <Thead>
              <Tr>
                {headers.map((h, i) => (
                  <Th key={i} scope="col">{h}</Th>
                ))}
              </Tr>
            </Thead>
          )}
          {rows && (
            <Tbody>
              {rows.map((row, r) => (
                <Tr key={r} {...(onRow ? { onClick: () => onRow(r), role: 'button', tabIndex: 0, className: styles.clickable, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRow(r); } } } : {})}>
                  {row.map((cell, c) => (
                    <Td key={c}>{cell}</Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          )}
        </>
      ) : (
        children
      )}
    </table>
  );
};

export const Thead = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn(styles.thead, className)} {...props}>{children}</thead>
);

export const Tbody = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn(styles.tbody, className)} {...props}>{children}</tbody>
);

export const Tr = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn(styles.tr, className)} {...props}>{children}</tr>
);

export const Th = ({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
  <th className={cn(styles.th, className)} {...props}>{children}</th>
);

/** A cell; `intent` colours its text (a gain, a loss), `numeric` sets tabular figures and aligns it right. */
export const Td = ({ className = '', children, intent, numeric = false, ...props }: React.TdHTMLAttributes<HTMLTableDataCellElement> & { intent?: 'muted' | 'secondary' | 'primary' | 'success' | 'warning' | 'danger'; numeric?: boolean }) => (
  <td className={cn(styles.td, intent && styles[`intent-${intent}`], numeric && styles.numeric, className)} {...props}>{children}</td>
);
