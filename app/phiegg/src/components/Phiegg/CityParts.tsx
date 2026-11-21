import React from 'react';
import { Avatar, Button, Card, CardBody, ItemCard, Rows, Stack, Tag, Text, Title, type SectionDef } from '@pui/components';
import { entityPalette } from '../../lib/colour';
import { useStore } from '@pui/store';
import { Plus } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { usePlaces } from '../../lib/lazy';
import { D, clubsInWorld, districtsOf, eggsOfWorld, fmt, jewelsOfWorld, person, ridesOfWorld, shotPost, shotsOfWorld, site, t, worldMark, itemOf } from '../../lib/data';
import { JewelList, RideList } from './Rides';
import { Tile } from './Tile';
import { postTile } from './ShotCard';
import { Connected } from './Connected';
import { EntityAvatar } from './EntityAvatar';
import { StatGrid } from '@phi-kit/blocks/Stats';
import { ListView } from './Views';
import type { City, Club, World } from '../../types/phiegg';

/**
 * What a city holds, as sections: About, Zones, Posts, PFTs, Hosts, Clubs, Rides, Gems and Links. The city's page, its
 * full-screen sheet and the sheet of a post made in it all show these same sections, so a city reads the same wherever
 * it is opened; a section with nothing in it is hidden.
 */
export const useCityParts = (w: World): SectionDef[] => {
  const s = useStore(phieggStore); const placesReady = !!usePlaces();
  const club = itemOf('club', w.clubId);
  const nest = s.nests.find((n) => n.kind === 'world' && n.worldId === w.id);
  const hostId = nest?.hostId ?? club?.hostId ?? D.hosts.hosts[0].id;
  const clubs = clubsInWorld(w.id); const rides = ridesOfWorld(w.id); const jewels = jewelsOfWorld(w.id);
  const posts = shotsOfWorld(w.id).map(shotPost); const eggs = eggsOfWorld(w.id);
  const hosts = D.hosts.hosts.filter((h) => (h as { worldId?: string }).worldId === w.id);
  const mark = worldMark(w);
  const placesIn = (c: City) => districtsOf(c.id).reduce((n, d) => n + d.places.length, 0);
  const residents = w.cities.reduce((n, c) => n + c.population, 0);
  const facts: [string, React.ReactNode][] = [
    [t('wdKind'), (site.worldKinds as Record<string, string>)[w.kind]],
    ...(w.land ? [[t('wdLand'), [w.landName, t('ctLand', { n: w.land }), w.landGroup].filter(Boolean).join(' · ')] as [string, React.ReactNode]] : []),
    [t('wdResidents'), fmt(residents)], [t('wdInside'), fmt(w.visitorsNow)], [t('wdZoneCount'), w.cities.length],
    ...(placesReady ? [[t('wdPlaceCount'), w.cities.reduce((n, c) => n + placesIn(c), 0)] as [string, React.ReactNode]] : []),
    ...(club ? [[t('wdClub'), club.name] as [string, React.ReactNode]] : []),
    ...(w.creatorId ? [[t('wdCreator'), person(w.creatorId).name] as [string, React.ReactNode]] : []),
  ];
  return [] = [
      { id: 'about', title: t('wdAbout'), expandable: true, content: (
        <Stack direction="column" gap={3}>
          <Text size="md">{w.description}</Text>
          <StatGrid size="sm" items={facts.map(([label, value]) => ({ label, value }))} />
          {w.tags?.length ? <Stack direction="row" gap={1} wrap>{w.tags.map((x) => <Tag key={x} minimal round size="sm">{x}</Tag>)}</Stack> : null}
        </Stack>) },
      { id: 'zones', title: t('wdCities'), hint: String(w.cities.length), expandable: true, actions: <Button variant="glass" iconLeft={Plus} onClick={() => s.openNest(hostId, nest?.id ?? null, 'city')}>{t('nestCity')}</Button>, content: (
        // A world has a handful of zones: one readable row each, whatever the app's list mode (a slider of three is no list).
        <Stack direction="column" gap={2}>{w.cities.map((c) => (
          <ItemCard key={c.id} variant="flat" stackBelow="never" onClick={() => s.go('city', { cityId: c.id, worldId: w.id })}
            media={mark ? <Avatar size="lg" src={mark} fit="contain" alt={c.name} colors={entityPalette(w.id)} /> : <EntityAvatar id={c.id} name={c.name} size="lg" />}
            title={<Title level={4} size="md">{c.name}</Title>}
            meta={placesReady ? t('wdZoneLine', { vibe: c.vibe, n: fmt(c.population), places: placesIn(c) }) : t('wdCityCard', { vibe: c.vibe, n: fmt(c.population) })}
            actions={<Button variant="glass" onClick={() => s.go('city', { cityId: c.id, worldId: w.id })}>{t('visit')}</Button>} />))}
        </Stack>) },
      { id: 'posts', title: t('wdPosts'), hint: String(posts.length), expandable: true, content: posts.length
        ? <Rows cols={3} colsSm={2} minItemWidth="9rem">{posts.slice(0, 12).map((p) => <Tile key={p.id} {...postTile(p)} ratio="4/5" title={p.slides[0].title} sub={person(p.authorId).name} onClick={() => s.openPost(p.id)} />)}</Rows>
        : <Text size="sm" intent="muted">{t('wdNoPosts', { name: w.name })}</Text> },
      { id: 'pfts', title: t('wdPfts'), hint: String(eggs.length), hidden: !eggs.length, expandable: true, content: (
        <Stack direction="column" gap={2}>{eggs.map((e) => (
          <Card key={e.id} padding="sm" onClick={() => s.openAsset(e.id)}><CardBody>
            <Text size="md" weight="bold">{e.name}</Text>
            <Text size="sm" intent="muted">{t('wdPftLine', { size: fmt((e as { sizeM2?: number }).sizeM2 ?? 0), price: fmt(e.priceEgg), sold: e.sold, supply: e.supply })}</Text>
          </CardBody></Card>))}</Stack>) },
      { id: 'clubs', title: t('wdClubs', { name: w.name }), hidden: clubs.length < 2, expandable: true, content: (
        <ListView<Club> rows={clubs} keyOf={(c) => c.id} text={(c) => c.name + ' ' + c.tagline} cols={2} onRow={(c) => s.go('club', { clubId: c.id })}
          sorts={[{ id: 'holders', label: t('lsSortHolders'), by: (a, b) => b.holders - a.holders }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
          table={[{ id: 'name', header: t('lsColName'), cell: (c) => c.name, sortValue: (c) => c.name }, { id: 'holders', header: t('lsColHolders'), cell: (c) => fmt(c.holders), sortValue: (c) => c.holders, align: 'right' }]}
          render={(c) => <ItemCard variant="flat" stackBelow="never" onClick={() => s.go('club', { clubId: c.id })} media={<EntityAvatar id={c.id} name={c.name} size="lg" />}
            title={c.name} meta={c.tagline} aside={<Tag minimal round size="sm">{c.ticker}</Tag>} />} />) },
      { id: 'rides', title: t('rdWorld', { name: w.name }), hint: t('rdWorldHint', { n: rides.length }), hidden: !rides.length, expandable: true, content: <RideList rows={rides} world={false} /> },
      { id: 'jewels', title: t('jwTitle'), hint: t('jwHint', { n: jewels.length }), hidden: !jewels.length, expandable: true, content: <JewelList rows={jewels} /> },
      { id: 'hosts', title: t('wdHosts'), hint: String(hosts.length), hidden: !hosts.length, expandable: true, content: (
        <Stack direction="column" gap={2}>{hosts.map((h) => (
          <ItemCard key={h.id} variant="flat" stackBelow="never" onClick={() => s.openDetails({ kind: 'host', id: h.id })}
            media={<EntityAvatar id={h.id} name={h.name} size="lg" />} title={<Title level={4} size="md">{h.name}</Title>}
            meta={t('wdHostLine', { n: fmt(h.members), gated: (h as { gated?: string }).gated ?? '' })} />))}
        </Stack>) },
      { id: 'related', title: t('asLinked'), content: <Connected kind="world" id={w.id} bare /> },
  ];
};
