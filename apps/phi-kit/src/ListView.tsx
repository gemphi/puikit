import React from 'react';
import { Box, Button, DataTable, FacetFilters, FilterLayout, Rows, Stack, Text, ViewToolbar, facetsOf, matchFacets, type DataTableColumn, type ViewMode } from '@pui/components';

export type ListFacet<T> = { id: string; label: string; get: (r: T) => string | undefined };
export type ListSort<T> = { id: string; label: string; by: (a: T, b: T) => number };

export type ListViewProps<T> = {
  rows: T[]; keyOf: (r: T) => string;
  /** The text the search matches. */
  text?: (r: T) => string;
  facets?: ListFacet<T>[]; sorts?: ListSort<T>[];
  /** One card (tile and grid). */
  render?: (r: T) => React.ReactNode;
  /** Columns for list mode (a table sortable by its headings); without them list mode is one card a row. */
  table?: DataTableColumn<T>[];
  onRow?: (r: T) => void;
  /** Start in this mode (default list when there is a table, else grid). */
  mode?: ViewMode;
  /** Cards a row in grid mode, and the narrowest a card may get. */
  cols?: number; minItemWidth?: string;
  /** Rows a page (Previous and Next under the list). */
  pageSize?: number;
  empty?: string;
  /** Counted thing, e.g. "items", "link types". */
  noun?: string;
};

/**
 * Every list in a phi-kit app: the view toolbar (tile, list, grid), Filter & sort as a drawer from the right built
 * from the rows' own fields (facets), search and sorts, then the cards or a sortable table. The same as Phiegg's
 * lists, without a store, so any app can use it.
 */
export function ListView<T>({ rows, keyOf, text, facets = [], sorts = [], render, table, onRow, mode: start, cols = 4, minItemWidth = '15rem', pageSize, empty = 'Nothing matches.', noun = 'items' }: ListViewProps<T>) {
  // Phones start on cards: a table of many columns reads badly at 390px (it still scrolls sideways if chosen).
  const narrow = typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 640px)').matches;
  const [mode, setMode] = React.useState<ViewMode>(start ?? (table && (!narrow || !render) ? 'list' : 'grid'));
  const [perView, setPerView] = React.useState(2);
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState(sorts[0]?.id ?? '');
  const [page, setPage] = React.useState(0);
  React.useEffect(() => { setPage(0); }, [rows, q, sel, sort]);
  const ql = q.trim().toLowerCase();
  const by = sorts.find((x) => x.id === sort)?.by;
  const shown = rows.filter((r) => (!ql || !text || text(r).toLowerCase().includes(ql)) && matchFacets(r, facets, sel));
  if (by) shown.sort(by);
  const pages = pageSize ? Math.max(1, Math.ceil(shown.length / pageSize)) : 1;
  const cur = Math.min(page, pages - 1);
  const slice = pageSize ? shown.slice(cur * pageSize, cur * pageSize + pageSize) : shown;
  const active = Object.values(sel).filter(Boolean).length + (ql ? 1 : 0);
  const tableOf = () => <Box scroll="x"><DataTable rows={slice} getKey={(r) => keyOf(r)} columns={table!} onRowClick={onRow ? (r) => onRow(r) : undefined} /></Box>;
  const cards = (n: number, min?: string) => <Rows cols={n} colsSm={Math.min(n, 2)} minItemWidth={min}>{slice.map((r) => <React.Fragment key={keyOf(r)}>{render ? render(r) : null}</React.Fragment>)}</Rows>;
  return (
    <Stack direction="column" gap={3}>
      <ViewToolbar mode={mode} onMode={setMode} perView={perView} onPerView={setPerView} count={`${shown.length.toLocaleString('en-US')} ${noun}`}
        onFilters={() => setOpen(!open)} filtersOpen={open} activeFilters={active} />
      <FilterLayout open={open} onClose={() => setOpen(false)}
        filters={<FacetFilters facets={facetsOf(rows, facets)} selected={sel} onSelect={(f, o) => setSel((x) => ({ ...x, [f]: o ?? '' }))}
          search={text ? q : undefined} onSearch={text ? setQ : undefined} sorts={sorts.map((x) => ({ id: x.id, label: x.label }))} sort={sort} onSort={setSort}
          labels={{ search: 'Search', sort: 'Sort', all: 'All', clear: 'Clear' }} />}>
        {shown.length === 0 ? <Text intent="muted">{empty}</Text>
          : mode === 'list' && table ? tableOf()
          : !render ? (table ? tableOf() : null)
          : mode === 'tile' ? cards(perView)
          : mode === 'list' ? cards(1)
          : cards(cols, minItemWidth)}
      </FilterLayout>
      {pages > 1 ? (
        <Stack direction="row" gap={2} align="center">
          <Button size="sm" variant="outline" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</Button>
          <Text as="span" size="xs" intent="muted">Page {cur + 1} of {pages}</Text>
          <Button size="sm" variant="outline" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
