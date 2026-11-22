import React from 'react';
import { Box, Button, DataTable, Deck, FacetFilters, FilterLayout, Rows, Stack, StageSlider, Text, VIEW_MODES, ViewToolbar, facetsOf, matchFacets, type DataTableColumn, type ViewMode } from '@pui/components';

export type ListFacet<T> = { id: string; label: string; get: (r: T) => string | undefined };
export type ListSort<T> = { id: string; label: string; by: (a: T, b: T) => number };

/** The view an app keeps for all its lists (a store): the mode, and the cards a view in tile mode. */
export type ListViewState = { mode: ViewMode; cols: number };
/** The list's words, for an app that has its own (a translation); each falls back to the English default. */
export type ListViewLabels = {
  tile?: string; list?: string; deck?: string; grid?: string; layout?: string; filters?: string; close?: string;
  search?: string; sort?: string; all?: string; clear?: string; order?: string; forward?: string; backward?: string;
  prev?: string; next?: string; position?: (k: number, n: number) => string;
};

export type ListViewProps<T> = {
  rows: T[]; keyOf: (r: T) => string;
  /** The text the search matches. */
  text?: (r: T) => string;
  facets?: ListFacet<T>[]; sorts?: ListSort<T>[];
  /** One card, told the layout it stands in (a row card in list mode, a tall one elsewhere). */
  render?: (r: T, mode: ViewMode) => React.ReactNode;
  /** Columns for list mode (a table sortable by its headings); without them list mode is one card a row. */
  table?: DataTableColumn<T>[];
  onRow?: (r: T) => void;
  /** Start in this mode (default list when there is a table, else grid). */
  mode?: ViewMode;
  /** The layouts offered (default list, deck, grid; tile joins them where the list has a slider of its own). */
  modes?: ViewMode[];
  /** The list's heading, at the start of its bar (under a section's or a block's header the heading is that header's). */
  title?: React.ReactNode;
  /** `false` leaves the bar out: no count, filter, sort or layout switch. */
  toolbar?: boolean;
  /** Grid mode: `false` keeps every card its own height (cards of words alone); else the mosaic's sizes. */
  mosaic?: boolean;
  /** Drawn between the bar and the list (a link to the full page). */
  lead?: React.ReactNode;
  /** The list's tabs, drawn in the centre of its header, before the search. */
  tabs?: React.ReactNode;
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
 * Every list in a phi-kit app. Its header (the kit's ViewToolbar, drawn in the section's or block's header above it)
 * carries, at the left, the total and the layout (list, deck or grid, picked from one icon); in the centre the list's
 * tabs and its search; at the right Filter and Sort, two icons and two drawers (Filter is the rows' own fields, Sort
 * the sorts and their order). Then the cards or a sortable table. The same as Phiegg's lists, without a store, so any
 * app can use it.
 */
export function ListView<T>({ rows, keyOf, text, facets = [], sorts = [], render, table, onRow, mode: start, modes, title, toolbar = true, mosaic, lead, tabs, cols = 4, minItemWidth = '15rem', pageSize, empty = 'Nothing matches.', noun = 'items',
  count, view, onView, labels = {}, tile = 'row', slider, openCard = false, cardClassName, tableOptions }: ListViewProps<T>) {
  // Phones start on cards: a table of many columns reads badly at 390px (it still scrolls sideways if chosen).
  const narrow = typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 640px)').matches;
  const [ownMode, setOwnMode] = React.useState<ViewMode>(start ?? (table && (!narrow || !render) ? 'list' : 'grid'));
  const [ownPerView, setOwnPerView] = React.useState(2);
  // Held outside (an app's one view for all its lists) or kept here.
  const mode = view?.mode ?? ownMode;
  const perView = view ? Math.min(3, Math.max(1, view.cols)) : ownPerView;
  const setMode = (m: ViewMode) => (view ? onView?.({ ...view, mode: m }) : setOwnMode(m));
  // The slider is offered where the list has one of its own (a stage, the caller's) or starts on it.
  const offered = modes ?? (slider || tile === 'stage' || start === 'tile' ? (['tile', ...VIEW_MODES] as ViewMode[]) : VIEW_MODES);
  const setPerView = (n: number) => (view ? onView?.({ ...view, cols: n }) : setOwnPerView(n));
  const [open, setOpen] = React.useState<'filter' | 'sort' | null>(null);
  const [reverse, setReverse] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState(sorts[0]?.id ?? '');
  const [page, setPage] = React.useState(0);
  React.useEffect(() => { setPage(0); }, [rows, q, sel, sort, reverse]);
  const ql = q.trim().toLowerCase();
  const by = sorts.find((x) => x.id === sort)?.by;
  const shown = rows.filter((r) => (!ql || !text || text(r).toLowerCase().includes(ql)) && matchFacets(r, facets, sel));
  if (by) shown.sort(by);
  if (reverse) shown.reverse();
  const pages = pageSize ? Math.max(1, Math.ceil(shown.length / pageSize)) : 1;
  const cur = Math.min(page, pages - 1);
  const slice = pageSize ? shown.slice(cur * pageSize, cur * pageSize + pageSize) : shown;
  const active = Object.values(sel).filter(Boolean).length;
  // The total stands on a ground of its own, its word after it: the count line is cut at its number ("79 items").
  const line = count ? count(shown.length) : `${shown.length.toLocaleString('en-US')} ${noun}`;
  const total = [shown.length.toLocaleString('en-US'), String(shown.length)].find((x) => line.includes(x));
  const word = total ? line.replace(total, '').trim() : undefined;
  const rowClick = onRow ? (r: T) => onRow(r) : undefined;
  const words = { filters: labels.filters ?? 'Filter', search: labels.search ?? 'Search', sort: labels.sort ?? 'Sort', all: labels.all ?? 'All', clear: labels.clear ?? 'Clear', order: labels.order, forward: labels.forward, backward: labels.backward };
  // A sticky table scrolls inside its own height; a plain one scrolls sideways in a box.
  const tableOf = () => (tableOptions?.sticky
    ? <DataTable rows={slice} getKey={(r) => keyOf(r)} columns={table!} onRowClick={rowClick} stickyHeader stickyFirst maxHeight={tableOptions.maxHeight} limit={tableOptions.limit} groupBy={tableOptions.groupBy} />
    : <Box scroll="x"><DataTable rows={slice} getKey={(r) => keyOf(r)} columns={table!} onRowClick={rowClick} limit={tableOptions?.limit} groupBy={tableOptions?.groupBy} /></Box>);
  const card = (r: T) => (!render ? null : !openCard ? render(r, mode) : (
    <Box className={cardClassName} onClick={(e: React.MouseEvent) => {
      const hit = (e.target as Element).closest(CONTROL);
      if (hit && hit !== e.currentTarget && (e.currentTarget as Element).contains(hit)) return;
      onRow?.(r);
    }}>{render(r, mode)}</Box>
  ));
  const cards = (n: number, min?: string) => <Rows cols={n} colsSm={Math.min(n, 2)} minItemWidth={min} mosaic={mosaic}>{slice.map((r) => <React.Fragment key={keyOf(r)}>{card(r)}</React.Fragment>)}</Rows>;
  // Decks: the grid's columns, every card its own height with two bars above it (the cards behind).
  const decks = () => <Rows cols={cols} colsSm={Math.min(cols, 2)} minItemWidth={minItemWidth} mosaic={false}>{slice.map((r) => <Deck key={keyOf(r)}>{card(r)}</Deck>)}</Rows>;
  // List without a table: one card a row, each as high as its own content.
  const lines = () => <Stack direction="column" gap={2}>{slice.map((r) => <React.Fragment key={keyOf(r)}>{card(r)}</React.Fragment>)}</Stack>;
  const stage = () => <StageSlider items={slice.map((r) => ({ id: keyOf(r), node: card(r) }))} prevLabel={labels.prev} nextLabel={labels.next} positionLabel={labels.position} />;
  return (
    <Stack direction="column" gap={3}>
      {toolbar ? <ViewToolbar mode={mode} onMode={setMode} modes={offered} title={title} perView={slider ? undefined : perView} onPerView={slider ? undefined : setPerView}
        count={total ?? line} noun={word || undefined} center={tabs} search={text ? q : undefined} onSearch={text ? setQ : undefined}
        onFilters={facets.length ? () => setOpen(open === 'filter' ? null : 'filter') : undefined} filtersOpen={open === 'filter'} activeFilters={active}
        onSort={sorts.length ? () => setOpen(open === 'sort' ? null : 'sort') : undefined} sortOpen={open === 'sort'} sortLabel={sorts.find((x) => x.id === sort)?.label}
        labels={{ tile: labels.tile, list: labels.list, deck: labels.deck, grid: labels.grid, layout: labels.layout, search: words.search, filters: words.filters, sort: words.sort }} /> : tabs}
      {lead}
      <FilterLayout open={open !== null} onClose={() => setOpen(null)} title={open === 'sort' ? words.sort : words.filters} closeLabel={labels.close}
        filters={open === 'sort'
          ? <FacetFilters sorts={sorts.map((x) => ({ id: x.id, label: x.label }))} sort={sort} onSort={setSort} reverse={reverse} onReverse={setReverse} labels={words} />
          : <FacetFilters facets={facetsOf(rows, facets)} selected={sel} onSelect={(f, o) => setSel((x) => ({ ...x, [f]: o ?? '' }))}
            openGroups={4} labels={words} />}>
        {shown.length === 0 ? <Box surface="region"><Text intent="muted">{empty}</Text></Box>
          : mode === 'list' && table ? tableOf()
          : !render ? (table ? tableOf() : null)
          : mode === 'tile' ? (slider ? slider(slice) : tile === 'stage' ? stage() : cards(perView))
          : mode === 'list' ? lines()
          : mode === 'deck' ? decks()
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
