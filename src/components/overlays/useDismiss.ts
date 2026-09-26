'use client';

import { useEffect } from 'react';

/**
 * Escape-to-dismiss for a modal surface.
 *
 * Anything carrying `aria-modal="true"` owes the keyboard a way out; without
 * it a drawer or dialog is a trap for anyone not using a mouse, and — as the
 * browser run of this library showed — an open overlay silently swallows every
 * click on the page behind it. The listener is bound only while the surface is
 * open, and is capture-phase so a nested surface closes before its parent.
 */
export function useDismiss(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, onClose]);
}
