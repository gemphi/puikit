'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import { Drawer } from '../../overlays/Drawer';
import { Menu as MenuIcon } from 'lucide-react';
import { ShellProvider } from './context';
import { ShellBrand } from './Brand';
import { APPS, Rail } from './Rail';
import { AppsList, GroupMenu, PageMenu, PhoneRail, PhoneTabs } from './Panel';
import { entriesOf, leafOf, type AppShellApp, type AppShellGroup, type AppShellLabels, type AppShellLeaf, type AppShellPreview, type AppShellTab } from './types';
import styles from './styles.module.scss';

export type { AppShellApp, AppShellGroup, AppShellLabels, AppShellLeaf, AppShellPreview, AppShellSection, AppShellTab } from './types';

export type AppShellProps = {
  brand: { name: string; tagline?: string; glyph?: React.ReactNode; wordmark?: React.ReactNode; color?: string };
  /** The menu, as data: rail groups and their sub-nav items. */
  groups: AppShellGroup[];
  /** The active leaf id. */
  view: string;
  onView: (id: string) => void;
  /** The rail group whose menu the panel shows; leave out and the shell keeps its own. */
  rail?: string;
  onRail?: (id: string) => void;
  /** The app switcher — a secondary panel, never the primary rail. */
  apps?: AppShellApp[];
  appsLabel?: string;
  appsIcon?: React.ReactNode;
  /** Pinned foot entries (You, Settings). */
  foot?: AppShellLeaf[];
  /** Phone tabs: on a phone the rail gives way to these in a bar at the foot. */
  tabs?: AppShellTab[];
  /** The phone's bar as the rail itself: the ids of the menu groups it shows, in order, as icons. A group's icon
   *  opens that group's own menu and nothing else; one that is a single page goes to it. Wins over `tabs`. */
  phoneRail?: string[];
  /** Tools shown at the foot of the panel (a look/theme switch). */
  tools?: React.ReactNode;
  /** Optional right aside. */
  right?: React.ReactNode;
  /** A second sidebar at the right edge, the same rail and menus as the left one: what the page that is open offers
   *  (switch to another, its centre, its market). It starts as icons only; an icon opens its menu beside it. */
  side?: { label: string; groups: AppShellGroup[] };
  /** A pulled record under a menu entry was picked. */
  onPreview?: (leafId: string, preview: AppShellPreview) => void;
  /** Where you are, when the app knows more than the menu does (an entity's own trail); the menu's trail otherwise. */
  crumbs?: React.ReactNode;
  /** The end of the header row (search, account): the header carries the brand and where you are. */
  headerRight?: React.ReactNode;
  /** Words the shell says (the pin, folding a menu); English by default. */
  labels?: Partial<AppShellLabels>;
  children: React.ReactNode;
  className?: string;
  /** Change it to fold the menu panel (and the phone drawer) away: opening a record full width, say a new asset. */
  collapseKey?: string;
};

const KEY = 'pui:shell:open';
const readOpen = () => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } };

/**
 * The one app shell for every Phi app, and the one place its look is decided; an app hands it data only. The header
 * has no border: its first cell sits over the sidebar (the logo while the menu panel is open, the glyph alone and the
 * pin under the pointer while it is closed), then where you are, aligned to the content, and the app's tools. The
 * sidebar is the one bordered thing: a glass holder with the rail of menu GROUPS and the panel, which the pin (or the
 * current rail icon) opens and closes, kept on this device. Every menu folds, the arrow at the left. Under it all lies
 * the stage a page paints its picture into (Backdrop). The content is one centred column with the only scroll. On a
 * phone the sidebar folds to a drawer, and the app's tabs sit at the foot. Components inside learn the panel's state
 * from useShell.
 */
export const AppShell: React.FC<AppShellProps> = ({
  collapseKey,
  brand, groups, view, onView, rail, onRail, apps, appsLabel = 'Apps', appsIcon, foot = [], tabs, phoneRail, tools, right, side, onPreview, crumbs, headerRight, labels, children, className = '',
}) => {
  const L: AppShellLabels = { openMenu: 'Open the menu', closeMenu: 'Close the menu', menu: 'Menu', moreApps: 'More apps', fold: (l, o) => (o ? 'Fold ' : 'Open ') + l, ...labels };
  const footGroups = foot.filter((f): f is AppShellGroup => Array.isArray(f.items) && f.items.length > 0);
  const footLeaves = foot.filter((f) => !f.items?.length);
  const allGroups = [...groups, ...footGroups];
  const groupOfView = allGroups.find((g) => entriesOf(g).some((i) => i.id === view))?.id;
  const [ownRail, setOwnRail] = React.useState<string>(() => rail ?? groupOfView ?? groups[0]?.id ?? '');
  const railId = rail ?? ownRail;
  const setRail = (id: string) => { setOwnRail(id); onRail?.(id); };
  const [drawer, setDrawer] = React.useState(false);
  const [phoneId, setPhoneId] = React.useState('');
  const [open, setOpenState] = React.useState(readOpen);
  const [stage, setStage] = React.useState<HTMLElement | null>(null);
  const setOpen = (o: boolean) => { setOpenState(o); try { localStorage.setItem(KEY, o ? '1' : '0'); } catch { /* storage off: it holds for this visit */ } };
  React.useEffect(() => { if (groupOfView && rail === undefined) setOwnRail(groupOfView); }, [groupOfView]); // eslint-disable-line react-hooks/exhaustive-deps
  // A rail the app picks from elsewhere (its account menu opening Appearance) opens the panel to show it.
  const lastRail = React.useRef(rail);
  React.useEffect(() => { if (rail !== undefined && rail !== lastRail.current) setOpen(true); lastRail.current = rail; }, [rail]);

  // A new collapseKey (the app names the page that is open: a new page, a new record) folds both sidebars and the
  // drawer away, so a page always opens with the room to itself. A rail icon that opens its own menu as it goes to
  // its page keeps that menu open (the person just asked for it).
  const lastKey = React.useRef(collapseKey); const keep = React.useRef(false);
  React.useEffect(() => {
    if (collapseKey && collapseKey !== lastKey.current) { if (!keep.current) setOpen(false); setSideRail(''); setDrawer(false); }
    keep.current = false; lastKey.current = collapseKey;
  }, [collapseKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (id: string) => { onView(id); setDrawer(false); };
  // The current icon closes its open panel. Otherwise a leaf group navigates, a group opens its menu (and goes to its
  // own page when it has one).
  const pick = (g: AppShellGroup) => {
    if (g.id === railId && open && !leafOf(g)) { setOpen(false); return; }
    const leaf = leafOf(g); if (leaf) go(leaf.id); else { if (g.to) { keep.current = true; go(g.to); } setOpen(true); }
    setRail(g.id);
  };
  // The right sidebar keeps its own open menu: closed (icons only) until one is picked, and again on the same icon.
  const [sideRail, setSideRail] = React.useState(''); const sideGroup = side?.groups.find((g) => g.id === sideRail);
  const pickSide = (g: AppShellGroup) => { const leaf = leafOf(g); if (leaf) { go(leaf.id); setSideRail(''); return; } if (g.to) go(g.to); setSideRail(g.id === sideRail ? '' : g.id); };
  // The phone's bar: an icon opens its own group's menu in the drawer, and closes it again; a page group goes there.
  const phoneGroups = (phoneRail ?? []).map((id) => allGroups.find((g) => g.id === id)).filter((g): g is AppShellGroup => !!g);
  const phoneGroup = phoneGroups.find((g) => g.id === phoneId);
  const pickPhone = (g: AppShellGroup) => {
    const leaf = leafOf(g); if (leaf) { setPhoneId(''); go(leaf.id); return; }
    if (drawer && phoneId === g.id) { setDrawer(false); return; }
    setPhoneId(g.id); setRail(g.id); setDrawer(true);
  };
  const bar = phoneGroups.length > 0 || !!tabs?.length;
  const pickApps = () => { if (railId === APPS && open) { setOpen(false); return; } setRail(APPS); setOpen(true); };

  // Groups that are one page each make one menu of pages, so a page never shows its own name as a heading over itself.
  const pages = groups.filter((g) => leafOf(g)).map((g) => ({ ...leafOf(g)!, icon: g.icon ?? leafOf(g)!.icon }));
  const activeGroup = allGroups.find((g) => g.id === railId);
  const crumbGroup = allGroups.find((g) => entriesOf(g).some((i) => i.id === view));
  const crumbLeaf = crumbGroup && entriesOf(crumbGroup).find((i) => i.id === view) || footLeaves.find((f) => f.id === view);
  const pulled = (leafId: string, p: AppShellPreview) => { onPreview?.(leafId, p); setDrawer(false); };
  const menu = { view, go, onPreview: pulled, foldLabel: L.fold };
  const footRows = footLeaves.map((f) => (
    <Pressable key={f.id} row gap={3} fill hover minHeight="40px" paddingX={3} className={styles.navRow} aria-current={view === f.id ? 'page' : undefined} onClick={() => go(f.id)}>
      {f.icon ?? null}<Text as="span" intent="inherit" weight={view === f.id ? 'bold' : 'medium'}>{f.label}</Text>
    </Pressable>
  ));
  const panelBody = railId === APPS ? <Box className={styles.panelGroup}><AppsList apps={apps ?? []} moreLabel={L.moreApps} /></Box>
    : activeGroup && leafOf(activeGroup) ? <PageMenu pages={pages} {...menu} />
    : activeGroup ? <GroupMenu key={activeGroup.id} group={activeGroup} {...menu} /> : null;
  const panel = (
    <Box as="aside" className={styles.panel} aria-label={(railId === APPS ? appsLabel : activeGroup?.label) ?? brand.name}>
      <Box className={styles.panelScroll}>{panelBody}</Box>
      {(tools || footRows.length > 0) && <Box className={styles.panelFoot}>{tools}{footRows}</Box>}
    </Box>
  );
  const trail = crumbs ?? (
    <Stack direction="row" gap={2} align="center">
      {crumbGroup && crumbGroup.label !== crumbLeaf?.label ? <><Text as="span" size="sm" intent="muted">{crumbGroup.label}</Text><Text as="span" size="sm" intent="muted">›</Text></> : null}
      {crumbLeaf ? <Text as="span" size="sm" weight="medium">{crumbLeaf.label}</Text> : null}
    </Stack>
  );

  return (
    <ShellProvider navOpen={open} stage={stage}>
      <Box className={cn(styles.root, open ? styles.open : styles.closed, bar && styles.withTabs, className)}>
        <Box ref={setStage} className={styles.stage} aria-hidden />
        <Box as="header" className={styles.head}>
          {!bar && <Pressable className={cn(styles.railBtn, styles.menuBtn)} aria-label={L.menu} onClick={() => setDrawer(true)}><MenuIcon size={20} /></Pressable>}
          <ShellBrand brand={brand} open={open} onToggle={() => setOpen(!open)} openLabel={L.openMenu} closeLabel={L.closeMenu}
            onHome={() => { const first = entriesOf(groups[0] ?? { id: '', label: '', items: [] })[0]; if (first) go(first.id); }} />
          <Box className={styles.lane}>
            <Box className={styles.crumbs}>{trail}</Box>
            <Box flex="1" />
            {headerRight}
          </Box>
        </Box>
        <Box className={styles.body}>
          <Box className={cn(styles.nav, 'phi-layers')}>
            <Rail label={brand.name} groups={groups} footGroups={footGroups} footLeaves={footLeaves} railId={railId} groupOfView={groupOfView} view={view}
              apps={apps?.length ? { label: appsLabel, icon: appsIcon } : undefined} pick={pick} pickApps={pickApps} go={go} />
            {open && panel}
          </Box>
          <Box as="main" className={styles.main}><Box className={cn(styles.inner, 'pui-shell-content')}>{children}</Box></Box>
          {right ? <Box as="aside" className={cn(styles.right, 'phi-layers')}>{right}</Box> : null}
          {side?.groups.length ? (
            <Box className={cn(styles.nav, styles.navEnd, 'phi-layers')} data-side="end">
              {sideGroup && <Box as="aside" className={styles.panel} aria-label={sideGroup.label}><Box className={styles.panelScroll}><GroupMenu key={sideGroup.id} group={sideGroup} {...menu} /></Box></Box>}
              <Rail label={side.label} groups={side.groups} footGroups={[]} footLeaves={[]} railId={sideRail} view={view} pick={pickSide} pickApps={() => undefined} go={go} />
            </Box>
          ) : null}
        </Box>
        {phoneGroups.length ? <PhoneRail label={L.menu} groups={phoneGroups} on={drawer ? phoneId : ''} current={groupOfView} pick={pickPhone} />
          : tabs?.length ? <PhoneTabs tabs={tabs} view={view} go={go} menu={{ label: L.menu, icon: <MenuIcon size={18} />, open: drawer, onClick: () => setDrawer(!drawer) }} /> : null}

        <Drawer isOpen={drawer} onClose={() => setDrawer(false)} position="left" size="md" title={phoneGroup?.label ?? brand.name}
          footer={phoneGroup ? <PhoneRail inDrawer label={L.menu} groups={phoneGroups} on={phoneId} current={groupOfView} pick={pickPhone} /> : undefined}>
          {phoneGroup ? <GroupMenu key={phoneGroup.id} group={phoneGroup} {...menu} /> : <Stack direction="column" gap={3}>
            {pages.length > 0 && <PageMenu pages={pages} {...menu} />}
            {allGroups.filter((g) => !leafOf(g)).map((g) => <GroupMenu key={g.id} group={g} {...menu} />)}
            {apps && apps.length > 0 && <Box className={styles.panelGroup}><Text size="sm" weight="semibold">{appsLabel}</Text><AppsList apps={apps} moreLabel={L.moreApps} /></Box>}
            {(tools || footRows.length > 0) && <Stack direction="column" gap={1}>{tools}{footRows}</Stack>}
          </Stack>}
        </Drawer>
      </Box>
    </ShellProvider>
  );
};

export { APPS as APPS_RAIL } from './Rail';
export { ShellBack, ShellBackButton, ShellPin } from './Brand';
export * from './context';
export default AppShell;
