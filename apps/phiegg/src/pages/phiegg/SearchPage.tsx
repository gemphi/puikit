import React, { useMemo, useState } from 'react';
import { Avatar, Button, Icon, Input, ItemCard, Page, Rows, SpriteImage, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { Search as SearchIcon } from 'lucide-react';
import { D, rideKind, rideSprite, seriesOf, showLead, site, t, worldImage, worldOf } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { PageSections } from '../../components/Phiegg/PageSections';
import { phieggStore } from '../../state/phieggStore';
import { searchGroups } from '../../components/Phiegg/Search';
import { ListView } from '../../components/Phiegg/Views';

const L = D.landing as unknown as { featured?: { worldIds: string[]; seriesIds: string[] } };
const POPULAR = (site as unknown as { searchPopular: string[] }).searchPopular;

/** Before a query: what people look for, and a few worlds, rides, shows and stories to open. */
const Suggestions: React.FC<{ onQuery: (q: string) => void }> = ({ onQuery }) => {
  const s = useStore(phieggStore);
  const worlds = (L.featured?.worldIds ?? []).map(worldOf).filter((w): w is NonNullable<typeof w> => !!w).slice(0, 6);
  const rides = (['car', 'cab', 'van', 'jetski', 'saucer', 'fun'] as const).map((k) => D.ride.list.find((r) => r.kind === k)).filter((r): r is NonNullable<typeof r> => !!r);
  const shows = [...D.shows.shows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const stories = (L.featured?.seriesIds ?? []).map(seriesOf).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 6);
  return (
    <PageSections id="search" sections={[
      { id: 'popular', title: t('srPopular'), content: <Stack direction="row" gap={1} wrap>{POPULAR.map((p) => <Tag key={p} interactive round onClick={() => onQuery(p)}>{p}</Tag>)}</Stack> },
      { id: 'worlds', title: t('srWorlds'), content: (
        <Rows cols={3} colsSm={1} minItemWidth="15rem">{worlds.map((w) => (
          <Tile key={w.id} image={worldImage(w)} tone={w.tone} ratio="16/9" grid title={w.name} sub={w.description} depth={{ worldId: w.id, clubId: w.clubId }} onClick={() => s.go('world', { worldId: w.id })} />))}</Rows>) },
      { id: 'rides', title: t('srRides'), content: (
        <Rows cols={6} colsSm={2} minItemWidth="9rem">{rides.map((r) => (
          <ItemCard key={r.id} depth={1} variant="flat" layout="vertical" tint={r.hex} onClick={() => s.openAsset(r.id)} media={<SpriteImage sprite={rideSprite(r)} alt={r.name} ratio="16 / 10" radius="lg" />} title={r.name} meta={rideKind(r.kind)} />))}</Rows>) },
      { id: 'shows', title: t('srShows'), content: (
        <Rows cols={4} colsSm={2} minItemWidth="12rem">{shows.map((x) => { const lead = showLead(x); return (
          <Tile key={x.id} tone={x.tone} color={lead.hex} ratio="4/5" depth={{ worldId: x.worldId, clubId: x.clubId, personId: x.hostAgentId, mid: lead.mid }} title={x.title} sub={worldOf(x.worldId)?.name} onClick={() => s.go('show', { showId: x.id })} />); })}</Rows>) },
      { id: 'stories', title: t('srStories'), content: (
        <Rows cols={3} colsSm={1} minItemWidth="16rem">{stories.map((x) => (
          <ItemCard key={x.id} depth={1} variant="flat" onClick={() => s.openSeries(x.id)} title={x.title} meta={[x.genre, worldOf(x.worldId)?.name].filter(Boolean).join(' · ')}>{x.synopsis}</ItemCard>))}</Rows>) },
    ]} />
  );
};

type Row = ReturnType<typeof searchGroups>[number]['hits'][number] & { kind: string; rank: number };

/** Full search: every match (not the header's top four), filterable by kind. */
export const SearchPage: React.FC = () => {
  const s = useStore(phieggStore);
  const [q, setQ] = useState(s.searchQ);
  const groups = useMemo(() => (q.trim() ? searchGroups(q, s, 128) : []), [q, s]);
  // One list of every match; the kind (clubs, worlds, people, agents, shows, hosts) is a filter, not a second tab row.
  const rows: Row[] = groups.flatMap((g) => g.hits.map((h, i) => ({ ...h, kind: g.label, rank: i })));
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}><Title level={2} size="xl">{t('srTitle')}</Title><Text intent="secondary">{t('srSub')}</Text></Stack>
      <Input autoFocus value={q} placeholder={t('navSearch')} aria-label={t('navSearch')} icon={<Icon icon={SearchIcon} size="xs" />}
        onChange={(e) => { setQ(e.target.value); phieggStore.setState({ searchQ: e.target.value }); }} />
      {!q.trim() && <Suggestions onQuery={(v) => { setQ(v); phieggStore.setState({ searchQ: v }); }} />}
      {q.trim() && (
        <ListView<Row> rows={rows} keyOf={(h) => h.kind + ':' + h.id} text={(h) => h.title + ' ' + (h.sub ?? '')} onRow={(h) => h.open()} cols={3} empty={t('navNoMatch', { q: q.trim() })}
          facets={[{ id: 'kind', label: t('lsColKind'), get: (h) => h.kind }]}
          sorts={[{ id: 'best', label: t('srBest'), by: (a, b) => a.rank - b.rank }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.title.localeCompare(b.title) }]}
          table={[{ id: 'title', header: t('lsColName'), cell: (h) => h.title, sortValue: (h) => h.title }, { id: 'kind', header: t('lsColKind'), cell: (h) => h.kind, sortValue: (h) => h.kind }, { id: 'sub', header: t('isValue'), cell: (h) => h.sub ?? '' }]}
          render={(h) => (
            <ItemCard depth={2} variant="flat" onClick={h.open} media={<Avatar initials={h.initials} size="md" />} title={h.title} meta={h.kind}>{h.sub || undefined}</ItemCard>)} />)}
    </Stack></Page>
  );
};
