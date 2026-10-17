import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Drawer, Frame, Icon, Pressable, Stack, Text, Title } from '@pui/components';
import { Menu as MenuIcon } from 'lucide-react';
import { useStore } from '@pui/store';
import {
  Bot, CalendarDays, Camera, ChevronDown, ChevronUp, Circle, Clapperboard, Clock, Film, Coins, Compass, Droplets, Flag, Gamepad2, Gem, Gift, Globe, Hash, Home, LayoutGrid, MessageCircle, Palette, Plus, Radio, Rocket, Search, Server, ShoppingBag, Sparkles, Tv, User, UserPlus,
  type LucideIcon,
} from 'lucide-react';

/** Icons named by the menus (data/phiegg.json, rail + secondary panels). Named imports keep the rest of lucide out of the bundle, add a name here when site.json starts using a new one. */
const L: Record<string, LucideIcon> = { Bot, CalendarDays, Camera, ChevronDown, ChevronUp, Circle, Clapperboard, Clock, Film, Coins, Compass, Droplets, Flag, Gamepad2, Gem, Gift, Globe, Hash, Home, LayoutGrid, MessageCircle, Palette, Plus, Radio, Rocket, Search, Server, ShoppingBag, Sparkles, Tv, User, UserPlus };
import { appMeta, appUrl, APPS } from '@phi-kit/data';
import { AppGlyph } from '@phi-kit/icons';
import { me, site, t } from '../../lib/data';
import { MENUS, type RailItem, type SecItem } from '../../lib/menus';
import { useViewport } from '../../lib/viewport';
import { phieggStore } from '../../state/phieggStore';
import { ChatHex, GridCut, HomeCut, HostPyramid, MenuBars, ShopNest } from '../Phiegg/Marks';
import { Appearance } from './Appearance';
import { previews } from './previews';
import { EntityAvatar } from '../Phiegg/EntityAvatar';
import { PersonAvatar } from '../Phiegg/PersonAvatar';
import styles from './Rail.module.scss';

const MARKS: Record<string, LucideIcon> = { ShopNest: ShopNest as unknown as LucideIcon, GridCut: GridCut as unknown as LucideIcon };
const icon = (n: string) => MARKS[n] ?? L[n] ?? Circle;
/** Primary rail (home · chat · host / menu / you) + secondary panel: menu records of app phiegg (lib/menus.ts). */
const railAll = () => [...MENUS.rail.top, ...MENUS.rail.center, ...MENUS.rail.bottom];

/** App switcher (rail "Apps"): this app's family from its menu record, then every other built Phiace app. */
const AppsPanel: React.FC<{ item: RailItem }> = ({ item }) => {
  const [more, setMore] = useState(false);
  const mine = (item.apps ?? []).map(appMeta).filter(Boolean);
  const rest = APPS.filter((a) => a.built && !mine.some((m) => m.key === a.key));
  const row = (a: (typeof APPS)[number]) => (
    <Button key={a.key} variant="ghost" size="sm" href={appUrl(a.key)} align="start" tall fullWidth>
      <Stack direction="row" gap={2} align="center">
        <Frame ratio="1/1" width="2rem" rounded="md" tint={a.color} tintStrength={100} ink="#fff"><AppGlyph paths={a.icon} size={20} /></Frame>
        <Stack direction="column" gap={0} align="start"><Text size="sm" weight="bold">{a.name}</Text><Text size="xs" intent="muted">{a.key === 'phiegg' ? t('hdThisApp') : a.tagline}</Text></Stack>
      </Stack>
    </Button>);
  return (
    <Stack direction="column" gap={1}>
      {mine.map(row)}
      <Button variant="ghost" size="sm" iconLeft={Plus} onClick={() => setMore(!more)} className={styles.menuItem}>{item.addLabel ?? t('hdAddApps')}</Button>
      {more && rest.map(row)}
    </Stack>
  );
};

/** Phones: the rail becomes a bottom tab bar (the menus in slot `mobile`). */
const NAV_ICON: Record<string, LucideIcon> = { home: Home, compass: Compass, server: Server, sparkles: Sparkles, user: User, globe: Globe, gem: Gem };
export const MobileTabs: React.FC = () => {
  const s = useStore(phieggStore); const [menu, setMenu] = useState(false);
  // Phones get the full sidebar (rail + panel, every accordion arrow) in a drawer from the Menu tab.
  useEffect(() => { setMenu(false); }, [s.tab]);
  return (
    <Box as="nav" aria-label={t('hdMenu')} className={styles.tabs}>
      <Pressable aria-label={t('hdMenu')} aria-expanded={menu} className={[styles.tab, menu ? styles.tabOn : ''].join(' ')} onClick={() => setMenu(!menu)}>
        <Icon icon={MenuIcon} size="sm" /><Text size="xs" intent="inherit">{t('hdMenu')}</Text>
      </Pressable>
      <Drawer isOpen={menu} onClose={() => setMenu(false)} position="left" size="md" title={t('hdMenu')}><SidebarNav activeTab={s.tab} onSelectTab={(tab) => s.go(tab)} inDrawer /></Drawer>
      {MENUS.mobile.map((m) => {
        const on = s.tab === m.tab || (m.tab === 'agents' && s.tab === 'agents-hub');
        return (
          <Pressable key={m.id} aria-label={m.label} aria-current={on ? 'page' : undefined} className={[styles.tab, on ? styles.tabOn : ''].join(' ')}
            onClick={() => (m.tab === 'profile' ? s.go('profile', { profileId: me().id }) : s.go(m.tab))}>
            <Icon icon={NAV_ICON[m.icon] ?? Circle} size="sm" /><Text size="xs" intent="inherit">{m.label}</Text>
          </Pressable>);
      })}
    </Box>
  );
};

export const SidebarNav: React.FC<{ activeTab: string; onSelectTab: (tab: string) => void; inDrawer?: boolean }> = ({ activeTab, inDrawer }) => {
  const s = useStore(phieggStore); const vp = useViewport(); const compact = vp.compact && !inDrawer;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [shown, setShown] = useState(false);
  const secondary = MENUS.secondary;
  const railItem = railAll().find((r) => r.id === s.rail);
  const conf = secondary[s.rail] ?? (railItem?.role === 'apps' ? { title: railItem.label, sections: [] } : undefined);
  const visible = !!conf && (!compact || shown);
  const pickRail = (r: RailItem) => {
    if (r.tab) s.go(r.tab);
    if (compact) setShown(r.id === s.rail ? !shown : !!(secondary[r.id] || r.role === 'apps'));
    s.setRail(r.id);
  };
  // Opened from elsewhere (header Theme → Appearance): show the panel on compact screens too.
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } if (compact && (secondary[s.rail] || railItem?.role === 'apps')) setShown(true); }, [s.rail]); // eslint-disable-line react-hooks/exhaustive-deps
  const goItem = (tab: string, params?: Record<string, string>) => { s.go(tab, params); if (compact) setShown(false); };
  const railBtn = (r: RailItem) => (
    <Pressable key={r.id} title={r.label} aria-label={r.label} aria-pressed={r.id === s.rail} className={[styles.item, r.id === s.rail ? styles.active : ''].join(' ')} onClick={() => pickRail(r)}>
      {r.id === 'menu' ? <MenuBars /> : r.id === 'host' ? <HostPyramid /> : r.id === 'chat' ? <ChatHex /> : r.id === 'home' ? <HomeCut /> : <Icon icon={icon(r.icon)} size="md" />}
    </Pressable>
  );
  const item = (it: SecItem) => {
    const key = s.rail + it.label;
    const expanded = open[key] ?? it.panel === 'appearance';
    // Two items can share a tab (Feeds and Reels): the one whose params match the page is the current one.
    const on = activeTab === it.tab && !it.panel && Object.entries(it.params ?? {}).every(([k, v]) => (s as unknown as Record<string, unknown>)[k] === v); // previews fold by default, a quiet list of destinations
    return (
      <Box key={key} className={styles.section}>
        {/* Every menu item spans the panel; the preview toggle sits at the row's end. */}
        <Stack direction="row" gap={1} align="center" justify="between">
          <Button variant="ghost" aria-current={on ? 'page' : undefined} className={[styles.menuItem, on ? styles.on : ''].join(' ')} size="sm" iconLeft={icon(it.icon)}
            onClick={() => it.panel ? setOpen({ ...open, [key]: !expanded }) : goItem(it.tab, it.params)}>{it.label}</Button>
          {it.source && <Button variant="ghost" size="sm" className={styles.toggle} aria-expanded={expanded} aria-label={t('topN', { n: site.previewCount })} icon={<Icon icon={expanded ? ChevronUp : ChevronDown} size="xs" />} onClick={() => setOpen({ ...open, [key]: !expanded })} />}
        </Stack>
        {it.source && expanded && previews(it.source, s, site.previewCount).map((p) => (
          <Pressable key={p.id} row gap={2} fill hover paddingY={1} paddingLeft={6} paddingRight={2} onClick={() => { p.open(); if (compact) setShown(false); }}>{p.who ? <PersonAvatar id={p.who} size="xs" /> : <EntityAvatar id={p.id} name={p.label} size="xs" />}<Text size="xs" truncate flex="1">{p.label}</Text><Text size="xs" intent="muted">{p.meta}</Text></Pressable>))}
        {it.panel === 'appearance' && expanded && <Box paddingLeft={2}><Appearance /></Box>}
      </Box>
    );
  };
  return (
    <Box className={styles.root}>
      <Box as="nav" className={styles.rail}>
        <Box className={styles.group}>{MENUS.rail.top.map(railBtn)}</Box>
        <Box className={styles.group}>{MENUS.rail.center.map(railBtn)}</Box>
        <Box className={styles.group}>{MENUS.rail.bottom.map(railBtn)}</Box>
      </Box>
      {visible && conf && <Box as="aside" key={s.rail} className={[styles.panel, compact ? styles.float : ''].join(' ')}>
        <Title level={5} size="sm">{conf.title}</Title>
        {railItem?.role === 'apps' && <Box flex="1 0 auto"><AppsPanel item={railItem} /></Box>}
        {conf.sections.map((sec) => <Box key={sec.position} className={[styles.section, styles.panelGroup].join(' ')} pushDown={sec.position === 'bottom'}>
          {/* An item marked `inline` in site.json sits on the same row as the one before it (Join · Shop). */}
          {sec.items.reduce<SecItem[][]>((rows, it) => { if (it.inline && rows.length) rows[rows.length - 1].push(it); else rows.push([it]); return rows; }, [])
            .map((row) => row.length === 1 ? item(row[0]) : <Stack key={row.map((x) => x.label).join('|')} direction="row" gap={1} align="start" className={styles.inlineRow}>{row.map(item)}</Stack>)}
        </Box>)}
      </Box>}
      {visible && compact && <Box className={styles.scrim} onClick={() => setShown(false)} aria-hidden />}
    </Box>
  );
};
