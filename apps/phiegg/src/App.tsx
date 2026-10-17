import React, { useEffect } from 'react';
import { usePuiTheme } from '@pui/hooks';
import { RADIUS_ALIASES, RADIUS_PRESETS, type GradientLevel, type RadiusPreset } from '@pui/providers';
import { Box, Stack } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from './state/phieggStore';
import { Header } from './components/Shell/Header';
import { MobileTabs, SidebarNav } from './components/Shell/Sidebar';
import { SignIn } from './components/Shell/SignIn';
import { useViewport } from './lib/viewport';
import { Overlays } from './components/Phiegg/Overlays';
import {
  AgentsHubPage, ClubPage, CollectionPage, ListPage, CreatePage, EventsPage, ExplorePage, FeedPage, HostsPage, JoinPage,
  MessagesPage, PhipadPage, ProfilePage, ShowPage, ShowsPage, WorldPage, WorldsPage, ShopPage, PoolPage, SeriesPage, LeaguePage, CityPage, SearchPage, RecentPage, StudioPage, RidesPage, WelcomePage,
} from './pages/phiegg';
import { site } from './lib/data';
import { useIdentity } from './lib/identity';

const LISTS = Object.keys(site.lists);

/** Every tab named in data/site.json (rail, secondary panels, agent hrefs) resolves to a page here. */
const page = (tab: string): React.ReactNode => {
  if (tab === 'shop') return <ShopPage />;
  if (tab === 'pool') return <PoolPage />;
  if (tab === 'series' || tab === 'watch') return <SeriesPage />;
  if (tab === 'league') return <LeaguePage />;
  if (LISTS.includes(tab)) return <ListPage key={tab} kind={tab} />;
  switch (tab) {
    case 'feed': return <FeedPage />;
    case 'recent': return <RecentPage />;
    case 'studio': return <StudioPage />;
    case 'rides': return <RidesPage />;
    case 'welcome': return <WelcomePage />;
    case 'search': return <SearchPage />;
    case 'explore': return <ExplorePage />;
    case 'hosts': case 'nests': case 'channels': return <HostsPage />;
    case 'worlds': return <WorldsPage />;
    case 'world': return <WorldPage />;
    case 'city': return <CityPage />;
    case 'shows': return <ShowsPage />;
    case 'show': return <ShowPage />;
    case 'club': return <ClubPage />;
    case 'collection': return <CollectionPage />;
    case 'profile': return <ProfilePage />;
    case 'messages': return <MessagesPage />;
    case 'agents': case 'agents-hub': return <AgentsHubPage />;
    case 'phipad': return <PhipadPage />;
    case 'events': return <EventsPage key="events" />;
    case 'drops': return <EventsPage key="drops" only="Drops" />;
    case 'create': return <CreatePage />;
    case 'join': return <JoinPage />;
    default: return <FeedPage />;
  }
};

export const App: React.FC = () => {
  const s = useStore(phieggStore); useIdentity(); const { mobile } = useViewport();
  // Mirror the appearance onto <html> so portalled overlays (drawers, chat, dialogs) share the same gradients and radius.
  const ap = s.appearance;
  // The appearance gradient drives the puijs gradient system (providers/palette.ts) for every surface.
  const { gradientLevel, setGradientLevel, borderRadius, setBorderRadius } = usePuiTheme();
  useEffect(() => { if (gradientLevel !== ap.gradient) setGradientLevel(ap.gradient as GradientLevel); }, [ap.gradient]);
  // The appearance radius drives the puijs radius scale, so every --phi-radius-* token (cards, decks, tabs, buttons) follows it.
  useEffect(() => {
    const id = (RADIUS_ALIASES[ap.radius] ?? ap.radius) as RadiusPreset;
    if (id !== ap.radius && RADIUS_PRESETS[id]) { s.setAppearance('radius', id); return; } // older saved ids (sharp/soft/round)
    const k = RADIUS_PRESETS[id] ?? 1; if (borderRadius !== k) setBorderRadius(k);
  }, [ap.radius]);
  useEffect(() => {
    const el = document.documentElement.dataset;
    el.phGradient = ap.gradient; el.phRadius = ap.radius; el.phMotion = ap.motion; el.phOpacity = ap.opacity;
  }, [ap.gradient, ap.radius, ap.motion, ap.opacity]);
  return (
    <Stack direction="column" gap={0} data-ph-radius={s.appearance.radius} data-ph-gradient={s.appearance.gradient} data-ph-motion={s.appearance.motion}
      data-ph-sidebar={s.appearance.sidebar} data-ph-content={s.appearance.content} data-ph-opacity={s.appearance.opacity}
      className="ph-app" width="100vw" height="100vh" overflow="hidden">
      <Header activeTab={s.tab} onSelectTab={(tab) => s.go(tab)} />
      <Stack direction="row" gap={0} flex="1" minHeight="0">
        {!mobile && <SidebarNav activeTab={s.tab} onSelectTab={(tab) => s.go(tab)} />}
        <Box key={s.tab + s.worldId + s.showId + s.clubId + s.profileId + s.cityId + s.storeId + s.poolId} className="ph-main" flex="1" minWidth="0" scroll="y">
          {page(s.tab)}
        </Box>
      </Stack>
      {mobile && <MobileTabs />}
      <Overlays />
      <SignIn />
    </Stack>
  );
};
