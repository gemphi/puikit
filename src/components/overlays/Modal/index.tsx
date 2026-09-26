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

export const MODAL_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const;

export type ModalSize = (typeof MODAL_SIZES)[keyof typeof MODAL_SIZES];

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = MODAL_SIZES.LG,
  className = '',
}) => {
  // Hooks run unconditionally; the early returns come after.
  // `portalTarget` is null during server rendering, where there is no DOM.
  const portalTarget = usePortalTarget();
  useDismiss(isOpen, onClose);
  if (!isOpen || !portalTarget) return null;

  return createPortal(
    <Stack direction="row" align="center" justify="center" className={cn(styles.overlay, className)} role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, padding: '1rem' }}>
      <Stack className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <Card hoverable={false} className={cn('pui-modal', styles.modal, styles[size])}>
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

export const Dialog = Modal;
export type DialogProps = ModalProps;
