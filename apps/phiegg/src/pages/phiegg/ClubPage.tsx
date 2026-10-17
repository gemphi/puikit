import React, { useState } from 'react';
import { Button, Card, CardBody, Grid, Page, Select, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, sortsFor, tableFor } from '../../lib/fields';
import { usePlaces } from '../../lib/lazy';
import { D, clubOf, fmt, hostOf, person, placesOfClub, postsBy, site, storeOfClub, t, worldOf } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { postTile } from '../../components/Phiegg/ShotCard';
import { ClubIcon, ListView } from '../../components/Phiegg/Views';
import type { ClubPiece, Place, Post, World } from '../../types/phiegg';
import { Connected } from '../../components/Phiegg/Connected';

const KIND = (site as unknown as { placeKinds: Record<string, string> }).placeKinds;

export const ClubPage: React.FC = () => {
  const s = useStore(phieggStore);
  const c = clubOf(s.clubId) ?? D.core.clubs[0]; const [tab, setTab] = useState(D.club.tabs[0]);
  const founder = person(c.founderId); const host = hostOf(c.hostId);
  const shots = [...D.core.users.flatMap((u) => postsBy(u.id)), ...D.agents.posts].filter((p) => p.clubId === c.id);
  const pieces = D.club.pieces.filter((p) => (p as { clubId?: string }).clubId === c.id);
  usePlaces(); const store = storeOfClub(c.id); const spots = placesOfClub(c.id);
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="end"><Select size="sm" value={c.id} aria-label={t('lsChooseClub')} onChange={(e) => s.go('club', { clubId: e.target.value })} options={D.core.clubs.map((x) => ({ value: x.id, label: x.name }))} /></Stack>
        <Tile tone={c.tone} ratio="21/7" big grid depth={{ clubId: c.id, worldId: c.worldIds[0], personId: c.founderId }} title={c.name} sub={c.tagline} badges={<><Tag round size="sm">{(site.clubStatus as Record<string, string>)[c.status]}</Tag><Tag round size="sm">{c.chain}</Tag></>} />
        <Stack direction="row" gap={2} align="center"><ClubIcon icon={(c as { icon?: string }).icon} size="2rem" /><Text>{c.description}</Text></Stack>
        <Stack direction="row" gap={2} wrap align="center">
          <Text size="sm" intent="muted">{t('founder')} <Text as="strong" size="sm" weight="bold" intent="inherit">{founder.name}</Text></Text>
          {host && <Button variant="primary" onClick={() => s.go('hosts')}>{t('enterHost')}</Button>}
          {store && <Button variant="outline" onClick={() => s.go('shop', { storeId: store.id })}>{store.name}</Button>}
          <Button variant={s.follow[c.id] ? 'secondary' : 'outline'} onClick={() => s.toggle('follow', c.id)}>{s.follow[c.id] ? t('following') : t('follow')}</Button>
          {c.founderId === D.core.currentUserId && <Button variant="outline" onClick={() => s.openEditClub(c.id)}>{t('editClub')}</Button>}
        </Stack>
        <Grid gap={3} xs={2} md={4}>{[[t('floor'), c.floor ? c.floor + ' ETH' : '·'], [t('holders'), fmt(c.holders)], [t('supply'), fmt(c.supply)], [t('cities'), String(c.worldIds.reduce((n, w) => n + (worldOf(w)?.cities.length ?? 0), 0))]].map(([l, v]) =>
          <Card depth={2} key={l} variant="flat"><CardBody><Text size="xs" intent="muted">{l}</Text><Title level={4} size="lg">{v}</Title></CardBody></Card>)}</Grid>
        <TabList size="sm" variant="pills" activeId={tab} onChange={(id) => setTab(id as typeof tab)} items={D.club.tabs.map((x) => ({ id: x, label: x }))} />
        {tab === D.club.tabs[0] && <ListView<ClubPiece> rows={pieces} keyOf={(p) => p.id} text={(p) => p.name + ' ' + p.trait + ' ' + p.tokenId}
          facets={facetsFor('piece')}
          sorts={sortsFor('piece')}
          table={tableFor('piece')}
          render={(p) => <Tile tone={p.tone} ratio="1" depth={{ clubId: c.id, worldId: c.worldIds[0], personId: p.creatorId }} title={p.name} sub={p.tokenId + ' · ' + p.trait} badges={p.ownerId === D.core.currentUserId && <Tag intent="success" round size="sm">{t('yours')}</Tag>} />} />}
        {tab === D.club.tabs[1] && <ListView<World> rows={c.worldIds.map((id) => worldOf(id)).filter((w): w is World => !!w)} keyOf={(w) => w.id} text={(w) => w.name + ' ' + w.description} onRow={(w) => s.go('world', { worldId: w.id })}
          facets={facetsFor('world')}
          sorts={sortsFor('world')}
          table={tableFor('world')}
          render={(w) => <Tile tone={w.tone} ratio="16/10" depth={{ worldId: w.id, clubId: c.id, personId: (w as { creatorId?: string }).creatorId }} title={w.name} sub={t('stats', { visitors: fmt(w.visitorsNow), cities: w.cities.length })} onClick={() => s.go('world', { worldId: w.id })} />} />}
        {tab === D.club.tabs[2] && <ListView<Post> rows={shots} keyOf={(p) => p.id} text={(p) => p.caption + ' ' + p.slides.map((x) => x.title).join(' ')} onRow={(p) => s.openPost(p.id)}
          facets={facetsFor('post')}
          sorts={sortsFor('post')}
          table={[{ id: 'title', header: t('lsColName'), cell: (p) => p.slides[0].title, sortValue: (p) => p.slides[0].title }, { id: 'author', header: t('lsAuthor'), cell: (p) => person(p.authorId).name, sortValue: (p) => person(p.authorId).name },
            { id: 'date', header: t('lsColDate'), cell: (p) => p.createdAt.slice(0, 10), sortValue: (p) => p.createdAt }, { id: 'likes', header: t('lsColLikes'), cell: (p) => fmt(p.likes), sortValue: (p) => p.likes, align: 'right' }]}
          render={(p) => <Tile {...postTile(p)} ratio="1" title={p.slides[0].title} onClick={() => s.openPost(p.id)} />} />}
        {tab === D.club.tabs[1] && spots.length > 0 && <Stack direction="column" gap={2}><Title level={4} size="md">{t('ctClubPlaces', { n: spots.length })}</Title>
          <ListView<Place> rows={spots.map((x) => x.place)} keyOf={(p) => p.id} text={(p) => p.name + ' ' + p.desc} onRow={(p) => s.openPlace(p.id)}
            facets={facetsFor('place').filter((f) => f.id === 'kind')}
            sorts={sortsFor('place').filter((x) => x.id !== 'az')}
            table={[{ id: 'name', header: t('lsColName'), cell: (p) => p.name, sortValue: (p) => p.name }, { id: 'kind', header: t('lsPlace'), cell: (p) => KIND[p.kind] ?? p.kind, sortValue: (p) => p.kind }, { id: 'rating', header: t('lsColRating'), cell: (p) => p.rating, sortValue: (p) => p.rating, align: 'right' }, { id: 'visitors', header: t('lsColVisitors'), cell: (p) => fmt(p.visitors), sortValue: (p) => p.visitors, align: 'right' }]}
            render={(p) => <Tile tone={p.tone} ratio="16/10" depth={{ clubId: c.id, worldId: c.worldIds[0] }} title={p.name} sub={KIND[p.kind] ?? p.kind} onClick={() => s.openPlace(p.id)} />} /></Stack>}
        {tab === D.club.tabs[3] && host && <Card depth={2}><CardBody><Title level={4} size="md">{host.name}</Title><Text size="sm" intent="muted">{host.gated} · {fmt(host.members)}</Text><Button variant="primary" onClick={() => s.go('hosts')}>{t('enterHost')}</Button></CardBody></Card>}
        <Connected kind="club" id={c.id} />
      </Stack>
    </Page>
  );
};
