import React, { useEffect, useState } from 'react';
import * as L from 'lucide-react';
import { Avatar, Button, Card, CardBody, Frame, FullScreen, Image, ItemCard, Rows, Showcase, Stack, TabList, Tag, Text, Title, type SectionDef } from '@pui/components';
import { partStore } from '@pui/components';
import { StatGrid } from '@phi-kit/blocks/Stats';
import { useStore } from '@pui/store';
import { Bookmark, Clapperboard, Heart, LogIn, MapPin, Maximize2, Plus, Share2, Shield, type LucideIcon } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { usePlaces } from '../../lib/lazy';
import { mediaUrl } from '../../lib/media';
import { D, clubsInWorld, districtsOf, eggsOfWorld, fmt, jewelsOfWorld, person, ridesOfWorld, shotPost, shotsOfWorld, showForWorld, site, t, viewLabel, worldImage, worldMark, itemOf } from '../../lib/data';
import { JewelList, RideList } from '../../components/Phiegg/Rides';
import { Tile } from '../../components/Phiegg/Tile';
import { useCityParts } from '../../components/Phiegg/CityParts';
import { postTile } from '../../components/Phiegg/ShotCard';
import { Connected } from '../../components/Phiegg/Connected';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { EntityPage } from '../../components/Phiegg/EntityPage';
import { PageSections } from '../../components/Phiegg/PageSections';
import { AgentChat } from '../../components/Phiegg/AgentChat';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import { ListView } from '../../components/Phiegg/Views';
import type { City, Club, World } from '../../types/phiegg';

/**
 * A world's page (/world/<id>), opened as a profile is: the world's picture under the whole window, sharp, its name
 * and four tabs (Status, About, Zones, Items: site.json worldTabs); scrolling blurs the picture and brings the world's
 * square card up, then its sections; every section is also in the right sidebar's Center, and a chat with the club's
 * agent stands beside the page. A world is a city: its zones are the old
 * "cities" (World = City -> Zones -> Places, and Lands).
 */
const WORLD_TABS = (site as unknown as { worldTabs: { items: { id: string; label: string; tab?: boolean; own?: boolean; of?: string[] }[] } }).worldTabs.items;
const WORLD_MENU = (site as unknown as { worldMenu: { items: { id: string; label: string; icon: string }[] } }).worldMenu.items;
const glyph = (name: string) => { const G = (L as unknown as Record<string, L.LucideIcon>)[name]; return G ? <G size={18} /> : null; };

export const WorldPage: React.FC = () => {
  const s = useStore(phieggStore);
  const w = itemOf('world', s.worldId) ?? D.core.worlds[0]; const placesReady = !!usePlaces();
  const [full, setFull] = useState(false);
  useEffect(() => setFull(false), [w.id]);
  const club = itemOf('club', w.clubId); const show = showForWorld(w.id);
  const nest = s.nests.find((n) => n.kind === 'world' && n.worldId === w.id);
  const hostId = nest?.hostId ?? club?.hostId ?? D.hosts.hosts[0].id;
  const clubs = clubsInWorld(w.id); const rides = ridesOfWorld(w.id); const jewels = jewelsOfWorld(w.id);
  const posts = shotsOfWorld(w.id).map(shotPost); const eggs = eggsOfWorld(w.id);
  const agent = D.agents.agents.find((a) => club && a.clubIds.includes(club.id));
  const shown = w.gallery?.[0];
  const big = shown ? mediaUrl(shown.lg) : worldImage(w);
  const placesIn = (c: City) => districtsOf(c.id).reduce((n, d) => n + d.places.length, 0);
  const residents = w.cities.reduce((n, c) => n + c.population, 0);
  const mark = worldMark(w);

  const facts: [string, React.ReactNode][] = [
    [t('wdKind'), (site.worldKinds as Record<string, string>)[w.kind]],
    ...(w.land ? [[t('wdLand'), [w.landName, t('ctLand', { n: w.land }), w.landGroup].filter(Boolean).join(' · ')] as [string, React.ReactNode]] : []),
    [t('wdResidents'), fmt(residents)], [t('wdInside'), fmt(w.visitorsNow)], [t('wdZoneCount'), w.cities.length],
    ...(placesReady ? [[t('wdPlaceCount'), w.cities.reduce((n, c) => n + placesIn(c), 0)] as [string, React.ReactNode]] : []),
    ...(club ? [[t('wdClub'), club.name] as [string, React.ReactNode]] : []),
    ...(w.creatorId ? [[t('wdCreator'), person(w.creatorId).name] as [string, React.ReactNode]] : []),
  ];
  // The city's views as slides: each whole, with the city's mark; its land and who is inside under the view's name.
  const slides = (w.gallery ?? []).map((g) => ({ id: g.view, src: mediaUrl(g.lg), thumb: mediaUrl(g.sm), mark, title: viewLabel(g.view),
    sub: [w.landName && w.landName !== w.name ? w.landName : w.landGroup, t('insideNow', { n: fmt(w.visitorsNow) })].filter(Boolean).join(' · ') }));
  const act = (I: LucideIcon, label: string, onClick: () => void, on?: boolean) => (
    <Button key={label} variant="glass" icon={<I size={16} fill={on ? 'currentColor' : 'none'} />} aria-label={label} title={label} aria-pressed={on} onClick={onClick} />);
  const acts = <>
    <Button variant="glass" iconLeft={LogIn} onClick={() => s.flash(t('entering', { name: w.name }))}>{t('enterWorld', { name: w.name })}</Button>
    {club && act(Shield, t('byClub', { name: club.name }), () => s.go('club', { clubId: club.id }))}
    {show && act(Clapperboard, t('showCard', { season: show.season, looks: show.looks.length }), () => s.go('show', { showId: show.id }))}
    {act(Heart, t('isLike'), () => s.toggle('liked', w.id), !!s.liked[w.id])}
    {act(Bookmark, t('isSave'), () => { s.toggle('saved', w.id); s.flash(t('saved')); }, !!s.saved[w.id])}
    {act(Share2, t('isShare'), () => { void navigator.clipboard?.writeText(location.href); s.flash(t('isCopied')); })}
    {slides.length > 0 && act(Maximize2, t('isFull'), () => setFull(true))}
  </>;
  // What the city holds, as the full-screen sheet and a post's sheet show it (CityParts); the page lays the same
  // sections out by data (site.json worldTabs): its own Status first, several of the city's as one (Items), the rest after.
  const parts = useCityParts(w); const held = useCityParts(w, { facts: false });
  const own: Record<string, React.ReactNode> = {
    status: <Stack direction="column" gap={3}><Stack direction="row" gap={1} wrap>{acts}</Stack><StatGrid size="sm" items={facts.map(([label, value]) => ({ label, value }))} /></Stack>,
    views: slides.length ? <Showcase ratio="16/9" auto={0} slides={slides} labels={{ prev: t('slPrev'), next: t('slNext'), picker: t('ctViews') }} /> : null,
  };
  const sections: SectionDef[] = WORLD_TABS.flatMap((x): SectionDef[] => {
    if (x.own) return own[x.id] ? [{ id: x.id, title: x.label, content: own[x.id] }] : [];
    if (x.of) { const of = x.of.flatMap((id) => held.filter((p) => p.id === id && !p.hidden));
      return of.length ? [{ id: x.id, title: x.label, hint: String(of.length), expandable: true, content: (
        <Stack direction="column" gap={4}>{of.map((p) => <Stack key={p.id} direction="column" gap={2}><Title level={4} size="sm">{p.title}</Title>{p.content}</Stack>)}</Stack>) }] : []; }
    return held.filter((p) => p.id === x.id && !p.hidden).map((p) => ({ ...p, title: x.label }));
  });
  const centre = <PageSections id="world-page" size="sm" sections={sections} />;
  // The page's sections are known outside it: the right sidebar's Center lists them all and brings one into view.
  const named = sections.map((x) => x.id + '=' + String(x.title)).join('|');
  useEffect(() => { partStore.set(sections.map((x) => ({ id: x.id, label: String(x.title) }))); return () => partStore.set([]); }, [named]); // eslint-disable-line react-hooks/exhaustive-deps

  // It opens as a profile does: the city's picture as it is and its name, its first sections as tabs under the name (a
  // tab brings its section into view; the others are in the right sidebar), then the city's own square card in the
  // centre, growing to the page's width as it comes up; the card opens the city full screen.
  const tabs = WORLD_TABS.filter((x) => x.tab && sections.some((p) => p.id === x.id));
  const [part, setPart] = useState<string>();
  const toPart = (id: string) => { setPart(id); document.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  // The tab follows the page: the last tab whose section has come up past the middle of the window is the one lit.
  const tabIds = tabs.map((x) => x.id).join('|');
  useEffect(() => {
    let frame = 0;
    const read = () => { frame = 0;
      const line = window.innerHeight / 2;
      const at = tabIds.split('|').filter((id) => { const el = document.querySelector(`[data-section="${id}"]`); return !!el && el.getBoundingClientRect().top <= line; }).pop();
      setPart(at); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => { document.removeEventListener('scroll', onScroll, { capture: true }); if (frame) cancelAnimationFrame(frame); };
  }, [tabIds, w.id]);
  const card = big ? <Image src={big} alt={w.name} fit="cover" fill />
    : <Tile image={worldImage(w)} tone={w.tone} ratio="1" big grid depth={{ worldId: w.id, clubId: w.clubId, personId: w.creatorId }} />;
  const hero = { card, onCard: big ? () => setFull(true) : undefined, cardLabel: t('isFull'),
    tabs: tabs.length > 1 ? <TabList size="sm" variant="pills" aria-label={w.name} activeId={part ?? tabs[0].id} onChange={toPart} items={tabs.map((x) => ({ id: x.id, label: x.label }))} /> : undefined };
  const columns = [
    { id: 'world', title: w.name, label: t('wdWorld'), content: centre, minWidth: '20rem' },
    ...(agent ? [{ id: 'chat', title: <Stack direction="row" gap={2} align="center"><PersonAvatar id={agent.id} size="xs" /><Text size="sm" weight="semibold">{agent.name}</Text></Stack>,
      label: t('chat'), content: <AgentChat agentId={agent.id} context={w.name} prompts={[]} />, width: '22rem', folded: true }] : []),
  ];
  return (<>
    {full && big && <FullScreen label={w.name} fill={big} media={<Image src={big} alt={w.name} fit="contain" fill />} onClose={() => setFull(false)} closeLabel={t('close')}
      menuLabel={w.name} infoLabel={t('wdAbout')}
      menu={WORLD_MENU.filter((m) => parts.some((p) => p.id === m.id && !p.hidden)).map((m) => ({ id: m.id, label: m.label, icon: glyph(m.icon),
        section: m.id }))}>
      <PageSections id="world-full" size="sm" sections={parts} />
    </FullScreen>}
    <EntityPage hero={hero} stickLast={!!agent} picture={big ? <Image src={big} alt="" fit="cover" fill /> : undefined}
      title={w.name} sub={<>{w.landGroup ?? (site.worldKinds as Record<string, string>)[w.kind]} · {t('insideNow', { n: fmt(w.visitorsNow) })}</>} columns={columns} />
  </>);
};
