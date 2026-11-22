import React from 'react';
import { Icon, type AppShellApp, type AppShellGroup, type AppShellLeaf, type AppShellTab } from '@pui/components';
import {
  Bot, CalendarDays, Camera, ChevronDown, ChevronUp, Circle, Clapperboard, Clock, Film, Coins, Compass, Droplets, Flag, Gamepad2, Gem, Gift, Globe, Hash, Home, LayoutGrid, MessageCircle, Palette, Plus, Radio, Rocket, Search, Server, ShoppingBag, Sparkles, Tv, User, UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { appMeta, appUrl, APPS } from '@phi-kit/data';
import { AppGlyph } from '@phi-kit/icons';
import * as Lucide from 'lucide-react';
import { itemOf, site, storeOf, t } from '../../lib/data';
import { PARAM_OF, PATH_OF, routeOf, rowsOf } from '../../lib/route';
import { titleOf } from '../../lib/fields';
import { MENUS, type MenuEntry, type RailItem, type SecItem } from '../../lib/menus';
import { shopMenu } from '../../lib/shopMenu';
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
/** Is the app in a shop (the path's menu, data/route.json)? */
export const inShop = (s: PhieggState) => routeOf(s.tab).menu === 'shop';
/** In a shop the shop's rail group is that brand's own menu, like a storefront's: its kinds at the top; in the middle
 *  the entries of the path's menu that hold its products (data/menu.json, lib/shopMenu.ts), each folding its own; all
 *  shops at the foot. */
const shopGroup = (s: PhieggState, r: RailItem, place: AppShellGroup['place']): AppShellGroup => {
  const store = storeOf(s.storeId);
  // The shop's own menu (data/menu.json for the path `shop`), an entry and whatever it holds, to any depth.
  const leaf = (e: MenuEntry): AppShellLeaf => ({ id: 'shopview:cat:' + e.id, label: e.label, ...(e.items ? { items: e.items.map(leaf) } : {}) });
  const sections: AppShellGroup['sections'] = [
    { id: 'shop:kinds', place: 'top', items: (routeOf('shop').tab ?? []).map((x) => ({ id: 'shopview:tab:' + x.id, label: x.label })) },
    { id: 'shop:cats', place: 'center', items: [{ id: 'shopview:cat:', label: t('seAll') }, ...shopMenu(store).map(leaf)] },
    { id: 'shop:all', place: 'bottom', items: [{ id: 'shops', label: t('pgShops'), icon: railGlyph(r) }] },
  ];
  return { id: r.id, label: store.name, icon: railGlyph(r), place, sections, items: sections.flatMap((x) => x.items) };
};

export const shellGroups = (s: PhieggState): AppShellGroup[] => rail().filter(([r]) => r.role !== 'apps').map(([r, place]) => {
  if (r.tab === 'shop' && inShop(s)) return shopGroup(s, r, place);
  const conf = MENUS.secondary[r.id];
  if (!conf) return { id: r.id, label: r.label, icon: railGlyph(r), place, items: [{ id: r.id, label: r.label, icon: railGlyph(r) }] };
  const sections = conf.sections.map((sec) => ({ id: r.id + ':' + sec.position, place: (['top', 'center', 'bottom'] as const).find((p) => p === sec.position) ?? 'top', items: sec.items.map((it) => leaf(it, s)) }));
  return { id: r.id, label: conf.title || r.label, icon: railGlyph(r), place, to: r.tab, sections, items: sections.flatMap((x) => x.items) };
});

/** The right sidebar for where the app is (data/route.json `side`): each group's menu is the rows of a kind that belong
 *  to the record the path shows (other worlds, this world's zones, its club's shops), then its plain links. A group
 *  with nothing to show is left out. No path is named here. */
export const sideGroups = (s: PhieggState, columns: { id: string; label: string; open: boolean }[] = [], parts: { id: string; label: string }[] = []): AppShellGroup[] => {
  const route = routeOf(s.tab); const id = route.param ? (s as unknown as Record<string, string>)[route.param] : undefined;
  const own = [route.record ?? route.kind ?? []].flat(); const mine = id ? own.find((k) => itemOf(k, id)) : own[0]; const record = mine && id ? itemOf(mine, id) : undefined;
  const word = (k: string) => (k in site.copy ? t(k as keyof typeof site.copy) : k);
  return (route.side ?? []).flatMap((g) => {
    const kind = g.kind === '@' ? mine : g.kind; const path = kind ? PATH_OF[kind] : undefined; const param = path ? PARAM_OF[path] : undefined;
    const rows = kind && path && param ? rowsOf({ id: g.id, label: g.label, kind, where: g.where }, record).filter((r) => r.id !== id).slice(0, g.limit ?? 16) : [];
    const shown = (Lucide as unknown as Record<string, LucideIcon>).Eye, hidden = (Lucide as unknown as Record<string, LucideIcon>).EyeOff;
    // A named set of rows folded under its own entry (a world's zones, its hosts): open, a heading over its rows.
    const pathOf = (k: string) => PATH_OF[k] ?? (routeOf(k).param ? k : undefined);
    const subs: AppShellLeaf[] = (g.sub ?? []).flatMap((x) => {
      const p = pathOf(x.kind); const q = p ? PARAM_OF[p] : undefined; if (!p || !q) return [];
      const list = rowsOf({ id: x.id, label: x.label, kind: x.kind, where: x.where, not: x.not }, record).slice(0, x.limit ?? 16);
      return list.length ? [{ id: 'sub:' + g.id + ':' + x.id, label: word(x.label), head: true, open: true, items: list.map((r) => ({ id: entryId({ tab: p, params: { [q]: r.id } }), label: titleOf(x.kind, r) })) }] : [];
    });
    const inPage: AppShellLeaf[] = g.parts ? parts.map((x) => ({ id: 'part:' + x.id, label: x.label })) : [];
    const links: AppShellLeaf[] = (g.link ?? []).map((l) => ({ id: l.path, label: word(l.label) }));
    // A group with the page's sections or named sets lays its menu in three runs: the page's own at the top, what the
    // record holds in the middle, the lists it leads to at the foot.
    const runs = g.parts || g.sub ? [{ id: g.id + ':top', place: 'top' as const, items: inPage }, { id: g.id + ':center', place: 'center' as const, items: subs }, { id: g.id + ':bottom', place: 'bottom' as const, items: links }].filter((x) => x.items.length) : undefined;
    const items: AppShellLeaf[] = [...inPage, ...subs,
      ...(g.columns ? columns.map((c) => ({ id: 'col:' + c.id, label: c.label, icon: <Icon icon={c.open ? shown : hidden} size="sm" /> })) : []), ...rows.map((r) => ({ id: entryId({ tab: path!, params: { [param!]: r.id } }), label: titleOf(kind!, r) })), ...links];
    const G = (Lucide as unknown as Record<string, LucideIcon>)[g.icon] ?? Circle;
    return items.length ? [{ id: 'side:' + g.id, label: word(g.label), icon: <Icon icon={G} size="md" />, place: g.place, items, ...(runs ? { sections: runs } : {}) }] : [];
  });
};

/** The right sidebar's group whose menu is open as the path opens (data/route.json `open`), if it has one. */
export const sideOn = (s: PhieggState): string | undefined => { const g = (routeOf(s.tab).side ?? []).find((x) => x.open); return g ? 'side:' + g.id : undefined; };

/** The current entry: the one whose page and params match where the app is; the bare page otherwise. */
export const currentEntry = (s: PhieggState): string => {
  if (inShop(s)) return s.shopView.cat ? 'shopview:cat:' + s.shopView.cat : 'shopview:tab:' + (s.shopView.tab || 'items');
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

/** The phone's bar as rail entries: the menus in slot `mobile` that name one. */
export const shellPhoneRail = (): string[] => MENUS.mobile.map((m) => m.rail).filter((id): id is string => !!id);
/** Phone tabs: the menus in slot `mobile` that are pages of their own. */
export const shellTabs = (): AppShellTab[] => MENUS.mobile.filter((m) => m.tab && !m.rail).map((m) => ({ id: m.tab!, label: m.label ?? '', icon: <Icon icon={TAB_ICON[m.icon ?? ''] ?? Circle} size="sm" /> }));
export const appsGlyph = () => { const a = appsItem(); return a ? railGlyph(a) : undefined; };
