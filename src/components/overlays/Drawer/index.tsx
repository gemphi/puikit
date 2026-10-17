'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePortalTarget } from '../usePortalTarget';
import { useDismiss } from '../useDismiss';
import { ChevronDown, ChevronUp, Maximize2, Minimize2, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../primitives/Button';
import { Title } from '../../primitives/Title';
import { Stack } from '../../layout/Stack';
import { Box } from '../../layout/Box';
import { Card, CardHeader, CardBody, CardFooter } from '../../display/card';
import styles from './styles.module.scss';

export const DRAWER_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  /** A bottom sheet: slides up, full width, `size` sets its height. */
  BOTTOM: 'bottom',
} as const;

export type DrawerPosition = (typeof DRAWER_POSITIONS)[keyof typeof DRAWER_POSITIONS];

export const DRAWER_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const;

export type DrawerSize = (typeof DRAWER_SIZES)[keyof typeof DRAWER_SIZES];

type DrawerProps = {
  isOpen: boolean;
  /** Omit on a docked sheet that cannot be closed. */
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  position?: DrawerPosition;
  size?: DrawerSize;
  className?: string;
  /** Show an expand button that grows the drawer to the full window and back. */
  expandable?: boolean;
  /** Controlled expanded state (with onExpandedChange); uncontrolled when omitted. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Accessible labels for the expand button. */
  expandLabel?: string;
  collapseLabel?: string;
  /**
   * Docked: the sheet stays on the page instead of over it. No backdrop, no focus trap, Escape does not close it, and
   * the page behind keeps working. With `position="bottom"` it is the page's bottom sheet: its header is always on
   * screen and the body folds away under it.
   */
  docked?: boolean;
  /** Folded to its header (docked sheets). Controlled with onFoldedChange; uncontrolled when omitted. */
  folded?: boolean;
  defaultFolded?: boolean;
  onFoldedChange?: (folded: boolean) => void;
  foldLabel?: string;
  unfoldLabel?: string;
  /** Header content in place of the title (a player's controls, a toolbar). The title, if any, is its label. */
  header?: React.ReactNode;
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = DRAWER_POSITIONS.RIGHT,
  size = DRAWER_SIZES.MD,
  className = '',
  expandable = false,
  expanded,
  onExpandedChange,
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
  docked = false,
  folded,
  defaultFolded = false,
  onFoldedChange,
  foldLabel = 'Fold',
  unfoldLabel = 'Unfold',
  header,
}: DrawerProps) => {
  const [ownExpanded, setOwnExpanded] = useState(false);
  const [ownFolded, setOwnFolded] = useState(defaultFolded);
  const isFolded = docked && (folded ?? ownFolded);
  const setFolded = (v: boolean) => { if (folded === undefined) setOwnFolded(v); onFoldedChange?.(v); if (v && isExpanded) setExpanded(false); };
  const isExpanded = expanded ?? ownExpanded;
  const setExpanded = (v: boolean) => { if (expanded === undefined) setOwnExpanded(v); onExpandedChange?.(v); };
  // Hooks run unconditionally; the early returns come after.
  // `portalTarget` is null during server rendering, where there is no DOM.
  const portalTarget = usePortalTarget();
  useDismiss(isOpen && !docked && !!onClose, onClose ?? (() => {}));
  if (!isOpen) return null;

  const sheet = (
      <Card hoverable={false} tint="none" className={cn('pui-drawer', styles.drawer, styles[position], styles[size], isExpanded && styles.expanded, isFolded && styles.folded)} data-expanded={isExpanded || undefined} data-folded={isFolded || undefined}>
        <CardHeader className={cn(header != null && styles.headerBar)} action={
          <Stack direction="row" gap={1} align="center">
            {docked && (
              <Button variant="icon" size="sm" onClick={() => setFolded(!isFolded)} aria-label={isFolded ? unfoldLabel : foldLabel} aria-expanded={!isFolded}>
                {isFolded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            )}
            {expandable && !isFolded && (
              <Button variant="icon" size="sm" onClick={() => setExpanded(!isExpanded)} aria-label={isExpanded ? collapseLabel : expandLabel} aria-pressed={isExpanded}>
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            )}
            {onClose && <Button variant="icon" size="sm" onClick={onClose} aria-label="Close"><X size={18} /></Button>}
          </Stack>
        }>
          {header != null ? header : title && <Title variant="h3" className={styles.title}>{title}</Title>}
        </CardHeader>
        {position === DRAWER_POSITIONS.BOTTOM && (docked
          ? <Box as="button" className={cn(styles.handle, styles.handleButton)} onClick={() => setFolded(!isFolded)} aria-label={isFolded ? unfoldLabel : foldLabel} />
          : <Stack className={styles.handle} aria-hidden="true" />)}
        {!isFolded && <CardBody className={styles.body}>
          {children}
        </CardBody>}
        {footer && !isFolded && <CardFooter className={styles.footer}>{footer}</CardFooter>}
      </Card>
  );
  // Docked: in the page's flow, stuck to the foot of the scrolling main area, so it takes the width of the content
  // (never over a sidebar) and the page scrolls clear of it with no spacer.
  if (docked) {
    return (
      <Stack className={cn(styles.dock, className)} role="region" aria-label={typeof title === 'string' ? title : undefined}>
        {sheet}
      </Stack>
    );
  }
  if (!portalTarget) return null;
  return createPortal(
    <Stack className={cn(styles.overlay, className)} role="dialog" aria-modal="true">
      <Stack className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      {sheet}
    </Stack>, portalTarget);
};
