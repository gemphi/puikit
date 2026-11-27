import { AppShell, type AppShellGroup, type AppShellLeaf, Avatar, columnStore, useColumnEntries } from '@pui/components';
import React from 'react';
import { Columns3, Eye, EyeOff, User, Settings } from 'lucide-react';
import { APPS, appUrl, assetUrl, type AppMeta, type NavItem } from './data';
import type { GridItem } from './blocks/Grid';
import { AppGlyph, NavIcon } from './icons';
import { Face, READ, crowdOf, waitingIn, type People } from './people';
import { VoiceBar, VoiceLine, useInside } from './voice';
import { counted, useNotice } from './notice';
import { Reminder } from './keep';
import { AccountDrawer } from './AccountDrawer';

export type AccountItem = { id: string; label: string; previews?: { id: string; label: string; sub?: string }[] };
export type ShellProps = {
  app: AppMeta; nav: NavItem[]; view: string; onView: (id: string) => void;
  right?: React.ReactNode; children: React.ReactNode;
  /** The right sidebar's groups, as data, like `nav` (the app's config `side`). */
  side?: NavItem[];
  /** A record pulled under a menu entry was picked. */
  onRecord?: (it: GridItem) => void;
  /** The account (You) sub-nav: Overview, a leaf per profile section, Wallet, Account, Settings. */
  account?: AccountItem[];
  /** The app's people, for the entries that are one (`who`): their picture and presence stand where the icon would. */
  people?: People | null;
};

/** A small icon for each account entry (bank-style): the overview, each kind, the wallet, the account, settings. */
const ACCOUNT_ICON: Record<string, string> = { _you: 'user', _wallet: 'wallet', _account: 'card', _settings: 'box', _you_pool: 'cube', _you_round: 'chart', _you_order: 'bag', _you_offer: 'coin', _you_nest: 'grid', _you_zone: 'map', _you_area: 'pin' };

/** The app's menu, as data, mapped to the shared shell: a nav item with `items` is a rail group with a sub-nav; one
 *  without is a leaf the rail navigates to. Apps are a secondary panel, never the primary rail. */
const toGroups = (nav: NavItem[], crowd?: Crowd): AppShellGroup[] => {
  const people = crowd?.people;
  // An entry, and its own entries under it at any depth. A person's entry shows their picture and presence; a heading
  // shows no icon and starts open; a voice room's entry always shows who is in it, and a press on one goes to the room.
  const leaf = (it: NavItem): AppShellLeaf => ({
    id: it.id, label: it.label, head: it.head, open: it.head, steady: !!it.crowd || undefined,
    count: it.count ?? (people && crowd ? counted(crowd.notice, crowd.app, it.id, (people.room?.[it.id] as { space?: string } | undefined)?.space, waitingIn(people, crowd.app, it.id, crowd.read)) || undefined : undefined),
    icon: it.head ? undefined : it.who && people ? <Face file={people} m={people.member.find((m) => m.id === it.who)} size="sm" dot /> : <NavIcon name={it.icon} size={18} />,
    items: it.items?.length ? it.items.map(leaf) : undefined,
    previews: it.crowd && crowd && people
      ? crowdOf(people, it.crowd, !!crowd.joined[crowd.app + '/' + it.crowd]).map((m) => ({ id: m.id, label: m.name, sub: m.state, avatar: <Face file={people} m={m} size="xs" dot />, onSelect: () => crowd.go(it.id) }))
      : it.previews?.map((p, i) => ({ id: p.id ?? String(i), label: p.title, sub: p.sub, image: p.image ? assetUrl(p.image) : undefined })),
  });
  // What waits in a group is what waits in its entries, at any depth.
  const sum = (list: AppShellLeaf[]): number => list.reduce((n, it) => n + (it.count ?? 0) + sum(it.items ?? []), 0);
  return nav.map((n) => { const items = (n.items && n.items.length ? n.items : [{ ...n, items: undefined }]).map(leaf); return { id: n.id, label: n.label, items, count: sum(items),
    icon: n.mark ? <Avatar size="sm" deck={0} alt={n.label} sprite={{ src: assetUrl(n.mark.sheet), cols: n.mark.cols, index: n.mark.index }} /> : <NavIcon name={n.icon} size={20} /> }; });
};
/** What the menu needs to show people: the app's people, the rooms the viewer joined and those they opened, and the
 *  way to a page. */
type Crowd = { app: string; people?: People | null; joined: Record<string, boolean>; read: Record<string, boolean>; notice: ReturnType<typeof useNotice>; go: (id: string) => void };

/**
 * Every Phi app's shell is the puikit {@link AppShell}; this wrapper only feeds it the app's data — menu groups, the
 * app switcher, the built-in You/Settings, and the look switch. Nothing here is per-app logic.
 */
export const PhiShell: React.FC<ShellProps> = ({ app, nav, side = [], view, onView, right, onRecord, account, people, children }) => {
  // The right sidebar, the same in every app: the page's own columns (shown or hidden by picking one, so no column
  // keeps a strip of its own), then whatever groups the app's data names.
  const columns = useColumnEntries(); const joined = useInside(); const read = READ.use(); const notice = useNotice();
  // The viewer in the foot: their own picture and presence where the person icon would be, once the app has people.
  const me = people ? <Face file={people} m={people.member.find((m) => m.id === people.me)} size="sm" dot /> : <User size={18} />;
  const panels: AppShellGroup[] = columns.length ? [{ id: '_panels', label: 'Panels', icon: <Columns3 size={20} />, items: columns.map((c) => ({ id: 'col:' + c.id, label: c.label, icon: c.open ? <Eye size={16} /> : <EyeOff size={16} /> })) }] : [];
  const sideGroups = [...panels, ...toGroups(side).map((g) => ({ ...g, id: 'side:' + g.id }))];
  const pick = (id: string) => { if (id.startsWith('col:')) columnStore.toggle(id.slice(4)); else onView(id); };
  const pulled = (leafId: string, id: string) => {
    // An account data point (You › Your rounds › a round): open that record's sheet; the leaf id carries the kind.
    if (leafId.startsWith('_you_')) { onView('#/' + leafId.slice(5) + '/' + id); return; }
    if (leafId.startsWith('_you')) { onView(leafId); return; } // Overview / Wallet / Account: go to the section
    const leaf = nav.flatMap((n) => [n, ...(n.items ?? [])]).find((n) => n.id === leafId); const it = leaf?.previews?.find((p, i) => (p.id ?? String(i)) === id); if (it) onRecord?.(it);
  };
  // The account (You) is a foot group with its own panel — the sidebar becomes the account menu, bank-style.
  const foot = account?.length
    ? [{ id: '_you', label: 'You', icon: me, items: account.map((a) => ({ id: a.id, label: a.label, icon: <NavIcon name={ACCOUNT_ICON[a.id] ?? 'layers'} size={18} />, previews: a.previews?.map((p) => ({ id: p.id, label: p.label, sub: p.sub })) })) }]
    : [{ id: '_you', label: 'You', icon: me }, { id: '_settings', label: 'Settings', icon: <Settings size={18} /> }];
  const apps = APPS.filter((a) => a.built || a.key === app.key).map((a) => ({
    id: a.key, name: a.name, tagline: a.key === app.key ? 'This app' : a.tagline,
    href: appUrl(a.key), current: a.key === app.key, color: a.color, glyph: <AppGlyph paths={a.icon} size={20} />,
  }));
  return (
    <AppShell
      brand={{ name: app.name, tagline: app.tagline, color: app.color, glyph: <AppGlyph paths={app.icon} size={22} /> }}
      groups={toGroups(nav, { app: app.key, people, joined, read, notice, go: onView })} view={view} onView={pick} side={{ label: app.name, groups: sideGroups }}
      apps={apps} appsLabel="Apps"
      foot={foot}
      tools={<VoiceBar go={(store) => onView(store.slice(app.key.length + 1))} />} right={right} onPreview={(leafId, p) => pulled(leafId, p.id)}
      headerRight={<AccountDrawer onProfile={() => onView('_you')} />}
    >
      {children}
      <VoiceLine />
      <Reminder go={onView} />
    </AppShell>
  );
};
