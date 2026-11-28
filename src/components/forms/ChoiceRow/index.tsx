import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../../primitives/Text';
import { Button } from '../../primitives/Button';
import { Input } from '../Input';
import { Player } from '../../display/Player';
import styles from './styles.module.scss';

/** An option; with `picture` it is chosen by what it looks like, as a system's first-run screens offer a layout: its
 *  picture (a file, `image`, or something drawn, `preview`) over its name, as a Player, so it has depth and draws back
 *  under the pointer. */
export type ChoiceOption = { value: string; label: React.ReactNode; count?: number; picture?: { image?: string; preview?: React.ReactNode } };
export type ChoiceRowProps = {
  options: ChoiceOption[];
  value?: string;
  onChange: (value: string) => void;
  /** What is being chosen (read out; shown over the options when `showLabel`). */
  label: string;
  showLabel?: boolean;
  /** The narrowest an option may get; every option is the same width (default 8rem). */
  minWidth?: string;
  /** More options than this and the row shows one line of them and a glass "All N" (default 8). */
  limit?: number;
  labels?: { filter?: string; all?: (n: number) => string; less?: string };
  /** The pictures' shape, width to height, where the options have pictures. */
  ratio?: string;
  className?: string;
};

/**
 * ChoiceRow: a choice with its options in view, never a dropdown and never a long search box. The options are chips in
 * an even grid (each the same width), the chosen one lit, like a filter's options. A long list shows one line of
 * them (the chosen one first) and a glass "All N" at the end of the line; that opens every option, with a short filter
 * box beside it. One tap chooses; arrow keys move along.
 */
export const ChoiceRow = ({ options: every, value, onChange, label, showLabel, minWidth = '8rem', limit = 8, labels = {}, ratio = '4/3', className }: ChoiceRowProps) => {
  const [q, setQ] = useState(''); const [all, setAll] = useState(false);
  const long = every.length > limit, ql = q.trim().toLowerCase();
  const text = (o: ChoiceOption) => (typeof o.label === 'string' ? o.label : o.value).toLowerCase();
  const chosen = every.find((o) => o.value === value);
  // Closed: the chosen one first, then the rest in order; the grid shows only its first line.
  const options = !long ? every : all ? every.filter((o) => !ql || text(o).includes(ql)) : chosen ? [chosen, ...every.filter((o) => o !== chosen)] : every;
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const k = (i + d + options.length) % options.length;
    onChange(options[k].value);
    ((e.currentTarget.parentElement?.children[k]) as HTMLElement | undefined)?.focus();
  };
  return (
    <Box className={cn(styles.root, className)}>
      {(showLabel || (long && all)) && (
        <Box className={styles.head}>
          {showLabel && <Text size="xs" weight="bold">{label}</Text>}
          {long && all && <Input className={styles.filter} value={q} placeholder={labels.filter ?? 'Filter'} aria-label={(labels.filter ?? 'Filter') + ': ' + label} onChange={(e) => setQ(e.target.value)} />}
        </Box>
      )}
      <Box className={styles.line}>
        <Box role="radiogroup" aria-label={label} className={cn(styles.grid, long && !all && styles.one)} style={{ '--pui-choice-min': minWidth } as React.CSSProperties}>
          {options.map((o, i) => {
            const on = o.value === value;
            return (
              <Box as="button" {...({ type: 'button' } as object)} key={o.value} role="radio" aria-checked={on} tabIndex={on || (!value && i === 0) ? 0 : -1}
                className={cn(styles.option, o.picture && styles.pictured, on && styles.on)} onClick={() => onChange(o.value)} onKeyDown={(e: React.KeyboardEvent) => move(e, i)}>
                {o.picture && <Player image={o.picture.image} label={typeof o.label === 'string' ? o.label : o.value} ratio={ratio} selected={on}>{o.picture.preview}</Player>}
                <Text as="span" size="xs" truncate>{o.label}</Text>
                {o.count != null && <Text as="span" size="xs" intent="muted" numeric>{o.count}</Text>}
              </Box>
            );
          })}
        </Box>
        {long && (
          <Button variant="glass" className={styles.all} aria-expanded={all} onClick={() => { setAll(!all); setQ(''); }}>
            {all ? labels.less ?? 'Fewer' : (labels.all ?? ((n: number) => `All ${n}`))(every.length)}
          </Button>
        )}
      </Box>
    </Box>
  );
};
