import React, { useState } from 'react';
import { Button, Page, Stack, StageSlider, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { Play } from 'lucide-react';
import { useViewport } from '../../lib/viewport';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, sortsFor, tableFor } from '../../lib/fields';
import { D, clubOf, fmt, person, showLead, t, worldOf } from '../../lib/data';
import { ListView } from '../../components/Phiegg/Views';
import type { Show } from '../../types/phiegg';
import { Tile } from '../../components/Phiegg/Tile';

const subOf = (x: Show) => { const w = worldOf(x.worldId)!; const city = w.cities.find((c) => c.id === x.venueCityId);
  return t('venue', { city: city?.name ?? '', world: w.name }) + ' · ' + t('hostedBy', { name: person(x.hostAgentId).name }); };
const badgesOf = (x: Show) => <><Tag round size="sm">{t('looksN', { n: x.looks.length })}</Tag><Tag round size="sm">{t('posesN', { n: x.poseIds.length })}</Tag></>;

/** One show at a time: the stage slider, arrows on the sides, the watch button beside the progress. */
const ShowSlider: React.FC<{ list: Show[] }> = ({ list }) => {
  const s = useStore(phieggStore); const { view } = useStore(phieggStore); const { mobile } = useViewport();
  const [i, setI] = useState(0); const cur = list[i] ?? list[0];
  // The puijs stage: the show in the centre, its neighbours half its height either side and half tucked under it.
  return (
    <StageSlider aria-label={t('showsTitle', { season: D.shows.season })} index={i} onIndexChange={setI} sides={mobile ? 1 : Math.min(3, Math.max(1, view.cols))}
      stageWidth={mobile ? '78vw' : 'min(35rem, 60vw)'} prevLabel={t('slPrev')} nextLabel={t('slNext')} positionLabel={(k, n) => t('slPos', { i: k, n })}
      footer={<Button variant="primary" size="sm" iconLeft={Play} onClick={() => s.go('show', { showId: cur.id })}>{t('watchShow')}</Button>}
      items={list.map((x) => ({ id: x.id, label: x.title, node: (
        <Tile animate big tone={x.tone} color={showLead(x).hex} ratio="1/1" depth={{ worldId: x.worldId, clubId: x.clubId, personId: x.hostAgentId, mid: showLead(x).mid }} title={x.title} sub={subOf(x)} badges={badgesOf(x)} onClick={() => s.go('show', { showId: x.id })} />) }))} />
  );
};

/** Shows of the season: one row of region tabs; host, club, world and venue are filters. Tile mode is the stage slider. */
export const ShowsPage: React.FC = () => {
  const s = useStore(phieggStore);
  const regions = D.explore.worldRegions; const [region, setRegion] = useState(regions[0]);
  const kinds: Record<string, string | null> = { [regions[0]]: null, [regions[1]]: 'virtual', [regions[2]]: 'ar', [regions[3]]: 'agentic' };
  const list = D.shows.shows.filter((x) => !kinds[region] || worldOf(x.worldId)?.kind === kinds[region]);
  const venue = (x: Show) => worldOf(x.worldId)?.cities.find((c) => c.id === x.venueCityId)?.name;
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}><Title level={2} size="xl">{t('showsTitle', { season: D.shows.season })}</Title>
          <Text intent="secondary">{t('showsSub', { season: D.shows.season, looks: 64, poses: D.shows.poses.length })}</Text></Stack>
        <TabList size="sm" variant="pills" aria-label="Regions" activeId={region} onChange={(id) => setRegion(id as typeof region)} items={regions.map((r) => ({ id: r, label: r }))} />
        <ListView<Show> rows={list} keyOf={(x) => x.id} text={(x) => x.title + ' ' + subOf(x)} onRow={(x) => s.go('show', { showId: x.id })}
          facets={facetsFor<Show>('show', { get: { venue } })}
          sorts={sortsFor<Show>('show')}
          table={[...tableFor<Show>('show'), { id: 'venue', header: t('lsVenue'), cell: (x) => venue(x) ?? '', sortValue: venue }]}
          slider={(rows) => rows.length > 0 && <ShowSlider key={region + rows.length} list={rows} />}
          render={(x) => <Tile tone={x.tone} color={showLead(x).hex} ratio="4/3" depth={{ worldId: x.worldId, clubId: x.clubId, personId: x.hostAgentId, mid: showLead(x).mid }} title={x.title} onClick={() => s.go('show', { showId: x.id })} sub={subOf(x)} badges={badgesOf(x)} />} />
      </Stack>
    </Page>
  );
};
