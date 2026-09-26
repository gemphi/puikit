'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { usePortalTarget } from '../usePortalTarget';
import { useDismiss } from '../useDismiss';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../primitives/Button';
import { Title } from '../../primitives/Title';
import { Stack } from '../../layout/Stack';
import { Card, CardHeader, CardBody, CardFooter } from '../../display/card';
import styles from './styles.module.scss';

export const DRAWER_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
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
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  position?: DrawerPosition;
  size?: DrawerSize;
  className?: string;
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
}: DrawerProps) => {
  // Hooks run unconditionally; the early returns come after.
  // `portalTarget` is null during server rendering, where there is no DOM.
  const portalTarget = usePortalTarget();
  useDismiss(isOpen, onClose);
  if (!isOpen || !portalTarget) return null;

  return createPortal(
    <Stack className={cn(styles.overlay, className)} role="dialog" aria-modal="true">
      <Stack className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <Card hoverable={false} className={cn('pui-drawer', styles.drawer, styles[position], styles[size])}>
        <CardHeader action={<Button variant="icon" size="sm" onClick={onClose} aria-label="Close"><X size={18} /></Button>}>
          {title && <Title variant="h3" className={styles.title}>{title}</Title>}
        </CardHeader>
        <CardBody className={styles.body}>
          {children}
        </CardBody>
        {footer && <CardFooter className={styles.footer}>{footer}</CardFooter>}
      </Card>
    </Stack>, portalTarget);
};
