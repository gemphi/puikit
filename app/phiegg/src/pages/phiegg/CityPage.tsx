import React from 'react';
import { Box, Button, Card, CardBody, Icon, Page, Spinner, Stack, Tag, Text, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { Clock, Star, Users } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, sortsFor, tableFor } from '../../lib/fields';
import { usePlaces } from '../../lib/lazy';
import { cityMeta, cityOf, clubOf, districtsOf, fmt, site, t, worldImage } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { ListView } from '../../components/Phiegg/Views';
import { Connected } from '../../components/Phiegg/Connected';
import type { District, Place } from '../../types/phiegg';

const kindLabel = (k: string) => (site as unknown as { placeKinds: Record<string, string> }).placeKinds[k] ?? k;
type Row = Place & { district: District };

/** World → city → places (data/places.json). One row of city tabs; districts, kinds and clubs are filters. */
export const CityPage: React.FC = () => {
  const s = useStore(phieggStore); const loaded = usePlaces(); const hit = cityOf(s.cityId);
  if (!hit) return null;
  if (!loaded) return <Page><Spinner /></Page>;
  const { city, world } = hit; const meta = cityMeta(city.id); const districts = districtsOf(city.id);
  const rows: Row[] = districts.flatMap((d) => d.places.map((p) => ({ ...p, district: d })));
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="row" gap={2} align="center">
        <Box flex="1" minWidth="0"><TabList size="sm" variant="pills" aria-label={t('wCities')} activeId={city.id} onChange={(id) => s.go('city', { cityId: id, worldId: world.id })} items={world.cities.map((c) => ({ id: c.id, label: c.name }))} /></Box>
        <Button size="sm" variant="outline" onClick={() => s.go('world', { worldId: world.id })}>{world.name}</Button>
      </Stack>
      <Tile image={worldImage(world)} tone={meta?.tone ?? world.tone} ratio="21/7" big title={city.name} sub={city.vibe + ' · ' + world.name}
        badges={<><Tag round size="sm">{t('residents', { n: fmt(city.population) })}</Tag><Tag round size="sm">{t('ctDistricts', { n: districts.length })}</Tag><Tag round size="sm">{t('ctPlaces', { n: rows.length })}</Tag></>} />
      {meta && <Text intent="secondary">{meta.desc}</Text>}
      <ListView<Row> rows={rows} keyOf={(p) => p.id} text={(p) => p.name + ' ' + p.desc + ' ' + p.district.name}
        facets={facetsFor<Row>('place')}
        sorts={sortsFor<Row>('place')}
        table={[...tableFor<Row>('place'), { id: 'hours', header: t('lsColHours'), cell: (p) => p.hours }]}
        render={(p) => (
          <Card depth={2} onClick={() => s.openPlace(p.id)}><CardBody><Stack direction="column" gap={2}>
            <Tile tone={p.tone} ratio="16/9" title={p.name} sub={p.district.name + ' · ' + (clubOf(p.clubId)?.name ?? '')} badges={<Tag round size="sm">{kindLabel(p.kind)}</Tag>} />
            <Stack direction="row" gap={3} wrap>
              <Text size="xs" intent="muted"><Icon icon={Star} size="xs" /> {p.rating}</Text>
              <Text size="xs" intent="muted"><Icon icon={Users} size="xs" /> {t('ctInside', { n: p.visitors })}</Text>
              <Text size="xs" intent="muted"><Icon icon={Clock} size="xs" /> {p.hours}</Text>
            </Stack>
          </Stack></CardBody></Card>)} />
      <Connected kind="city" id={s.cityId} />
    </Stack></Page>
  );
};
