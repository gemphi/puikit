'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';
import { Stack } from '../../layout/Stack';
import { usePortalTarget } from '../usePortalTarget';
import styles from './styles.module.scss';

type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
type PopoverProps = {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
  /** Render the content in document.body, positioned against the trigger — use inside clipping containers (cards, scroll areas). */
  portal?: boolean;
  className?: string;
  contentClassName?: string;
};

const GAP = 4;
/** Fixed-position coordinates for portalled content, kept inside the viewport. */
const place = (r: DOMRect, p: Placement): React.CSSProperties => {
  const vw = window.innerWidth;
  const s: React.CSSProperties = { position: 'fixed', margin: 0 };
  if (p.startsWith('bottom')) s.top = r.bottom + GAP; else s.bottom = window.innerHeight - r.top + GAP;
  if (p.endsWith('start')) s.left = Math.max(8, Math.min(r.left, vw - 8 - 200)); else s.right = Math.max(8, vw - r.right);
  return s;
};

export const Popover = ({
  isOpen: controlledOpen,
  onOpenChange,
  trigger,
  children,
  placement = 'bottom-start',
  portal = false,
  className = '',
  contentClassName = '',
}: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const ref = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const target = usePortalTarget();
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const change = useRef(onOpenChange); change.current = onOpenChange;

  const setOpen = (value: boolean) => {
    if (change.current) {
      change.current(value);
    } else {
      setInternalOpen(value);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const n = e.target as Node;
      if (ref.current && !ref.current.contains(n) && !(content.current && content.current.contains(n))) {
        setOpen(false);
      }
    };
    // Escape closes too (keyboard users never get stuck in an open popover).
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', onKey); };
  }, []);

  // Portalled content follows the trigger on scroll and resize.
  useLayoutEffect(() => {
    if (!portal || !open || !ref.current) { setPos(null); return; }
    const update = () => ref.current && setPos(place(ref.current.getBoundingClientRect(), placement));
    update();
    window.addEventListener('resize', update); window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [portal, open, placement]);

  const body = (
    <Stack direction="column" ref={content} className={cn(styles.content, !portal && styles[placement], contentClassName)} style={portal ? pos ?? { visibility: 'hidden' } : undefined}>
      {children}
    </Stack>
  );

  return (
    <Stack direction="column" className={cn(styles.popover, className)} ref={ref}>
      <Stack className={styles.trigger} onClick={() => setOpen(!open)}>
        {trigger}
      </Stack>
      {open && (portal ? (target ? createPortal(body, target) : null) : body)}
    </Stack>
  );
};

Popover.displayName = 'Popover';
