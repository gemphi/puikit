import React, { useMemo, useState } from 'react';
import { Button, Card, CardBody, Drawer, Grid, Input, ProgressBar, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { useWallet } from '@phi-kit/wallet';
import { ArrowRightLeft } from 'lucide-react';
import { D, clubOf, coinOf, fmt, lotsOfPool, metricOf, poolOf, poolQuestOf, shadeOf, showLookOf, t, unitName, usd } from '../../lib/data';
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
  const s = useStore(phieggStore); const club = clubOf(pool.clubId);
  const N = poolNumbers(pool, now); const st = poolStats(pool, now); const vol = st.find((x) => x.metric.id === 'vol24h');
  return (
    <Card depth={2} onClick={() => s.go('pool', { poolId: pool.id })}><CardBody><Stack direction="column" gap={2}>
      <Tile tone={club?.tone ?? 'accent'} color={pool.colors?.[0]} ratio="16/9" depth={{ worldId: pool.worldId, clubId: pool.clubId, entityId: pool.id, entityName: pool.name }}
        title={pool.name} sub={club?.name} badges={<><Tag round size="sm">{kindLabel(pool)}</Tag>{pool.kind === 'show' && <Tag round size="sm" intent="primary">{t('plShowDrop')}</Tag>}</>} />
      <Stack direction="row" justify="between" align="center"><Text size="xs" weight="bold">{t('plSold', { sold: fmt(N.sold), supply: fmt(N.supply) })}</Text><Text size="xs" intent="muted">{t('plFloor', { v: usd(N.floor) })}</Text></Stack>
      <ProgressBar value={N.supply ? N.sold / N.supply : 0} size="sm" animate={false} />
      <Stack direction="row" justify="between"><Text size="xs" intent="muted">{t('plVol', { v: vol?.text ?? '' })}</Text><Text size="xs" intent="muted">{t('plValue', { v: '$' + fmt(N.total) })}</Text></Stack>
    </Stack></CardBody></Card>
  );
};

/** One lot: pack (4–7 looks) or drop (up to 64 units), its price ladder high → low, the moving total and the sold counter. */
export const LotCard: React.FC<{ lot: PoolLot; now: number }> = ({ lot, now }) => {
  const s = useStore(phieggStore); const w = useWallet(); const [all, setAll] = useState(false);
  const q = quote(lot, now); const shown = all ? q.units : q.units.slice(0, lot.kind === 'pack' ? 7 : 8);
  const buy = (i: number | null) => { const price = i == null ? q.total : q.units[i].usd; s.flash(buyLot(lot, i, now) ? t('plBought', { name: i == null ? lot.title : itemName(q.units[i].itemId), v: usd(price) }) : t('noFunds')); };
  return (
    <Card depth={2}><CardBody><Stack direction="column" gap={2}>
      <Stack direction="row" justify="between" align="start" gap={2}>
        <Stack direction="column" gap={0}><Text weight="bold">{lot.title}</Text>
          <Text size="xs" intent="muted">{lot.kind === 'pack' ? t('plPack', { n: lot.itemIds.length }) : t('plDrop', { n: lot.itemIds.length })}</Text></Stack>
        <Stack direction="column" gap={0} align="end"><Title level={4} size="md">{t('plTotal', { v: usd(q.total) })}</Title>
          <Text size="xs" intent={q.change >= 0 ? 'success' : 'danger'}>{pct(q.change)}</Text></Stack>
      </Stack>
      <Stack direction="row" justify="between"><Text size="xs" weight="bold">{t('plSold', { sold: fmt(q.sold), supply: fmt(q.supply) })}</Text><Text size="xs" intent="muted">{t('plTotalNote')}</Text></Stack>
      <ProgressBar value={q.soldPct} size="sm" animate={false} />
      <Text size="xs" intent="muted" weight="bold">{t('plLadder')}</Text>
      <Stack direction="column" gap={1}>
        {shown.map((u, k) => (
          <Stack key={u.index} direction="row" gap={2} align="center">
            <Text size="xs" intent="muted" numeric width="1.6rem">{k + 1}</Text>
            <Stack flex="1" minWidth="0"><ProgressBar value={q.high ? u.usd / q.high : 0} color={shadeOf(u.itemId)?.hex ?? showLookOf(u.itemId)?.look.hex} animate={false} /></Stack>
            <Text size="xs" truncate flex="0 1 9rem" minWidth="0">{itemName(u.itemId)}</Text>
            <Text size="xs" weight="bold" numeric align="right" width="5rem">{usd(u.usd)}</Text>
            {lot.kind === 'drop' && <Button size="sm" variant="ghost" disabled={w.usd < u.usd || q.remaining <= 0} onClick={() => buy(q.units.indexOf(u))}>{t('plBuyUnit')}</Button>}
          </Stack>))}
        {q.units.length > shown.length && <Button size="sm" variant="ghost" onClick={() => setAll(true)}>{t('plMore', { n: q.units.length - shown.length })}</Button>}
      </Stack>
      {lot.kind === 'pack' && <Button variant="primary" disabled={w.usd < q.total || q.remaining <= 0} onClick={() => buy(null)}>{w.usd < q.total ? t('shNoFunds') : t('plBuyPack', { v: usd(q.total) })}</Button>}
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
          <Text size="xs" intent="muted">{r.metric.label}</Text>
          <Text weight="bold" numeric intent={tone(r)}>{r.text}</Text>
          <ProgressBar value={r.progress} size="sm" animate={false} />
        </CardBody></Card>)} />
  );
};

/** A stat and its quest: what it measures, where it stands, the target, and join / leave. */
const StatDrawer: React.FC<{ poolId: string; metricId: string }> = ({ poolId, metricId }) => {
  const s = useStore(phieggStore); const now = useNow(1000); const eco = useEconomy();
  const pool = poolOf(poolId); const m = metricOf(metricId); if (!pool || !m) return null;
  const row = poolStats(pool, now).find((r) => r.metric.id === metricId) as StatRow; const q = statQuest(pool, row); const inQ = !!eco.quests[q.id];
  return (
    <Drawer isOpen onClose={s.close} position="right" size="sm" title={<Stack direction="column" gap={0}><Title level={4} size="md">{m.label}</Title><Text size="xs" intent="muted">{pool.name} · {t('plStatQuest')}</Text></Stack>}
      footer={inQ ? <Stack direction="row" gap={2} align="center"><Tag round intent="success">{t('plJoined')}</Tag><Button variant="ghost" onClick={() => leaveQuest(q.id)}>{t('qLeave')}</Button></Stack>
        : <Button variant="primary" onClick={() => { enterQuest(q.id); s.flash(t('joined_', { name: q.title })); }}>{t('plEnter')}</Button>}>
      <Stack direction="column" gap={3}>
        <Title level={2} size="xl">{row.text}</Title>
        <Text intent="secondary">{m.hint}</Text>
        <Text weight="bold">{q.title}</Text>
        <ProgressBar value={row.progress} />
        <Stack direction="row" gap={1} wrap><Tag round minimal>{t('reward', { n: q.reward, coin: q.rewardCoin })}</Tag>{q.endsAt && <Tag round minimal>{t('plEnds', { date: q.endsAt.slice(5, 10) })}</Tag>}</Stack>
        <Button variant="outline" onClick={() => s.go('pool', { poolId: pool.id })}>{t('plOpen')}</Button>
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
    : quoteNow.reason === 'funds' ? t('plFunds', { v: usd(-quoteNow.difference) }) : quoteNow.direction === 'receive' ? t('plReceive', { pool: poolOf(quoteNow.sponsorPoolId)?.name ?? '', v: usd(quoteNow.difference) })
    : quoteNow.direction === 'pay' ? t('plPay', { v: usd(-quoteNow.difference) }) : t('plEven');
  return (
    <Drawer isOpen onClose={s.close} position="right" size="md" title={<Stack direction="row" gap={2} align="center"><ArrowRightLeft size={18} /><Title level={4} size="md">{t('plSwapTitle', { name: itemName(give) })}</Title></Stack>}
      footer={quoteNow && <Stack direction="column" gap={2}>
        <Text size="sm" weight="bold" role="status" intent={quoteNow.allowed ? undefined : 'danger'}>{msg}</Text>
        <Button variant="primary" disabled={!quoteNow.allowed} onClick={() => { const r = doSwap(give, get); if (r?.allowed) { s.flash(t('plSwapped', { give: itemName(give), get: itemName(get) })); s.close(); } }}>{t('plConfirmSwap')}</Button></Stack>}>
      <Stack direction="column" gap={3}>
        <Text size="xs" intent="muted">{t('plAllowance', { limit: usd(rules.withdrawLimitUsd), left: usd(quoteNow?.allowanceUsd ?? rules.withdrawLimitUsd) })}</Text>
        <Text size="xs" intent="muted" weight="bold">{t('plGive')}</Text>
        {mine.length ? <TabList size="sm" variant="pills" activeId={give} onChange={setGive} items={mine.map((id) => ({ id, label: itemName(id), count: usd(valueOf(id, now)?.usd ?? 0) }))} /> : <Text size="sm">{t('plNoneHeld')}</Text>}
        <Text size="xs" intent="muted" weight="bold">{t('plGet')}</Text>
        <Input value={q} placeholder={t('plPickTarget')} onChange={(e) => setQ(e.target.value)} aria-label={t('plPickTarget')} />
        <Grid gap={2} xs={2} sm={3}>
          {candidates.map((l) => { const v = valueOf(l.id, now); return (
            <Card key={l.id} depth={1} tint={l.hex} tintStrength={22} selected={get === l.id} onClick={() => setGet(l.id)} padding="sm"><CardBody>
              <LookImage look={l} cascade={2} /><Text size="xs" weight="bold">{l.name}</Text><Text size="xs" intent="muted">{usd(v?.usd ?? l.usd)} · {poolOf(l.poolId)?.name}</Text>
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
  const s = useStore(phieggStore); const eco = useEconomy(); const pq = poolQuestOf(pool.questId); if (!pq) return null;
  const inQ = !!eco.quests[pq.id];
  return (
    <Card depth={2}><CardBody><Stack direction="column" gap={2}>
      <Stack direction="row" justify="between" align="center" gap={2}><Stack direction="column" gap={0}><Text size="xs" intent="muted" weight="bold">{t('plQuest')}</Text><Title level={4} size="md">{pq.title}</Title></Stack>
        {inQ ? <Tag round intent="success">{t('plJoined')}</Tag> : <Button variant="primary" size="sm" onClick={() => { enterQuest(pq.id); s.flash(t('joined_', { name: pq.title })); }}>{t('plEnter')}</Button>}</Stack>
      <Text size="sm" intent="secondary">{t('plQuestHas', { m: pq.metricIds.length, q: pq.metricIds.length + pq.questIds.length, c: pq.coinIds.length })} · {t('reward', { n: pq.reward, coin: pq.rewardCoin })} · {t('entrants', { n: fmt(pq.entrants + (inQ ? 1 : 0)) })}</Text>
      <Stack direction="row" gap={1} wrap>{pq.coinIds.map((id) => { const c = coinOf(id); return c ? <Tag key={id} round minimal intent="primary">{c.symbol} · ${c.price}</Tag> : null; })}</Stack>
    </Stack></CardBody></Card>
  );
};

export { lotsOfPool };
