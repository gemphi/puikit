import { Box, DataTable, Input, Stack, TabList, Table as PuiTable } from '@pui/components';
import React from 'react';
import type { Block } from '../data';

/**
 * A table block. When rows carry record routes (`b.routes`), each row is a link to that record's sheet.
 * With `b.columns` it is the kit DataTable over the records in `b.items` (typed, sortable columns): `getKey`, `sort`
 * (the first sort), `empty`, `loading`, `group` (section the rows) and `onRow` are handed on. A filter row sits above
 * either kind when the block names one: `b.tabs` ({ items, activeId, onChange, label }) and `b.search`
 * ({ value, onChange, placeholder }).
 */
export const Table: React.FC<{ b: Block; onRoute?: (hash: string) => void }> = ({ b, onRoute }) => {
  const table = (
    <Box surface="panel" padding={0} scroll="x">
      {b.columns
        ? <DataTable columns={b.columns} rows={b.items || []} getKey={b.getKey ?? ((_: unknown, i: number) => i)} defaultSort={b.sort}
            empty={b.empty} loading={b.loading} groupBy={b.group} onRowClick={b.onRow} />
        : <PuiTable headers={b.cols || []} rows={b.rows || []}
            onRow={b.routes && onRoute ? (i: number) => onRoute(b.routes[i]) : undefined} />}
    </Box>
  );
  if (!b.tabs && !b.search) return table;
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={2} align="center" wrap>
        {b.tabs ? <TabList size="sm" variant="pills" aria-label={b.tabs.label} activeId={b.tabs.activeId} onChange={(id) => b.tabs.onChange(String(id))} items={b.tabs.items} /> : null}
        {b.search ? <Input value={b.search.value} onChange={(e) => b.search.onChange(e.target.value)} placeholder={b.search.placeholder} aria-label={b.search.placeholder} width="18rem" /> : null}
      </Stack>
      {table}
    </Stack>
  );
};
