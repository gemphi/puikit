import React, { useEffect, useState } from 'react';
import * as L from 'lucide-react';
import { Avatar, Button, Card, CardBody, Frame, FullScreen, Image, ItemCard, Rows, Showcase, Stack, Tag, Text, Title, type SectionDef } from '@pui/components';
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
import { Stats } from '../../components/Phiegg/Details';
import { ListView } from '../../components/Phiegg/Views';
import type { City, Club, World } from '../../types/phiegg';

/**
 * A world's page (#/world/<id>), opened the way a fashion item is: the world under the whole window, the world itself
 * as an object on its stage with its actions, then About, Zones, Posts, PFTs, clubs, rides and jewellery, and a chat
 * with the club's agent beside it. A world is a city: its zones are the old
 * "cities" (World = City -> Zones -> Places, and Lands).
 */
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

  // ── centre: the world as an object on its stage, then what it holds ──
  // A city is wide: its stage is a wide frame the size of the column, so the whole city fits the screen (never a square that overflows it).
  const stage = w.gallery?.length && big
    ? <Frame ratio="16/9" rounded="lg"><Image src={big} alt={w.name} fit="contain" fill /></Frame>
    : <Tile image={worldImage(w)} tone={w.tone} ratio="1" big grid title={w.name} depth={{ worldId: w.id, clubId: w.clubId, personId: w.creatorId }} />;
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
    <Button key={label} variant="glass" size="sm" icon={<I size={16} fill={on ? 'currentColor' : 'none'} />} aria-label={label} title={label} aria-pressed={on} onClick={onClick} />);
  const acts = <>
    <Button variant="glass" size="sm" iconLeft={LogIn} onClick={() => s.flash(t('entering', { name: w.name }))}>{t('enterWorld', { name: w.name })}</Button>
    {club && act(Shield, t('byClub', { name: club.name }), () => s.go('club', { clubId: club.id }))}
    {show && act(Clapperboard, t('showCard', { season: show.season, looks: show.looks.length }), () => s.go('show', { showId: show.id }))}
    {act(Heart, t('isLike'), () => s.toggle('liked', w.id), !!s.liked[w.id])}
    {act(Bookmark, t('isSave'), () => { s.toggle('saved', w.id); s.flash(t('saved')); }, !!s.saved[w.id])}
    {act(Share2, t('isShare'), () => { void navigator.clipboard?.writeText(location.href); s.flash(t('isCopied')); })}
    {slides.length > 0 && act(Maximize2, t('isFull'), () => setFull(true))}
  </>;
  // What the city holds: the same sections under the square, in the full-screen sheet and under its posts.
  const parts = useCityParts(w);
  const centre = (
    <PageSections id="world-item" size="sm" sections={[
      // The city as a square on its own blur (whole, never cropped), its views as the picker, its actions as glass icons at
      // the foot of the square; everything else scrolls under it. Full screen opens the same view and sheet as a post.
      { id: 'world', title: w.name, collapsible: true, content: slides.length
        ? <Showcase ratio="1" auto={0} slides={slides} labels={{ prev: t('slPrev'), next: t('slNext'), picker: t('ctViews') }} actions={() => <>{acts}</>} />
        : <Stack direction="column" gap={2}>{stage}<Stack direction="row" gap={1} wrap>{acts}</Stack></Stack> },
      ...parts,
    ]} />
  );

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
    <EntityPage stickLast={!!agent} picture={big ? <Image src={big} alt="" fit="cover" fill /> : undefined}
      title={w.name} sub={<>{w.landGroup ?? (site.worldKinds as Record<string, string>)[w.kind]} · {t('insideNow', { n: fmt(w.visitorsNow) })}</>} columns={columns} />
  </>);
};
