'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { Stack } from '../Stack';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import styles from './styles.module.scss';

/** One pane: an id (so its width and position travel with it), an optional title, header actions, and its content. */
export type Pane = { id: string; title?: React.ReactNode; actions?: React.ReactNode; node: React.ReactNode };

export type PanesProps = {
  panes: Pane[];
  /** Columns can be dragged wider/narrower. Default true. */
  resizable?: boolean;
  /** Columns can be moved left/right (reorders the array). Default true. */
  reorderable?: boolean;
  /** Below this many px of width per pane the panes stack into one column (no resize/reorder). Default 260. */
  minPaneWidth?: number;
  className?: string;
};

const swap = <T,>(a: T[], i: number, j: number) => { const n = a.slice(); [n[i], n[j]] = [n[j], n[i]]; return n; };

/**
 * A row of panes you can rearrange: move a column left or right (it just reindexes the array) and drag the seams to
 * resize. One shared layout — every surface that wants side-by-side, movable, resizable columns uses it, so a record
 * sheet, a workspace or a dashboard all behave the same. Stacks into a single column when there isn't room.
 * The only difference between uses is the `panes` data.
 */
export const Panes: React.FC<PanesProps> = ({ panes, resizable = true, reorderable = true, minPaneWidth = 260, className }) => {
  const ids = panes.map((p) => p.id).join('|');
  // Order and per-pane width weight are keyed by id, so both follow a pane when it moves.
  const [order, setOrder] = React.useState<string[]>(() => panes.map((p) => p.id));
  const [weights, setWeights] = React.useState<Record<string, number>>(() => Object.fromEntries(panes.map((p) => [p.id, 1])));
  const [stacked, setStacked] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ left: string; right: string; x: number; wl: number; wr: number; px: number } | null>(null);

  // Keep order/weights in step with the pane set (added or removed panes), without losing arranged state.
  React.useEffect(() => {
    const want = panes.map((p) => p.id);
    setOrder((prev) => { const kept = prev.filter((id) => want.includes(id)); const added = want.filter((id) => !kept.includes(id)); return [...kept, ...added]; });
    setWeights((prev) => { const next: Record<string, number> = {}; for (const id of want) next[id] = prev[id] ?? 1; return next; });
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stack into one column when each pane would fall below minPaneWidth.
  React.useEffect(() => {
    const el = rootRef.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setStacked(el.clientWidth < minPaneWidth * Math.min(panes.length, 2)));
    ro.observe(el); return () => ro.disconnect();
  }, [panes.length, minPaneWidth]);

  React.useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current; const el = rootRef.current; if (!d || !el) return;
      const total = d.wl + d.wr; const span = el.clientWidth || 1;
      const deltaW = ((e.clientX - d.x) / span) * (total * (order.length)); // move weight between the two neighbours
      const wl = Math.max(0.25, d.wl + deltaW); const wr = Math.max(0.25, d.wr - deltaW);
      setWeights((w) => ({ ...w, [d.left]: wl, [d.right]: wr }));
    };
    const up = () => { drag.current = null; document.body.style.removeProperty('cursor'); document.body.style.removeProperty('user-select'); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [order]);

  const startDrag = (left: string, right: string, e: React.PointerEvent) => {
    drag.current = { left, right, x: e.clientX, wl: weights[left] ?? 1, wr: weights[right] ?? 1, px: 0 };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };
  const nudge = (left: string, right: string, dir: 1 | -1) => setWeights((w) => { const wl = Math.max(0.25, (w[left] ?? 1) + dir * 0.2); const wr = Math.max(0.25, (w[right] ?? 1) - dir * 0.2); return { ...w, [left]: wl, [right]: wr }; });

  const byId = Object.fromEntries(panes.map((p) => [p.id, p]));
  const seq = order.filter((id) => byId[id]);

  return (
    <Box ref={rootRef} className={cn(styles.root, stacked && styles.stacked, className)}>
      {seq.map((id, i) => {
        const p = byId[id];
        const header = (p.title != null || (reorderable && !stacked)) ? (
          <Stack direction="row" gap={2} align="center" justify="between" className={styles.head}>
            <Box minWidth="0" flex="1">{typeof p.title === 'string' ? <Text as="span" size="xs" intent="muted" truncate className={styles.label}>{p.title}</Text> : p.title}</Box>
            <Stack direction="row" gap={1} align="center">
              {p.actions}
              {reorderable && !stacked && (
                <>
                  <Pressable className={styles.arrow} aria-label="Move left" disabled={i === 0} onClick={() => i > 0 && setOrder((o) => swap(o, i, i - 1))}><ChevronLeft size={15} /></Pressable>
                  <Pressable className={styles.arrow} aria-label="Move right" disabled={i === seq.length - 1} onClick={() => i < seq.length - 1 && setOrder((o) => swap(o, i, i + 1))}><ChevronRight size={15} /></Pressable>
                </>
              )}
            </Stack>
          </Stack>
        ) : null;
        return (
          <React.Fragment key={id}>
            {resizable && !stacked && i > 0 && (
              <Pressable
                className={styles.seam}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize columns"
                onPointerDown={(e) => startDrag(seq[i - 1], id, e)}
                onKeyDown={(e) => { if (e.key === 'ArrowLeft') { nudge(seq[i - 1], id, -1); e.preventDefault(); } else if (e.key === 'ArrowRight') { nudge(seq[i - 1], id, 1); e.preventDefault(); } }}
              ><GripVertical size={14} className={styles.grip} /></Pressable>
            )}
            <Box className={styles.pane} style={stacked ? undefined : ({ flexGrow: weights[id] ?? 1, flexBasis: 0, minWidth: 0 } as React.CSSProperties)}>
              {header}
              <Box className={styles.body} scroll="y">{p.node}</Box>
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};

Panes.displayName = 'Panes';
