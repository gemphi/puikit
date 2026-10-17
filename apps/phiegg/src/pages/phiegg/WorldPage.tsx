import React from 'react';
import { Button, Icon, ItemCard, Page, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { usePlaces } from '../../lib/lazy';
import { D, clubOf, clubsInWorld, districtsOf, fmt, jewelsOfWorld, ridesOfWorld, showForWorld, site, t, worldImage, worldOf } from '../../lib/data';
import { JewelList, RideList } from '../../components/Phiegg/Rides';
import { Tile } from '../../components/Phiegg/Tile';
import { MapPin, Plus } from 'lucide-react';
import { Connected } from '../../components/Phiegg/Connected';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { ListView } from '../../components/Phiegg/Views';
import { PageSections } from '../../components/Phiegg/PageSections';
import type { City, Club } from '../../types/phiegg';

export const WorldPage: React.FC = () => {
  const s = useStore(phieggStore);
  const w = worldOf(s.worldId) ?? D.core.worlds[0]; const placesReady = !!usePlaces();
  const club = clubOf(w.clubId); const show = showForWorld(w.id);
  const nest = s.nests.find((n) => n.kind === 'world' && n.worldId === w.id);
  const hostId = nest?.hostId ?? club?.hostId ?? D.hosts.hosts[0].id;
  const i = D.core.worlds.findIndex((x) => x.id === w.id);
  const near = [...D.core.worlds.slice(i + 1), ...D.core.worlds.slice(0, i)].slice(0, 8);
  const clubs = clubsInWorld(w.id); const rides = ridesOfWorld(w.id); const jewels = jewelsOfWorld(w.id);
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" gap={1} overflow="auto">{near.map((x) => <Button key={x.id} size="sm" variant="ghost" icon={<EntityAvatar id={x.id} name={x.name} size="xs" />} onClick={() => s.go('world', { worldId: x.id })}>{x.name}</Button>)}
          <Button size="sm" variant="primary" onClick={() => s.go('worlds')}>{t('allWorlds')}</Button></Stack>
        <Tile image={worldImage(w)} tone={w.tone} ratio="21/8" big grid title={w.name} sub={w.description} depth={{ worldId: w.id, clubId: w.clubId, personId: w.creatorId }}
          badges={<><Tag round size="sm">{(site.worldKinds as Record<string, string>)[w.kind]}</Tag><Tag round size="sm">{t('insideNow', { n: fmt(w.visitorsNow) })}</Tag>{w.agents && <Tag round size="sm">{t('agentsCount', { n: fmt(w.agents) })}</Tag>}</>} />
        <Stack direction="row" gap={2} wrap>
          <Button variant="primary" onClick={() => s.flash(t('entering', { name: w.name }))}>{t('enterWorld', { name: w.name })}</Button>
          {club && <Button variant="outline" onClick={() => s.go('club', { clubId: club.id })}>{t('byClub', { name: club.name })}</Button>}
          {show && <Button variant="secondary" onClick={() => s.go('show', { showId: show.id })}>{t('showCard', { season: show.season, looks: show.looks.length })}</Button>}
        </Stack>
        <PageSections id="world" sections={[
          { id: 'cities', title: t('wdCities'), expandable: true, actions: <Button size="sm" variant="ghost" iconLeft={Plus} onClick={() => s.openNest(hostId, nest?.id ?? null, 'city')}>{t('nestCity')}</Button>, content: (
        <ListView<City> rows={w.cities} keyOf={(c) => c.id} text={(c) => c.name + ' ' + c.vibe} cols={3} onRow={(c) => s.go('city', { cityId: c.id, worldId: w.id })}
          facets={[{ id: 'vibe', label: t('lsVibe'), get: (c) => c.vibe }]}
          sorts={[{ id: 'pop', label: t('lsSortResidents'), by: (a, b) => b.population - a.population }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
          table={[{ id: 'name', header: t('lsColName'), cell: (c) => c.name, sortValue: (c) => c.name }, { id: 'vibe', header: t('lsVibe'), cell: (c) => c.vibe, sortValue: (c) => c.vibe },
            { id: 'pop', header: t('lsColResidents'), cell: (c) => fmt(c.population), sortValue: (c) => c.population, align: 'right' },
            ...(placesReady ? [{ id: 'places', header: t('lsPlace'), cell: (c: City) => districtsOf(c.id).reduce((n, d) => n + d.places.length, 0), sortValue: (c: City) => districtsOf(c.id).reduce((n, d) => n + d.places.length, 0), align: 'right' as const }] : [])]}
          render={(c) => (
            <ItemCard depth={2} deckDirection="both" variant="flat" layout="vertical" onClick={() => s.go('city', { cityId: c.id, worldId: w.id })}
              media={<Tile image={worldImage(w)} tone={w.tone} ratio="16/9" title={c.name} depth={{ worldId: w.id, clubId: w.clubId }} />}
              title={<Stack direction="row" gap={2} align="center"><Icon icon={MapPin} size="sm" /><Title level={4} size="md">{c.name}</Title></Stack>}
              meta={t('wdCityCard', { vibe: c.vibe, n: fmt(c.population) })}
              actions={<Button size="sm" variant="outline" onClick={() => s.go('city', { cityId: c.id, worldId: w.id })}>{t('visit')}</Button>}>
              {placesReady && <Text size="xs" intent="muted">{t('ctDistricts', { n: districtsOf(c.id).length })} · {t('ctPlaces', { n: districtsOf(c.id).reduce((n, d) => n + d.places.length, 0) })}</Text>}
            </ItemCard>)} />
          ) },
          { id: 'clubs', title: t('wdClubs', { name: w.name }), hidden: clubs.length < 2, expandable: true, content: (
          <ListView<Club> rows={clubs} keyOf={(c) => c.id} text={(c) => c.name + ' ' + c.tagline} cols={3} onRow={(c) => s.go('club', { clubId: c.id })}
            sorts={[{ id: 'holders', label: t('lsSortHolders'), by: (a, b) => b.holders - a.holders }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
            table={[{ id: 'name', header: t('lsColName'), cell: (c) => c.name, sortValue: (c) => c.name }, { id: 'holders', header: t('lsColHolders'), cell: (c) => fmt(c.holders), sortValue: (c) => c.holders, align: 'right' }]}
            render={(c) => (
              <ItemCard depth={2} deckDirection="both" variant="flat" layout="vertical" onClick={() => s.go('club', { clubId: c.id })}
                media={<Tile tone={c.tone} ratio="16/9" title={c.name} sub={c.tagline} depth={{ worldId: w.id, clubId: c.id, personId: c.founderId }} />}
                title={c.name} meta={c.tagline} aside={<Tag minimal round size="sm">{c.ticker}</Tag>} />)} />          ) },
          { id: 'rides', title: t('rdWorld', { name: w.name }), hint: t('rdWorldHint', { n: rides.length }), hidden: !rides.length, expandable: true, content: <RideList rows={rides} world={false} /> },
          { id: 'jewels', title: t('jwTitle'), hint: t('jwHint', { n: jewels.length }), hidden: !jewels.length, expandable: true, content: <JewelList rows={jewels} /> },
          { id: 'related', title: t('asLinked'), content: <Connected kind="world" id={w.id} bare /> },
        ]} />
      </Stack>
    </Page>
  );
};
