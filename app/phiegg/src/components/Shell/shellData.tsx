import React from 'react';
import { Icon, type AppShellApp, type AppShellGroup, type AppShellLeaf, type AppShellTab } from '@pui/components';
import {
  Bot, CalendarDays, Camera, ChevronDown, ChevronUp, Circle, Clapperboard, Clock, Film, Coins, Compass, Droplets, Flag, Gamepad2, Gem, Gift, Globe, Hash, Home, LayoutGrid, MessageCircle, Palette, Plus, Radio, Rocket, Search, Server, ShoppingBag, Sparkles, Tv, User, UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { appMeta, appUrl, APPS } from '@phi-kit/data';
import { AppGlyph } from '@phi-kit/icons';
import { site, t } from '../../lib/data';
import { MENUS, type RailItem, type SecItem } from '../../lib/menus';
import type { PhieggState } from '../../state/phieggStore';
import { ChatHex, GLYPH_SIZE, GridCut, HomeCut, HostPyramid, MenuBars, ShopNest, YouPill } from '../Phiegg/Marks';
import { EntityAvatar } from '../Phiegg/EntityAvatar';
import { PersonAvatar } from '../Phiegg/PersonAvatar';
import { Appearance } from './Appearance';
import { previews } from './previews';

/** Icons named by the menus (data/phiegg.json). Named imports keep the rest of lucide out of the bundle; add a name here
 *  when the menus start using a new one. */
const L: Record<string, LucideIcon> = { Bot, CalendarDays, Camera, ChevronDown, ChevronUp, Circle, Clapperboard, Clock, Film, Coins, Compass, Droplets, Flag, Gamepad2, Gem, Gift, Globe, Hash, Home, LayoutGrid, MessageCircle, Palette, Plus, Radio, Rocket, Search, Server, ShoppingBag, Sparkles, Tv, User, UserPlus };
const TAB_ICON: Record<string, LucideIcon> = { home: Home, compass: Compass, server: Server, sparkles: Sparkles, user: User, globe: Globe, gem: Gem };
type Glyph = React.FC<{ size?: string }>;
const GLYPH: Record<string, Glyph> = { menu: MenuBars, host: HostPyramid, chat: ChatHex, home: HomeCut };
const MARK: Record<string, Glyph> = { ShopNest, GridCut, User: YouPill } as unknown as Record<string, Glyph>;
const railGlyph = (r: RailItem) => { const G = GLYPH[r.id] ?? MARK[r.icon]; return G ? <G size={GLYPH_SIZE} /> : <Icon icon={L[r.icon] ?? Circle} size="md" />; };
const itemIcon = (n: string) => { const G = MARK[n]; return G ? <G size="1rem" /> : <Icon icon={L[n] ?? Circle} size="sm" />; };

/** A menu entry's id: its page and the params it opens with, so two entries on one page (Feeds and Reels) differ. */
export const entryId = (it: { tab: string; params?: Record<string, string> }) => it.tab + (it.params ? '?' + new URLSearchParams(it.params).toString() : '');
/** The page and params an entry id names. */
export const parseEntry = (id: string): [string, Record<string, string> | undefined] => {
  const [tab, q] = id.split('?'); return [tab, q ? Object.fromEntries(new URLSearchParams(q)) : undefined];
};

const rail = () => [...MENUS.rail.top.map((r) => [r, 'top'] as const), ...MENUS.rail.center.map((r) => [r, 'center'] as const), ...MENUS.rail.bottom.map((r) => [r, 'bottom'] as const)];
export const appsItem = () => rail().map(([r]) => r).find((r) => r.role === 'apps');

const leaf = (it: SecItem, s: PhieggState): AppShellLeaf => ({
  id: it.panel ? 'panel:' + it.label : entryId(it), label: it.label, icon: itemIcon(it.icon), inline: it.inline,
  panel: it.panel === 'appearance' ? <Appearance /> : undefined, open: it.panel === 'appearance',
  previews: it.source ? previews(it.source, s, site.previewCount).map((p) => ({
    id: p.id, label: p.label, meta: p.meta, onSelect: p.open,
    avatar: p.who ? <PersonAvatar id={p.who} size="xs" /> : <EntityAvatar id={p.id} name={p.label} size="xs" />,
  })) : undefined,
});

/** Phiegg's menu records (lib/menus.ts) as the shared shell's groups: every rail entry a group in its rail place, its
 *  panel's sections as runs (the bottom one at the panel's foot); a rail entry with no panel is a page of its own. */
export const shellGroups = (s: PhieggState): AppShellGroup[] => rail().filter(([r]) => r.role !== 'apps').map(([r, place]) => {
  const conf = MENUS.secondary[r.id];
  if (!conf) return { id: r.id, label: r.label, icon: railGlyph(r), place, items: [{ id: r.id, label: r.label, icon: railGlyph(r) }] };
  const sections = conf.sections.map((sec) => ({ id: r.id + ':' + sec.position, end: sec.position === 'bottom', items: sec.items.map((it) => leaf(it, s)) }));
  return { id: r.id, label: conf.title || r.label, icon: railGlyph(r), place, to: r.tab, sections, items: sections.flatMap((x) => x.items) };
});

/** The current entry: the one whose page and params match where the app is; the bare page otherwise. */
export const currentEntry = (s: PhieggState): string => {
  const all = Object.values(MENUS.secondary).flatMap((c) => c.sections.flatMap((x) => x.items)).filter((it) => !it.panel);
  const on = all.find((it) => it.tab === s.tab && Object.entries(it.params ?? {}).every(([k, v]) => (s as unknown as Record<string, unknown>)[k] === v));
  return on ? entryId(on) : s.tab;
};

/** The app switcher: this app's family first, then every other built app behind "add apps". */
export const shellApps = (): AppShellApp[] => {
  const mine = (appsItem()?.apps ?? []).map(appMeta).filter(Boolean);
  const rest = APPS.filter((a) => a.built && !mine.some((m) => m.key === a.key));
  const row = (a: (typeof APPS)[number], more: boolean): AppShellApp => ({
    id: a.key, name: a.name, tagline: a.key === 'phiegg' ? t('hdThisApp') : a.tagline, href: appUrl(a.key), current: a.key === 'phiegg', glyph: <AppGlyph paths={a.icon} size={20} />, more,
  });
  return [...mine.map((a) => row(a, false)), ...rest.map((a) => row(a, true))];
};

/** Phone tabs: the menus in slot `mobile`. */
export const shellTabs = (): AppShellTab[] => MENUS.mobile.map((m) => ({ id: m.tab, label: m.label, icon: <Icon icon={TAB_ICON[m.icon] ?? Circle} size="sm" /> }));
export const appsGlyph = () => { const a = appsItem(); return a ? railGlyph(a) : undefined; };
