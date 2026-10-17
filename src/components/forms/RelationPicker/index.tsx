'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Tag } from '../../primitives/Tag';
import { Input } from '../Input';
import { Check, X } from 'lucide-react';
import styles from './styles.module.scss';

export type RelationOption = { value: string; label: string; sub?: string };

export type RelationPickerProps = {
  options: RelationOption[];
  /** Selected ids. Always an array; a single picker holds at most one. */
  value: string[];
  onChange: (value: string[]) => void;
  /** Pick several (default) or just one. */
  multi?: boolean;
  /** Cap the number of selections. */
  max?: number;
  placeholder?: string;
  /** Hide the search box under this many options. */
  searchFrom?: number;
  emptyText?: string;
  className?: string;
};

/**
 * Pick one or several existing records to link to: the control behind a kind's relation fields (a pool's clubs, a
 * club's world). Selected records show as removable chips; a search box filters the rest; clicking a row links or
 * unlinks it. Single mode keeps one. Options come from the items of the target kind, so forms carry linked data with
 * the same paradigm as everything else. Surfaces and radius are theme tokens.
 */
export const RelationPicker: React.FC<RelationPickerProps> = ({
  options, value, onChange, multi = true, max, placeholder, searchFrom = 6, emptyText = 'No matches', className = '',
}) => {
  const [q, setQ] = React.useState('');
  const picked = new Set(value);
  const byId = React.useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const atMax = multi && max != null && value.length >= max;

  const toggle = (id: string) => {
    if (!multi) { onChange(value[0] === id ? [] : [id]); return; }
    if (picked.has(id)) onChange(value.filter((v) => v !== id));
    else if (!atMax) onChange([...value, id]);
  };

  const ql = q.trim().toLowerCase();
  const list = ql ? options.filter((o) => o.label.toLowerCase().includes(ql) || o.sub?.toLowerCase().includes(ql)) : options;

  return (
    <Stack direction="column" gap={2} className={cn(styles.root, className)}>
      {value.length > 0 && (
        <Stack direction="row" gap={1} wrap className={styles.chips}>
          {value.map((id) => {
            const o = byId.get(id);
            return (
              <Tag key={id} round size="sm" intent="primary" className={styles.chip}>
                {o?.label ?? id}
                <Box as="button" className={styles.chipX} aria-label={`Remove ${o?.label ?? id}`} onClick={() => toggle(id)}><X size={12} /></Box>
              </Tag>
            );
          })}
        </Stack>
      )}
      {options.length >= searchFrom && (
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder ?? 'Search to link'} aria-label={placeholder ?? 'Search to link'} />
      )}
      <Box className={styles.list} role="listbox" aria-multiselectable={multi || undefined}>
        {list.length === 0 ? (
          <Text size="sm" intent="muted" className={styles.empty}>{emptyText}</Text>
        ) : list.map((o) => {
          const on = picked.has(o.value);
          return (
            <Box
              as="button"
              key={o.value}
              className={cn(styles.row, on && styles.on)}
              role="option"
              aria-selected={on}
              data-disabled={!on && atMax ? 'true' : undefined}
              onClick={() => toggle(o.value)}
            >
              <Box as="span" className={styles.mark} aria-hidden="true">{on ? <Check size={14} /> : null}</Box>
              <Box as="span" className={styles.rowText}>
                <Text as="span" size="sm" className={styles.rowLabel}>{o.label}</Text>
                {o.sub && <Text as="span" size="xs" intent="muted">{o.sub}</Text>}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};

export default RelationPicker;
