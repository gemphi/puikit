import React, { useState } from 'react';
import { Button, Card, CardBody, DataTable, Page, Select, Stack, Tag, Text, Title, TabList, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { Trophy } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { D, clubOf, fmt, site, t } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';

type Conf = { title: string; sub: string };

/** Phiegg League: standings by metric plus the knockout rounds (data/league.json). */
export const LeaguePage: React.FC = () => {
  const s = useStore(phieggStore); const L = D.league; const c = (site.lists as unknown as Record<string, Conf>).league;
  const [tab, setTab] = useState<'table' | 'rounds'>('table'); const [round, setRound] = useState(L.rounds[0].id);
  const champ = clubOf(L.champion); const r = L.rounds.find((x) => x.id === round)!;
  const metric = (id: string) => L.metrics.find((m) => m.id === id)?.label ?? id;
  const name = (id: string) => clubOf(id)?.name ?? id;
  type Row = (typeof L.table)[number] & { rank: number };
  const rows: Row[] = [...L.table].sort((a, b) => Number(b.score) - Number(a.score)).map((x, i) => ({ ...x, rank: i + 1 }));
  const cols: DataTableColumn<Row>[] = [
    { id: 'rank', header: '#', cell: (x) => x.rank, sortValue: (x) => x.rank, align: 'right' },
    { id: 'club', header: t('lgClub'), cell: (x) => <Button size="sm" variant="ghost" onClick={() => s.go('club', { clubId: x.clubId })}>{name(x.clubId)}</Button>, sortValue: (x) => name(x.clubId) },
    { id: 'seed', header: t('lgSeed'), cell: (x) => x.seed, sortValue: (x) => Number(x.seed), align: 'right' },
    ...L.metrics.map((m): DataTableColumn<Row> => ({ id: m.id, header: m.label, cell: (x) => fmt(Number(x[m.id])), sortValue: (x) => Number(x[m.id]), align: 'right' })),
    { id: 'score', header: t('lgScore'), cell: (x) => <Text weight="bold">{fmt(Number(x.score))}</Text>, sortValue: (x) => Number(x.score), align: 'right' },
  ];
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}><Title level={2} size="xl">{c.title}</Title><Text intent="secondary">{c.sub}</Text><Text size="xs" intent="muted">{L.format}</Text></Stack>
      {champ && <Card depth={2} onClick={() => s.go('club', { clubId: champ.id })}><CardBody>
        <Tile animate tone={champ.tone} ratio="5/1" title={champ.name} sub={t('lgChampion') + ' · ' + L.season} badges={<Tag intent="primary" round size="sm" icon={<Trophy size={12} />}>{t('lgChampion')}</Tag>} />
      </CardBody></Card>}
      <TabList size="sm" variant="pills" activeId={tab} onChange={(id) => setTab(id as typeof tab)} items={[{ id: 'table', label: t('lgStandings') }, { id: 'rounds', label: t('lgBracket') }]} />
      {tab === 'table' ? (
        <Card depth={2}><CardBody>
          <DataTable rows={rows} getKey={(x) => x.clubId} columns={cols} defaultSort={{ id: 'score', dir: 'desc' }} />
        </CardBody></Card>
      ) : (
        <Stack direction="column" gap={3}>
          <Stack direction="row" justify="end"><Select size="sm" value={round} aria-label={t('lgBracket')} onChange={(e) => setRound(e.target.value)} options={L.rounds.map((x) => ({ value: x.id, label: x.label }))} /></Stack>
          <Text size="sm" intent="muted">{t('lgRoundMetric', { metric: metric(r.metric) })}</Text>
          <Stack direction="column" gap={2}>
            {r.matches.map((m) => (
              <Card depth={2} key={m.id}><CardBody><Stack direction="row" gap={3} align="center" justify="between" wrap>
                <Stack direction="row" gap={2} align="center" grow={1}>
                  <Text weight={m.winner === m.a ? 'bold' : 'normal'} intent={m.winner === m.a ? undefined : 'muted'}>{name(m.a)} · {fmt(m.scoreA)}</Text>
                  <Text size="xs" intent="muted">{t('lgVs')}</Text>
                  <Text weight={m.winner === m.b ? 'bold' : 'normal'} intent={m.winner === m.b ? undefined : 'muted'}>{name(m.b)} · {fmt(m.scoreB)}</Text>
                </Stack>
                <Stack direction="row" gap={2} align="center">
                  <Tag intent="success" minimal round size="sm">{name(m.winner)} {t('lgWinner')}</Tag>
                  <Button size="sm" variant="outline" onClick={() => s.go('quests')}>{t('lgPlayQuest')}</Button>
                </Stack>
              </Stack></CardBody></Card>))}
          </Stack>
        </Stack>
      )}
    </Stack></Page>
  );
};
