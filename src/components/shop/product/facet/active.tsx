import React from 'react';
import { Tag } from '../../../primitives/Tag';
import { Button } from '../../../primitives/Button';
import { Stack } from '../../../layout/Stack';

/** One selected value, traced back to the group it came from. */
export interface ActiveFilter {
  /** The facet this value belongs to, e.g. `colour`. */
  facet: string;
  value: string;
  /** What the shopper sees, e.g. `Ivory`. */
  label: string;
}

export interface ActiveFiltersLabels {
  clearAll: string;
  /** Receives the filter's label, e.g. `(l) => \`Remove ${l}\``. */
  remove: (label: string) => string;
}

export const DEFAULT_ACTIVE_FILTERS_LABELS: ActiveFiltersLabels = {
  clearAll: 'Clear all',
  remove: (label) => `Remove ${label}`,
};

export interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (filter: ActiveFilter) => void;
  onClearAll?: () => void;
  labels?: Partial<ActiveFiltersLabels>;
  className?: string;
}

/**
 * The chips for what is currently filtered.
 *
 * Without this, a shopper who has narrowed a catalog has no way to see what
 * they narrowed it by except by scrolling the rail — and no way to undo one
 * choice without hunting for the checkbox that made it. Renders nothing when
 * nothing is selected, so it costs no space in the common case.
 */
export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemove,
  onClearAll,
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_ACTIVE_FILTERS_LABELS, ...labels };
  if (filters.length === 0) return null;

  return (
    <Stack direction="row" wrap gap={1} align="center" className={className} data-active-filters="true">
      {filters.map((f) => (
        <Tag
          key={`${f.facet}:${f.value}`}
          intent="primary"
          minimal
          round
          onRemove={() => onRemove(f)}
          aria-label={copy.remove(f.label)}
        >
          {f.label}
        </Tag>
      ))}
      {onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          {copy.clearAll}
        </Button>
      )}
    </Stack>
  );
};
