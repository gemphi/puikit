import React, { useState } from 'react';
import { Button, Card, CardBody, Grid, Input, ItemCard, Page, ProgressBar, Rows, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { clubOf, eventOf, hostOf, liquidityOf, lookOf, lotsOfPool, poolOf, poolQuestOf, showOf, storeOf, t, usd, worldOf, D } from '../../lib/data';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { PersonLine } from '../../components/Phiegg/PersonLine';
import { lookLive, poolNumbers, poolStats, useNow } from '../../lib/market';
import { accrued, stake, unstake, useEconomy } from '../../lib/economy';
import { useOwned } from '../../lib/cart';
import { phieggStore } from '../../state/phieggStore';
import { Tile } from '../../components/Phiegg/Tile';
import { LookImage } from '../../components/Phiegg/LookImage';
import { LotCard, PoolQuestCard, StatGrid } from '../../components/Phiegg/Pools';
import { PoolItems } from '../../components/Phiegg/PoolItems';
import { PageSections } from '../../components/Phiegg/PageSections';
import type { ShopLook } from '../../types/phiegg';

type LinkRow = { id: string; name: string; meta: string; open: () => void };
/** Everything a pool is linked to, from its relation fields: clubs, worlds, cities, hosts. Click through to each. */
const Linked: React.FC<{ pool: ReturnType<typeof poolOf> & object }> = ({ pool }) => {
  const s = useStore(phieggStore);
  const P = pool as typeof pool & { clubIds?: string[]; cityIds?: string[]; hostIds?: string[] };
  const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];
  const cities = D.core.worlds.flatMap((w) => w.cities.map((c) => ({ c, w })));
  const groups: { title: string; rows: LinkRow[] }[] = [
    { title: 'Clubs', rows: uniq([P.clubId, ...(P.clubIds ?? [])]).map(clubOf).filter((c): c is NonNullable<ReturnType<typeof clubOf>> => !!c)
      .map((c) => ({ id: c.id, name: c.name, meta: c.holders.toLocaleString('en-US') + ' holders', open: () => s.go('club', { clubId: c.id }) })) },
    { title: 'Worlds', rows: uniq([P.worldId, ...(P.worldIds ?? [])]).map(worldOf).filter((w): w is NonNullable<ReturnType<typeof worldOf>> => !!w)
      .map((w) => ({ id: w.id, name: w.name, meta: w.cities.length + ' cities', open: () => s.go('world', { worldId: w.id }) })) },
    { title: 'Cities', rows: uniq(P.cityIds ?? []).map((id) => cities.find((x) => x.c.id === id)).filter((x): x is NonNullable<typeof x> => !!x)
      .map(({ c, w }) => ({ id: c.id, name: c.name, meta: w.name, open: () => s.go('city', { cityId: c.id }) })) },
    { title: 'Hosts', rows: uniq([...(P.hostIds ?? []), ...(P.teamIds ?? [])]).map(hostOf).filter((h): h is NonNullable<ReturnType<typeof hostOf>> => !!h)
      .map((h) => ({ id: h.id, name: h.name, meta: 'Host', open: () => s.go('hosts') })) },
  ].filter((g) => g.rows.length);
  if (!groups.length) return <Text intent="muted">Nothing linked yet.</Text>;
  return (
    <Stack direction="column" gap={3}>
      {groups.map((g) => (
        <Stack key={g.title} direction="column" gap={2}>
          <Text size="xs" weight="bold" intent="muted">{g.title + ' · ' + g.rows.length}</Text>
          <Rows cols={4} colsSm={1} minItemWidth="13rem">{g.rows.map((r) => (
            <ItemCard key={r.id} depth={1} variant="flat" onClick={r.open} media={<EntityAvatar id={r.id} name={r.name} size="md" />} title={r.name} meta={r.meta} />))}</Rows>
        </Stack>
      ))}
    </Stack>
  );
};

/** One pool: the centre of its PFTs, stats (each a quest), lots for sale at moving prices, the pool quest, liquidity. */
export const PoolPage: React.FC = () => {
  const s = useStore(phieggStore); const now = useNow(1000); const eco = useEconomy(); const mine = useOwned();
  const pool = poolOf(s.poolId) ?? D.pools.pools[0]; const club = clubOf(pool.clubId); const world = worldOf(pool.worldId);
  const N = poolNumbers(pool, now); const lots = lotsOfPool(pool); const liq = liquidityOf(pool); const st = liq ? eco.stakes[liq.id] : undefined;
  const [step, setStep] = useState(D.pools.application.steps[0].id); const [answers, setAnswers] = useState<Record<string, string>>({});
  const pq = poolQuestOf(pool.questId); const rows = poolStats(pool, now); const A = D.pools.application;
  const show = pool.showId ? showOf(pool.showId) : undefined; const store = pool.storeId ? storeOf(pool.storeId) : undefined;
  return (
    <Page><Stack direction="column" gap={4}>
      <Tile tone={club?.tone ?? 'accent'} color={pool.colors?.[0]} ratio="21/7" big grid depth={{ worldId: pool.worldId, clubId: pool.clubId, personId: club?.founderId, entityId: pool.id, entityName: pool.name }}
        title={pool.name} sub={[club?.name, world?.name, pool.season].filter(Boolean).join(' · ')}
        badges={<><Tag round size="sm">{t(('plKind_' + pool.kind) as 'plKind_show')}</Tag>{pool.kind === 'show' && <Tag round size="sm" intent="primary">{t('plShowDrop')}</Tag>}<Tag round size="sm">{t('plSold', { sold: N.sold.toLocaleString('en-US'), supply: N.supply.toLocaleString('en-US') })}</Tag></>} />
      <Text intent="secondary">{pool.desc}</Text>
      <Stack direction="row" gap={2} wrap>
        <Button variant="primary" size="sm" onClick={() => s.openCreate('pft', { poolId: pool.id })}>Mint an item</Button>
        {club && <Button variant="outline" size="sm" onClick={() => s.go('club', { clubId: club.id })}>{club.name}</Button>}
        {store && <Button variant="outline" size="sm" onClick={() => s.go('shop', { storeId: store.id })}>{store.name}</Button>}
        {show && <Button variant="outline" size="sm" onClick={() => s.go('show', { showId: show.id })}>{show.title}</Button>}
        <Tag round minimal>{t('plValue', { v: usd(N.total) })}</Tag>
      </Stack>

      <PageSections id={'pool'} sections={[
        { id: 'stats', title: t('plStats'), hint: t('plStatsSub'), expandable: true, content: <StatGrid pool={pool} now={now} /> },
        { id: 'items', title: t('asItems'), expandable: true, content: <PoolItems pool={pool} /> },
        { id: 'linked', title: 'Linked', hint: 'The clubs, worlds, cities and hosts this pool belongs to.', content: <Linked pool={pool} /> },
        { id: 'quest', title: t('plQuestTitle'), content: <PoolQuestCard pool={pool} /> },
        { id: 'application', title: t('plApp'), hint: t('plAppSub'), hidden: !pq, content: pq && <Stack direction="column" gap={3}>

        <Tag round>{t('plStepsDone', { done: pq.stepsDone, answered: pq.answered })}</Tag>
        <ProgressBar value={pq.stepsDone / 8} size="sm" animate={false} />
        <TabList size="sm" variant="pills" activeId={step} onChange={setStep} items={A.steps.map((x) => ({ id: x.id, label: t('plStep', { n: x.n, title: x.title }), count: x.n <= pq.stepsDone ? '✓' : undefined }))} />
        {A.steps.filter((x) => x.id === step).map((x) => (
          <Stack key={x.id} direction="column" gap={2}>
            <Text size="sm" intent="secondary">{x.hint}</Text>
            <Rows cols={4} colsSm={2}>{rows.filter((r) => x.groups.includes(r.metric.group)).map((r) => (
              <Card key={r.metric.id} variant="flat" padding="sm" onClick={() => s.openStat(pool.id, r.metric.id)}><CardBody>
                <Text size="xs" intent="muted">{r.metric.label}</Text><Text weight="bold" numeric>{r.text}</Text><ProgressBar value={r.progress} size="sm" animate={false} /></CardBody></Card>))}</Rows>
            <Text size="xs" weight="bold" intent="muted">{t('plQuestions')}</Text>
            {A.questions.filter((qq) => qq.step === x.id).map((qq) => (
              <Stack key={qq.id} direction="column" gap={1}>
                <Text size="sm" weight="semibold">{qq.id.slice(1)}. {qq.text.replace('{pool}', pool.name)}</Text>
                {qq.kind === 'choice' && qq.options
                  ? <TabList size="sm" variant="pills" activeId={answers[qq.id]} onChange={(v) => setAnswers({ ...answers, [qq.id]: v })} items={qq.options.map((o) => ({ id: o, label: o }))} />
                  : <Input value={answers[qq.id] ?? ''} inputMode={qq.kind === 'number' ? 'numeric' : undefined} placeholder={t('plAnswer')} aria-label={qq.text.replace('{pool}', pool.name)} onChange={(e) => setAnswers({ ...answers, [qq.id]: e.target.value })} />}
              </Stack>))}
          </Stack>))}
        <Button variant="primary" onClick={() => s.flash(t('plApplied'))}>{t('plApply')}</Button>
        </Stack> },
        { id: 'team', title: t('plTeam'), hint: t('plTeamSub', { club: club?.name ?? '' }), hidden: !(pool.teamIds?.length), content: (
        <Rows slider itemWidth="15rem">{(pool.teamIds ?? []).map(hostOf).filter((h): h is NonNullable<ReturnType<typeof hostOf>> => !!h).map((h) => (
          <Card key={h.id} depth={1} padding="sm" onClick={() => s.openDetails({ kind: 'host', id: h.id })}><CardBody><Stack direction="row" gap={2} align="center">
            <EntityAvatar id={h.id} name={h.name} size="md" /><Stack direction="column" gap={0}><Text size="sm" weight="bold">{h.name}</Text><Text size="xs" intent="muted">{h.members.toLocaleString('en-US')} members</Text></Stack></Stack></CardBody></Card>))}
          {(pool.memberIds ?? []).map((id) => <Card key={id} depth={1} padding="sm"><CardBody><PersonLine id={id} size="sm" /></CardBody></Card>)}</Rows>
        ) },
        { id: 'worlds', title: t('plWorlds'), hidden: !(pool.worldIds?.length), content: (
        <Rows cols={3} colsSm={1}>{(pool.worldIds ?? []).map(worldOf).filter((w): w is NonNullable<ReturnType<typeof worldOf>> => !!w).map((w) => { const party = (pool.partyIds ?? []).map(eventOf).find((e) => e?.worldId === w.id); return (
          <Tile key={w.id} tone={w.tone} ratio="16/9" grid depth={{ worldId: w.id, clubId: w.clubId, personId: w.creatorId }} title={w.name} sub={party ? t('plParty', { name: party.title, genre: party.genre ?? '' }) : clubOf(w.clubId)?.name}
            onClick={() => s.go('world', { worldId: w.id })} badges={party && <Tag round size="sm">{party.startsAt.slice(5, 10)} · {party.rsvps.toLocaleString('en-US')} RSVPs</Tag>} />); })}</Rows>
        ) },
        { id: 'lots', title: t('plLots'), hidden: !lots.length, content: (
        <Grid gap={3} xs={1} md={2}>{lots.map((l) => <LotCard key={l.id} lot={l} now={now} />)}</Grid>
        ) },
        { id: 'looks', title: t('plSolo'), hidden: !pool.lookIds.length, content: (
        <Grid gap={3} xs={2} sm={3} md={4}>{pool.lookIds.map(lookOf).filter((l): l is ShopLook => !!l).map((l) => { const q = lookLive(l, now); return (
          <Card depth={2} deckDirection="both" key={l.id} tint={l.hex} tintStrength={22} onClick={() => s.openLook(l.id)}><CardBody><Stack direction="column" gap={1}>
            <LookImage look={l} /><Text weight="bold">{l.name}</Text>
            <Stack direction="row" justify="between"><Text size="xs" numeric>{t('plLive', { v: usd(q.total) })}</Text>
              <Text size="xs" intent={q.change >= 0 ? 'success' : 'danger'}>{(q.change >= 0 ? '+' : '') + (q.change * 100).toFixed(1)}%</Text></Stack>
            {mine[l.id] && <Button size="sm" variant="outline" onClick={(e: React.MouseEvent) => { e.stopPropagation(); s.openSwap(l.id); }}>{t('plSwap')}</Button>}
          </Stack></CardBody></Card>); })}</Grid>
        ) },
        { id: 'liquidity', title: t('plLiquidity'), hidden: !liq, content: liq && <Stack direction="column" gap={2}>

        <Stack direction="row" justify="between" align="center"><Title level={4} size="md">{liq.name}</Title><Tag round>{t('apr', { n: liq.apr })}</Tag></Stack>
        <Text size="xs" intent="muted">{t('tvl', { n: usd(liq.tvl + (st?.usd ?? 0)) })} · {liq.stakers + (st ? 1 : 0)}</Text>
        {st && <Tag round minimal intent="success">{t('accrued', { usd: '$' + accrued(liq.id).toFixed(6), day: '$' + (st.usd * liq.apr / 100 / 365).toFixed(4) })}</Tag>}
        <Stack direction="row" gap={2}>
          <Button size="sm" variant="primary" onClick={() => s.flash(stake(liq.id, 100) ? t('staked', { name: liq.name }) : t('noFunds'))}>{t('stake')} $100</Button>
          {st && <Button size="sm" variant="ghost" onClick={() => { const back = unstake(liq.id); s.flash(t('unstaked', { usd: usd(back), name: liq.name })); }}>{t('unstake')}</Button>}
        </Stack>
        </Stack> },
      ]} />
    </Stack></Page>
  );
};
