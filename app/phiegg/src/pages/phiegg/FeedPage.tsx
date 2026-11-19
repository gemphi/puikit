import React, { useState } from 'react';
import { Avatar, Button, Card, CardBody, Col, Grid, Icon, ItemCard, Page, ProgressBar, Stack, StatusRail, TabList, Tag, Text } from '@pui/components';
import * as L from 'lucide-react';
import { useStore } from '@pui/store';
import { entityPalette } from '../../lib/colour';
import { phieggStore } from '../../state/phieggStore';
import { D, feedPosts, fmt, person, site, t, usd, worldMark, worldThumb, itemOf } from '../../lib/data';
import { PageSections } from '../../components/Phiegg/PageSections';
import { livePools, poolStats, statQuest, useNow, useSwaps } from '../../lib/market';
import { ShotCard } from '../../components/Phiegg/ShotCard';
import { Composer } from '../../components/Phiegg/Overlays';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { Tile } from '../../components/Phiegg/Tile';
import { entityColour, personColour } from '../../lib/colour';
import type { Pool } from '../../types/phiegg';

/** A live market moment in the feed: a drop's sold counter and moving value, or a stat quest to join, read live. */
const MarketMoment: React.FC<{ pool: Pool; k: number; now: number }> = ({ pool, k, now }) => {
  const s = useStore(phieggStore); const club = itemOf('club', pool.clubId);
  const rows = poolStats(pool, now); const sold = rows.find((r) => r.metric.id === 'sold')!; const total = rows.find((r) => r.metric.id === 'ladderTotal')!;
  const stat = rows[(k * 7) % rows.length]; const q = statQuest(pool, stat);
  // The tile is the card; the moment around it has no surface of its own.
  const tile = { tone: club?.tone ?? 'accent', color: pool.colors?.[k % Math.max(1, pool.colors?.length ?? 1)], title: sold.text + ' sold', sub: t('plValue', { v: total.text }), depth: { worldId: pool.worldId, clubId: pool.clubId, entityId: pool.id, entityName: pool.name } };
  return (
    <Card depth={2} deckDirection="down" padding="sm"><CardBody><Stack direction="column" gap={2}>
      <Stack direction="row" gap={2} align="center" justify="between"><Stack direction="row" gap={2} align="center"><EntityAvatar id={pool.id} name={pool.name} size="sm" />
        <Stack direction="column" gap={0}><Text size="sm" weight="bold">{pool.name}</Text><Text size="xs" intent="muted">{club?.name} · {t(('plKind_' + pool.kind) as 'plKind_show')}</Text></Stack></Stack>
        <Tag round size="sm" intent="primary">{t('plShowDrop')}</Tag></Stack>
      <Tile {...tile} ratio="16/9" onClick={() => s.openStory(pool.id)} />
      <ProgressBar value={sold.progress} size="sm" animate={false} />
      <Stack direction="row" gap={2} align="center" wrap>
        <Stack grow={1}><Text size="xs" intent="muted">{q.title} · {Math.round(q.progress * 100)}%</Text></Stack>
        <Button size="sm" variant="ghost" onClick={() => s.openStat(pool.id, stat.metric.id)}>{t('plStatQuest')}</Button>
        <Button size="sm" variant="primary" onClick={() => s.go('pool', { poolId: pool.id })}>{t('plOpensDrop')}</Button>
      </Stack>
    </Stack></CardBody></Card>
  );
};

/** A region's one action: an icon that opens the whole list in the browse sheet. */
const SeeAll: React.FC<{ label: string; onOpen: () => void }> = ({ label, onOpen }) => (
  <Button variant="icon" size="sm" onClick={onOpen} aria-label={t('seeAll') + ' · ' + label} title={t('seeAll')}><L.ArrowUpRight size={16} /></Button>
);
const glyph = (name?: string) => { const G = name ? (L as unknown as Record<string, L.LucideIcon>)[name] : undefined; return G ? <Icon icon={G} size="xs" /> : undefined; };

export const FeedPage: React.FC = () => {
  const s = useStore(phieggStore); const now = useNow(2000); const swaps = useSwaps();
  const ids = [...D.feed.moments.map((m) => m.userId), ...D.agents.agents.map((a) => a.id)];
  const live = new Set(D.feed.moments.filter((m) => m.live).map((m) => m.userId));
  const [n, setN] = useState(20); const hot = livePools(now, 10);
  // Feeds (site.json feedKinds, also the Feeds dropdown in the Home sidebar): everything, following, looks, reels, agents, worlds.
  const kinds = (site as unknown as { feedKinds: { id: string; label: string; icon?: string }[] }).feedKinds; const kind = s.feedKind || 'all';
  // Recent, Following, Popular and Favourite are the feed's tabs; reels (the sidebar's Reels) still filter it.
  const posts = feedPosts().filter((p) => (kind !== 'following' || s.follow[p.authorId]) && (kind !== 'favourite' || s.liked[p.id] || s.saved[p.id]) && (kind !== 'reels' || p.slides.length > 1));
  posts.sort(kind === 'popular' ? (a, b) => b.likes - a.likes : (a, b) => b.createdAt.localeCompare(a.createdAt));
  const worlds = D.core.worlds.filter((w) => w.gallery?.length).sort((a, b) => b.visitorsNow - a.visitorsNow).slice(0, 5);
  const rail = [
    ...hot.slice(0, 6).map(({ pool, N }) => ({ id: pool.id, thumb: <EntityAvatar id={pool.id} name={pool.name} size="lg" />, label: pool.name, sub: Math.round((N.supply ? N.sold / N.supply : 0) * 100) + '% sold', live: true, color: entityColour(pool.id), onClick: () => s.openStory(pool.id) })),
    ...ids.map((id) => { const p = person(id); return { id, thumb: <PersonAvatar id={id} size="lg" />, label: p.handle, sub: p.isAgent ? 'Agent' : undefined, live: live.has(id), color: personColour(id), onClick: () => s.openStory(id) }; }),
  ];
  // Every third item is a live market moment, so the feed keeps moving with the pools.
  const items: React.ReactNode[] = []; posts.slice(0, n).forEach((p, i) => { items.push(<ShotCard key={p.id} post={p} />); if (i % 3 === 2 && hot.length) { const h = hot[(i / 3) % hot.length | 0]; items.push(<MarketMoment key={'m' + i} pool={h.pool} k={i} now={now} />); } });
  return (
    <Page width="feed">
      <Grid gap={4} xs={1} lg={12}>
        <Col span={8} xs={12} lg={8}>
          <Stack direction="column" gap={6} maxWidth="36rem" style={{ marginInline: 'auto', width: '100%' }}>
            <StatusRail aria-label="Stories" items={rail} />
            <TabList size="sm" variant="pills" place="center" aria-label={t('fdKinds')} activeId={kind} onChange={(id) => { s.go('feed', { feedKind: id }); setN(20); }} items={kinds.map((k) => ({ id: k.id, label: k.label, icon: glyph(k.icon) }))} />
            <Composer placeholder={t('sharePh')} onSend={(v) => s.postShot(v)} />
            {items.length ? items : <Text intent="muted">{t('fdNone')}</Text>}
            {n < posts.length && <Button variant="outline" onClick={() => setN(n + 20)}>{t('loadMore', { n: posts.length - n })}</Button>}
          </Stack>
        </Col>
        <Col span={4} xs={12} lg={4}>
          <PageSections id="feed-side" size="sm" sections={[
            { id: 'clubs', title: t('fdClubs'), actions: <SeeAll label={t('fdClubs')} onOpen={() => s.openList('clubs')} />, content: (
              <Stack direction="column" gap={2}>{D.feed.suggestedClubIds.map((id) => { const c = itemOf('club', id)!; return (
                <ItemCard key={id} variant="flat" stackBelow="never" onClick={() => s.go('club', { clubId: c.id })} media={<EntityAvatar id={c.id} name={c.name} size="md" />} title={c.name} meta={fmt(c.holders) + ' ' + t('holders')} />); })}</Stack>) },
            { id: 'drops', title: t('drops'), actions: <SeeAll label={t('drops')} onOpen={() => s.openList('drops')} />, content: (
              <Stack direction="column" gap={2}>{hot.slice(0, 5).map(({ pool, N }) => (
                <Card key={pool.id} padding="sm" depth={1} onClick={() => s.go('pool', { poolId: pool.id })}><CardBody><Stack direction="column" gap={1}>
                  <Stack direction="row" justify="between" gap={2}><Text size="sm" weight="bold">{pool.name}</Text><Text size="xs" numeric>{usd(N.floor)}</Text></Stack>
                  <Text size="xs" intent="muted">{t('plSold', { sold: N.sold.toLocaleString('en-US'), supply: N.supply.toLocaleString('en-US') })}</Text>
                  <ProgressBar value={N.supply ? N.sold / N.supply : 0} size="sm" animate={false} /></Stack></CardBody></Card>))}</Stack>) },
            { id: 'events', title: t('fdEvents'), actions: <SeeAll label={t('fdEvents')} onOpen={() => s.openList('events')} />, content: (
              <Stack direction="column" gap={2}>{D.feed.upcomingEventIds.map((id) => { const e = itemOf('event', id)!; return (
                <ItemCard key={id} variant="flat" stackBelow="never" onClick={() => s.go('events')} media={<EntityAvatar id={e.id} name={e.title} size="md" />} title={e.title} meta={itemOf('world', e.worldId)?.name} />); })}</Stack>) },
            { id: 'worlds', title: t('fdWorlds'), hidden: !worlds.length, actions: <SeeAll label={t('fdWorlds')} onOpen={() => s.go('worlds')} />, content: (
              <Stack direction="column" gap={2}>{worlds.map((w) => { const m = worldMark(w); return (
                <ItemCard key={w.id} variant="flat" stackBelow="never" onClick={() => s.go('world', { worldId: w.id })} media={m ? <Avatar size="md" src={m} fit="contain" alt="" colors={entityPalette(w.id)} /> : <Avatar size="md" src={worldThumb(w)} alt="" />}
                  title={w.name} meta={t('insideNow', { n: fmt(w.visitorsNow) })} />); })}</Stack>) },
            { id: 'agents', title: t('fdAgents'), actions: <SeeAll label={t('fdAgents')} onOpen={() => s.go('agents-hub')} />, content: (
              <Stack direction="column" gap={2}>{D.agents.agents.slice(0, 5).map((a) => (
                <ItemCard key={a.id} variant="flat" stackBelow="never" onClick={() => s.openPerson(a.id)} media={<PersonAvatar id={a.id} size="md" />} title={a.name} meta={a.role} />))}</Stack>) },
            { id: 'swaps', title: t('plSwap'), hidden: !swaps.history.length, content: (
              <Stack direction="column" gap={1}>{swaps.history.slice(0, 4).map((x) => <Text key={x.t} size="xs">{x.difference >= 0 ? '+' : '−'}{usd(Math.abs(x.difference))}</Text>)}</Stack>) },
          ]} />
        </Col>
      </Grid>
    </Page>
  );
};
