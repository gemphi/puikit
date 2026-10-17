'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Title } from '../../primitives/Title';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import { Link } from '../Link';
import { Drawer } from '../../overlays/Drawer';
import { Avatar } from '../../media/Avatar';
import { Menu as MenuIcon, Grid3x3, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './styles.module.scss';

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
  children: React.ReactNode;
  className?: string;
};

const leafOf = (g: AppShellGroup) => (g.items.length === 1 && g.items[0].id === g.id ? g.items[0] : null);

/**
 * The one app shell for every Phi app: a primary icon rail of the app's menu GROUPS, a secondary panel that lists the
 * active group's sub-nav, the app switcher as its own secondary panel (never the primary rail), the content, and an
 * optional right aside. Everything comes from the `groups`/`apps` data, so the only difference between one app and the
 * next is that data — the components are the same everywhere. Folds to a menu drawer on a phone.
 */
export const AppShell: React.FC<AppShellProps> = ({
  brand, groups, view, onView, apps, appsLabel = 'Apps', appsIcon, foot = [], tools, right, onPreview, headerRight, children, className = '',
}) => {
  const [folded, setFolded] = React.useState<Record<string, boolean>>({});
  // A foot entry that carries `items` is a group too (the account/profile panel), only it lives in the rail's foot.
  const footGroups = foot.filter((f): f is AppShellGroup => Array.isArray(f.items) && f.items.length > 0);
  const footLeaves = foot.filter((f) => !f.items?.length);
  const allGroups = [...groups, ...footGroups];
  const groupOfView = React.useMemo(() => allGroups.find((g) => g.items.some((i) => i.id === view))?.id, [allGroups, view]);
  const [railId, setRailId] = React.useState<string>(() => groupOfView ?? groups[0]?.id ?? '');
  const [drawer, setDrawer] = React.useState(false);
  React.useEffect(() => { if (groupOfView) setRailId(groupOfView); }, [groupOfView]);

  const APPS = '__apps';
  const pickRail = (g: AppShellGroup) => { const leaf = leafOf(g); if (leaf) { onView(leaf.id); setDrawer(false); } setRailId(g.id); };
  // Clicking a foot group (You) opens its panel and lands on its first item (the overview) unless already inside it.
  const pickFoot = (g: AppShellGroup) => { setRailId(g.id); if (!g.items.some((i) => i.id === view)) go(g.items[0].id); };
  const go = (id: string) => { onView(id); setDrawer(false); };

  const railBtn = (id: string, label: string, icon: React.ReactNode, on: boolean, onClick: () => void) => (
    <Pressable key={id} title={label} aria-label={label} aria-pressed={on} className={cn(styles.railBtn, on && styles.railOn)} onClick={onClick}>
      {icon}
    </Pressable>
  );

  const rail = (
    <Box as="nav" className={styles.rail} aria-label={brand.name}>
      <Stack direction="column" gap={1} align="center" className={styles.railGroup}>
        {groups.map((g) => railBtn(g.id, g.label, g.icon ?? <span className={styles.railGlyph}>{g.label.slice(0, 1)}</span>,
          railId === g.id || groupOfView === g.id, () => pickRail(g)))}
      </Stack>
      <Box flex="1" />
      <Stack direction="column" gap={1} align="center" className={styles.railGroup}>
        {apps && apps.length > 0 && railBtn(APPS, appsLabel, appsIcon ?? <Grid3x3 size={20} />, railId === APPS, () => setRailId(APPS))}
        {footGroups.map((f) => railBtn(f.id, f.label, f.icon ?? <span className={styles.railGlyph}>{f.label.slice(0, 1)}</span>, railId === f.id || groupOfView === f.id, () => pickFoot(f)))}
        {footLeaves.map((f) => railBtn(f.id, f.label, f.icon ?? <span className={styles.railGlyph}>{f.label.slice(0, 1)}</span>, view === f.id, () => go(f.id)))}
      </Stack>
    </Box>
  );

  const activeGroup = allGroups.find((g) => g.id === railId);
  const crumbGroup = allGroups.find((g) => g.items.some((i) => i.id === view));
  const crumbLeaf = crumbGroup?.items.find((i) => i.id === view) ?? footLeaves.find((f) => f.id === view);
  const panelBody = railId === APPS
    ? (
      <Stack direction="column" gap={1}>
        {(apps ?? []).map((a) => (
          <Link key={a.id} href={a.current ? '#' : (a.href ?? '#')} className={cn(styles.appRow, a.current && styles.appOn)} aria-current={a.current ? 'page' : undefined}>
            <Box as="span" className={styles.appGlyph} style={a.color ? { ['--app-color' as string]: a.color } : undefined}>{a.glyph ?? a.name.slice(0, 1)}</Box>
            <Box as="span" className={styles.appText}>
              <Text as="span" size="sm" weight="bold">{a.name}</Text>
              {a.tagline && <Text as="span" size="xs" intent="muted">{a.tagline}</Text>}
            </Box>
          </Link>
        ))}
      </Stack>
    )
    : (
      <Stack direction="column" gap={1}>
        {(activeGroup?.items ?? []).map((it) => {
          // An entry that pulls records shows them folded under it: open on its own page, a toggle elsewhere.
          const pulls = it.previews ?? []; const open = folded[it.id] ?? view === it.id;
          return (
            <Box key={it.id} className={styles.navEntry}>
              <Stack direction="row" gap={1} align="center">
                <Pressable row gap={3} fill hover accent current={view === it.id} minHeight="40px" paddingX={3} className={styles.navRow}
                  aria-current={view === it.id ? 'page' : undefined} onClick={() => go(it.id)}>
                  {it.icon ?? null}
                  <Text as="span" intent="inherit" weight={view === it.id ? 'bold' : 'medium'}>{it.label}</Text>
                </Pressable>
                {pulls.length > 0 && (
                  <Pressable className={styles.foldBtn} aria-expanded={open} aria-label={(open ? 'Hide ' : 'Show ') + it.label} onClick={() => setFolded({ ...folded, [it.id]: !open })}>
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Pressable>
                )}
              </Stack>
              {pulls.length > 0 && open && (
                <Stack direction="column" gap={0} className={styles.pulls}>
                  {pulls.map((p) => (
                    <Pressable key={p.id} row gap={2} fill hover paddingY={1} paddingLeft={4} paddingRight={2} className={styles.pullRow} onClick={() => { onPreview?.(it.id, p); setDrawer(false); }}>
                      <Avatar size="xs" src={p.image} alt={p.label} initials={p.label.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()} seed={p.id} />
                      <Stack direction="column" gap={0} flex="1" minWidth="0">
                        <Text as="span" size="xs" weight="medium" truncate>{p.label}</Text>
                        {p.sub ? <Text as="span" size="xs" intent="muted" truncate>{p.sub}</Text> : null}
                      </Stack>
                    </Pressable>
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    );

  const panel = (
    <Box as="aside" className={styles.panel} aria-label={(railId === APPS ? appsLabel : activeGroup?.label) ?? brand.name}>
      <Box className={styles.panelScroll}>
        {(railId === APPS || activeGroup) ? <>
          <Title level={5} size="sm" className={styles.panelTitle}>{railId === APPS ? appsLabel : activeGroup?.label}</Title>
          <Box className={styles.panelGroup}>{panelBody}</Box>
        </> : crumbLeaf ? <Title level={5} size="sm" className={styles.panelTitle}>{crumbLeaf.label}</Title> : null}
      </Box>
      <Box className={styles.panelFoot}>
        {tools}
        {footLeaves.map((f) => (
          <Pressable key={f.id} row gap={3} fill hover accent current={view === f.id} minHeight="40px" paddingX={3} className={styles.navRow}
            aria-current={view === f.id ? 'page' : undefined} onClick={() => go(f.id)}>
            {f.icon ?? null}<Text as="span" intent="inherit" weight={view === f.id ? 'bold' : 'medium'}>{f.label}</Text>
          </Pressable>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box className={cn(styles.root, className)}>
      {/* The header row, as in every Phi app: brand, where you are, and the app's own tools at the end. */}
      <Box as="header" className={styles.head}>
        <Pressable className={cn(styles.railBtn, styles.menuBtn)} aria-label="Menu" onClick={() => setDrawer(true)}><MenuIcon size={20} /></Pressable>
        <Pressable className={styles.brand} onClick={() => { const first = groups[0]?.items[0]; if (first) go(first.id); }}>
          {brand.glyph && <Box className={styles.brandGlyph} style={brand.color ? { ['--app-color' as string]: brand.color } : undefined}>{brand.glyph}</Box>}
          <Text as="span" weight="bold" className={styles.brandName}>{brand.name}</Text>
        </Pressable>
        <Stack direction="row" gap={2} align="center" className={styles.crumbs}>
          {crumbGroup && crumbGroup.label !== crumbLeaf?.label ? <><Text as="span" size="sm" intent="muted">{crumbGroup.label}</Text><Text as="span" size="sm" intent="muted">›</Text></> : null}
          {crumbLeaf ? <Text as="span" size="sm" weight="medium">{crumbLeaf.label}</Text> : null}
        </Stack>
        <Box flex="1" />
        {headerRight}
      </Box>
      <Box className={styles.body}>
        <Box className={styles.nav}>{rail}{panel}</Box>
        <Box as="main" className={styles.main}>
          <Box className={styles.inner}>{children}</Box>
        </Box>
        {right ? <Box as="aside" className={styles.right}>{right}</Box> : null}
      </Box>

      <Drawer isOpen={drawer} onClose={() => setDrawer(false)} position="left" size="md" title={brand.name}>
        <Stack direction="column" gap={3}>
          {[...groups, ...footGroups].map((g) => (
            <Stack key={g.id} direction="column" gap={1}>
              <Text size="xs" intent="muted" className={styles.panelTitle}>{g.label}</Text>
              {g.items.map((it) => (
                <Pressable key={it.id} row gap={3} fill hover accent current={view === it.id} minHeight="40px" paddingX={3} onClick={() => go(it.id)}>
                  {it.icon ?? null}<Text as="span" intent="inherit" weight={view === it.id ? 'bold' : 'medium'}>{it.label}</Text>
                </Pressable>
              ))}
            </Stack>
          ))}
          {apps && apps.length > 0 && (
            <Stack direction="column" gap={1}>
              <Text size="xs" intent="muted" className={styles.panelTitle}>{appsLabel}</Text>
              {apps.map((a) => (
                <Link key={a.id} href={a.current ? '#' : (a.href ?? '#')} className={cn(styles.appRow, a.current && styles.appOn)}>
                  <Box as="span" className={styles.appGlyph} style={a.color ? { ['--app-color' as string]: a.color } : undefined}>{a.glyph ?? a.name.slice(0, 1)}</Box>
                  <Text as="span" size="sm" weight="bold">{a.name}</Text>
                </Link>
              ))}
            </Stack>
          )}
          {(tools || footLeaves.length > 0) && <Stack direction="column" gap={1}>{tools}{footLeaves.map((f) => (
            <Pressable key={f.id} row gap={3} fill hover accent current={view === f.id} minHeight="40px" paddingX={3} onClick={() => go(f.id)}>{f.icon ?? null}<Text as="span" intent="inherit">{f.label}</Text></Pressable>
          ))}</Stack>}
        </Stack>
      </Drawer>
    </Box>
  );
};

export default AppShell;
