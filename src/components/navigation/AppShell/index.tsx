'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import { Drawer } from '../../overlays/Drawer';
import { Menu as MenuIcon, Grid3x3 } from 'lucide-react';
import { ShellProvider } from './context';
import { ShellBrand } from './Brand';
import { AppsList, GroupMenu } from './Panel';
import type { AppShellApp, AppShellGroup, AppShellLeaf, AppShellPreview } from './types';
import styles from './styles.module.scss';

export type { AppShellApp, AppShellGroup, AppShellLeaf, AppShellPreview } from './types';

export type AppShellProps = {
  brand: { name: string; tagline?: string; glyph?: React.ReactNode; color?: string };
  /** The menu, as data: rail groups and their sub-nav items. */
  groups: AppShellGroup[];
  /** The active leaf id. */
  view: string;
  onView: (id: string) => void;
  /** The app switcher — a secondary panel, never the primary rail. */
  apps?: AppShellApp[];
  appsLabel?: string;
  appsIcon?: React.ReactNode;
  /** Pinned foot entries (You, Settings). */
  foot?: AppShellLeaf[];
  /** Tools shown at the foot of the panel (a look/theme switch). */
  tools?: React.ReactNode;
  /** Optional right aside. */
  right?: React.ReactNode;
  /** A pulled record under a menu entry was picked. */
  onPreview?: (leafId: string, preview: AppShellPreview) => void;
  /** The end of the header row (search, account): the header carries the brand and where you are. */
  headerRight?: React.ReactNode;
  /** Words the shell says (the pin, folding a menu); English by default. */
  labels?: { openMenu?: string; closeMenu?: string; menu?: string; fold?: (label: string, open: boolean) => string };
  children: React.ReactNode;
  className?: string;
};

const leafOf = (g: AppShellGroup) => (g.items.length === 1 && g.items[0].id === g.id ? g.items[0] : null);
const KEY = 'pui:shell:open';
const readOpen = () => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } };

/**
 * The one app shell for every Phi app, and the one place its look is decided; an app hands it data only. The header
 * has no border: its first cell sits over the sidebar (the logo while the menu panel is open, the glyph alone and the
 * pin under the pointer while it is closed), then where you are, aligned to the content, and the app's tools. The
 * sidebar is the one bordered thing: a glass holder with the rail of menu GROUPS and the panel, which the pin opens
 * and closes (kept on this device). Every menu in the panel folds, the arrow at the left. Folds to a drawer on a phone.
 * Components inside learn whether the panel is open from useShell.
 */
export const AppShell: React.FC<AppShellProps> = ({
  brand, groups, view, onView, apps, appsLabel = 'Apps', appsIcon, foot = [], tools, right, onPreview, headerRight, labels, children, className = '',
}) => {
  const L = { openMenu: 'Open the menu', closeMenu: 'Close the menu', menu: 'Menu', fold: (l: string, o: boolean) => (o ? 'Fold ' : 'Open ') + l, ...labels };
  const footGroups = foot.filter((f): f is AppShellGroup => Array.isArray(f.items) && f.items.length > 0);
  const footLeaves = foot.filter((f) => !f.items?.length);
  const allGroups = [...groups, ...footGroups];
  const groupOfView = React.useMemo(() => allGroups.find((g) => g.items.some((i) => i.id === view))?.id, [allGroups, view]);
  const [railId, setRailId] = React.useState<string>(() => groupOfView ?? groups[0]?.id ?? '');
  const [drawer, setDrawer] = React.useState(false);
  const [open, setOpenState] = React.useState(readOpen);
  const setOpen = (o: boolean) => { setOpenState(o); try { localStorage.setItem(KEY, o ? '1' : '0'); } catch { /* storage off: it holds for this visit */ } };
  React.useEffect(() => { if (groupOfView) setRailId(groupOfView); }, [groupOfView]);

  const APPS = '__apps';
  const go = (id: string) => { onView(id); setDrawer(false); };
  // A rail group opens its menu in the panel (opening the panel if it is closed); a leaf group navigates.
  const pickRail = (g: AppShellGroup) => { const leaf = leafOf(g); if (leaf) go(leaf.id); else setOpen(true); setRailId(g.id); };
  const pickFoot = (g: AppShellGroup) => { setRailId(g.id); setOpen(true); if (!g.items.some((i) => i.id === view)) go(g.items[0].id); };

  const railBtn = (id: string, label: string, icon: React.ReactNode, on: boolean, onClick: () => void) => (
    <Pressable key={id} title={label} aria-label={label} aria-pressed={on} className={cn(styles.railBtn, on && styles.railOn)} onClick={onClick}>{icon}</Pressable>
  );
  const glyph = (l: { label: string; icon?: React.ReactNode }) => l.icon ?? <span className={styles.railGlyph}>{l.label.slice(0, 1)}</span>;
  const rail = (
    <Box as="nav" className={styles.rail} aria-label={brand.name}>
      <Stack direction="column" gap={1} align="center" className={styles.railGroup}>
        {groups.map((g) => railBtn(g.id, g.label, glyph(g), railId === g.id || groupOfView === g.id, () => pickRail(g)))}
      </Stack>
      <Box flex="1" />
      <Stack direction="column" gap={1} align="center" className={styles.railGroup}>
        {apps && apps.length > 0 && railBtn(APPS, appsLabel, appsIcon ?? <Grid3x3 size={20} />, railId === APPS, () => { setRailId(APPS); setOpen(true); })}
        {footGroups.map((f) => railBtn(f.id, f.label, glyph(f), railId === f.id || groupOfView === f.id, () => pickFoot(f)))}
        {footLeaves.map((f) => railBtn(f.id, f.label, glyph(f), view === f.id, () => go(f.id)))}
      </Stack>
    </Box>
  );

  const activeGroup = allGroups.find((g) => g.id === railId);
  const crumbGroup = allGroups.find((g) => g.items.some((i) => i.id === view));
  const crumbLeaf = crumbGroup?.items.find((i) => i.id === view) ?? footLeaves.find((f) => f.id === view);
  const pulled = (leafId: string, p: AppShellPreview) => { onPreview?.(leafId, p); setDrawer(false); };
  const footRows = footLeaves.map((f) => (
    <Pressable key={f.id} row gap={3} fill hover minHeight="40px" paddingX={3} className={styles.navRow} aria-current={view === f.id ? 'page' : undefined} onClick={() => go(f.id)}>
      {f.icon ?? null}<Text as="span" intent="inherit" weight={view === f.id ? 'bold' : 'medium'}>{f.label}</Text>
    </Pressable>
  ));
  const panel = (
    <Box as="aside" className={styles.panel} aria-label={(railId === APPS ? appsLabel : activeGroup?.label) ?? brand.name}>
      <Box className={styles.panelScroll}>
        {railId === APPS ? <Box className={styles.panelGroup}><AppsList apps={apps ?? []} /></Box>
          : activeGroup ? <GroupMenu key={activeGroup.id} group={activeGroup} view={view} go={go} onPreview={pulled} foldLabel={L.fold} /> : null}
      </Box>
      {(tools || footRows.length > 0) && <Box className={styles.panelFoot}>{tools}{footRows}</Box>}
    </Box>
  );

  return (
    <ShellProvider navOpen={open}>
      <Box className={cn(styles.root, open ? styles.open : styles.closed, className)}>
        <Box as="header" className={styles.head}>
          <Pressable className={cn(styles.railBtn, styles.menuBtn)} aria-label={L.menu} onClick={() => setDrawer(true)}><MenuIcon size={20} /></Pressable>
          <ShellBrand brand={brand} open={open} onToggle={() => setOpen(!open)} openLabel={L.openMenu} closeLabel={L.closeMenu}
            onHome={() => { const first = groups[0]?.items[0]; if (first) go(first.id); }} />
          <Box className={styles.lane}>
            <Stack direction="row" gap={2} align="center" className={styles.crumbs}>
              {crumbGroup && crumbGroup.label !== crumbLeaf?.label ? <><Text as="span" size="sm" intent="muted">{crumbGroup.label}</Text><Text as="span" size="sm" intent="muted">›</Text></> : null}
              {crumbLeaf ? <Text as="span" size="sm" weight="medium">{crumbLeaf.label}</Text> : null}
            </Stack>
            <Box flex="1" />
            {headerRight}
          </Box>
        </Box>
        <Box className={styles.body}>
          <Box className={styles.nav}>{rail}{open && panel}</Box>
          <Box as="main" className={styles.main}><Box className={styles.inner}>{children}</Box></Box>
          {right ? <Box as="aside" className={styles.right}>{right}</Box> : null}
        </Box>

        <Drawer isOpen={drawer} onClose={() => setDrawer(false)} position="left" size="md" title={brand.name}>
          <Stack direction="column" gap={3}>
            {allGroups.map((g) => <GroupMenu key={g.id} group={g} view={view} go={go} onPreview={pulled} foldLabel={L.fold} />)}
            {apps && apps.length > 0 && <Box className={styles.panelGroup}><Text size="sm" weight="semibold">{appsLabel}</Text><AppsList apps={apps} /></Box>}
            {(tools || footRows.length > 0) && <Stack direction="column" gap={1}>{tools}{footRows}</Stack>}
          </Stack>
        </Drawer>
      </Box>
    </ShellProvider>
  );
};

export * from './context';
export default AppShell;
