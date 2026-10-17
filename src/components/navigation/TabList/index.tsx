import React, { useLayoutEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type TabListItem = {
  id: string;
  label: React.ReactNode;
  /** Leading icon or avatar. */
  icon?: React.ReactNode;
  /** Count shown after the label (e.g. results). */
  count?: number | string;
  disabled?: boolean;
};

type TabListProps = {
  items: TabListItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  size?: 'sm' | 'md';
  variant?: 'default' | 'pills';
  /** Accessible name of the tab row. */
  'aria-label'?: string;
  className?: string;
};

/**
 * One row of tabs. Labels never wrap; when the row is wider than its container it scrolls sideways (edges fade),
 * and the active indicator slides smoothly to the chosen tab, which scrolls into view. Backgrounds, the active
 * pill, radius and motion all come from theme tokens (--phi-control-*, --phi-gradient-control, --phi-radius-*,
 * --phi-transition-*).
 */
export const TabList = ({ items, activeId, onChange, size = 'md', variant = 'default', className = '', ...rest }: TabListProps) => {
  const row = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = row.current; if (!el) return;
    const edges = () => {
      const more = el.scrollWidth - el.clientWidth > 1;
      el.dataset.fadeStart = String(more && el.scrollLeft > 1);
      el.dataset.fadeEnd = String(more && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };
    const place = () => {
      edges();
      const on = el.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!on) { el.style.setProperty('--pui-tab-w', '0px'); return; }
      el.style.setProperty('--pui-tab-x', on.offsetLeft + 'px');
      el.style.setProperty('--pui-tab-w', on.offsetWidth + 'px');
      el.style.setProperty('--pui-tab-h', on.offsetHeight + 'px');
      el.style.setProperty('--pui-tab-y', on.offsetTop + 'px');
      const l = on.offsetLeft - el.scrollLeft, r = l + on.offsetWidth;
      if (l < 0 || r > el.clientWidth) el.scrollTo?.({ left: on.offsetLeft - el.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
      el.dataset.ready = 'true';
    };
    place();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    ro?.observe(el);
    el.addEventListener('scroll', edges, { passive: true });
    return () => { ro?.disconnect(); el.removeEventListener('scroll', edges); };
  }, [activeId, items.length]);
  return (
    <Box ref={row} className={cn(styles.tabList, styles[size], styles[variant], className)} role="tablist" aria-label={rest['aria-label']}>
      <Box as="span" className={styles.indicator} aria-hidden="true" />
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <Box
            as="button"
            key={item.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={item.disabled || undefined}
            tabIndex={item.disabled ? -1 : undefined}
            className={cn(styles.tab, isActive && styles.active)}
            onClick={() => { if (!item.disabled) onChange?.(item.id); }}
          >
            {item.icon && <Box as="span" className={styles.icon}>{item.icon}</Box>}
            <Box as="span">{item.label}</Box>
            {item.count != null && <Box as="span" className={styles.count}>{item.count}</Box>}
          </Box>
        );
      })}
    </Box>
  );
};

TabList.displayName = 'TabList';
