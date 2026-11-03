import React, { useState } from 'react';
import { Button, Rows, Card, CardBody, Input, Page, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { D, clubOf, collectionFamilies, fmt, person, site, t, usd, worldOf, worldImage } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';


const tags = site.categoryTags as Record<string, string>;

export const ExplorePage: React.FC = () => {
  const s = useStore(phieggStore);
  const [q, setQ] = useState(''); const [cat, setCat] = useState(D.explore.categories[0]);
  const m = (n: string) => !q.trim() || n.toLowerCase().includes(q.trim().toLowerCase());
  const clubs = D.core.clubs.filter((c) => (!tags[cat] || c.tags.includes(tags[cat])) && m(c.name));
  const worlds = (q.trim() ? D.core.worlds : D.explore.trendingWorldIds.map((id) => worldOf(id)!)).filter((w) => w && m(w.name)).slice(0, 12);
  const people = [...D.explore.creatorIds, ...D.agents.agents.map((a) => a.id)].map(person).filter((p) => m(p.name));
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Input value={q} placeholder={t('searchPh')} onChange={(e) => setQ(e.target.value)} />
        <TabList size="sm" variant="pills" activeId={cat} onChange={(id) => setCat(id as typeof cat)} items={D.explore.categories.map((c) => ({ id: c, label: c }))} />
        <Title level={3} size="lg">{t('trendingClubs')}</Title>
        {/* Only full rows: a feature row, complete rows of four, leftovers in a slider, never a gap. */}
        <Rows feature cols={4} colsSm={2} rowHeight="clamp(11rem, 18vw, 15rem)" aria-label={t('trendingClubs')}>{clubs.map((c, i) => (
          <Tile key={c.id} tone={c.tone} ratio="auto" big={i === 0} title={c.name} depth={{ clubId: c.id, worldId: c.worldIds[0], personId: c.founderId }} onClick={() => s.go('club', { clubId: c.id })}
            sub={(c.floor ? c.floor + ' ETH ' + t('floor') : t('preMint')) + ' · ' + fmt(c.holders) + ' ' + t('holders')} badges={<>{i < 3 && <Tag round size="sm">{t('exTrending', { n: i + 1 })}</Tag>}<Tag round size="sm">{(site.clubStatus as Record<string, string>)[c.status]}</Tag></>} />))}</Rows>
        <Title level={3} size="lg">{t('exCollections')}</Title>
        <Rows cols={4} colsSm={2} rowHeight="clamp(10rem, 15vw, 13rem)" aria-label={t('exCollections')}>{collectionFamilies().filter((f) => f.clubs.length > 1 && m(f.nest.name)).slice(0, 8).map((f, i) => (
          <Tile key={f.nest.id} tone={f.clubs[0]?.tone ?? 'accent'} ratio="auto" title={'#' + f.nest.name} depth={{ clubId: f.clubs[0]?.id, worldId: (f.nest as { worldId?: string }).worldId ?? f.clubs[0]?.worldIds[0], entityId: f.nest.id, entityName: f.nest.name }}
            sub={t('colClubsN', { n: f.clubs.length }) + ' · ' + usd(f.volumeUsd)} badges={i < 3 && <Tag round size="sm">{t('exTrending', { n: i + 1 })}</Tag>} onClick={() => s.go('collection', { nestId: f.nest.id })} />))}</Rows>
        <Stack direction="row" justify="between"><Title level={3} size="lg">{t('worldsToVisit')}</Title><Button size="sm" variant="outline" onClick={() => s.go('worlds')}>{t('allWorlds')}</Button></Stack>
        <Rows cols={4} colsSm={2} rowHeight="clamp(10rem, 15vw, 13rem)" aria-label={t('worldsToVisit')}>{worlds.map((w) => <Tile key={w.id} image={worldImage(w)} tone={w.tone} ratio="auto" grid title={w.name} depth={{ worldId: w.id, clubId: w.clubId, personId: w.creatorId }} sub={clubOf(w.clubId)?.name} onClick={() => s.go('world', { worldId: w.id })} />)}</Rows>
        <Title level={3} size="lg">{t('creators')}</Title>
        <Rows slider itemWidth="11.5rem" aria-label={t('creators')}>{people.map((p) => (
          <Card depth={2} key={p.id}><CardBody><Stack direction="column" align="center" gap={1}><PersonAvatar id={p.id} size="lg" />
            <Text size="sm" weight="bold" truncate maxWidth="100%">{p.name}</Text>
            <Text size="xs" intent="muted">{fmt(p.followers)} {t('followers')}</Text>
            <Button size="sm" variant={s.follow[p.id] ? 'secondary' : 'outline'} onClick={() => s.toggle('follow', p.id)}>{s.follow[p.id] ? t('following') : t('follow')}</Button></Stack></CardBody></Card>))}</Rows>
      </Stack>
    </Page>
  );
};
