import type React from 'react';

/** A record a menu entry pulls in (its top five pools, the latest runs): shown folded under the entry. */
export type AppShellPreview = { id: string; label: string; sub?: string; image?: string };
/** A leaf, or (when it carries `items`) a foot entry with its own panel — the account/profile sub-nav, bank-style. */
export type AppShellLeaf = { id: string; label: string; icon?: React.ReactNode; previews?: AppShellPreview[]; items?: AppShellLeaf[] };
export type AppShellGroup = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** The group's sub-nav. A single item whose id is the group id makes the group a leaf (the rail icon navigates). */
  items: AppShellLeaf[];
};
export type AppShellApp = {
  id: string; name: string; tagline?: string; href?: string; current?: boolean; glyph?: React.ReactNode; color?: string;
};
