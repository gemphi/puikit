import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Maximize2, Minimize2, PanelBottomOpen, RotateCcw, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import styles from './styles.module.scss';

export type SectionDef = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  /** One plain line under the title. */
  hint?: React.ReactNode;
  /** Expand: this section takes the whole column (the others fold away) and back. */
  expandable?: boolean;
  /** Fold to its header and open again. */
  collapsible?: boolean;
  /** Close: the section waits in the reopen strip at the foot. */
  closable?: boolean;
  /** Start folded. */
  defaultCollapsed?: boolean;
  actions?: React.ReactNode;
  hidden?: boolean;
  label?: string;
};

export type SectionsProps = {
  sections: SectionDef[];
  className?: string;
  /** Up and down arrows on the right of every header move the section, so the reader sets the order. */
  reorderable?: boolean;
  /** Remember the order, the folded and the closed sections on this device under this key. */
  storageKey?: string;
  /** Header size: `sm` inside sheets and cards, `lg` for the sections of a page. */
  size?: 'sm' | 'lg';
  /** `card` (default) frames every section; `plain` leaves the page background. */
  variant?: 'card' | 'plain';
  expandLabel?: string; collapseLabel?: string; foldLabel?: string; closeLabel?: string; upLabel?: string; downLabel?: string; resetLabel?: string;
};

type Saved = { order?: string[]; closed?: Record<string, boolean>; folded?: Record<string, boolean> };
const load = (key?: string): Saved => { if (!key || typeof localStorage === 'undefined') return {}; try { return JSON.parse(localStorage.getItem('pui:sections:' + key) ?? '{}') as Saved; } catch { return {}; } };
const save = (key: string | undefined, v: Saved) => { if (!key || typeof localStorage === 'undefined') return; try { localStorage.setItem('pui:sections:' + key, JSON.stringify(v)); } catch { /* storage off */ } };

/**
 * Sections, the vertical twin of Columns: rows that each expand to the whole column, fold to their header, close into
 * a reopen strip and (with `reorderable`) move up and down, with every control on the right of the header. With
 * `storageKey` the reader's layout is kept; a reset in the strip puts it back. Together with Columns every area of a
 * sheet or a page opens, folds, closes and moves the same way.
 */
export const Sections = ({ sections, className, reorderable = false, storageKey, size = 'sm', variant = 'card', expandLabel = 'Expand', collapseLabel = 'Restore', foldLabel = 'Fold', closeLabel = 'Close', upLabel = 'Move up', downLabel = 'Move down', resetLabel = 'Reset layout' }: SectionsProps) => {
  const [saved] = useState(() => load(storageKey));
  const [closed, setClosed] = useState<Record<string, boolean>>(saved.closed ?? {});
  const [folded, setFolded] = useState<Record<string, boolean>>(() => saved.folded ?? Object.fromEntries(sections.filter((x) => x.defaultCollapsed).map((x) => [x.id, true])));
  const [order, setOrder] = useState<string[]>(saved.order ?? []);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => { save(storageKey, { order, closed, folded }); }, [storageKey, order, closed, folded]);
  const rank = (id: string) => { const i = order.indexOf(id); return i < 0 ? order.length + sections.findIndex((x) => x.id === id) : i; };
  const live = sections.filter((x) => !x.hidden).sort((a, b) => rank(a.id) - rank(b.id));
  const shut = live.filter((x) => closed[x.id]);
  const open = live.filter((x) => !closed[x.id]);
  const shown = open.filter((x) => !expanded || x.id === expanded);
  const name = (x: SectionDef) => x.label ?? (typeof x.title === 'string' ? x.title : x.id);
  const move = (id: string, by: number) => {
    const ids = live.map((x) => x.id); const visible = open.map((x) => x.id); const at = visible.indexOf(id); const other = visible[at + by]; if (!other) return;
    const a = ids.indexOf(id), b = ids.indexOf(other); [ids[a], ids[b]] = [ids[b], ids[a]]; setOrder(ids);
  };
  const changed = order.length > 0 || Object.keys(closed).some((k) => closed[k]);
  const reset = () => { setOrder([]); setClosed({}); setFolded(Object.fromEntries(sections.filter((x) => x.defaultCollapsed).map((x) => [x.id, true]))); setExpanded(null); };
  const icon = size === 'lg' ? 17 : 15;
  return (
    <Box className={cn(styles.stack, styles[variant], styles[size], className)} data-expanded={expanded ?? undefined}>
      {shown.map((x) => {
        const isExp = expanded === x.id; const isFold = !!folded[x.id] && !isExp; const at = open.indexOf(x);
        return (
          <Box key={x.id} as="section" className={cn(styles.section, isExp && styles.exp, isFold && styles.folded)} aria-label={name(x)} data-section={x.id}>
            <Box className={styles.head}>
              <Box className={styles.title}>
                {typeof x.title === 'string' ? (size === 'lg' ? <Title level={3} size="lg">{x.title}</Title> : <Text size="sm" weight="semibold">{x.title}</Text>) : x.title}
                {x.hint && !isFold && <Text size="sm" intent="muted">{x.hint}</Text>}
              </Box>
              {x.actions}
              {reorderable && !expanded && <>
                <Button variant="icon" size="sm" onClick={() => move(x.id, -1)} disabled={at <= 0} aria-label={upLabel}><ArrowUp size={icon} /></Button>
                <Button variant="icon" size="sm" onClick={() => move(x.id, 1)} disabled={at >= open.length - 1} aria-label={downLabel}><ArrowDown size={icon} /></Button>
              </>}
              {x.collapsible && !isExp && (
                <Button variant="icon" size="sm" onClick={() => setFolded({ ...folded, [x.id]: !isFold })} aria-label={isFold ? expandLabel : foldLabel} aria-expanded={!isFold}>
                  {isFold ? <ChevronDown size={icon} /> : <ChevronUp size={icon} />}
                </Button>
              )}
              {x.expandable && (
                <Button variant="icon" size="sm" onClick={() => setExpanded(isExp ? null : x.id)} aria-label={isExp ? collapseLabel : expandLabel} aria-pressed={isExp}>
                  {isExp ? <Minimize2 size={icon} /> : <Maximize2 size={icon} />}
                </Button>
              )}
              {x.closable && (
                <Button variant="icon" size="sm" onClick={() => { if (isExp) setExpanded(null); setClosed({ ...closed, [x.id]: true }); }} aria-label={closeLabel}><X size={icon} /></Button>
              )}
            </Box>
            {!isFold && <Box className={styles.body}>{x.content}</Box>}
          </Box>
        );
      })}
      {(shut.length > 0 || (reorderable && changed)) && (
        <Box className={styles.strip} aria-label="Closed sections">
          {shut.map((x) => <Button key={x.id} size="sm" variant="ghost" icon={<PanelBottomOpen size={14} />} onClick={() => setClosed({ ...closed, [x.id]: false })}>{name(x)}</Button>)}
          {reorderable && changed && <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={reset}>{resetLabel}</Button>}
        </Box>
      )}
    </Box>
  );
};
