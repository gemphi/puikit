import type React from 'react';

/** A record a menu entry pulls in (its top five pools, the latest runs): shown folded under the entry. `avatar` draws
 *  the row's picture instead of the initials, `meta` sits at the row's end (a count, a time), `onSelect` opens it. */
export type AppShellPreview = { id: string; label: string; sub?: string; image?: string; avatar?: React.ReactNode; meta?: string; onSelect?: () => void };
/** A menu entry. With `items` it is a foot entry with its own panel (the account sub-nav, bank-style). With `panel` it
 *  folds that content open instead of going anywhere (an appearance panel); `open` folds it open at first. `inline`
 *  puts it on the row of the entry before it. */
export type AppShellLeaf = {
  id: string; label: string; icon?: React.ReactNode; previews?: AppShellPreview[]; items?: AppShellLeaf[];
  panel?: React.ReactNode; open?: boolean; inline?: boolean;
};
/** A run of entries in a group's menu; the `end` one sits at the panel's foot. */
export type AppShellSection = { id: string; items: AppShellLeaf[]; end?: boolean };
export type AppShellGroup = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** The group's sub-nav. A single item whose id is the group id makes the group a leaf (the rail icon navigates). */
  items: AppShellLeaf[];
  /** The sub-nav in runs, each its own pane in the panel; `items` is then every entry of every run. */
  sections?: AppShellSection[];
  /** Where on the rail: with the first groups (the default), in the middle, or at the foot. */
  place?: 'top' | 'center' | 'bottom';
  /** Where picking the group goes as well as opening its menu (the group's own page). */
  to?: string;
};
export type AppShellApp = {
  id: string; name: string; tagline?: string; href?: string; current?: boolean; glyph?: React.ReactNode; color?: string;
  /** Listed only once the switcher's "more apps" is opened. */
  more?: boolean;
};
/** A phone tab: below the phone width the rail gives way to a bar of these at the foot, beside the menu. */
export type AppShellTab = { id: string; label: string; icon?: React.ReactNode };
/** Words the shell says, English by default. */
export type AppShellLabels = {
  openMenu: string; closeMenu: string; menu: string; moreApps: string;
  fold: (label: string, open: boolean) => string;
};

/** The page a group is, when it is one page and no menu: its single entry, which carries the group's own id. */
export const leafOf = (g: AppShellGroup) => (g.items.length === 1 && g.items[0].id === g.id && !g.sections ? g.items[0] : null);
/** Every entry of a group, its runs flattened. */
export const entriesOf = (g: AppShellGroup) => (g.sections ? g.sections.flatMap((s) => s.items) : g.items);
