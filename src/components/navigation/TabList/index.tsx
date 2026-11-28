import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

export type TabPlacement = 'start' | 'center' | 'rail';
/**
 * Where the tabs inside stand, said by what holds them: a record's page and a full-screen view say `rail`, so the
 * tabs a page hands them (written as a row) are drawn as the bar at the left, and no page says it for itself.
 */
export const TabPlace = createContext<TabPlacement | undefined>(undefined);

type TabListProps = {
  items: TabListItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  size?: 'sm' | 'md';
  variant?: 'default' | 'pills';
  /** Accessible name of the tab row. */
  'aria-label'?: string;
  /** `center` (the default): a page's row of tabs, centred at no more than half the content's width; more tabs than fit scroll sideways
   *  in place and the row stays under the header while the page scrolls. `rail`: the tabs as a bar standing at the
   *  side of what they head, each an icon over its word; what holds it (a record's page, a full-screen view) stands
   *  it at the left, clear of the content. */
  place?: TabPlacement;
  className?: string;
};

/**
 * One row of tabs. Labels never wrap; when the row is wider than its container it scrolls sideways (edges fade),
 * and the active indicator slides smoothly to the chosen tab, which scrolls into view. Only the tab that is on is
 * filled and underlined; the others are plain labels. The row is one stop for the Tab key: the arrows, Home and End
 * move between tabs, Enter or Space picks. Backgrounds, the active pill, radius and motion all come from theme
 * tokens (--phi-label, --phi-surface, --phi-radius-*, --phi-transition-*).
 */
export const TabList = ({ items, activeId, onChange, size = 'md', variant = 'default', place: asked = 'center', className = '', ...rest }: TabListProps) => {
  const place = useContext(TabPlace) ?? asked; const rail = place === 'rail';
  const row = useRef<HTMLElement | null>(null);
  // The rail is its icons alone: a tab's word comes up beside the rail, at the right, while the tab is pointed at or
  // focused. It is drawn on the page itself, since the rail scrolls inside itself and would cut it off.
  const [tip, setTip] = useState<{ label: React.ReactNode; x: number; y: number } | null>(null);
  const point = (label: React.ReactNode) => (e: React.SyntheticEvent<HTMLElement>) => {
    const tab = e.currentTarget.getBoundingClientRect(); const bar = row.current?.getBoundingClientRect() ?? tab;
    setTip({ label, x: bar.right + 8, y: tab.top + tab.height / 2 });
  };
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
  return (<>
    <Box ref={row} className={cn(styles.tabList, rail ? styles.rail : [styles[size], styles[variant], place === 'center' && styles.center], className)} role="tablist" aria-label={rest['aria-label']}
      aria-orientation={rail ? 'vertical' : undefined} data-place={place} onKeyDown={onKeyDown}>
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
            {...(rail && item.icon ? { onMouseEnter: point(item.label), onFocus: point(item.label), onMouseLeave: () => setTip(null), onBlur: () => setTip(null) } : {})}
          >
            {item.icon && <Box as="span" className={styles.icon}>{item.icon}</Box>}
            <Box as="span" className={styles.word}>{item.label}</Box>
            {/* The rail shows no numbers: a tab is its icon, its word on hover. */}
            {item.count != null && !rail && <Box as="span" className={styles.count}>{item.count}</Box>}
          </Box>
        );
      })}
    </Box>
    {tip && typeof document !== 'undefined' && createPortal(<span className={styles.railTip} style={{ left: tip.x, top: tip.y }} aria-hidden="true">{tip.label}</span>, document.body)}
  </>);
};

TabList.displayName = 'TabList';

export type TabRailProps = Pick<TabListProps, 'items' | 'activeId' | 'onChange' | 'aria-label'> & {
  /** What the tab that is on shows. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * Tabs beside what they show, inside a sheet, a drawer or a column: the rail at the left, held in view while the
 * content scrolls, a gap between them so the tabs never touch the content. One tab or none: the content alone.
 * (A whole page or a full-screen view stands the rail at its own edge: EntityLayout, FullScreen.)
 */
export const TabRail = ({ items, activeId, onChange, children, className, ...rest }: TabRailProps) => {
  const on = items.find((x) => x.id === activeId);
  return (
    <Box className={cn(styles.beside, className)}>
      {items.length > 1 && <Box className={styles.held}><TabList place="rail" items={items} activeId={activeId} onChange={onChange} aria-label={rest['aria-label']} /></Box>}
      <Box className={styles.shown} role="tabpanel" aria-label={typeof on?.label === 'string' ? on.label : undefined}>{children}</Box>
    </Box>
  );
};
