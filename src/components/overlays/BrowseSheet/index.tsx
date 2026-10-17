import React from 'react';
import { Drawer } from '../Drawer';
import { Columns } from '../../layout/Columns';
import { Rows } from '../../layout/Rows';
import { Stack } from '../../layout/Stack';
import { FacetFilters, type SortOption } from '../../forms/Facets';
import { TabList } from '../../navigation/TabList';
import { Text } from '../../primitives/Text';

export type BrowseFacet = { id: string; label: string; options: { id: string; label: string; count?: number }[] };
export type BrowseLayout = { mode: 'grid' | 'list' | 'tile'; cols: number };
export type BrowseSheetLabels = { filters: string; layout: string; search: string; sort: string; all: string; clear: string; expand: string; collapse: string; grid: string; list: string; tile: string };

export type BrowseSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Shown beside the title (e.g. the number of matches). */
  count?: React.ReactNode;
  /** Left column: one group of filter chips per facet; the caller owns the selection. */
  facets?: BrowseFacet[];
  selected?: Record<string, string>;
  onSelect?: (facetId: string, optionId: string | null) => void;
  search?: string;
  onSearch?: (q: string) => void;
  sorts?: SortOption[];
  sort?: string;
  onSort?: (id: string) => void;
  /** Right column: layout options; the caller owns the layout. */
  layout: BrowseLayout;
  onLayout: (l: BrowseLayout) => void;
  /** Extra right-column content under the layout options — a chat, actions. */
  aside?: React.ReactNode;
  asideTitle?: React.ReactNode;
  /** The grid: one node per item (cards). */
  children: React.ReactNode;
  labels?: Partial<BrowseSheetLabels>;
};

const L: BrowseSheetLabels = { filters: 'Filters', layout: 'Layout', search: 'Search', sort: 'Sort', all: 'All', clear: 'Clear filters', expand: 'Expand', collapse: 'Restore', grid: 'Grid', list: 'List', tile: 'Tile' };

/**
 * BrowseSheet — a bottom sheet that only takes data for its areas: filters (left), the current grid (centre), layout
 * options and an aside such as a chat (right). Each column expands or closes like every other sheet; the grid is a
 * puijs Rows (full rows, leftovers in a slider; tile = one slider row). Nothing inside knows what the items are.
 */
export const BrowseSheet = ({ isOpen, onClose, title, count, facets = [], selected = {}, onSelect, search, onSearch, sorts, sort, onSort, layout, onLayout, aside, asideTitle, children, labels }: BrowseSheetProps) => {
  const l = { ...L, ...labels };
  const filters = <FacetFilters facets={facets} selected={selected} onSelect={onSelect} search={search} onSearch={onSearch} sorts={sorts} sort={sort} onSort={onSort}
    labels={{ search: l.search, all: l.all, clear: l.clear, sort: l.sort }} />;
  const options = (
    <Stack direction="column" gap={3}>
      <Stack direction="column" gap={1}>
        <Text size="xs" weight="bold" intent="muted">{l.layout}</Text>
        <TabList size="sm" variant="pills" aria-label={l.layout} activeId={layout.mode} onChange={(m) => onLayout({ ...layout, mode: m as BrowseLayout['mode'] })}
          items={[{ id: 'grid', label: l.grid }, { id: 'list', label: l.list }, { id: 'tile', label: l.tile }]} />
        {layout.mode === 'grid' && <TabList size="sm" variant="pills" aria-label={l.grid} activeId={String(layout.cols)} onChange={(c) => onLayout({ ...layout, cols: Number(c) })}
          items={[2, 3, 4, 6].map((n) => ({ id: String(n), label: String(n) }))} />}
      </Stack>
      {aside}
    </Stack>
  );
  const grid = layout.mode === 'tile' ? <Rows slider itemWidth="clamp(16rem, 28vw, 22rem)">{children}</Rows>
    : <Rows cols={layout.mode === 'list' ? 1 : layout.cols} colsSm={layout.mode === 'list' ? 1 : 2}>{children}</Rows>;
  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="bottom" size="lg" expandable expandLabel={l.expand} collapseLabel={l.collapse}
      title={<Stack direction="row" gap={2} align="center"><Text size="sm" weight="semibold">{title}</Text>{count != null && <Text size="xs" intent="muted">{count}</Text>}</Stack>}>
      <Columns expandLabel={l.expand} collapseLabel={l.collapse} columns={[
        { id: 'filters', title: l.filters, content: filters, width: '17rem', closable: true, expandable: true },
        { id: 'grid', title, label: typeof title === 'string' ? title : 'Items', content: grid, expandable: true, minWidth: '20rem' },
        { id: 'options', title: asideTitle ?? l.layout, label: l.layout, content: options, width: '20rem', closable: true, expandable: true },
      ]} />
    </Drawer>
  );
};
