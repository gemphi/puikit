import React, { useMemo, useState } from 'react';
import { Button, Card, CardBody, Drawer, Figure, FigureRow, Grid, Input, Ladder, ProgressBar, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { useWallet } from '@phi-kit/wallet';
import { ArrowRightLeft } from 'lucide-react';
import { D, fmt, lotsOfPool, showLookOf, t, unitName, usd, itemOf } from '../../lib/data';
import { buyLot, doSwap, poolNumbers, poolStats, quote, quoteSwapOf, statQuest, swapRules, useNow, useSwaps, valueOf, fmtStat, type StatRow } from '../../lib/market';
import { enterQuest, leaveQuest, useEconomy } from '../../lib/economy';
import { useOwned } from '../../lib/cart';
import { phieggStore } from '../../state/phieggStore';
import { LookImage } from './LookImage';
import { Tile } from './Tile';
import { ListView } from './Views';
import type { Pool, PoolLot } from '../../types/phiegg';

const kindLabel = (p: Pool) => t(('plKind_' + p.kind) as 'plKind_show');
const itemName = (id: string) => unitName(id);
const pct = (n: number) => (n > 0 ? '+' : '') + (n * 100).toFixed(1) + '%';

/** A pool at a glance: three-layer tile, kind, sold counter, floor, 24h volume and the moving value. */
export const PoolCard: React.FC<{ pool: Pool; now: number }> = ({ pool, now }) => {
  const s = useStore(phieggStore); const club = itemOf('club', pool.clubId);
  const N = poolNumbers(pool, now); const st = poolStats(pool, now); const vol = st.find((x) => x.metric.id === 'vol24h');
  return (
    <Card depth={2} onClick={() => s.go('pool', { poolId: pool.id })}><CardBody><Stack direction="column" gap={2}>
      <Tile tone={club?.tone ?? 'accent'} color={pool.colors?.[0]} ratio="16/9" depth={{ worldId: pool.worldId, clubId: pool.clubId, entityId: pool.id, entityName: pool.name }}
        title={pool.name} sub={club?.name} badges={<><Tag round size="sm">{kindLabel(pool)}</Tag>{pool.kind === 'show' && <Tag round size="sm" intent="primary">{t('plShowDrop')}</Tag>}</>} />
      <Stack direction="column" gap={2} surface="region" role="status">
        <Stack direction="row" justify="between" align="center" gap={2}><Text size="xs" weight="bold">{t('plSold', { sold: fmt(N.sold), supply: fmt(N.supply) })}</Text><Text size="xs" intent="muted" numeric>{Math.round((N.supply ? N.sold / N.supply : 0) * 100)}%</Text></Stack>
        <ProgressBar value={N.supply ? N.sold / N.supply : 0} size="md" animate={false} />
      </Stack>
      <FigureRow><Figure label={t('lsColFloor')} value={usd(N.floor)} /><Figure label={t('lsColVol')} value={vol?.text ?? ''} /><Figure label={t('lsColValue')} value={'$' + fmt(N.total)} /></FigureRow>
    </Stack></CardBody></Card>
  );
};

/** One lot: pack (4–7 looks) or drop (up to 64 units). Its name and moving total, how it stands (sold, left, high and
 *  low), then its price ladder high → low as the kit's Ladder. Every part stands on a ground of its own. */
export const LotCard: React.FC<{ lot: PoolLot; now: number }> = ({ lot, now }) => {
  const s = useStore(phieggStore); const w = useWallet(); const [all, setAll] = useState(false);
  const q = quote(lot, now); const shown = all ? q.units : q.units.slice(0, lot.kind === 'pack' ? 7 : 8); const out = q.remaining <= 0;
  const buy = (i: number | null) => { const price = i == null ? q.total : q.units[i].usd; s.flash(buyLot(lot, i, now) ? t('plBought', { name: i == null ? lot.title : itemName(q.units[i].itemId), v: usd(price) }) : t('noFunds')); };
  return (
    <Card depth={2}><CardBody><Stack direction="column" gap={2}>
      <Stack direction="row" justify="between" align="start" gap={2} surface="region">
        <Stack direction="column" gap={1} minWidth="0"><Text weight="bold" truncate>{lot.title}</Text>
          <Stack direction="row" gap={1} wrap><Tag round size="sm">{lot.kind === 'pack' ? t('plPack', { n: lot.itemIds.length }) : t('plDrop', { n: lot.itemIds.length })}</Tag>
            <Tag round size="sm" minimal intent={out ? 'error' : 'success'}>{out ? t('plSoldOut') : t('plOnSale')}</Tag></Stack></Stack>
        <Stack direction="column" gap={0} align="end"><Title level={4} size="md">{t('plTotal', { v: usd(q.total) })}</Title>
          <Tag round size="sm" minimal intent={q.change >= 0 ? 'success' : 'error'}>{pct(q.change)}</Tag></Stack>
      </Stack>
      <Stack direction="column" gap={2} surface="region" role="status">
        <Stack direction="row" justify="between" align="center" gap={2}><Text size="xs" weight="bold">{t('plSold', { sold: fmt(q.sold), supply: fmt(q.supply) })}</Text><Text size="xs" intent="muted" numeric>{Math.round(q.soldPct * 100)}%</Text></Stack>
        <ProgressBar value={q.soldPct} size="md" animate={false} />
        <Text size="xs" intent="muted">{t('plTotalNote')}</Text>
      </Stack>
      <FigureRow>
        <Figure label={t('plHigh')} value={usd(q.high)} /><Figure label={t('plLow')} value={usd(q.low)} />
        <Figure label={t('plLeft')} value={fmt(Math.max(0, q.remaining))} intent={out ? 'danger' : undefined} /><Figure label={t('plCount')} value={q.units.length} />
      </FigureRow>
      <Stack direction="column" gap={2} surface="region">
        <Text size="xs" intent="muted" weight="bold">{t('plLadder')}</Text>
        <Ladder aria-label={t('plLadder')} rows={shown.map((u) => ({
          id: String(u.index), label: itemName(u.itemId), share: q.high ? u.usd / q.high : 0, amount: usd(u.usd),
          color: itemOf('shade', u.itemId)?.hex ?? showLookOf(u.itemId)?.look.hex,
          action: lot.kind === 'drop' ? <Button variant="glass" disabled={w.usd < u.usd || out} onClick={() => buy(q.units.indexOf(u))}>{t('plBuyUnit')}</Button> : undefined,
        }))} />
        {q.units.length > shown.length && <Button variant="glass" onClick={() => setAll(true)}>{t('plMore', { n: q.units.length - shown.length })}</Button>}
      </Stack>
      {lot.kind === 'pack' && <Button variant="glass" disabled={w.usd < q.total || out} onClick={() => buy(null)}>{w.usd < q.total ? t('shNoFunds') : t('plBuyPack', { v: usd(q.total) })}</Button>}
    </Stack></CardBody></Card>
  );
};

/** Every stat of a pool; each one opens its quest. */
export const StatGrid: React.FC<{ pool: Pool; now: number; groups?: string[] }> = ({ pool, now, groups }) => {
  const s = useStore(phieggStore); const rows = poolStats(pool, now).filter((r) => !groups || groups.includes(r.metric.group));
  const cap = (g: string) => g[0].toUpperCase() + g.slice(1);
  const tone = (r: StatRow) => (r.metric.id.startsWith('change') ? (r.value >= 0 ? 'success' : 'danger') : undefined);
  // Stats are a list like any other: group is a filter, and in list mode the table sorts by every heading.
  return (
    <ListView<StatRow> rows={rows} keyOf={(r) => r.metric.id} text={(r) => r.metric.label + ' ' + r.metric.hint} cols={6} minItemWidth="9rem" onRow={(r) => s.openStat(pool.id, r.metric.id)} groupBy={(r) => cap(r.metric.group)}
      facets={[{ id: 'group', label: t('lsGroup'), get: (r) => cap(r.metric.group) }]}
      sorts={[{ id: 'order', label: t('lsStat'), by: () => 0 }, { id: 'progress', label: t('lsSortProgress'), by: (a, b) => b.progress - a.progress }, { id: 'value', label: t('lsSortStat'), by: (a, b) => b.value - a.value }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.metric.label.localeCompare(b.metric.label) }]}
      table={[{ id: 'stat', header: t('lsStat'), cell: (r) => r.metric.label, sortValue: (r) => r.metric.label },
        { id: 'value', header: t('lsColValue'), cell: (r) => <Text as="span" size="sm" weight="bold" intent={tone(r)} numeric>{r.text}</Text>, sortValue: (r) => r.value, align: 'right' },
        { id: 'target', header: t('lsColTarget'), cell: (r) => fmtStat(r.metric, r.target), sortValue: (r) => r.target, align: 'right' },
        { id: 'progress', header: t('lsColProgress'), cell: (r) => Math.round(r.progress * 100) + '%', sortValue: (r) => r.progress, align: 'right' }]}
      render={(r) => (
        <Card depth={1} variant="flat" onClick={() => s.openStat(pool.id, r.metric.id)} padding="sm"><CardBody>
          <Figure label={r.metric.label} value={r.text} intent={tone(r)} share={r.progress} />
        </CardBody></Card>)} />
  );
};

/** A stat and its quest: what it measures, where it stands, the target, and join / leave. */
const StatDrawer: React.FC<{ poolId: string; metricId: string }> = ({ poolId, metricId }) => {
  const s = useStore(phieggStore); const now = useNow(1000); const eco = useEconomy();
  const pool = itemOf('pool', poolId); const m = itemOf('metric', metricId); if (!pool || !m) return null;
  const row = poolStats(pool, now).find((r) => r.metric.id === metricId) as StatRow; const q = statQuest(pool, row); const inQ = !!eco.quests[q.id];
  return (
    <Drawer isOpen onClose={s.close} position="right" size="sm" title={<Stack direction="column" gap={0}><Title level={4} size="md">{m.label}</Title><Text size="xs" intent="muted">{pool.name} · {t('plStatQuest')}</Text></Stack>}
      footer={inQ ? <Stack direction="row" gap={2} align="center"><Tag round intent="success">{t('plJoined')}</Tag><Button variant="glass" onClick={() => leaveQuest(q.id)}>{t('qLeave')}</Button></Stack>
        : <Button variant="glass" onClick={() => { enterQuest(q.id); s.flash(t('joined_', { name: q.title })); }}>{t('plEnter')}</Button>}>
      <Stack direction="column" gap={3}>
        <Stack direction="column" gap={1} surface="region"><Title level={2} size="xl">{row.text}</Title><Text intent="secondary">{m.hint}</Text></Stack>
        <Stack direction="column" gap={2} surface="region" role="status">
          <Stack direction="row" justify="between" align="center" gap={2}><Text weight="bold">{q.title}</Text><Text size="xs" intent="muted" numeric>{Math.round(row.progress * 100)}%</Text></Stack>
          <ProgressBar value={row.progress} />
        </Stack>
        <FigureRow><Figure label={t('lsColTarget')} value={fmtStat(m, row.target)} /><Figure label={t('lsColReward')} value={t('reward', { n: q.reward, coin: q.rewardCoin })} />{q.endsAt && <Figure label={t('lsColEnds')} value={q.endsAt.slice(5, 10)} />}</FigureRow>
        <Button variant="glass" onClick={() => s.go('pool', { poolId: pool.id })}>{t('plOpen')}</Button>
      </Stack>
    </Drawer>
  );
};

/** Fungible swap: give a PFT you hold, take any other; the pool you take from settles the difference. */
const SwapDrawer: React.FC<{ giveId: string; getId?: string }> = ({ giveId, getId }) => {
  const s = useStore(phieggStore); const now = useNow(1000); const owned = useOwned(); useSwaps(); useWallet();
  const [give, setGive] = useState(giveId); const [get, setGet] = useState(getId ?? ''); const [q, setQ] = useState('');
  const mine = Object.keys(owned).filter((id) => valueOf(id));
  const candidates = useMemo(() => { const ql = q.trim().toLowerCase(); return D.stores.stores.flatMap((x) => x.looks).filter((l) => !owned[l.id] && (!ql || l.name.toLowerCase().includes(ql))).slice(0, 24); }, [q, owned]);
  const rules = swapRules(); const quoteNow = get ? quoteSwapOf(give, get, now) : undefined;
  const msg = !quoteNow ? '' : quoteNow.reason === 'limit' ? t('plLimit', { left: usd(quoteNow.allowanceUsd) }) : quoteNow.reason === 'reserve' ? t('plReserve', { v: usd(quoteNow.difference) })
    : quoteNow.reason === 'funds' ? t('plFunds', { v: usd(-quoteNow.difference) }) : quoteNow.direction === 'receive' ? t('plReceive', { pool: itemOf('pool', quoteNow.sponsorPoolId)?.name ?? '', v: usd(quoteNow.difference) })
    : quoteNow.direction === 'pay' ? t('plPay', { v: usd(-quoteNow.difference) }) : t('plEven');
  return (
    <Drawer isOpen onClose={s.close} position="right" size="md" title={<Stack direction="row" gap={2} align="center"><ArrowRightLeft size={18} /><Title level={4} size="md">{t('plSwapTitle', { name: itemName(give) })}</Title></Stack>}
      footer={quoteNow && <Stack direction="column" gap={2}>
        <Text size="sm" weight="bold" role="status" intent={quoteNow.allowed ? undefined : 'danger'}>{msg}</Text>
        <Button variant="glass" disabled={!quoteNow.allowed} onClick={() => { const r = doSwap(give, get); if (r?.allowed) { s.flash(t('plSwapped', { give: itemName(give), get: itemName(get) })); s.close(); } }}>{t('plConfirmSwap')}</Button></Stack>}>
      <Stack direction="column" gap={3}>
        <Text size="xs" intent="muted">{t('plAllowance', { limit: usd(rules.withdrawLimitUsd), left: usd(quoteNow?.allowanceUsd ?? rules.withdrawLimitUsd) })}</Text>
        <Text size="xs" intent="muted" weight="bold">{t('plGive')}</Text>
        {mine.length ? <TabList size="sm" variant="pills" activeId={give} onChange={setGive} items={mine.map((id) => ({ id, label: itemName(id), count: usd(valueOf(id, now)?.usd ?? 0) }))} /> : <Text size="sm">{t('plNoneHeld')}</Text>}
        <Text size="xs" intent="muted" weight="bold">{t('plGet')}</Text>
        <Input value={q} placeholder={t('plPickTarget')} onChange={(e) => setQ(e.target.value)} aria-label={t('plPickTarget')} />
        <Grid gap={2} xs={2} sm={3}>
          {candidates.map((l) => { const v = valueOf(l.id, now); return (
            <Card key={l.id} depth={1} selected={get === l.id} onClick={() => setGet(l.id)} padding="sm"><CardBody>
              <LookImage look={l} cascade={2} /><Text size="xs" weight="bold">{l.name}</Text><Text size="xs" intent="muted">{usd(v?.usd ?? l.usd)} · {itemOf('pool', l.poolId)?.name}</Text>
            </CardBody></Card>); })}
        </Grid>
      </Stack>
    </Drawer>
  );
};

export const PoolOverlays: React.FC = () => {
  const o = useStore(phieggStore).overlay;
  return o.kind === 'stat' ? <StatDrawer poolId={o.poolId} metricId={o.metricId} /> : o.kind === 'swap' ? <SwapDrawer giveId={o.giveId} getId={o.getId} /> : null;
};

/** The pool quest: its pool of stats, its sub-quests and the coins taking part. */
export const PoolQuestCard: React.FC<{ pool: Pool }> = ({ pool }) => {
  const s = useStore(phieggStore); const eco = useEconomy(); const pq = itemOf('poolQuest', pool.questId); if (!pq) return null;
  const inQ = !!eco.quests[pq.id];
  return (
    <Card depth={2}><CardBody><Stack direction="column" gap={2}>
      <Stack direction="row" justify="between" align="center" gap={2} surface="region"><Stack direction="column" gap={0}><Text size="xs" intent="muted" weight="bold">{t('plQuest')}</Text><Title level={4} size="md">{pq.title}</Title></Stack>
        <Stack flex="none">{inQ ? <Tag round intent="success">{t('plJoined')}</Tag> : <Button variant="glass" onClick={() => { enterQuest(pq.id); s.flash(t('joined_', { name: pq.title })); }}>{t('plEnter')}</Button>}</Stack></Stack>
      <Stack surface="region"><Text size="sm" intent="secondary">{t('plQuestHas', { m: pq.metricIds.length, q: pq.metricIds.length + pq.questIds.length, c: pq.coinIds.length })}</Text></Stack>
      <FigureRow><Figure label={t('lsColReward')} value={t('reward', { n: pq.reward, coin: pq.rewardCoin })} /><Figure label={t('lsColEntrants')} value={fmt(pq.entrants + (inQ ? 1 : 0))} /></FigureRow>
      <Stack direction="row" gap={1} wrap surface="region">{pq.coinIds.map((id) => { const c = itemOf('coin', id); return c ? <Tag key={id} round minimal intent="primary">{c.symbol} · ${c.price}</Tag> : null; })}</Stack>
    </Stack></CardBody></Card>
  );
};

export { lotsOfPool };
