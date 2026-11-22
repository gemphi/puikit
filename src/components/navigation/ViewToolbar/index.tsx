import React, { useState } from 'react';
import { ArrowUpDown, GalleryHorizontal, Layers, LayoutGrid, List, ListFilter, Search } from 'lucide-react';
import { Stack } from '../../layout/Stack';
import { HeadPart, HeadTools, useHeadSlot } from '../../layout/HeadTools';
import { Button } from '../../primitives/Button';
import { Tag } from '../../primitives/Tag';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { Input } from '../../forms/Input';
import { Popover } from '../../overlays/Popover';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './styles.module.scss';

export type ViewMode = 'tile' | 'list' | 'deck' | 'grid';
/** The layouts every list offers unless its data names its own: rows, decks, a grid. */
export const VIEW_MODES: ViewMode[] = ['list', 'deck', 'grid'];
const ICON: Record<ViewMode, typeof List> = { tile: GalleryHorizontal, list: List, deck: Layers, grid: LayoutGrid };
const NAME: Record<ViewMode, string> = { tile: 'Tile', list: 'List', deck: 'Deck', grid: 'Grid' };

export type ViewToolbarProps = {
  mode: ViewMode; onMode: (m: ViewMode) => void;
  /** The layouts offered, in the menu's order; the one shown is always among them. */
  modes?: ViewMode[];
  /** The list's heading, at the bar's start. Under a header that takes tools the heading is that header's. */
  title?: React.ReactNode;
  /** Cards per view in the tile (slider) mode, the only mode that shows the numbers. */
  perView?: number; onPerView?: (n: number) => void; perViewOptions?: number[];
  /** The total, on a ground of its own, and the word after it ("items"). */
  count?: React.ReactNode; noun?: React.ReactNode;
  /** The search: an icon in the centre that opens the field beside it. Left out, there is no search here. */
  search?: string; onSearch?: (q: string) => void;
  /** What else stands in the centre, before the search: a row of tabs. */
  center?: React.ReactNode;
  /** Shows the Filter button; `filtersOpen` marks it pressed, `activeFilters` is counted on it. */
  onFilters?: () => void; filtersOpen?: boolean; activeFilters?: number;
  /** Shows the Sort button, apart from Filter; `sortLabel` (the sort that is on) is said in its tip. */
  onSort?: () => void; sortOpen?: boolean; sortLabel?: string;
  labels?: { tile?: string; list?: string; deck?: string; grid?: string; layout?: string; search?: string; filters?: string; sort?: string; perView?: (n: number) => string };
};

/**
 * One header for every list, in three parts. At the left, right after the title: the total on a ground of its own,
 * its word, then one icon that is the layout shown (a press drops the layouts below it, on the bar's own ground, to
 * pick another). In the centre: the list's tabs and its search. At the right: Filter and Sort, each its own drawer.
 * Under a header that takes tools (a section's, a block's: `WithHeadTools`) the parts stand in that header's slots
 * and the list draws no bar of its own; alone, the bar is the header, with the list's title at its start.
 */
export const ViewToolbar = ({ mode, onMode, modes = VIEW_MODES, title, perView, onPerView, perViewOptions = [1, 2, 3], count, noun, search, onSearch, center,
  onFilters, filtersOpen, activeFilters = 0, onSort, sortOpen, sortLabel, labels = {} }: ViewToolbarProps) => {
  const [open, setOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const headed = useHeadSlot();
  const tip = (label: string, node: React.ReactElement, key?: React.Key) => <Tooltip key={key} content={label} position="bottom">{node}</Tooltip>;
  const name = (m: ViewMode) => labels[m] ?? NAME[m];
  const per = labels.perView ?? ((n: number) => `${n} per view`);
  const filters = labels.filters ?? 'Filter'; const sort = labels.sort ?? 'Sort'; const layout = labels.layout ?? 'Layout'; const seek = labels.search ?? 'Search';
  const offered = modes.includes(mode) ? modes : [mode, ...modes];
  const Now = ICON[mode];
  // The field shows while it is asked for or holds words; closing it clears it, so no hidden search narrows the list.
  const field = seeking || !!search;
  const start = (
    <Stack as="span" direction="row" gap={1} align="center" flex="none">
      {count != null && <Tag minimal round size="sm">{count}</Tag>}
      {noun != null && <Text as="span" size="xs" intent="muted">{noun}</Text>}
      {offered.length > 1 && (
        <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-start" portal contentClassName={styles.menu}
          trigger={<Button variant="icon" aria-label={`${layout} · ${name(mode)}`} title={`${layout} · ${name(mode)}`} aria-haspopup="menu" aria-expanded={open}><Now size={16} /></Button>}>
          <Stack direction="column" gap={1} role="menu" aria-label={layout}>
            {offered.map((m) => { const I = ICON[m]; return (
              <Button key={m} variant="glass" role="menuitemradio" aria-checked={m === mode} aria-pressed={m === mode} icon={<I size={16} />} onClick={() => { onMode(m); setOpen(false); }}>{name(m)}</Button>); })}
          </Stack>
        </Popover>)}
      {mode === 'tile' && onPerView && perViewOptions.map((n) => tip(per(n), <Button variant="glass" aria-pressed={perView === n} aria-label={per(n)} onClick={() => onPerView(n)}>{n}</Button>, n))}
    </Stack>
  );
  const middle = (center != null || onSearch) ? (
    <Stack as="span" direction="row" gap={1} align="center" minWidth="0">
      {center}
      {onSearch && tip(seek, <Button variant="icon" aria-label={seek} aria-pressed={field} aria-expanded={field} onClick={() => { if (field) onSearch(''); setSeeking(!field); }}><Search size={16} /></Button>)}
      {onSearch && field && <Input type="search" autoFocus value={search ?? ''} placeholder={seek} aria-label={seek} flex="1" maxWidth="16rem" onChange={(e) => onSearch(e.target.value)} />}
    </Stack>) : null;
  const end = (onFilters || onSort) ? (
    <Stack as="span" direction="row" gap={1} align="center" flex="none">
      {onFilters && tip(activeFilters ? `${filters} · ${activeFilters}` : filters,
        <Button variant="icon" aria-label={filters} aria-pressed={!!filtersOpen || activeFilters > 0} onClick={onFilters}><ListFilter size={16} /></Button>)}
      {onSort && tip(sortLabel ? `${sort} · ${sortLabel}` : sort,
        <Button variant="icon" aria-label={sort} aria-pressed={!!sortOpen} onClick={onSort}><ArrowUpDown size={16} /></Button>)}
    </Stack>) : null;
  if (headed) return <><HeadTools at="start">{start}</HeadTools><HeadTools at="center">{middle}</HeadTools><HeadTools at="end">{end}</HeadTools></>;
  return (
    <Stack direction="row" gap={2} align="center" wrap surface="region">
      {typeof title === 'string' ? <Title level={3} size="md">{title}</Title> : title}
      <HeadPart place="start">{start}</HeadPart><HeadPart place="center">{middle}</HeadPart><HeadPart place="end">{end}</HeadPart>
    </Stack>
  );
};
