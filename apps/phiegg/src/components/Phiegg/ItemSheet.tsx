import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardBody, Columns, Drawer, Input, Rows, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { useWallet } from '@phi-kit/wallet';
import { D, lookOf, lookStore, lotsOfPool, poolOf, t, usd } from '../../lib/data';
import { buy, makeOffer, toggleCart, useCart, useOwned, withdrawOffer } from '../../lib/cart';
import { itemStats, lookLive, quote, useNow } from '../../lib/market';
import { phieggStore } from '../../state/phieggStore';
import { Connected } from './Connected';
import { AgentChat } from './AgentChat';
import { ItemActivity, ItemAppears, ItemPrice, ItemSpecs, ItemStatsTable } from './ItemFacts';
import { record } from '../../lib/activity';
import { LookImage } from './LookImage';
import { PageSections } from './PageSections';
import { useThemeColours } from '../../lib/themes';
import { usePageTheme } from '../../lib/pageTheme';
import { PersonAvatar } from './PersonAvatar';
import type { ShopLook } from '../../types/phiegg';

/**
 * A PFT opened as content: a bottom sheet with three columns, variants and related content on the left, the item
 * itself in the centre (look · buy, offer and swap · stats, each a row that expands, folds or closes), and a chat
 * with the store's agent on the right. Every column expands or closes, every row expands, folds or closes, with the
 * controls on the right of its header.
 */
export const ItemSheet: React.FC<{ id: string }> = ({ id }) => {
  const s = useStore(phieggStore); const l = lookOf(id); const w = useWallet(); const mine = useOwned(); const { cart, offers } = useCart(); const now = useNow(1000);
  const [angle, setAngle] = useState('FRONT'); const [opaque, setOpaque] = useState(false); const [bid, setBid] = useState(''); const [msg, setMsg] = useState('');
  useEffect(() => { if (l) { setBid(String(Math.round(l.floor))); setAngle('FRONT'); setOpaque(false); setMsg(''); } }, [id]);
  const store = l ? lookStore(l) : undefined;
  const agent = D.agents.agents.find((a) => store && a.clubIds.includes(store.clubId)) ?? D.agents.agents[0];
  // A look with a set theme dresses the whole page in it while the sheet is open.
  const tc = useThemeColours(l); usePageTheme(tc?.[0], tc?.[1], 'vivid', 'look');
  if (!l || !store) return null;
  const pool = poolOf(l.poolId); const live = lookLive(l, now);
  const pending = offers.find((o) => o.lookId === l.id && o.status === 'pending');
  const views = (opaque && l.opaque ? l.opaque : l.views);
  const src = views[angle] ?? l.views.FRONT;
  const doBuy = () => setMsg(buy(l, t('shBuyLabel', { name: l.name })) ? t('shBought', { name: l.name, n: l.minted + 1, edition: l.edition }) : t('shTopUp'));
  const doOffer = () => { const n = Number(bid); if (!(n > 0)) return; const r = makeOffer(l, n, t('shOfferLabelLog', { name: l.name }));
    setMsg(r === 'accepted' ? t('shOfferAccepted', { name: l.name }) : r === 'pending' ? t('shOfferSent') : t('shTopUp')); };
  const siblings = (pool?.lookIds ?? store.looks.map((x) => x.id)).map(lookOf).filter((x): x is ShopLook => !!x && x.id !== l.id);
  const lots = pool ? lotsOfPool(pool).filter((lot) => lot.itemIds.includes(l.id)) : [];

  // ── left: variants and related content ──
  const left = (
    <Stack direction="column" gap={3}>
      <Text size="xs" weight="bold" intent="muted">{t('isAngles')}</Text>
      <Rows cols={3} colsSm={3} minItemWidth="5rem">{Object.keys(views).map((k) => (
        <Card key={k} padding="sm" tint={l.hex} tintStrength={22} selected={k === angle} onClick={() => { setAngle(k); record('angle', l.id, { refKind: 'look', note: k }); }}><CardBody>
          <LookImage look={l} src={views[k]} cascade={1} /><Text size="xs" weight={k === angle ? 'bold' : undefined}>{D.ls.views.find((v) => v.id === k)?.label ?? k}</Text></CardBody></Card>))}</Rows>
      {l.opaque && <TabList size="sm" variant="pills" activeId={opaque ? 'opaque' : 'sheer'} onChange={(v) => setOpaque(v === 'opaque')} items={[{ id: 'sheer', label: t('shSheer') }, { id: 'opaque', label: t('shOpaque') }]} />}
      {lots.length > 0 && <><Text size="xs" weight="bold" intent="muted">{t('isInLots')}</Text>
        {lots.map((lot) => { const q = quote(lot, now); return (
          <Card key={lot.id} padding="sm" onClick={() => pool && s.go('pool', { poolId: pool.id })}><CardBody>
            <Text size="sm" weight="bold">{lot.title}</Text><Text size="xs" intent="muted">{t('plTotal', { v: usd(q.total) })} · {t('plSold', { sold: q.sold.toLocaleString('en-US'), supply: q.supply.toLocaleString('en-US') })}</Text></CardBody></Card>); })}</>}
      <Text size="xs" weight="bold" intent="muted">{t('isVariants', { pool: pool?.name ?? store.name })}</Text>
      <Rows cols={3} colsSm={2} minItemWidth="7.5rem">{siblings.slice(0, 12).map((x) => (
        <Card key={x.id} padding="sm" deckDirection="right" depth={1} tint={x.hex} tintStrength={22} onClick={() => s.openLook(x.id)}><CardBody>
          <LookImage look={x} cascade={1} /><Text size="xs" weight="bold">{x.name}</Text><Text size="xs" intent="muted">{usd(lookLive(x, now).total)}</Text></CardBody></Card>))}</Rows>
      <Connected kind="look" id={l.id} max={4} />
    </Stack>
  );

  // ── centre: the item as content, in three rows ──
  const centre = (
    <PageSections id="item" size="sm" sections={[
      { id: 'look', title: l.name, expandable: true, collapsible: true, content: (
        <Stack direction="column" gap={2}>
          <Box maxWidth="26rem" width="100%" centered><LookImage look={l} src={src} /></Box>
          {Object.keys(views).length > 1 && <TabList size="sm" variant="pills" aria-label={t('isAngles')} activeId={angle} onChange={setAngle} items={Object.keys(views).map((k) => ({ id: k, label: D.ls.views.find((v) => v.id === k)?.label ?? k }))} />}
        </Stack>) },
      { id: 'buy', title: t('isBuy'), expandable: true, collapsible: true, closable: true, content: (
        <Stack direction="column" gap={2}>
          <Stack direction="row" gap={2} align="end" wrap><Title level={3} size="lg">{usd(l.usd)}</Title><Text size="sm" intent="muted" numeric>{t('plLive', { v: usd(live.total) })}</Text>
            <Tag minimal round size="sm">{l.rarity}</Tag>{pool && <Tag minimal round size="sm" interactive onClick={() => s.go('pool', { poolId: pool.id })}>{pool.name}</Tag>}</Stack>
          <Text size="xs" intent="muted">{t('shFloorLine', { floor: usd(l.floor), change: (l.change7d > 0 ? '+' : '') + l.change7d, owners: l.owners, minted: l.minted, edition: l.edition })}</Text>
          {mine[l.id] ? <Stack direction="row" gap={2} align="center"><Tag intent="success" round>{t('shInCollection')}</Tag><Button variant="primary" onClick={() => s.openSwap(l.id)}>{t('plSwap')}</Button></Stack> : (
            <Stack direction="column" gap={2}>
              <Stack direction="row" gap={2} wrap>
                <Button variant="primary" disabled={w.usd < l.usd} onClick={doBuy}>{w.usd < l.usd ? t('shNoFunds') : t('shBuy', { price: usd(l.usd) })}</Button>
                <Button variant="outline" onClick={() => toggleCart(l.id)}>{cart.includes(l.id) ? t('shInCart') : t('shAddCart')}</Button>
              </Stack>
              {pending ? (
                <Stack direction="row" gap={2} align="center"><Text size="sm">{t('shOfferPending', { price: usd(pending.usd) })}</Text><Button size="sm" variant="ghost" onClick={() => withdrawOffer(l.id)}>{t('shWithdraw')}</Button></Stack>
              ) : (
                <Stack direction="row" gap={2} align="center">
                  <Input inputMode="numeric" value={bid} aria-label={t('shOfferLabel')} onChange={(e) => setBid(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && doOffer()} />
                  <Button variant="outline" onClick={doOffer}>{t('shOffer')}</Button>
                </Stack>
              )}
            </Stack>)}
          {msg && <Text size="sm" role="status">{msg}</Text>}
          <Stack direction="row" gap={1} wrap>{l.garments.map((g) => <Tag key={g} minimal round size="sm">{g}</Tag>)}<Tag minimal round size="sm">{t('shColour', { colour: l.colour })}</Tag></Stack>
        </Stack>) },
      { id: 'specs', title: t('isSpecs'), expandable: true, collapsible: true, closable: true, content: <ItemSpecs look={l} /> },
      { id: 'activity', title: t('isActivity'), expandable: true, collapsible: true, closable: true, content: <ItemActivity look={l} /> },
      { id: 'price', title: t('isPrice2'), expandable: true, collapsible: true, closable: true, content: <ItemPrice look={l} live={live.total} /> },
      { id: 'appears', title: t('isAppears'), expandable: true, collapsible: true, closable: true, content: <ItemAppears look={l} /> },
      { id: 'stats', title: t('plItemStats'), expandable: true, collapsible: true, closable: true, content: <ItemStatsTable stats={itemStats(l, now)} /> },
    ]} />
  );

  // ── right: chat with the store's agent about this item (the shared chat area) ──
  const chat = <AgentChat agentId={agent.id} context={l.name} prompts={[t('isAskStyle'), t('isAskSwap'), t('isAskPrice')]} />;

  return (
    <Drawer isOpen onClose={s.close} position="bottom" size="lg" expandable expandLabel={t('expand')} collapseLabel={t('collapse')}
      title={<Stack direction="row" gap={2} align="center"><Text size="sm" weight="semibold">{l.name}</Text><Text size="xs" intent="muted">{store.name} · {l.rarity}</Text></Stack>}>
      <Columns expandLabel={t('expand')} collapseLabel={t('collapse')} columns={[
        { id: 'variants', title: t('isVariantsTitle'), content: left, width: '19rem', closable: true, expandable: true },
        { id: 'item', title: l.name, label: t('isItem'), content: centre, expandable: true, minWidth: '20rem' },
        { id: 'chat', title: <Stack direction="row" gap={2} align="center"><PersonAvatar id={agent.id} size="xs" /><Text size="sm" weight="semibold">{agent.name}</Text></Stack>, label: t('chat'), content: chat, width: '22rem', closable: true, expandable: true },
      ]} />
    </Drawer>
  );
};


