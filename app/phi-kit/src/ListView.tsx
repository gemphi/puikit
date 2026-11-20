import React from 'react';
import { Box, Button, DataTable, FacetFilters, FilterLayout, Rows, Stack, StageSlider, Text, ViewToolbar, facetsOf, matchFacets, type DataTableColumn, type ViewMode } from '@pui/components';

export type ListFacet<T> = { id: string; label: string; get: (r: T) => string | undefined };
export type ListSort<T> = { id: string; label: string; by: (a: T, b: T) => number };

/** The view an app keeps for all its lists (a store): the mode, and the cards a view in tile mode. */
export type ListViewState = { mode: ViewMode; cols: number };
/** The list's words, for an app that has its own (a translation); each falls back to the English default. */
export type ListViewLabels = {
  tile?: string; list?: string; grid?: string; filters?: string; close?: string;
  search?: string; sort?: string; all?: string; clear?: string;
  prev?: string; next?: string; position?: (k: number, n: number) => string;
};

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
  /** The whole count line, when the noun alone does not say it. */
  count?: (n: number) => string;
  /** The view held outside the list (one view for every list of an app); without it the list keeps its own. */
  view?: ListViewState; onView?: (v: ListViewState) => void;
  labels?: ListViewLabels;
  /** Tile mode: `row` (default) is one row of cards a view, `stage` the kit's stage slider (one card in front, its neighbours behind). */
  tile?: 'row' | 'stage';
  /** A slider of the caller's own for tile mode (a stage of shows); the cards-per-view numbers are then left out. */
  slider?: (rows: T[]) => React.ReactNode;
  /** A click anywhere on a card opens the row (onRow); a click on a control of its own inside does only that. */
  openCard?: boolean;
  /** The class of the box round each card when `openCard` is on. */
  cardClassName?: string;
  /** The table of list mode: its head and first column kept in view inside its own height, rows a step, and groups that fold. */
  tableOptions?: { sticky?: boolean; maxHeight?: string; limit?: number; groupBy?: (r: T) => string };
};

const CONTROL = 'button, a, input, select, textarea, label, [role="button"], [role="radio"], [role="checkbox"], [role="tab"]';

/**
 * Every list in a phi-kit app: the view toolbar (tile, list, grid), Filter & sort as a drawer from the right built
 * from the rows' own fields (facets), search and sorts, then the cards or a sortable table. The same as Phiegg's
 * lists, without a store, so any app can use it.
 */
export function ListView<T>({ rows, keyOf, text, facets = [], sorts = [], render, table, onRow, mode: start, cols = 4, minItemWidth = '15rem', pageSize, empty = 'Nothing matches.', noun = 'items',
  count, view, onView, labels = {}, tile = 'row', slider, openCard = false, cardClassName, tableOptions }: ListViewProps<T>) {
  // Phones start on cards: a table of many columns reads badly at 390px (it still scrolls sideways if chosen).
  const narrow = typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 640px)').matches;
  const [ownMode, setOwnMode] = React.useState<ViewMode>(start ?? (table && (!narrow || !render) ? 'list' : 'grid'));
  const [ownPerView, setOwnPerView] = React.useState(2);
  // Held outside (an app's one view for all its lists) or kept here.
  const mode = view?.mode ?? ownMode;
  const perView = view ? Math.min(3, Math.max(1, view.cols)) : ownPerView;
  const setMode = (m: ViewMode) => (view ? onView?.({ ...view, mode: m }) : setOwnMode(m));
  const setPerView = (n: number) => (view ? onView?.({ ...view, cols: n }) : setOwnPerView(n));
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
  const rowClick = onRow ? (r: T) => onRow(r) : undefined;
  // A sticky table scrolls inside its own height; a plain one scrolls sideways in a box.
  const tableOf = () => (tableOptions?.sticky
    ? <DataTable rows={slice} getKey={(r) => keyOf(r)} columns={table!} onRowClick={rowClick} stickyHeader stickyFirst maxHeight={tableOptions.maxHeight} limit={tableOptions.limit} groupBy={tableOptions.groupBy} />
    : <Box scroll="x"><DataTable rows={slice} getKey={(r) => keyOf(r)} columns={table!} onRowClick={rowClick} limit={tableOptions?.limit} groupBy={tableOptions?.groupBy} /></Box>);
  const card = (r: T) => (!render ? null : !openCard ? render(r) : (
    <Box className={cardClassName} onClick={(e: React.MouseEvent) => {
      const hit = (e.target as Element).closest(CONTROL);
      if (hit && hit !== e.currentTarget && (e.currentTarget as Element).contains(hit)) return;
      onRow?.(r);
    }}>{render(r)}</Box>
  ));
  const cards = (n: number, min?: string) => <Rows cols={n} colsSm={Math.min(n, 2)} minItemWidth={min}>{slice.map((r) => <React.Fragment key={keyOf(r)}>{card(r)}</React.Fragment>)}</Rows>;
  const stage = () => <StageSlider items={slice.map((r) => ({ id: keyOf(r), node: card(r) }))} prevLabel={labels.prev} nextLabel={labels.next} positionLabel={labels.position} />;
  return (
    <Stack direction="column" gap={3}>
      <ViewToolbar mode={mode} onMode={setMode} perView={slider ? undefined : perView} onPerView={slider ? undefined : setPerView}
        count={count ? count(shown.length) : `${shown.length.toLocaleString('en-US')} ${noun}`}
        onFilters={() => setOpen(!open)} filtersOpen={open} activeFilters={active} labels={{ tile: labels.tile, list: labels.list, grid: labels.grid, filters: labels.filters }} />
      <FilterLayout open={open} onClose={() => setOpen(false)} title={labels.filters} closeLabel={labels.close}
        filters={<FacetFilters facets={facetsOf(rows, facets)} selected={sel} onSelect={(f, o) => setSel((x) => ({ ...x, [f]: o ?? '' }))}
          search={text ? q : undefined} onSearch={text ? setQ : undefined} sorts={sorts.map((x) => ({ id: x.id, label: x.label }))} sort={sort} onSort={setSort}
          labels={{ search: labels.search ?? 'Search', sort: labels.sort ?? 'Sort', all: labels.all ?? 'All', clear: labels.clear ?? 'Clear' }} />}>
        {shown.length === 0 ? <Box surface="region"><Text intent="muted">{empty}</Text></Box>
          : mode === 'list' && table ? tableOf()
          : !render ? (table ? tableOf() : null)
          : mode === 'tile' ? (slider ? slider(slice) : tile === 'stage' ? stage() : cards(perView))
          : mode === 'list' ? cards(1)
          : cards(cols, minItemWidth)}
      </FilterLayout>
      {pages > 1 ? (
        <Stack direction="row" gap={2} align="center">
          <Button variant="glass" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</Button>
          <Text as="span" size="xs" intent="muted">Page {cur + 1} of {pages}</Text>
          <Button variant="glass" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
