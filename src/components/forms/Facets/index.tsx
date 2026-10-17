import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Input } from '../Input';
import { Text } from '../../primitives/Text';
import styles from './styles.module.scss';

export type Facet = { id: string; label: string; options: { id: string; label: string; count?: number }[]; /** Options a row (1 to 3); by default from the longest label. */ cols?: 1 | 2 | 3 };
export type SortOption = { id: string; label: string };
export type FacetFiltersProps = {
  facets?: Facet[];
  selected?: Record<string, string>;
  onSelect?: (facetId: string, optionId: string | null) => void;
  search?: string;
  onSearch?: (q: string) => void;
  sorts?: SortOption[];
  sort?: string;
  onSort?: (id: string) => void;
  /** How many groups start open (the rest are folded to their header). */
  openGroups?: number;
  labels?: { search?: string; sort?: string; all?: string; clear?: string };
};

/** Options a row from the longest label: short labels three a row, medium two, long ones one. */
export const facetCols = (labels: string[]): 1 | 2 | 3 => { const n = Math.max(0, ...labels.map((x) => x.length)); return n <= 9 ? 3 : n <= 18 ? 2 : 1; };

/** One accordion group: a header (label, the current choice, a chevron) over an equal-width grid of options. */
const Group = ({ id, label, current, open, onToggle, cols, children }: { id: string; label: string; current?: string; open: boolean; onToggle: () => void; cols: number; children: React.ReactNode }) => (
  <Box className={cn(styles.group, open && styles.open)} role="group" aria-label={label}>
    <Box as="button" className={styles.head} aria-expanded={open} aria-controls={'facet-' + id} onClick={onToggle}>
      <Text as="span" size="xs" weight="bold">{label}</Text>
      {current && <Text as="span" size="xs" intent="primary" className={styles.current}>{current}</Text>}
      <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
    </Box>
    {open && <Box id={'facet-' + id} className={styles.grid} style={{ '--pui-facet-cols': String(cols) } as React.CSSProperties}>{children}</Box>}
  </Box>
);
const Option = ({ on, onClick, children, role = 'checkbox' }: { on: boolean; onClick: () => void; children: React.ReactNode; role?: string }) => (
  <Box as="button" role={role} aria-checked={on} className={cn(styles.option, on && styles.on)} onClick={onClick}>{children}</Box>
);

/**
 * Facets: search, sort and one accordion per facet (single choice, "All" to clear). Every group folds to its header,
 * which shows the current choice; its options sit in an equal-width grid of one, two or three a row, chosen from the
 * length of its labels (or `cols`), so every chip in a row is the same width. The same block fills the filter drawer,
 * a page's filter sidebar and a bottom sheet's filter column.
 */
export const FacetFilters = ({ facets = [], selected = {}, onSelect, search, onSearch, sorts, sort, onSort, openGroups = 3, labels = {} }: FacetFiltersProps) => {
  const any = Object.values(selected).some(Boolean);
  const ids = [...(sorts?.length ? ['__sort'] : []), ...facets.map((f) => f.id)];
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(ids.map((id, i) => [id, i < openGroups])));
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !(o[id] ?? false) }));
  const sortLabel = sorts?.find((x) => x.id === sort)?.label;
  return (
    <Stack direction="column" gap={2}>
      {onSearch && <Input value={search ?? ''} placeholder={labels.search ?? 'Search'} aria-label={labels.search ?? 'Search'} onChange={(e) => onSearch(e.target.value)} />}
      {sorts && sorts.length > 0 && (
        <Group id="__sort" label={labels.sort ?? 'Sort'} current={sortLabel} open={open.__sort ?? true} onToggle={() => toggle('__sort')} cols={facetCols(sorts.map((x) => x.label))}>
          {sorts.map((o) => <Option key={o.id} role="radio" on={sort === o.id} onClick={() => onSort?.(o.id)}>{o.label}</Option>)}
        </Group>
      )}
      {facets.map((f) => {
        const cur = f.options.find((o) => o.id === selected[f.id])?.label;
        return (
          <Group key={f.id} id={f.id} label={f.label} current={cur} open={open[f.id] ?? false} onToggle={() => toggle(f.id)} cols={f.cols ?? facetCols([labels.all ?? 'All', ...f.options.map((o) => o.label + (o.count != null ? ' · ' + o.count : ''))])}>
            <Option on={!selected[f.id]} onClick={() => onSelect?.(f.id, null)}>{labels.all ?? 'All'}</Option>
            {f.options.map((o) => (
              <Option key={o.id} on={selected[f.id] === o.id} onClick={() => onSelect?.(f.id, selected[f.id] === o.id ? null : o.id)}>
                <Text as="span" size="xs" truncate>{o.label}</Text>{o.count != null && <Text as="span" size="xs" intent="muted" numeric>{o.count}</Text>}
              </Option>
            ))}
          </Group>
        );
      })}
      {any && <Option on={false} onClick={() => facets.forEach((f) => onSelect?.(f.id, null))}>{labels.clear ?? 'Clear filters'}</Option>}
    </Stack>
  );
};

/** Build facets from any records: options are the values each `get` reads, counted, most frequent first. */
export function facetsOf<T>(rows: T[], defs: { id: string; label: string; get: (r: T) => string | undefined }[], max = 16): Facet[] {
  return defs.map((d) => {
    const counts = new Map<string, number>(); for (const r of rows) { const v = d.get(r); if (v) counts.set(v, (counts.get(v) ?? 0) + 1); }
    return { id: d.id, label: d.label, options: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([v, n]) => ({ id: v, label: v, count: n })) };
  });
}
/** Keep the rows that match every selected facet. */
export const matchFacets = <T,>(r: T, defs: { id: string; get: (r: T) => string | undefined }[], selected: Record<string, string>) => defs.every((d) => !selected[d.id] || d.get(r) === selected[d.id]);
