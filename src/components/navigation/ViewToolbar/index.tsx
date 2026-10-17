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
    <Button key={m} variant="icon" size="sm" aria-label={label} aria-pressed={mode === m} title={label} onClick={() => onMode(m)}
      style={mode === m ? { backgroundColor: 'var(--phi-color-primary)', color: 'var(--phi-color-text-inverse, #fff)' } : undefined}><I size={16} /></Button>
  );
  return (
    <Stack direction="row" gap={1} align="center" wrap>
      {icon('tile', GalleryHorizontal, labels.tile ?? 'Tile')}{icon('list', List, labels.list ?? 'List')}{icon('grid', LayoutGrid, labels.grid ?? 'Grid')}
      {mode === 'tile' && onPerView && perViewOptions.map((n) => <Button key={n} size="sm" variant={perView === n ? 'primary' : 'ghost'} aria-pressed={perView === n} aria-label={`${n} per view`} onClick={() => onPerView(n)}>{n}</Button>)}
      {count != null && <Text size="xs" intent="muted" style={{ marginLeft: 'auto' }}>{count}</Text>}
      {onFilters && <Button size="sm" variant={filtersOpen ? 'primary' : 'outline'} iconLeft={SlidersHorizontal} aria-pressed={!!filtersOpen} onClick={onFilters} style={count == null ? { marginLeft: 'auto' } : undefined}>
        {(labels.filters ?? 'Filter & sort') + (activeFilters ? ` · ${activeFilters}` : '')}</Button>}
    </Stack>
  );
};
