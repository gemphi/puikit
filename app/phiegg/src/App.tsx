import React, { useEffect } from 'react';
import { usePuiTheme } from '@pui/hooks';
import { RADIUS_ALIASES, RADIUS_PRESETS, type GradientLevel, type RadiusPreset } from '@pui/providers';
import { AppShell, APPS_RAIL, Box, Stack, Title, columnStore, useColumnEntries } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from './state/phieggStore';
import { HeaderEnd } from './components/Shell/HeaderEnd';
import { appsGlyph, appsItem, currentEntry, inShop, parseEntry, shellApps, shellGroups, shellTabs, sideGroups } from './components/Shell/shellData';
import { Crumbs } from './components/Phiegg/Search';
import { Icon, Wordmark } from './components/Phiegg/Marks';
import { SignIn } from './components/Shell/SignIn';
import { useViewport } from './lib/viewport';
import { Overlays } from './components/Phiegg/Overlays';
import { ItemSheet } from './components/Phiegg/ItemSheet';
import { AssetSheet } from './components/Phiegg/AssetSheet';
import { WatchSheet } from './components/Phiegg/WatchSheet';
import { PlacePage } from './components/Phiegg/Commerce';
import { useListedLook } from './components/Shell/Appearance';
import {
  AgentsHubPage, ClubPage, CollectionPage, ListPage, CreatePage, ExplorePage, FeedPage, HostPage, JoinPage,
  MessagesPage, PhipadPage, ProfilePage, ShowPage, WorldPage, ShopPage, PoolPage, SeriesPage, LeaguePage, CityPage, SearchPage, RecentPage, StudioPage, RidesPage, WelcomePage, PostPage,
} from './pages/phiegg';
import { me, site, t } from './lib/data';
import { MENUS } from './lib/menus';
import { routeOf } from './lib/route';
import { RecordView } from './components/Phiegg/RecordSheet';
import { useIdentity } from './lib/identity';


type S = ReturnType<typeof phieggStore.getState>;
/** Every tab named in data/site.json (rail, secondary panels, agent hrefs) resolves to a page here. A look, an asset,
 *  a title and a place are entities, each on a page of its own. */
const page = (tab: string, s: S): React.ReactNode => {
  if (tab === 'shop') return <ShopPage />;
  if (tab === 'pool') return <PoolPage />;
  if (tab === 'series' || tab === 'watch') return <SeriesPage />;
  if (tab === 'league') return <LeaguePage />;
  // A path with a title and tabs is a list (worlds, shows, events, hosts, pools…); one that carries a record id and
  // has no page of its own shows its kind's record (data/route.json).
  const route = routeOf(tab);
  if (route.title && route.tab) return <ListPage key={tab} path={tab} />;
  if (route.param === 'recordId' && typeof route.kind === 'string') return <RecordView key={s.recordId} kind={route.kind} id={s.recordId} page />;
  switch (tab) {
    case 'feed': return <FeedPage />;
    case 'recent': return <RecentPage />;
    case 'studio': return <StudioPage />;
    case 'rides': return <RidesPage />;
    case 'welcome': return <WelcomePage />;
    case 'post': return <PostPage />;
    case 'look': return <ItemSheet id={s.lookId} />;
    case 'asset': return <AssetSheet id={s.assetId} />;
    case 'title': return <WatchSheet id={s.titleId} />;
    case 'place': return <PlacePage id={s.placeId} />;
    case 'search': return <SearchPage />;
    case 'explore': return <ExplorePage />;
    case 'host': case 'nests': case 'channels': return <HostPage />;
    case 'world': return <WorldPage />;
    case 'city': return <CityPage />;
    case 'show': return <ShowPage />;
    case 'club': return <ClubPage />;
    case 'collection': return <CollectionPage />;
    case 'profile': return <ProfilePage />;
    case 'messages': return <MessagesPage />;
    case 'agents': case 'agents-hub': return <AgentsHubPage />;
    case 'phipad': return <PhipadPage />;
    case 'create': return <CreatePage />;
    case 'join': return <JoinPage />;
    default: return <FeedPage />;
  }
};

/** Phiegg on the shared shell: it hands the shell its menus, its brand and its pages, and the shell decides the rest. */
export const App: React.FC = () => {
  const s = useStore(phieggStore); useIdentity(); useListedLook(); const { compact } = useViewport();
  // Mirror the appearance onto <html> so portalled overlays (drawers, chat, dialogs) share the same gradients and radius.
  const ap = s.appearance;
  // The appearance gradient drives the puikit gradient system (providers/palette.ts) for every surface.
  const { gradientLevel, setGradientLevel, borderRadius, setBorderRadius } = usePuiTheme();
  useEffect(() => { if (gradientLevel !== ap.gradient) setGradientLevel(ap.gradient as GradientLevel); }, [ap.gradient]);
  // The appearance radius drives the puikit radius scale, so every --phi-radius-* token (cards, decks, tabs, buttons) follows it.
  // A change of default (site.json appearance.rev) moves a saved appearance still on the old default once.
  useEffect(() => {
    const rev = (site as unknown as { appearance: { rev?: { id: string; from: Partial<Record<keyof typeof ap, string>> }; defaults: Record<string, string> } }).appearance;
    if (!rev.rev) return;
    try {
      if (localStorage.getItem('phiegg:appearance-rev') === rev.rev.id) return;
      for (const [k, v] of Object.entries(rev.rev.from)) if (ap[k as keyof typeof ap] === v) s.setAppearance(k as keyof typeof ap, rev.defaults[k]);
      localStorage.setItem('phiegg:appearance-rev', rev.rev.id);
    } catch { /* no storage: the defaults already apply */ }
  }, []);
  useEffect(() => {
    const id = (RADIUS_ALIASES[ap.radius] ?? ap.radius) as RadiusPreset;
    if (id !== ap.radius && RADIUS_PRESETS[id]) { s.setAppearance('radius', id); return; } // older saved ids (sharp/soft/round)
    const k = RADIUS_PRESETS[id] ?? 1; if (borderRadius !== k) setBorderRadius(k);
  }, [ap.radius]);
  useEffect(() => {
    const el = document.documentElement.dataset;
    el.phGradient = ap.gradient; el.phRadius = ap.radius; el.phMotion = ap.motion; el.phOpacity = ap.opacity;
  }, [ap.gradient, ap.radius, ap.motion, ap.opacity]);
  // An entry id names a page and its params (shellData.tsx); the profile tab opens your own.
  // In a shop the sidebar opens on the shop's own menu (shellData shopGroup); leaving it returns to Home's.
  const shopRail = Object.values(MENUS.rail).flat().find((r) => r.tab === 'shop')?.id;
  useEffect(() => { if (!shopRail) return; if (inShop(s)) { if (s.rail !== shopRail) s.setRail(shopRail); } else if (s.rail === shopRail) s.setRail('home'); }, [s.tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const columns = useColumnEntries();
  const go = (id: string) => {
    // A column of the page, picked in the right sidebar: shown or hidden.
    if (id.startsWith('col:')) { columnStore.toggle(id.slice(4)); return; }
    // A pick in a shop's own menu sets the shop's tab or category (state shopView), the page follows.
    if (id.startsWith('shopview:')) { const [, k, v] = id.split(':'); s.setShopView(k === 'tab' ? { tab: v, cat: '' } : { cat: v, tab: v ? 'looks' : s.shopView.tab }); return; }
    const [tab, params] = parseEntry(id); if (tab === 'profile' && !params) s.go('profile', { profileId: me().id }); else s.go(tab, params); };
  const apps = appsItem();
  return (
    <Stack direction="column" gap={0} data-ph-radius={ap.radius} data-ph-gradient={ap.gradient} data-ph-motion={ap.motion}
      data-ph-sidebar={ap.sidebar} data-ph-content={ap.content} data-ph-opacity={ap.opacity} className="ph-app" width="100vw" height="100vh" overflow="hidden">
      <AppShell
        brand={{ name: site.brand.name, glyph: <Icon size="100%" />, wordmark: <Title level={4} size="sm"><Wordmark /></Title> }}
        groups={shellGroups(s)} view={currentEntry(s)} onView={go} side={{ label: t('pgExplore'), groups: sideGroups(s, columns) }}
        collapseKey={s.tab === 'asset' ? 'asset:' + s.assetId : s.tab === 'look' ? 'look:' + s.lookId : undefined}
        rail={s.rail === apps?.id ? APPS_RAIL : s.rail} onRail={(id) => s.setRail(id === APPS_RAIL && apps ? apps.id : id)}
        apps={shellApps()} appsLabel={apps?.label ?? t('hdApps')} appsIcon={appsGlyph()} tabs={shellTabs()}
        crumbs={<Crumbs compact={compact} />} headerRight={<HeaderEnd />}
        labels={{ openMenu: t('hdMenu'), closeMenu: t('hdCloseMenu'), menu: t('hdMenu'), moreApps: apps?.addLabel ?? t('hdAddApps'), fold: (l, o) => (o ? t('collapse') : t('expand')) + ' ' + l }}
      >
        <Box key={[s.tab, s.worldId, s.showId, s.clubId, s.profileId, s.cityId, s.storeId, s.poolId, s.hostId, s.lookId, s.assetId, s.titleId, s.placeId].join('|')}>
          {page(s.tab, s)}
        </Box>
        <Overlays />
        <SignIn />
      </AppShell>
    </Stack>
  );
};
