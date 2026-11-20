import React from 'react';
import { ArrowUpDown, GalleryHorizontal, LayoutGrid, List, ListFilter } from 'lucide-react';
import { Stack } from '../../layout/Stack';
import { Button } from '../../primitives/Button';
import { Tag } from '../../primitives/Tag';
import { Tooltip } from '../../overlays/Tooltip';

export type ViewMode = 'tile' | 'list' | 'grid';
export type ViewToolbarProps = {
  mode: ViewMode; onMode: (m: ViewMode) => void;
  /** Cards per view in the tile (slider) mode — the only mode that shows the numbers. */
  perView?: number; onPerView?: (n: number) => void; perViewOptions?: number[];
  count?: React.ReactNode;
  /** Shows the Filter button; `filtersOpen` marks it pressed, `activeFilters` is counted on it. */
  onFilters?: () => void; filtersOpen?: boolean; activeFilters?: number;
  /** Shows the Sort button, apart from Filter; `sortLabel` (the sort that is on) is said in its tip. */
  onSort?: () => void; sortOpen?: boolean; sortLabel?: string;
  labels?: { tile?: string; list?: string; grid?: string; filters?: string; sort?: string; perView?: (n: number) => string };
};

/**
 * One toolbar for every list: tile (slider) · list · grid as icons, cards per view (tile only), the count on a ground
 * of its own, then Filter and Sort as two icons, each its own drawer. Every icon says what it is in the kit's Tooltip
 * under the pointer or on focus.
 */
export const ViewToolbar = ({ mode, onMode, perView, onPerView, perViewOptions = [1, 2, 3], count, onFilters, filtersOpen, activeFilters = 0, onSort, sortOpen, sortLabel, labels = {} }: ViewToolbarProps) => {
  const tip = (label: string, node: React.ReactElement, key?: React.Key) => <Tooltip key={key} content={label} position="bottom">{node}</Tooltip>;
  const icon = (m: ViewMode, I: typeof List, label: string) => tip(label,
    <Button variant="icon" aria-label={label} aria-pressed={mode === m} onClick={() => onMode(m)}><I size={16} /></Button>, m);
  const per = labels.perView ?? ((n: number) => `${n} per view`);
  const filters = labels.filters ?? 'Filter'; const sort = labels.sort ?? 'Sort';
  return (
    <Stack direction="row" gap={1} align="center" wrap surface="region">
      {icon('tile', GalleryHorizontal, labels.tile ?? 'Tile')}{icon('list', List, labels.list ?? 'List')}{icon('grid', LayoutGrid, labels.grid ?? 'Grid')}
      {mode === 'tile' && onPerView && perViewOptions.map((n) => tip(per(n), <Button variant="glass" aria-pressed={perView === n} aria-label={per(n)} onClick={() => onPerView(n)}>{n}</Button>, n))}
      <Stack direction="row" gap={1} align="center" style={{ marginLeft: 'auto' }}>
        {count != null && <Tag minimal round size="sm">{count}</Tag>}
        {onFilters && tip(activeFilters ? `${filters} · ${activeFilters}` : filters,
          <Button variant="icon" aria-label={filters} aria-pressed={!!filtersOpen || activeFilters > 0} onClick={onFilters}><ListFilter size={16} /></Button>)}
        {onSort && tip(sortLabel ? `${sort} · ${sortLabel}` : sort,
          <Button variant="icon" aria-label={sort} aria-pressed={!!sortOpen} onClick={onSort}><ArrowUpDown size={16} /></Button>)}
      </Stack>
    </Stack>
  );
};
