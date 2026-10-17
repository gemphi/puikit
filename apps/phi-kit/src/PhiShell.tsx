import { AppShell, type AppShellGroup, Button, Stack, TabList, Text } from '@pui/components';
import { usePuiTheme } from '@pui/providers';
import React from 'react';
import { Moon, Sun, User, Settings } from 'lucide-react';
import { APPS, appUrl, assetUrl, type AppMeta, type NavItem } from './data';
import type { GridItem } from './blocks/Grid';
import { AppGlyph, NavIcon } from './icons';
import { LOOKS, useLook } from './looks';

export type AccountItem = { id: string; label: string; previews?: { id: string; label: string; sub?: string }[] };
export type ShellProps = {
  app: AppMeta; nav: NavItem[]; view: string; onView: (id: string) => void;
  right?: React.ReactNode; children: React.ReactNode;
  /** A record pulled under a menu entry was picked. */
  onRecord?: (it: GridItem) => void;
  /** The account (You) sub-nav: Overview, a leaf per profile section, Wallet, Account, Settings. */
  account?: AccountItem[];
};

/** A small icon for each account entry (bank-style): the overview, each kind, the wallet, the account, settings. */
const ACCOUNT_ICON: Record<string, string> = { _you: 'user', _wallet: 'wallet', _account: 'card', _settings: 'box', _you_pool: 'cube', _you_round: 'chart', _you_order: 'bag', _you_offer: 'coin', _you_nest: 'grid', _you_zone: 'map', _you_area: 'pin' };

/** The app's menu, as data, mapped to the shared shell: a nav item with `items` is a rail group with a sub-nav; one
 *  without is a leaf the rail navigates to. Apps are a secondary panel, never the primary rail. */
const toGroups = (nav: NavItem[]): AppShellGroup[] => nav.map((n) => ({
  id: n.id, label: n.label, icon: <NavIcon name={n.icon} size={20} />,
  items: (n.items && n.items.length ? n.items : [n]).map((it) => ({ id: it.id, label: it.label, icon: <NavIcon name={it.icon} size={18} />,
    previews: it.previews?.map((p, i) => ({ id: p.id ?? String(i), label: p.title, sub: p.sub, image: p.image ? assetUrl(p.image) : undefined })) })),
}));

/**
 * Every Phi app's shell is the puijs {@link AppShell}; this wrapper only feeds it the app's data — menu groups, the
 * app switcher, the built-in You/Settings, and the look switch. Nothing here is per-app logic.
 */
export const PhiShell: React.FC<ShellProps> = ({ app, nav, view, onView, right, onRecord, account, children }) => {
  const pulled = (leafId: string, id: string) => {
    // An account data point (You › Your rounds › a round): open that record's sheet; the leaf id carries the kind.
    if (leafId.startsWith('_you_')) { onView('#/' + leafId.slice(5) + '/' + id); return; }
    if (leafId.startsWith('_you')) { onView(leafId); return; } // Overview / Wallet / Account: go to the section
    const leaf = nav.flatMap((n) => [n, ...(n.items ?? [])]).find((n) => n.id === leafId); const it = leaf?.previews?.find((p, i) => (p.id ?? String(i)) === id); if (it) onRecord?.(it);
  };
  // The account (You) is a foot group with its own panel — the sidebar becomes the account menu, bank-style.
  const foot = account?.length
    ? [{ id: '_you', label: 'You', icon: <User size={18} />, items: account.map((a) => ({ id: a.id, label: a.label, icon: <NavIcon name={ACCOUNT_ICON[a.id] ?? 'layers'} size={18} />, previews: a.previews?.map((p) => ({ id: p.id, label: p.label, sub: p.sub })) })) }]
    : [{ id: '_you', label: 'You', icon: <User size={18} /> }, { id: '_settings', label: 'Settings', icon: <Settings size={18} /> }];
  const apps = APPS.filter((a) => a.built || a.key === app.key).map((a) => ({
    id: a.key, name: a.name, tagline: a.key === app.key ? 'This app' : a.tagline,
    href: appUrl(a.key), current: a.key === app.key, color: a.color, glyph: <AppGlyph paths={a.icon} size={20} />,
  }));
  return (
    <AppShell
      brand={{ name: app.name, tagline: app.tagline, color: app.color, glyph: <AppGlyph paths={app.icon} size={22} /> }}
      groups={toGroups(nav)} view={view} onView={onView}
      apps={apps} appsLabel="Apps"
      foot={foot}
      tools={<LookSwitch />} right={right} onPreview={(leafId, p) => pulled(leafId, p.id)}
      headerRight={<Button variant="ghost" size="sm" iconLeft={User} onClick={() => onView('_you')}>You</Button>}
    >
      {children}
    </AppShell>
  );
};

/** The look (Apple, SpaceX, Organic) and light or dark, one tap away in every app; Settings has the fine controls. */
const LookSwitch: React.FC = () => {
  const [look, setLook] = useLook();
  const { isDark, setTheme } = usePuiTheme();
  return (
    <Stack direction="column" gap={1} paddingX={2} paddingBottom={2}>
      <Stack direction="row" gap={1} align="center" justify="between">
        <Text as="span" size="xs" intent="muted">Look</Text>
        <Button variant="ghost" size="sm" onClick={() => setTheme(isDark ? 'light' : 'dark')} iconLeft={isDark ? Sun : Moon}>{isDark ? 'Light' : 'Dark'}</Button>
      </Stack>
      <TabList size="sm" variant="pills" aria-label="Look" activeId={look.id} onChange={setLook} items={LOOKS.map((l) => ({ id: l.id, label: l.label }))} />
    </Stack>
  );
};
