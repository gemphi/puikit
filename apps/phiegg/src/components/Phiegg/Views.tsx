import React, { useState } from 'react';
import { DataTable, FacetFilters, FilterLayout, Rows, Stack, StageSlider, Text, ViewToolbar, facetsOf, matchFacets, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { garmentOf, t } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { useViewport } from '../../lib/viewport';

/** Club brand glyph drawn from data/site.json garments. */
export const ClubIcon: React.FC<{ icon?: string; size?: string }> = ({ icon, size = '1.5rem' }) => {
  const g = garmentOf(icon);
  return g ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-label={g.name}><path d={g.path} /></svg> : null;
};

export type ViewMode = 'tile' | 'list' | 'grid';
/** Tile (slider) · List · Grid as icons; the numbers (cards per view) only in tile mode. Shared by every list via the store. */
export const ViewSwitch: React.FC<{ count: number; onFilters?: () => void; filtersOpen?: boolean; activeFilters?: number; perView?: boolean }> = ({ count, onFilters, filtersOpen, activeFilters, perView = true }) => {
  const { view, setView } = useStore(phieggStore);
  return <ViewToolbar mode={view.mode} onMode={(m) => setView({ ...view, mode: m })} perView={perView ? Math.min(3, Math.max(1, view.cols)) : undefined} onPerView={perView ? (n) => setView({ ...view, cols: n }) : undefined}
    count={`${count} items`} onFilters={onFilters} filtersOpen={filtersOpen} activeFilters={activeFilters} labels={{ tile: 'Tile', list: 'List', grid: 'Grid', filters: t('lsFilterSort') }} />;
};
/** Grid wrapper that follows the chosen view: the stage slider (tile), full rows (grid) or one a row (list). */
export const ViewGrid: React.FC<{ children: React.ReactNode; cols?: number; minItemWidth?: string }> = ({ children, cols: want = 4, minItemWidth = '15rem' }) => {
  const { view } = useStore(phieggStore); const { mobile } = useViewport();
  // Tile is the slider: 1–3 large cards per view. Grid is full rows (two a row on phones). List is one a row.
  if (view.mode === 'tile') {
    // Tile is the stage: one card in the centre, 1 to 3 a side (the toolbar numbers), each half the height of the one in
    // front with half of it tucked under, arrows on the sides and the progress under it.
    const items = React.Children.toArray(children).map((c, i) => ({ id: String((c as React.ReactElement).key ?? i), node: c }));
    return <StageSlider items={items} sides={mobile ? 1 : Math.min(3, Math.max(1, view.cols))} stageWidth={mobile ? '78vw' : 'min(30rem, 52vw)'} prevLabel={t('slPrev')} nextLabel={t('slNext')} positionLabel={(k, n) => t('slPos', { i: k, n })} />;
  }
  const cols = view.mode === 'list' ? 1 : mobile ? Math.min(want, 2) : want;
  // Responsive: up to `cols` a row, but never narrower than minItemWidth (the grid measures its own width).
  return <Rows cols={cols} colsSm={Math.min(cols, 2)} minItemWidth={view.mode === 'list' ? undefined : minItemWidth}>{children}</Rows>;
};

/**
 * Every list in the app: the view toolbar, a Filter & sort sidebar built from the rows' own fields (facets) and
 * sorts, and the grid. In list mode a `table` turns the rows into a DataTable sortable by its headings.
 */
export type ListFacet<T> = { id: string; label: string; get: (r: T) => string | undefined };
export type ListSort<T> = { id: string; label: string; by: (a: T, b: T) => number };
export function ListView<T>({ rows, keyOf, text, facets = [], sorts = [], render, table, cols, minItemWidth, empty, slider, onRow, groupBy }: {
  rows: T[]; keyOf: (r: T) => string; text?: (r: T) => string; facets?: ListFacet<T>[]; sorts?: ListSort<T>[];
  render: (r: T) => React.ReactNode; table?: DataTableColumn<T>[]; cols?: number; empty?: string;
  /** In list (table) mode, section the rows into groups that expand and collapse. */
  groupBy?: (r: T) => string;
  /** The narrowest a card may get before the grid drops a column (default 15rem). */
  minItemWidth?: string;
  /** A bespoke slider for tile mode (e.g. the shows stage); otherwise tile mode is the Rows slider. */
  slider?: (rows: T[]) => React.ReactNode;
  /** Opens a row from the table. */
  onRow?: (r: T) => void;
}) {
  const { view } = useStore(phieggStore);
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [sel, setSel] = useState<Record<string, string>>({}); const [sort, setSort] = useState(sorts[0]?.id ?? '');
  const ql = q.trim().toLowerCase();
  const by = sorts.find((x) => x.id === sort)?.by;
  const shown = rows.filter((r) => (!ql || !text || text(r).toLowerCase().includes(ql)) && matchFacets(r, facets, sel));
  if (by) shown.sort(by);
  const active = Object.values(sel).filter(Boolean).length + (ql ? 1 : 0);
  return (
    <Stack direction="column" gap={3}>
      <ViewSwitch count={shown.length} onFilters={() => setOpen(!open)} filtersOpen={open} activeFilters={active} perView={!slider} />
      <FilterLayout open={open} onClose={() => setOpen(false)} title={t('lsFilterSort')} closeLabel={t('lsClose')}
        filters={<FacetFilters facets={facetsOf(rows, facets)} selected={sel} onSelect={(f, o) => setSel((x) => ({ ...x, [f]: o ?? '' }))}
          search={text ? q : undefined} onSearch={text ? setQ : undefined} sorts={sorts.map((x) => ({ id: x.id, label: x.label }))} sort={sort} onSort={setSort}
          labels={{ search: t('searchPh'), sort: t('lsSort'), all: t('seAll'), clear: t('lsClear') }} />}>
        {shown.length === 0 ? <Text intent="muted">{empty ?? t('lsNone')}</Text>
          : view.mode === 'list' && table ? <DataTable rows={shown} getKey={(r) => keyOf(r)} columns={table} onRowClick={onRow ? (r) => onRow(r) : undefined}
              stickyHeader stickyFirst maxHeight="34rem" limit={groupBy ? undefined : 25} groupBy={groupBy} />
          : view.mode === 'tile' && slider ? slider(shown)
          : <ViewGrid cols={cols} minItemWidth={minItemWidth}>{shown.map((r) => <React.Fragment key={keyOf(r)}>{render(r)}</React.Fragment>)}</ViewGrid>}
      </FilterLayout>
    </Stack>
  );
}
