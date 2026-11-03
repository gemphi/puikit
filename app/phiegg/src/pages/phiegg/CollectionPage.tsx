import React from 'react';
import { Card, CardBody, Grid, Page, Select, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { D, STORES, clubOf, clubsOfCollection, collectionOf, fmt, jewelOf, person, rideOf, t, usd, worldOf } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { ListView } from '../../components/Phiegg/Views';
import { Connected } from '../../components/Phiegg/Connected';
import type { Club, ID, Tone } from '../../types/phiegg';

/** One PFT of the collection, whatever its kind, as one row. */
type Pft = { id: ID; name: string; kind: string; clubId?: ID; usd?: number; tone?: Tone; open: () => void };

/** Every PFT that names this collection, across looks, pieces, eggs, machines, profiles, rides and jewellery. */
function pftsOf(nestId: ID, s: ReturnType<typeof phieggStore.getState>): Pft[] {
  const of = (r: unknown) => (r as { nestId?: ID }).nestId === nestId;
  const out: Pft[] = [];
  for (const st of STORES) for (const l of st.looks) if (of(l)) out.push({ id: l.id, name: l.name, kind: t('itLook'), clubId: st.clubId, usd: l.usd, open: () => s.openLook(l.id) });
  for (const p of D.club.pieces) if (of(p)) out.push({ id: p.id, name: p.name, kind: t('itPiece'), clubId: (p as { clubId?: ID }).clubId, tone: p.tone, open: () => s.openDetails({ kind: 'piece', id: p.id }) });
  for (const e of D.assets.eggs) if (of(e)) out.push({ id: e.id, name: e.name, kind: t('itEgg'), clubId: e.clubId, usd: e.priceUsd, open: () => s.openAsset(e.id) });
  for (const m of D.assets.sums) if (of(m)) out.push({ id: m.id, name: m.name, kind: t('itMachine'), clubId: m.clubId, open: () => s.openAsset(m.id) });
  for (const pp of D.assets.profiles) if (of(pp)) out.push({ id: pp.id, name: pp.name, kind: t('itProfile'), clubId: pp.clubId, usd: pp.priceUsd, open: () => s.openAsset(pp.id) });
  for (const r of D.ride.list) if (of(r)) out.push({ id: r.id, name: r.name, kind: t('rdKind_' + r.kind as 'rdKind_car'), clubId: r.clubId, usd: r.mode === 'sale' ? r.priceUsd : r.ticketUsd, open: () => s.openAsset(r.id) });
  for (const j of D.jewel.list) if (of(j)) out.push({ id: j.id, name: j.name, kind: t('itJewel'), clubId: j.clubId, usd: j.priceUsd, open: () => s.openAsset(j.id) });
  return out;
}

export const CollectionPage: React.FC = () => {
  const s = useStore(phieggStore);
  const all = D.hosts.nests.filter((n) => n.kind === 'collection');
  const col = collectionOf(s.nestId) ?? all[0];
  const clubs = clubsOfCollection(col.id);
  const pfts = React.useMemo(() => pftsOf(col.id, s), [col.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const ids = React.useMemo(() => new Set(pfts.map((x) => x.id)), [pfts]);
  const sales = D.sales.sales.filter((x) => ids.has(x.itemId) && x.event === 'sale');
  const lead = clubs[0];
  const world = worldOf((col as { worldId?: ID }).worldId ?? lead?.worldIds[0]);
  const floor = clubs.length ? Math.min(...clubs.map((c) => c.floor || Infinity)) : 0;
  const stats: [string, string][] = [
    [t('colClubs'), String(clubs.length)],
    [t('colPfts'), fmt(pfts.length)],
    [t('holders'), fmt(clubs.reduce((n, c) => n + c.holders, 0))],
    [t('supply'), fmt(clubs.reduce((n, c) => n + c.supply, 0))],
    [t('floor'), Number.isFinite(floor) && floor ? floor + ' ETH' : '·'],
    [t('colVolume'), sales.length ? usd(sales.reduce((n, x) => n + x.priceUsd, 0)) : '·'],
  ];
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="end"><Select size="sm" value={col.id} aria-label={t('colBadge')} onChange={(e) => s.go('collection', { nestId: e.target.value })} options={all.map((x) => ({ value: x.id, label: '#' + x.name }))} /></Stack>
        <Tile tone={lead?.tone ?? 'accent'} ratio="21/7" big grid depth={{ clubId: lead?.id, worldId: world?.id, entityId: col.id, entityName: col.name }}
          title={'#' + col.name} sub={clubs.length > 1 ? t('colClubsN', { n: clubs.length }) + ' · ' + t('colPftsN', { n: fmt(pfts.length) }) : t('colOne')}
          badges={<><Tag round size="sm">{t('colBadge')}</Tag>{world && <Tag round size="sm">{world.name}</Tag>}</>} />
        {col.topic ? <Text intent="secondary" maxWidth="70ch">{col.topic}</Text> : null}
        <Grid gap={3} xs={2} md={6}>{stats.map(([l, v]) => <Card depth={2} key={l} variant="flat"><CardBody><Text size="xs" intent="muted">{l}</Text><Title level={4} size="lg">{v}</Title></CardBody></Card>)}</Grid>

        <Title level={3} size="lg">{t('colClubs')}</Title>
        <ListView<Club> rows={clubs} keyOf={(c) => c.id} text={(c) => c.name + ' ' + c.tagline} onRow={(c) => s.go('club', { clubId: c.id })}
          facets={[{ id: 'world', label: t('lsWorld'), get: (c) => worldOf(c.worldIds[0])?.name }, { id: 'chain', label: t('lsColChain'), get: (c) => c.chain }]}
          sorts={[{ id: 'holders', label: t('holders'), by: (a, b) => b.holders - a.holders }, { id: 'floor', label: t('floor'), by: (a, b) => (b.floor || 0) - (a.floor || 0) }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
          table={[{ id: 'name', header: t('lsColName'), cell: (c) => c.name, sortValue: (c) => c.name }, { id: 'holders', header: t('holders'), cell: (c) => fmt(c.holders), sortValue: (c) => c.holders, align: 'right' },
            { id: 'floor', header: t('floor'), cell: (c) => (c.floor ? c.floor + ' ETH' : '·'), sortValue: (c) => c.floor ?? 0, align: 'right' }, { id: 'supply', header: t('supply'), cell: (c) => fmt(c.supply), sortValue: (c) => c.supply, align: 'right' }]}
          render={(c) => <Tile tone={c.tone} ratio="16/10" depth={{ clubId: c.id, worldId: c.worldIds[0], personId: c.founderId }} title={c.name} sub={t('stats2', { holders: fmt(c.holders), supply: fmt(c.supply) })} badges={<Tag round size="sm">{c.chain}</Tag>} onClick={() => s.go('club', { clubId: c.id })} />} />

        <Title level={3} size="lg">{t('colPfts')}</Title>
        <ListView<Pft> rows={pfts} keyOf={(x) => x.id} text={(x) => x.name + ' ' + x.kind} onRow={(x) => x.open()}
          facets={[{ id: 'kind', label: t('lsColKind'), get: (x) => x.kind }, { id: 'club', label: t('lsColClub'), get: (x) => clubOf(x.clubId)?.name }]}
          sorts={[{ id: 'price', label: t('colPrice'), by: (a, b) => (b.usd ?? -1) - (a.usd ?? -1) }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
          table={[{ id: 'name', header: t('lsColName'), cell: (x) => x.name, sortValue: (x) => x.name }, { id: 'kind', header: t('lsColKind'), cell: (x) => x.kind, sortValue: (x) => x.kind },
            { id: 'club', header: t('lsColClub'), cell: (x) => clubOf(x.clubId)?.name ?? '·', sortValue: (x) => clubOf(x.clubId)?.name ?? '' }, { id: 'usd', header: t('colPrice'), cell: (x) => (x.usd != null ? usd(x.usd) : '·'), sortValue: (x) => x.usd ?? -1, align: 'right' }]}
          render={(x) => <Tile tone={x.tone ?? clubOf(x.clubId)?.tone ?? 'neutral'} ratio="1" depth={{ clubId: x.clubId, worldId: clubOf(x.clubId)?.worldIds[0], entityId: x.id, entityName: x.name }} title={x.name} sub={x.kind + (x.usd != null ? ' · ' + usd(x.usd) : '')} onClick={() => x.open()} />} />

        <Connected kind="nest" id={col.id} />
      </Stack>
    </Page>
  );
};
