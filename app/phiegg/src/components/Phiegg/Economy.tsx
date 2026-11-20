import React, { useState } from 'react';
import { Button, Card, CardBody, Input, ItemCard, Popover, ProgressBar, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { fmt, itemOf, t, usd } from '../../lib/data';
import { buyCoin, enterQuest, leaveQuest, sellCoin, useEconomy } from '../../lib/economy';
import { EntityAvatar } from './EntityAvatar';
import { Tile } from './Tile';
import type { Coin, Quest } from '../../types/phiegg';

const pct = (n: number) => (n > 0 ? '+' : '') + n + '%';

/** Amount popover: type a USD amount, confirm. */
const Amount: React.FC<{ label: string; initial?: number; onConfirm: (n: number) => boolean; variant?: 'primary' | 'outline' }> = ({ label, initial = 100, onConfirm, variant = 'outline' }) => {
  const [open, setOpen] = useState(false); const [v, setV] = useState(String(initial));
  return (
    <Popover portal isOpen={open} onOpenChange={setOpen} placement="bottom-start" trigger={<Button variant={variant}>{label}</Button>}>
      <Stack direction="column" gap={2} minWidth="12rem">
        <Text size="xs" intent="muted" weight="bold">{t('stakeAmt')}</Text>
        <Input type="number" min={1} value={v} aria-label={t('stakeAmt')} onChange={(e) => setV(e.target.value)} />
        <Stack direction="row" gap={1}>{[50, 100, 500].map((n) => <Button key={n} variant="glass" onClick={() => setV(String(n))}>{usd(n)}</Button>)}</Stack>
        <Button variant="glass" onClick={() => { if (onConfirm(Number(v))) setOpen(false); }}>{label} {usd(Number(v) || 0)}</Button>
      </Stack>
    </Popover>
  );
};

/** A quest: its world, sponsor and reward, and entering or leaving it. */
export const QuestCard: React.FC<{ q: Quest }> = ({ q }) => {
  const s = useStore(phieggStore); const eco = useEconomy(); const inQ = !!eco.quests[q.id];
  return (
    <Card depth={2}><CardBody><Stack direction="column" gap={2}>
      <Tile animate tone={q.tone} ratio="16/8" depth={{ worldId: q.worldId, clubId: q.sponsorClubId }} title={q.title} sub={itemOf('world', q.worldId)?.name} badges={<Tag round size="sm">{t('reward', { n: q.reward, coin: q.rewardCoin })}</Tag>} />
      <Text size="xs" intent="muted">{t('sponsoredBy', { name: itemOf('club', q.sponsorClubId)?.name ?? '' })} · {t('entrants', { n: fmt(q.entrants + (inQ ? 1 : 0)) })} · {t('endsAt', { date: q.endsAt.slice(5, 10) })}</Text>
      <ProgressBar value={q.progress} size="sm" animate={false} />
      {inQ
        ? <Stack direction="row" gap={1} align="center"><Tag round intent="success" size="sm">{t('qEntered')}</Tag>
            <Button variant="glass" onClick={() => s.go('world', { worldId: q.worldId })}>{itemOf('world', q.worldId)?.name ?? t('playQuest')}</Button>
            <Button variant="glass" onClick={() => { leaveQuest(q.id); s.flash(t('qLeft', { name: q.title })); }}>{t('qLeave')}</Button></Stack>
        : <Button variant="glass" onClick={() => { enterQuest(q.id); s.flash(t('joined_', { name: q.title })); }}>{t('playQuest')}</Button>}
    </Stack></CardBody></Card>
  );
};

/** A coin: its price and holders, and buying or selling it. */
export const CoinCard: React.FC<{ x: Coin }> = ({ x }) => {
  const s = useStore(phieggStore); const eco = useEconomy(); const held = eco.coins[x.id] ?? 0;
  return (
    <ItemCard depth={2} stackBelow="always" media={<EntityAvatar id={x.clubId ?? x.id} name={x.name} size="md" />} title={x.symbol} meta={x.name}
      aside={<Stack direction="column" gap={0} align="end"><Text weight="bold" numeric>{'$' + x.price}</Text><Text size="xs" numeric intent={x.change24h >= 0 ? 'success' : 'danger'}>{pct(x.change24h)}</Text></Stack>}
      actions={<><Amount label={t('buy')} variant="primary" onConfirm={(n) => { const ok = buyCoin(x.id, n); s.flash(ok ? t('bought', { n: (n / x.price).toFixed(2), coin: x.symbol }) : t('noFunds')); return ok; }} />
        {held > 0 && <Button variant="glass" onClick={() => { const got = sellCoin(x.id); s.flash(t('sold', { coin: x.symbol, usd: usd(got) })); }}>{t('sell')}</Button>}</>}>
      <Stack direction="column" gap={1}>
        <Text size="xs" intent="muted">{fmt(x.holders + (held ? 1 : 0))} {t('holders')}</Text>
        {held > 0 && <Tag round minimal intent="primary">{t('youHold', { n: held.toFixed(2) + ' ' + x.symbol })} · {usd(held * x.price)}</Tag>}
      </Stack>
    </ItemCard>
  );
};
