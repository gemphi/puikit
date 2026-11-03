import React, { useState } from 'react';
import { Card, CardBody, Page, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, sortsFor, tableFor } from '../../lib/fields';
import { D, clubOf, fmt, site, t } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { ListView } from '../../components/Phiegg/Views';

type Conf = { title: string; sub: string };
const KINDS = [['all', 'seAll'], ['film', 'seFilms'], ['series', 'seSeries'], ['play', 'sePlays']] as const;

/** Watch: films, series and plays produced by clubs and streamed in their hosts (data/series.json). */
export const SeriesPage: React.FC = () => {
  const s = useStore(phieggStore); const c = (site.lists as unknown as Record<string, Conf>).series;
  const [kind, setKind] = useState<string>('all');
  const list = D.series.series.filter((x) => kind === 'all' || x.kind === kind);
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}><Title level={2} size="xl">{c.title}</Title><Text intent="secondary">{c.sub}</Text></Stack>
      <TabList size="sm" variant="pills" activeId={kind} onChange={(id) => setKind(id as typeof kind)} items={KINDS.map(([k, label]) => ({ id: k, label: t(label) }))} />
      <ListView rows={list} keyOf={(x) => x.id} text={(x) => x.title + ' ' + x.synopsis + ' ' + (x.studio ?? '')}
        facets={facetsFor('series', { get: { studio: (x: { studio?: string; clubId: string }) => x.studio ?? clubOf(x.clubId)?.name } })}
        sorts={sortsFor('series')}
        table={tableFor('series')}
        render={(x) => (
          <Card depth={2} onClick={() => s.openSeries(x.id)}><CardBody><Stack direction="column" gap={2}>
            <Tile animate tone={x.tone} ratio="16/10" depth={{ worldId: x.worldId, clubId: x.clubId, personId: x.cast[0] }} title={x.title} sub={clubOf(x.clubId)?.name}
              badges={<Tag round size="sm">{x.kind === 'film' ? t('seMinutes', { n: x.runtime }) : t('seEpisodes', { n: x.episodes.length })}</Tag>} />
            <Text size="xs" intent="muted">{x.genre} · {x.year ?? x.era}{x.studio ? ' · ' + x.studio : ''}</Text>
            <Text size="xs">{t('seRating', { n: x.rating })} · {t('seViews', { n: fmt(x.views) })}{x.boxOfficeUsd ? ' · $' + fmt(x.boxOfficeUsd) + ' box office' : ''}{x.awards ? ' · ' + x.awards + ' awards' : ''}</Text>
          </Stack></CardBody></Card>)} />
    </Stack></Page>
  );
};
