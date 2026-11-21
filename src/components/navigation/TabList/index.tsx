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
  /** `center` (the default): a page's row of tabs, centred at no more than half the content's width; more tabs than fit scroll sideways
   *  in place and the row stays under the header while the page scrolls. */
  place?: 'start' | 'center';
  className?: string;
};

/**
 * One row of tabs. Labels never wrap; when the row is wider than its container it scrolls sideways (edges fade),
 * and the active indicator slides smoothly to the chosen tab, which scrolls into view. Only the tab that is on is
 * filled and underlined; the others are plain labels. The row is one stop for the Tab key: the arrows, Home and End
 * move between tabs, Enter or Space picks. Backgrounds, the active pill, radius and motion all come from theme
 * tokens (--phi-label, --phi-surface, --phi-radius-*, --phi-transition-*).
 */
export const TabList = ({ items, activeId, onChange, size = 'md', variant = 'default', place = 'center', className = '', ...rest }: TabListProps) => {
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
  // One stop for the Tab key (the tab that is on, else the first that can be picked); the arrows move between tabs.
  const stop = items.find((x) => x.id === activeId && !x.disabled)?.id ?? items.find((x) => !x.disabled)?.id;
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 0, End: 0 }[e.key];
    if (step == null) return;
    const tabs = Array.from(row.current?.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])') ?? []);
    if (!tabs.length) return;
    const at = tabs.indexOf(document.activeElement as HTMLElement);
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (Math.max(at, 0) + step + tabs.length) % tabs.length;
    e.preventDefault();
    tabs[to].focus();
    tabs[to].scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };
  return (
    <Box ref={row} className={cn(styles.tabList, styles[size], styles[variant], place === 'center' && styles.center, className)} role="tablist" aria-label={rest['aria-label']} onKeyDown={onKeyDown}>
      <Box as="span" className={styles.indicator} aria-hidden="true" />
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <Box
            as="button"
            {...{ type: 'button' } /* a tab inside a form picks, it never submits the form */}
            key={item.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={item.disabled || undefined}
            tabIndex={item.id === stop ? 0 : -1}
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
