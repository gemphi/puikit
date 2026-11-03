import React, { useState } from 'react';
import { Button, Card, CardBody, Col, Grid, Page, ProgressBar, Stack, StatusRail, TabList, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronRight } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { D, clubOf, eventOf, feedPosts, fmt, person, site, t, usd, worldOf } from '../../lib/data';
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
  const s = useStore(phieggStore); const club = clubOf(pool.clubId);
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

/** A right-column card header with the arrow that opens the whole list in the browse sheet. */
const SeeAll: React.FC<{ title: string; onOpen: () => void }> = ({ title, onOpen }) => (
  <Stack direction="row" justify="between" align="center"><Title level={5} size="sm">{title}</Title>
    <Button variant="icon" size="sm" onClick={onOpen} aria-label={t('seeAll') + ' · ' + title}><ChevronRight size={16} /></Button></Stack>
);

export const FeedPage: React.FC = () => {
  const s = useStore(phieggStore); const now = useNow(2000); const swaps = useSwaps();
  const ids = [...D.feed.moments.map((m) => m.userId), ...D.agents.agents.map((a) => a.id)];
  const live = new Set(D.feed.moments.filter((m) => m.live).map((m) => m.userId));
  const [n, setN] = useState(20); const hot = livePools(now, 10);
  // Feeds (site.json feedKinds, also the Feeds dropdown in the Home sidebar): everything, following, looks, reels, agents, worlds.
  const kinds = (site as unknown as { feedKinds: { id: string; label: string }[] }).feedKinds; const kind = s.feedKind || 'all';
  const posts = feedPosts().filter((p) => kind === 'all' || (kind === 'following' && s.follow[p.authorId]) || (kind === 'looks' && p.kind === 'look')
    || (kind === 'reels' && p.slides.length > 1) || (kind === 'agents' && person(p.authorId).isAgent) || (kind === 'worlds' && !!p.worldId));
  const rail = [
    ...hot.slice(0, 6).map(({ pool, N }) => ({ id: pool.id, thumb: <EntityAvatar id={pool.id} name={pool.name} size="lg" />, label: pool.name, sub: Math.round((N.supply ? N.sold / N.supply : 0) * 100) + '% sold', live: true, color: entityColour(pool.id), onClick: () => s.openStory(pool.id) })),
    ...ids.map((id) => { const p = person(id); return { id, thumb: <PersonAvatar id={id} size="lg" />, label: p.handle, sub: p.isAgent ? 'Agent' : undefined, live: live.has(id), color: personColour(id), onClick: () => s.openStory(id) }; }),
  ];
  // Every third item is a live market moment, so the feed keeps moving with the pools.
  const items: React.ReactNode[] = []; posts.slice(0, n).forEach((p, i) => { items.push(<ShotCard key={p.id} post={p} />); if (i % 3 === 2 && hot.length) { const h = hot[(i / 3) % hot.length | 0]; items.push(<MarketMoment key={'m' + i} pool={h.pool} k={i} now={now} />); } });
  return (
    <Page>
      <Grid gap={4} xs={1} lg={12}>
        <Col span={8} xs={12} lg={8}>
          <Stack direction="column" gap={4} maxWidth="36rem">
            <StatusRail aria-label="Stories" items={rail} />
            <TabList size="sm" variant="pills" aria-label={t('fdKinds')} activeId={kind} onChange={(id) => { s.go('feed', { feedKind: id }); setN(20); }} items={kinds.map((k) => ({ id: k.id, label: k.label }))} />
            <Composer placeholder={t('sharePh')} onSend={(v) => s.postShot(v)} />
            {items.length ? items : <Text intent="muted">{t('fdNone')}</Text>}
            {n < posts.length && <Button variant="outline" onClick={() => setN(n + 20)}>{t('loadMore', { n: posts.length - n })}</Button>}
          </Stack>
        </Col>
        <Col span={4} xs={12} lg={4}>
          <Stack direction="column" gap={3}>
            {/* Rows sit on the opposite gradient of their card, so each one reads as cut into it. */}
            <Card depth={3}><CardBody><Stack direction="column" gap={2}><SeeAll title={t('clubsToJoin')} onOpen={() => s.openList('clubs')} />{D.feed.suggestedClubIds.map((id) => { const c = clubOf(id)!; return (
              <Card key={id} padding="sm" data-gradient-direction="reverse" depth={1}><CardBody><Stack direction="row" justify="between" align="center" gap={2}>
                <Stack direction="row" gap={2} align="center"><EntityAvatar id={c.id} name={c.name} size="sm" /><Stack direction="column" gap={0}><Text size="sm" weight="bold">{c.name}</Text><Text size="xs" intent="muted">{fmt(c.holders)} {t('holders')}</Text></Stack></Stack>
                <Button size="sm" variant="outline" onClick={() => s.go('club', { clubId: c.id })}>{t('view')}</Button></Stack></CardBody></Card>); })}</Stack></CardBody></Card>
            <Card depth={3}><CardBody><Stack direction="column" gap={2}><SeeAll title={t('drops')} onOpen={() => s.openList('drops')} />{hot.slice(0, 5).map(({ pool, N }) => (
              <Card key={pool.id} padding="sm" data-gradient-direction="reverse" depth={1} onClick={() => s.go('pool', { poolId: pool.id })}><CardBody><Stack direction="column" gap={1}>
                <Stack direction="row" justify="between" gap={2}><Text size="sm" weight="bold">{pool.name}</Text><Text size="xs" numeric>{usd(N.floor)}</Text></Stack>
                <Text size="xs" intent="muted">{t('plSold', { sold: N.sold.toLocaleString('en-US'), supply: N.supply.toLocaleString('en-US') })}</Text>
                <ProgressBar value={N.supply ? N.sold / N.supply : 0} size="sm" animate={false} /></Stack></CardBody></Card>))}</Stack></CardBody></Card>
            <Card depth={3}><CardBody><Stack direction="column" gap={2}><SeeAll title={t('comingUp')} onOpen={() => s.openList('events')} />{D.feed.upcomingEventIds.map((id) => { const e = eventOf(id)!; return (
              <Card key={id} padding="sm" data-gradient-direction="reverse" depth={1} onClick={() => s.go('events')}><CardBody><Text size="sm" weight="bold">{e.title}</Text><Text size="xs" intent="muted">{worldOf(e.worldId)?.name}</Text></CardBody></Card>); })}</Stack></CardBody></Card>
            {swaps.history.length > 0 && <Card depth={3}><CardBody><Stack direction="column" gap={2}><Title level={5} size="sm">{t('plSwap')}</Title>{swaps.history.slice(0, 4).map((x) => (
              <Card key={x.t} padding="sm" data-gradient-direction="reverse" depth={1}><CardBody><Text size="xs">{x.difference >= 0 ? '+' : '−'}{usd(Math.abs(x.difference))}</Text></CardBody></Card>))}</Stack></CardBody></Card>}
          </Stack>
        </Col>
      </Grid>
    </Page>
  );
};
