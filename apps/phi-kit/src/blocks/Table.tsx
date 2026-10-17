import { Box, Table as PuiTable } from '@pui/components';
import React from 'react';
import type { Block } from '../data';
import s from '../kit.module.scss';

/** A table block. When rows carry record routes (`b.routes`), each row is a link to that record's sheet. */
export const Table: React.FC<{ b: Block; onRoute?: (hash: string) => void }> = ({ b, onRoute }) => (
  <Box surface="panel" padding={0} scroll="x">
    <PuiTable className={s.table} headers={b.cols || []} rows={b.rows || []}
      onRow={b.routes && onRoute ? (i: number) => onRoute(b.routes[i]) : undefined} />
  </Box>
);
