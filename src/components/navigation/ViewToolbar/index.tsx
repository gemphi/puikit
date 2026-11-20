import React from 'react';
import { GalleryHorizontal, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Stack } from '../../layout/Stack';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';

export type ViewMode = 'tile' | 'list' | 'grid';
export type ViewToolbarProps = {
  mode: ViewMode; onMode: (m: ViewMode) => void;
  /** Cards per view in the tile (slider) mode — the only mode that shows the numbers. */
  perView?: number; onPerView?: (n: number) => void; perViewOptions?: number[];
  count?: React.ReactNode;
  /** Shows the Filter & sort button; `filtersOpen` marks it pressed. */
  onFilters?: () => void; filtersOpen?: boolean; activeFilters?: number;
  labels?: { tile?: string; list?: string; grid?: string; filters?: string };
};

/** One toolbar for every list: tile (slider) · list · grid as icons, cards per view (tile only) and Filter & sort. */
export const ViewToolbar = ({ mode, onMode, perView, onPerView, perViewOptions = [1, 2, 3], count, onFilters, filtersOpen, activeFilters = 0, labels = {} }: ViewToolbarProps) => {
  const icon = (m: ViewMode, I: typeof List, label: string) => (
    <Button key={m} variant="icon" aria-label={label} aria-pressed={mode === m} title={label} onClick={() => onMode(m)}><I size={16} /></Button>
  );
  return (
    <Stack direction="row" gap={1} align="center" wrap surface="region">
      {icon('tile', GalleryHorizontal, labels.tile ?? 'Tile')}{icon('list', List, labels.list ?? 'List')}{icon('grid', LayoutGrid, labels.grid ?? 'Grid')}
      {mode === 'tile' && onPerView && perViewOptions.map((n) => <Button key={n} variant="glass" aria-pressed={perView === n} aria-label={`${n} per view`} onClick={() => onPerView(n)}>{n}</Button>)}
      {count != null && <Text size="xs" intent="muted" style={{ marginLeft: 'auto' }}>{count}</Text>}
      {onFilters && <Button variant="glass" iconLeft={SlidersHorizontal} aria-pressed={!!filtersOpen} onClick={onFilters} style={{ flex: 'none', marginLeft: count == null ? 'auto' : undefined }}>
        {(labels.filters ?? 'Filter & sort') + (activeFilters ? ` · ${activeFilters}` : '')}</Button>}
    </Stack>
  );
};
