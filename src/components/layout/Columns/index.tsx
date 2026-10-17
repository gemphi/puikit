import React, { useState } from 'react';
import { ArrowLeft, Maximize2, Minimize2, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import styles from './styles.module.scss';

export type ColumnDef = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  /** CSS width when not expanded, e.g. '18rem'. Omit for the flexible column. */
  width?: string;
  minWidth?: string;
  /** Show a close button. With `onClose` the caller owns closing; otherwise the column folds into the reopen strip. */
  closable?: boolean;
  onClose?: () => void;
  /** Show an expand button: the column takes the whole row (others fold away) and back. */
  expandable?: boolean;
  /** Show a back arrow in the header. */
  onBack?: () => void;
  backLabel?: string;
  /** Extra header controls. */
  actions?: React.ReactNode;
  /** Not rendered at all (caller-controlled visibility). */
  hidden?: boolean;
  /** Name in the reopen strip; defaults to `title` when it is a string. */
  label?: string;
};

export type ColumnsProps = {
  columns: ColumnDef[];
  className?: string;
  expandLabel?: string;
  collapseLabel?: string;
  closeLabel?: string;
};

/**
 * A row of columns, each with a header (sized columns give way together, down to 14rem or their `minWidth`, before the
 * row scrolls) that can go back, expand to the full row and close. Closed columns wait in a
 * slim strip on the left edge and reopen with one click. Used for the agent chat sheet (agents · chat · details).
 */
export const Columns = ({ columns, className, expandLabel = 'Expand', collapseLabel = 'Restore', closeLabel = 'Close' }: ColumnsProps) => {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const live = columns.filter((c) => !c.hidden);
  const folded = live.filter((c) => closed[c.id] && !c.onClose);
  const shown = live.filter((c) => !closed[c.id] || c.onClose).filter((c) => !expanded || c.id === expanded || !live.some((x) => x.id === expanded));
  return (
    <Box className={cn(styles.row, className)} data-expanded={expanded ?? undefined}>
      {folded.length > 0 && (
        <Box className={styles.strip} aria-label="Closed columns">
          {folded.map((c) => (
            <Button key={c.id} variant="ghost" size="sm" icon={<PanelLeftOpen size={14} />} onClick={() => setClosed({ ...closed, [c.id]: false })}>
              {c.label ?? (typeof c.title === 'string' ? c.title : c.id)}
            </Button>
          ))}
        </Box>
      )}
      {shown.map((c) => {
        const isExp = expanded === c.id;
        return (
          <Box key={c.id} as="section" className={cn(styles.col, !c.width && styles.flex, isExp && styles.exp)} style={!isExp && c.width ? { width: c.width, minWidth: c.minWidth ?? `min(${c.width}, 14rem)` } : { minWidth: c.minWidth }} aria-label={c.label ?? (typeof c.title === 'string' ? c.title : undefined)} data-column={c.id}>
            <Box className={styles.head}>
              {c.onBack && <Button variant="icon" size="sm" onClick={c.onBack} aria-label={c.backLabel ?? 'Back'}><ArrowLeft size={16} /></Button>}
              <Box className={styles.title}>{typeof c.title === 'string' ? <Text size="sm" weight="semibold">{c.title}</Text> : c.title}</Box>
              {c.actions}
              {c.expandable && (
                <Button variant="icon" size="sm" onClick={() => setExpanded(isExp ? null : c.id)} aria-label={isExp ? collapseLabel : expandLabel} aria-pressed={isExp}>
                  {isExp ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </Button>
              )}
              {c.closable && (
                <Button variant="icon" size="sm" onClick={() => { if (isExp) setExpanded(null); if (c.onClose) c.onClose(); else setClosed({ ...closed, [c.id]: true }); }} aria-label={closeLabel}>
                  <X size={16} />
                </Button>
              )}
            </Box>
            <Box className={styles.body}>{c.content}</Box>
          </Box>
        );
      })}
    </Box>
  );
};
