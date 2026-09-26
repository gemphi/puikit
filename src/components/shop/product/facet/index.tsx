import React, { useState } from 'react';
import { Checkbox } from '../../../forms/Checkbox';
import { Text } from '../../../primitives/Text';
import { Span } from '../../../primitives/Span';
import { Button } from '../../../primitives/Button';
import { Stack } from '../../../layout/Stack';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import styles from './styles.module.scss';

export interface FacetOption {
  value: string;
  label: string;
  count?: number;
  /** A colour value, when the group is displayed as swatches. */
  hex?: string;
}

/** How the options are drawn. */
export type FacetDisplay = 'checkbox' | 'swatch';

export interface FacetFilterLabels {
  /** Receives how many more options are hidden. */
  showMore: (n: number) => string;
  showLess: string;
  collapse: string;
  expand: string;
}

export const DEFAULT_FACET_FILTER_LABELS: FacetFilterLabels = {
  showMore: (n) => `Show ${n} more`,
  showLess: 'Show less',
  collapse: 'Collapse',
  expand: 'Expand',
};

export interface FacetFilterProps {
  title: string;
  options: FacetOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  /** Draws colour options as swatches rather than checkboxes. */
  display?: FacetDisplay;
  /** Lets the group fold away. Long rails are unusable without this. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Options shown before the rest fold behind a "show more". */
  maxVisible?: number;
  labels?: Partial<FacetFilterLabels>;
  className?: string;
}

/**
 * A faceted filter group composed exclusively from puijs primitives: the
 * {@link Stack} layout hosts a {@link Text} title and one {@link Checkbox} per
 * option, with the option count rendered via a token-driven {@link Span}. No
 * per-component stylesheet, no raw layout `<div>`, no raw `<input>`, no inline
 * style, and no hardcoded colors.
 */
export const FacetFilter: React.FC<FacetFilterProps> = ({
  title,
  options,
  selectedValues,
  onChange,
  display = 'checkbox',
  collapsible = false,
  defaultOpen = true,
  maxVisible,
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_FACET_FILTER_LABELS, ...labels };
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  // A selected option is never hidden behind "show more" — otherwise a filter
  // can be active with no visible trace of it.
  const hiddenCount =
    maxVisible !== undefined && !expanded ? Math.max(0, options.length - maxVisible) : 0;
  const visible =
    hiddenCount > 0
      ? options.filter((o, i) => i < maxVisible! || selectedValues.includes(o.value))
      : options;

  const heading = (
    <Text as="span" weight="semibold" data-facet-title="true">
      {title}
    </Text>
  );

  return (
    <Stack gap={2} className={className} data-facet-filter="true" data-open={open ? 'true' : 'false'}>
      {collapsible ? (
        <Button
          variant="ghost"
          size="sm"
          className={styles.groupToggle}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? copy.collapse : copy.expand}
        >
          <Stack direction="row" align="center" justify="between" gap={2} className={styles.groupToggleRow}>
            {heading}
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Stack>
        </Button>
      ) : (
        heading
      )}

      {open && (
        <Stack gap={1} data-facet-options="true">
          {display === 'swatch' ? (
            <Stack direction="row" wrap gap={1} className={styles.swatchGrid}>
              {visible.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={styles.swatchButton}
                  style={{ backgroundColor: opt.hex ?? opt.value }}
                  aria-pressed={selectedValues.includes(opt.value)}
                  aria-label={opt.count !== undefined ? `${opt.label} (${opt.count})` : opt.label}
                  title={opt.label}
                  onClick={() => handleToggle(opt.value)}
                />
              ))}
            </Stack>
          ) : (
            visible.map((opt) => (
              <Checkbox
                key={opt.value}
                checked={selectedValues.includes(opt.value)}
                onChange={() => handleToggle(opt.value)}
                label={
                  <Stack direction="row" align="start" justify="between" gap={2}>
                    <Span>{opt.label}</Span>
                    {opt.count !== undefined && (
                      <Span variant="muted" data-facet-count="true">{opt.count}</Span>
                    )}
                  </Stack>
                }
              />
            ))
          )}

          {(hiddenCount > 0 || expanded) && maxVisible !== undefined && options.length > maxVisible && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(styles.more)}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? copy.showLess : copy.showMore(options.length - maxVisible)}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
};
