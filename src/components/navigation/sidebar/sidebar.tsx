import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export type SidebarContextType = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarHovered: boolean;
  setSidebarHovered: (hovered: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a Sidebar component');
  }
  return context;
};

/** The context if one is above, or undefined — for compositions outside the rail. */
export const useOptionalSidebarContext = () => useContext(SidebarContext);

/**
 * Owns the collapse state above the rail, so surfaces outside the `<aside>` —
 * a comments panel, a player page — can contract and restore it. Without one,
 * `Sidebar` owns its own state exactly as before.
 */
export const SidebarProvider = ({
  children,
  defaultCollapsed = false,
  /** Below this viewport width the rail contracts on its own. */
  collapseBelow,
}: { children: ReactNode; defaultCollapsed?: boolean; collapseBelow?: number }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    if (!collapseBelow || typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${collapseBelow}px)`);
    const apply = () => {
      if (mq.matches) setSidebarCollapsed(true);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [collapseBelow]);

  return (
    <SidebarContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed, sidebarHovered: false, setSidebarHovered: () => {} }}>
      {children}
    </SidebarContext.Provider>
  );
};

/**
 * While `active`, contract the rail to its icon strip; when it ends, restore
 * whatever state the viewer had. The reference contracts its nav whenever a
 * side panel needs the room.
 */
export function useSidebarContraction(active: boolean): void {
  const ctx = useOptionalSidebarContext();
  const set = ctx?.setSidebarCollapsed;
  const collapsedRef = useRef(false);
  collapsedRef.current = ctx?.sidebarCollapsed ?? false;
  const prev = useRef<boolean | null>(null);

  useEffect(() => {
    if (!set) return;
    if (active) {
      if (prev.current === null) prev.current = collapsedRef.current;
      set(true);
    } else if (prev.current !== null) {
      set(prev.current);
      prev.current = null;
    }
  }, [active, set]);

  // Leaving the page mid-panel still hands the rail back.
  useEffect(
    () => () => {
      if (prev.current !== null && set) set(prev.current);
    },
    [set]
  );
}

export type SidebarProps = React.HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  defaultCollapsed?: boolean;
  /**
   * `flush` (the default) sits the rail on the page with a single dividing
   * edge. `panel` detaches it as a raised card, for layouts that want it
   * floating.
   */
  variant?: 'flush' | 'panel';
  className?: string;
  disableSpacer?: boolean;
};

/**
 * The navigation rail.
 *
 * It is an `<aside>`, not a card. A rail built on `Card` inherited a second
 * surface it never wanted — the card's own background, border, radius and
 * padding — so the rail read as a panel floating on the page and its contents
 * carried two nested insets that never quite lined up. Here the element owns
 * only what a rail owns: a width, a dividing edge, and one inset decided in
 * `SidebarBody`.
 *
 * Any additional DOM attributes (e.g. `data-collapsed`) are forwarded to the
 * root, so compositions such as {@link SidebarBrand} can express state as data
 * attributes without introducing a wrapper.
 */
export const Sidebar = ({ children, defaultCollapsed = false, variant = 'flush', className, disableSpacer = false, ...rest }: SidebarProps) => {
  // A provider above owns the state when present; the rail stays self-owned otherwise.
  const outer = useContext(SidebarContext);
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
  const sidebarCollapsed = outer ? outer.sidebarCollapsed : localCollapsed;
  const setSidebarCollapsed = outer ? outer.setSidebarCollapsed : setLocalCollapsed;

  return (
    <SidebarContext.Provider value={outer ?? { sidebarCollapsed, setSidebarCollapsed, sidebarHovered: false, setSidebarHovered: () => {} }}>
      <Box
        as="aside"
        className={cn(
          'pui-sidebar',
          styles.sidebar,
          variant === 'panel' ? styles.panel : styles.flush,
          sidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
          disableSpacer && styles.sidebarInline,
          className
        )}
        {...rest}
      >
        {children}
      </Box>
    </SidebarContext.Provider>
  );
};

export const SidebarHeader = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <Box className={cn('pui-sidebar-header', styles.sidebarHeader, className)}>
      {children}
    </Box>
  );
};

export const SidebarBody = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <Box className={cn('pui-sidebar-body', styles.sidebarBody, className)}>
      {children}
    </Box>
  );
};

export const SidebarFooter = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <Box className={cn('pui-sidebar-footer', styles.sidebarFooter, className)}>
      {children}
    </Box>
  );
};

export default Sidebar;
