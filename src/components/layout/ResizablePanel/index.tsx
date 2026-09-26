import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type ResizablePanelDirection = 'horizontal' | 'vertical';

export interface ResizablePanelProps {
  panel: React.ReactNode;
  children: React.ReactNode;
  direction?: ResizablePanelDirection;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onSizeChange?: (size: number) => void;
  className?: string;
  panelClassName?: string;
  contentClassName?: string;
  panelLabel?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  panel,
  children,
  direction = 'horizontal',
  defaultSize = 280,
  minSize = 200,
  maxSize = 480,
  onSizeChange,
  className = '',
  panelClassName = '',
  contentClassName = '',
  panelLabel = 'Resize panel',
}) => {
  const [size, setSize] = useState(defaultSize);
  const dragging = useRef(false);

  const updateSize = useCallback((next: number) => {
    const clamped = Math.min(maxSize, Math.max(minSize, next));
    setSize(clamped);
    onSizeChange?.(clamped);
  }, [maxSize, minSize, onSizeChange]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      updateSize(direction === 'horizontal' ? event.clientX : event.clientY);
    };
    const onPointerUp = () => {
      dragging.current = false;
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [direction, updateSize]);

  const startDragging = () => {
    dragging.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const onHandleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 24 : 8;
    if (direction === 'horizontal' && event.key === 'ArrowLeft') updateSize(size - step);
    else if (direction === 'horizontal' && event.key === 'ArrowRight') updateSize(size + step);
    else if (direction === 'vertical' && event.key === 'ArrowUp') updateSize(size - step);
    else if (direction === 'vertical' && event.key === 'ArrowDown') updateSize(size + step);
    else return;
    event.preventDefault();
  };

  return (
    <Box
      className={cn(
        styles.root,
        direction === 'vertical' ? styles.vertical : styles.horizontal,
        className
      )}
      style={{ '--pui-resizable-size': `${size}px` } as React.CSSProperties}
    >
      <Box className={cn(styles.panel, panelClassName)}>{panel}</Box>
      <button
        type="button"
        className={styles.handle}
        role="separator"
        aria-label={panelLabel}
        aria-orientation={direction}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        aria-valuenow={size}
        onPointerDown={startDragging}
        onKeyDown={onHandleKeyDown}
      />
      <Box className={cn(styles.content, contentClassName)}>{children}</Box>
    </Box>
  );
};

ResizablePanel.displayName = 'ResizablePanel';
