import type { World } from '../../types/phiegg';
import React, { useState } from 'react';
import { Page, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, sortsFor, tableFor } from '../../lib/fields';
import { D, clubOf, fmt, site, t, worldImage } from '../../lib/data';
import { ListView } from '../../components/Phiegg/Views';
import { Tile } from '../../components/Phiegg/Tile';

const kinds = site.regionKinds as Record<string, string | null>;
const kindLabel = site.worldKinds as Record<string, string>;
const copy = site.copy as Record<string, string>;

export const WorldsPage: React.FC = () => {
  const s = useStore(phieggStore);
  const [region, setRegion] = useState(D.explore.worldRegions[0]);
  const list = D.core.worlds.filter((w) => !kinds[region] || w.kind === kinds[region]);
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}><Title level={2} size="xl">{t('worldsTitle', { n: D.core.worlds.length })}</Title><Text intent="secondary">{t('worldsSub')}</Text></Stack>
        <TabList size="sm" variant="pills" activeId={region} onChange={(id) => setRegion(id as typeof region)} items={D.explore.worldRegions.map((r) => ({ id: r, label: r }))} />
        <ListView rows={list} keyOf={(w) => w.id} text={(w) => w.name + ' ' + w.cities.map((c) => c.name).join(' ')}
          facets={facetsFor('world')}
          sorts={site.worldSorts.map((k) => ({ id: k, label: copy[k], by: k === 'az' ? (a: World, b: World) => a.name.localeCompare(b.name) : (a: World, b: World) => b.visitorsNow - a.visitorsNow }))}
          table={tableFor('world')}
          render={(w) => (
            <Stack direction="column" gap={1}>
              <Tile image={worldImage(w)} tone={w.tone} ratio="5/4" grid depth={{ worldId: w.id, clubId: w.clubId, personId: w.creatorId }} title={w.name} sub={t('stats', { visitors: fmt(w.visitorsNow), cities: w.cities.length })} onClick={() => s.go('world', { worldId: w.id })}
                badges={<><Tag round size="sm">{kindLabel[w.kind]}</Tag>{clubOf(w.clubId) && <Tag round size="sm">{clubOf(w.clubId)!.ticker}</Tag>}</>} />
              <Stack direction="row" gap={1} wrap>{w.cities.map((c) => <Tag key={c.id} minimal round size="sm" intent="primary">{c.name}</Tag>)}</Stack>
            </Stack>)} />
      </Stack>
    </Page>
  );
};
