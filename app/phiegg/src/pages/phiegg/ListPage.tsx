import React, { useMemo, useState } from 'react';
import { Button, Card, CardBody, Input, ItemCard, Page, Popover, ProgressBar, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { poolNumbers, poolStats, useNow } from '../../lib/market';
import { PoolCard } from '../../components/Phiegg/Pools';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { D, clubOf, fmt, site, t, usd, worldOf } from '../../lib/data';
import { buyCoin, enterQuest, leaveQuest, sellCoin, useEconomy } from '../../lib/economy';
import { Tile } from '../../components/Phiegg/Tile';
import { ListView } from '../../components/Phiegg/Views';
import type { Coin, Pool, Quest } from '../../types/phiegg';

type Conf = { title: string; sub: string; source: string };
const pct = (n: number) => (n > 0 ? '+' : '') + n + '%';

/** Amount popover: type a USD amount, confirm. */
const Amount: React.FC<{ label: string; initial?: number; onConfirm: (n: number) => boolean; variant?: 'primary' | 'outline' }> = ({ label, initial = 100, onConfirm, variant = 'outline' }) => {
  const [open, setOpen] = useState(false); const [v, setV] = useState(String(initial));
  return (
    <Popover portal isOpen={open} onOpenChange={setOpen} placement="bottom-start" trigger={<Button variant={variant} size="sm">{label}</Button>}>
      <Stack direction="column" gap={2} minWidth="12rem">
        <Text size="xs" intent="muted" weight="bold">{t('stakeAmt')}</Text>
        <Input type="number" min={1} value={v} aria-label={t('stakeAmt')} onChange={(e) => setV(e.target.value)} />
        <Stack direction="row" gap={1}>{[50, 100, 500].map((n) => <Button key={n} size="sm" variant="ghost" onClick={() => setV(String(n))}>{usd(n)}</Button>)}</Stack>
        <Button size="sm" variant="primary" onClick={() => { if (onConfirm(Number(v))) setOpen(false); }}>{label} {usd(Number(v) || 0)}</Button>
      </Stack>
    </Popover>
  );
};

const QuestCard: React.FC<{ q: Quest }> = ({ q }) => {
  const s = useStore(phieggStore); const eco = useEconomy(); const inQ = !!eco.quests[q.id];
  return (
    <Card depth={2}><CardBody><Stack direction="column" gap={2}>
      <Tile animate tone={q.tone} ratio="16/8" depth={{ worldId: q.worldId, clubId: q.sponsorClubId }} title={q.title} sub={worldOf(q.worldId)?.name} badges={<Tag round size="sm">{t('reward', { n: q.reward, coin: q.rewardCoin })}</Tag>} />
      <Text size="xs" intent="muted">{t('sponsoredBy', { name: clubOf(q.sponsorClubId)?.name ?? '' })} · {t('entrants', { n: fmt(q.entrants + (inQ ? 1 : 0)) })} · {t('endsAt', { date: q.endsAt.slice(5, 10) })}</Text>
      <ProgressBar value={q.progress} size="sm" animate={false} />
      {inQ
        ? <Stack direction="row" gap={1} align="center"><Tag round intent="success" size="sm">{t('qEntered')}</Tag>
            <Button variant="primary" size="sm" onClick={() => s.go('world', { worldId: q.worldId })}>{worldOf(q.worldId)?.name ?? t('playQuest')}</Button>
            <Button variant="ghost" size="sm" onClick={() => { leaveQuest(q.id); s.flash(t('qLeft', { name: q.title })); }}>{t('qLeave')}</Button></Stack>
        : <Button variant="primary" size="sm" onClick={() => { enterQuest(q.id); s.flash(t('joined_', { name: q.title })); }}>{t('playQuest')}</Button>}
    </Stack></CardBody></Card>
  );
};

const CoinCard: React.FC<{ x: Coin }> = ({ x }) => {
  const s = useStore(phieggStore); const eco = useEconomy(); const held = eco.coins[x.id] ?? 0;
  return (
    <ItemCard depth={2} stackBelow="always" media={<EntityAvatar id={x.clubId ?? x.id} name={x.name} size="md" />} title={x.symbol} meta={x.name}
      aside={<Stack direction="column" gap={0} align="end"><Text weight="bold" numeric>{'$' + x.price}</Text><Text size="xs" numeric intent={x.change24h >= 0 ? 'success' : 'danger'}>{pct(x.change24h)}</Text></Stack>}
      actions={<><Amount label={t('buy')} variant="primary" onConfirm={(n) => { const ok = buyCoin(x.id, n); s.flash(ok ? t('bought', { n: (n / x.price).toFixed(2), coin: x.symbol }) : t('noFunds')); return ok; }} />
        {held > 0 && <Button variant="ghost" size="sm" onClick={() => { const got = sellCoin(x.id); s.flash(t('sold', { coin: x.symbol, usd: usd(got) })); }}>{t('sell')}</Button>}</>}>
      <Stack direction="column" gap={1}>
        <Text size="xs" intent="muted">{fmt(x.holders + (held ? 1 : 0))} {t('holders')}</Text>
        {held > 0 && <Tag round minimal intent="primary">{t('youHold', { n: held.toFixed(2) + ' ' + x.symbol })} · {usd(held * x.price)}</Tag>}
      </Stack>
    </ItemCard>
  );
};

type PoolRow = { pool: Pool; sold: number; supply: number; floor: number; total: number; vol: number; volText: string };
const kindOf = (p: Pool) => t(('plKind_' + p.kind) as 'plKind_show');

/** Quests, sponsored quests, coins and pools, which one comes from data/site.json lists. Every list has the view
 *  toolbar, Filter & sort (facets drawn from the rows themselves) and, in list mode, a table sortable by its headings. */
export const ListPage: React.FC<{ kind: string }> = ({ kind }) => {
  const s = useStore(phieggStore); const c = (site.lists as unknown as Record<string, Conf>)[kind];
  const E = D.economy; const eco = useEconomy();
  const now = useNow(c.source === 'pools' ? 5000 : 60000); const [kindF, setKindF] = useState('all');
  const poolRows = useMemo<PoolRow[]>(() => c.source !== 'pools' ? [] : D.pools.pools.map((pool) => {
    const N = poolNumbers(pool, now); const v = poolStats(pool, now).find((x) => x.metric.id === 'vol24h');
    return { pool, sold: N.sold, supply: N.supply, floor: N.floor, total: N.total, vol: v?.value ?? 0, volText: v?.text ?? '' };
  }), [c.source, now]);
  const clubName = (id?: string | null) => clubOf(id)?.name;
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}><Title level={2} size="xl">{c.title}</Title><Text intent="secondary">{c.sub}</Text></Stack>
      {(c.source === 'quests' || c.source === 'sponsored') && (
        <ListView<Quest> rows={E.quests.filter((q) => c.source === 'quests' || q.kind === 'sponsored')} keyOf={(q) => q.id} text={(q) => q.title + ' ' + (worldOf(q.worldId)?.name ?? '')}
          facets={[{ id: 'world', label: t('lsWorld'), get: (q) => worldOf(q.worldId)?.name }, { id: 'sponsor', label: t('lsSponsor'), get: (q) => clubName(q.sponsorClubId) }, { id: 'coin', label: t('lsColReward'), get: (q) => q.rewardCoin }, { id: 'status', label: t('lsStatus'), get: (q) => (eco.quests[q.id] ? t('lsEntered') : t('lsOpen')) }]}
          sorts={[{ id: 'reward', label: t('lsSortReward'), by: (a, b) => b.reward - a.reward }, { id: 'entrants', label: t('lsSortEntrants'), by: (a, b) => b.entrants - a.entrants }, { id: 'ends', label: t('lsSortEnds'), by: (a, b) => a.endsAt.localeCompare(b.endsAt) }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.title.localeCompare(b.title) }]}
          table={[{ id: 'title', header: t('lsColName'), cell: (q) => q.title, sortValue: (q) => q.title }, { id: 'world', header: t('lsWorld'), cell: (q) => worldOf(q.worldId)?.name, sortValue: (q) => worldOf(q.worldId)?.name },
            { id: 'reward', header: t('lsColReward'), cell: (q) => q.reward + ' ' + q.rewardCoin, sortValue: (q) => q.reward, align: 'right' }, { id: 'entrants', header: t('lsColEntrants'), cell: (q) => fmt(q.entrants), sortValue: (q) => q.entrants, align: 'right' },
            { id: 'progress', header: t('lsColProgress'), cell: (q) => Math.round(q.progress * 100) + '%', sortValue: (q) => q.progress, align: 'right' }, { id: 'ends', header: t('lsColEnds'), cell: (q) => q.endsAt.slice(5, 10), sortValue: (q) => q.endsAt }]}
          render={(q) => <QuestCard q={q} />} />)}
      {c.source === 'coins' && (
        <ListView<Coin> rows={E.coins} keyOf={(x) => x.id} text={(x) => x.symbol + ' ' + x.name}
          facets={[{ id: 'club', label: t('lsColClub'), get: (x) => clubName(x.clubId) }, { id: 'held', label: t('lsStatus'), get: (x) => ((eco.coins[x.id] ?? 0) > 0 ? t('lsHeld') : t('lsNotHeld')) }]}
          sorts={[{ id: 'holders', label: t('lsSortHolders'), by: (a, b) => b.holders - a.holders }, { id: 'price', label: t('lsSortPrice'), by: (a, b) => b.price - a.price }, { id: 'move', label: t('lsSortChange'), by: (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h) }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.symbol.localeCompare(b.symbol) }]}
          table={[{ id: 'symbol', header: t('lsColName'), cell: (x) => x.symbol + ' · ' + x.name, sortValue: (x) => x.symbol }, { id: 'club', header: t('lsColClub'), cell: (x) => clubName(x.clubId) ?? '', sortValue: (x) => clubName(x.clubId) },
            { id: 'price', header: t('lsColPrice'), cell: (x) => '$' + x.price, sortValue: (x) => x.price, align: 'right' }, { id: 'ch', header: t('lsCol24h'), cell: (x) => pct(x.change24h), sortValue: (x) => x.change24h, align: 'right' },
            { id: 'holders', header: t('lsColHolders'), cell: (x) => fmt(x.holders), sortValue: (x) => x.holders, align: 'right' }]}
          render={(x) => <CoinCard x={x} />} />)}
      {c.source === 'pools' && <>
        <TabList size="sm" variant="pills" activeId={kindF} onChange={setKindF} items={[{ id: 'all', label: t('seAll') }, ...(['pft', 'show', 'drop', 'collection'] as const).map((k) => ({ id: k, label: t(('plKind_' + k) as 'plKind_show') }))]} />
        <ListView<PoolRow> rows={poolRows.filter((r) => kindF === 'all' || r.pool.kind === kindF)} keyOf={(r) => r.pool.id} onRow={(r) => s.go('pool', { poolId: r.pool.id })} text={(r) => r.pool.name + ' ' + r.pool.desc + ' ' + (clubName(r.pool.clubId) ?? '')}
          facets={[{ id: 'club', label: t('lsColClub'), get: (r) => clubName(r.pool.clubId) }, { id: 'world', label: t('lsWorld'), get: (r) => worldOf(r.pool.worldId)?.name }, { id: 'season', label: t('lsSeason'), get: (r) => r.pool.season }]}
          sorts={[{ id: 'value', label: t('lsSortValue'), by: (a, b) => b.total - a.total }, { id: 'vol', label: t('lsSortVol'), by: (a, b) => b.vol - a.vol }, { id: 'sold', label: t('lsSortSold'), by: (a, b) => b.sold / (b.supply || 1) - a.sold / (a.supply || 1) }, { id: 'floor', label: t('lsSortFloor'), by: (a, b) => a.floor - b.floor }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.pool.name.localeCompare(b.pool.name) }]}
          table={[{ id: 'name', header: t('lsColName'), cell: (r) => r.pool.name, sortValue: (r) => r.pool.name }, { id: 'kind', header: t('lsColKind'), cell: (r) => kindOf(r.pool), sortValue: (r) => kindOf(r.pool) },
            { id: 'club', header: t('lsColClub'), cell: (r) => clubName(r.pool.clubId) ?? '', sortValue: (r) => clubName(r.pool.clubId) },
            { id: 'sold', header: t('lsColSold'), cell: (r) => fmt(r.sold) + ' / ' + fmt(r.supply), sortValue: (r) => r.sold / (r.supply || 1), align: 'right' },
            { id: 'floor', header: t('lsColFloor'), cell: (r) => usd(r.floor), sortValue: (r) => r.floor, align: 'right' }, { id: 'vol', header: t('lsColVol'), cell: (r) => r.volText, sortValue: (r) => r.vol, align: 'right' },
            { id: 'value', header: t('lsColValue'), cell: (r) => '$' + fmt(r.total), sortValue: (r) => r.total, align: 'right' }]}
          render={(r) => <PoolCard pool={r.pool} now={now} />} /></>}
    </Stack></Page>
  );
};
