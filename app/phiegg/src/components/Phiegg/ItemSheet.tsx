import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, FullScreen, Image, ItemCard, MediaStage, Input, Rows, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { Bookmark, Heart, Maximize2, Share2, ShoppingBag } from 'lucide-react';
import { useStore } from '@pui/store';
import { useWallet } from '@phi-kit/wallet';
import { D, itemImage, lookStore, lotsOfPool, person, salesOfItem, t, usd, itemOf, type SiteCopyKey } from '../../lib/data';
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
import { EntityPage } from './EntityPage';
import type { ShopLook } from '../../types/phiegg';

/**
 * A PFT's page (#/look/<id>): three glass columns over the look's own picture, blurred to its colour, variants and related content on the left, the item
 * itself in the centre (look · buy, offer and swap · stats, each a row that expands, folds or closes), and a chat
 * with the store's agent on the right. Every column expands or closes, every row expands, folds or closes, with the
 * controls on the right of its header.
 */
/** An item's tabs, the same set wherever an item is shown: Info, Stats, Trail, Owner, then what it is related to.
 *  One short word each (data/site.json), and the parts of the page each one shows. */
const PARTS: [string, SiteCopyKey, string[]][] = [['info', 'isTabInfo', ['buy', 'specs']], ['stats', 'isTabStats', ['price', 'stats']], ['trail', 'isTabTrail', ['activity']], ['owner', 'isTabOwner', ['owner']], ['related', 'isTabRelated', ['appears']]];

export const ItemSheet: React.FC<{ id: string }> = ({ id }) => {
  const s = useStore(phieggStore); const l = itemOf('look', id); const w = useWallet(); const mine = useOwned(); const { cart, offers } = useCart(); const now = useNow(1000);
  const [angle, setAngle] = useState('FRONT'); const [full, setFull] = useState(false); const [opaque, setOpaque] = useState(false); const [bid, setBid] = useState(''); const [msg, setMsg] = useState('');
  useEffect(() => { if (l) { setBid(String(Math.round(l.floor))); setAngle('FRONT'); setOpaque(false); setMsg(''); } }, [id]);
  const store = l ? lookStore(l) : undefined;
  const agent = D.agents.agents.find((a) => store && a.clubIds.includes(store.clubId)) ?? D.agents.agents[0];
  // The page wears the look: its designer theme when it has one, else its own render colour.
  const tc = useThemeColours(l); usePageTheme(tc?.[0] ?? l?.hex, tc?.[1], 'vivid', 'look');
  if (!l || !store) return null;
  const pool = itemOf('pool', l.poolId); const live = lookLive(l, now);
  const pending = offers.find((o) => o.lookId === l.id && o.status === 'pending');
  const views = (opaque && l.opaque ? l.opaque : l.views);
  const src = views[angle] ?? l.views.FRONT;
  const doBuy = () => setMsg(buy(l, t('shBuyLabel', { name: l.name })) ? t('shBought', { name: l.name, n: l.minted + 1, edition: l.edition }) : t('shTopUp'));
  const doOffer = () => { const n = Number(bid); if (!(n > 0)) return; const r = makeOffer(l, n, t('shOfferLabelLog', { name: l.name }));
    setMsg(r === 'accepted' ? t('shOfferAccepted', { name: l.name }) : r === 'pending' ? t('shOfferSent') : t('shTopUp')); };
  const siblings = (pool?.lookIds ?? store.looks.map((x) => x.id)).map(((id) => itemOf('look', id))).filter((x): x is ShopLook => !!x && x.id !== l.id);
  const lots = pool ? lotsOfPool(pool).filter((lot) => lot.itemIds.includes(l.id)) : [];

  // ── left: what goes with the item, each its own region (heading, background, fold and expand): its angles, the lots
  // it is in, the looks alike (its pool's), and what it links to. A region with nothing in it is not shown.
  const left = (
    <PageSections id="item-side" size="sm" sections={[
      { id: 'angles', title: t('isAngles'), content: (
        <Stack direction="column" gap={2}>
          <Rows cols={3} colsSm={3} minItemWidth="5rem">{Object.keys(views).map((k) => (
            <Card key={k} padding="sm" selected={k === angle} onClick={() => { setAngle(k); record('angle', l.id, { refKind: 'look', note: k }); }}><CardBody>
              <LookImage look={l} src={views[k]} cascade={1} /><Text size="xs" weight={k === angle ? 'bold' : undefined}>{D.ls.views.find((v) => v.id === k)?.label ?? k}</Text></CardBody></Card>))}</Rows>
          {l.opaque && <TabList size="sm" variant="pills" activeId={opaque ? 'opaque' : 'sheer'} onChange={(v) => setOpaque(v === 'opaque')} items={[{ id: 'sheer', label: t('shSheer') }, { id: 'opaque', label: t('shOpaque') }]} />}
        </Stack>) },
      { id: 'lots', title: t('isInLots'), hint: String(lots.length), hidden: !lots.length, content: (
        <Stack direction="column" gap={2}>{lots.map((lot) => { const q = quote(lot, now); return (
          <Card key={lot.id} padding="sm" onClick={() => pool && s.go('pool', { poolId: pool.id })}><CardBody>
            <Text size="sm" weight="bold">{lot.title}</Text><Text size="xs" intent="muted">{t('plTotal', { v: usd(q.total) })} · {t('plSold', { sold: q.sold.toLocaleString('en-US'), supply: q.supply.toLocaleString('en-US') })}</Text></CardBody></Card>); })}</Stack>) },
      { id: 'alike', title: t('isVariants'), hint: String(siblings.length), hidden: !siblings.length, content: (
        <Rows cols={2} colsSm={2} minItemWidth="7.5rem">{siblings.slice(0, 12).map((x) => (
          <Card key={x.id} padding="sm" onClick={() => s.openLook(x.id)}><CardBody>
            <LookImage look={x} cascade={1} /><Text size="xs" weight="bold">{x.name}</Text><Text size="xs" intent="muted">{usd(lookLive(x, now).total)}</Text></CardBody></Card>))}</Rows>) },
      { id: 'linked', title: t('asLinked'), content: <Connected kind="look" id={l.id} max={4} bare /> },
    ]} />
  );

  // The usual actions on an item float as icons over the picture's empty corner: like, save, share, cart, full screen.
  const icon = (G: typeof Heart) => <G size={18} />;
  const actions = [
    { id: 'like', label: t('isLike'), icon: icon(Heart), active: !!s.liked[l.id], onClick: () => s.toggle('liked', l.id) },
    { id: 'save', label: t('isSave'), icon: icon(Bookmark), active: !!s.saved[l.id], onClick: () => { s.toggle('saved', l.id); s.flash(t('saved')); } },
    { id: 'share', label: t('isShare'), icon: icon(Share2), onClick: () => { void navigator.clipboard?.writeText(location.href); s.flash(t('isCopied')); } },
    { id: 'cart', label: cart.includes(l.id) ? t('shInCart') : t('shAddCart'), icon: icon(ShoppingBag), active: cart.includes(l.id), onClick: () => toggleCart(l.id) },
    { id: 'full', label: t('isFull'), icon: icon(Maximize2), onClick: () => setFull(true) },
  ];
  const keys = Object.keys(views); const at = keys.indexOf(angle);
  // The page's tabs are its own parts; the one that is on is the one shown at the picture's right.
  const [part, setPart] = useState('info');

  // ── centre: the item as content, in three rows ──
  // Who holds it: everyone its ledger hands it to (a mint, a sale, a transfer), the newest first, each once.
  const holders = salesOfItem(l.id).filter((x) => x.toId).sort((a, b) => b.at.localeCompare(a.at))
    .filter((x, i, all) => all.findIndex((y) => y.toId === x.toId) === i).map((x) => ({ id: x.toId as string, at: x.at, usd: x.priceUsd || 0 }));
  const parts = [
      { id: 'buy', title: t('isBuy'), expandable: true, collapsible: true, closable: true, content: (
        <Stack direction="column" gap={2}>
          <Stack direction="row" gap={2} align="end" wrap><Title level={3} size="lg">{usd(l.usd)}</Title><Text size="sm" intent="muted" numeric>{t('plLive', { v: usd(live.total) })}</Text>
            <Tag minimal round size="sm">{l.rarity}</Tag>{pool && <Tag minimal round size="sm" interactive onClick={() => s.go('pool', { poolId: pool.id })}>{pool.name}</Tag>}</Stack>
          <Text size="xs" intent="muted">{t('shFloorLine', { floor: usd(l.floor), change: (l.change7d > 0 ? '+' : '') + l.change7d, owners: l.owners, minted: l.minted, edition: l.edition })}</Text>
          {mine[l.id] ? <Stack direction="row" gap={2} align="center"><Tag intent="success" round>{t('shInCollection')}</Tag><Button variant="glass" onClick={() => s.openSwap(l.id)}>{t('plSwap')}</Button></Stack> : (
            <Stack direction="column" gap={2}>
              <Stack direction="row" gap={2} wrap>
                <Button variant="glass" disabled={w.usd < l.usd} onClick={doBuy}>{w.usd < l.usd ? t('shNoFunds') : t('shBuy', { price: usd(l.usd) })}</Button>
                <Button variant="glass" onClick={() => toggleCart(l.id)}>{cart.includes(l.id) ? t('shInCart') : t('shAddCart')}</Button>
              </Stack>
              {pending ? (
                <Stack direction="row" gap={2} align="center"><Text size="sm">{t('shOfferPending', { price: usd(pending.usd) })}</Text><Button variant="glass" onClick={() => withdrawOffer(l.id)}>{t('shWithdraw')}</Button></Stack>
              ) : (
                <Stack direction="row" gap={2} align="center">
                  <Input inputMode="numeric" value={bid} aria-label={t('shOfferLabel')} onChange={(e) => setBid(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && doOffer()} />
                  <Button variant="glass" onClick={doOffer}>{t('shOffer')}</Button>
                </Stack>
              )}
            </Stack>)}
          {msg && <Text size="sm" role="status">{msg}</Text>}
          <Stack direction="row" gap={1} wrap>{l.garments.map((g) => <Tag key={g} minimal round size="sm">{g}</Tag>)}<Tag minimal round size="sm">{t('shColour', { colour: l.colour })}</Tag></Stack>
        </Stack>) },
      { id: 'look', title: l.name, expandable: true, collapsible: true, content: (
        <MediaStage media={<LookImage look={l} src={src} />} actions={actions}>
          {Object.keys(views).length > 1 && <TabList size="sm" variant="pills" place="center" aria-label={t('isAngles')} activeId={angle} onChange={setAngle} items={Object.keys(views).map((k) => ({ id: k, label: D.ls.views.find((v) => v.id === k)?.label ?? k }))} />}
        </MediaStage>) },
      { id: 'activity', title: t('isActivity'), expandable: true, collapsible: true, closable: true, content: <ItemActivity look={l} /> },
      { id: 'price', title: t('isPrice2'), expandable: true, collapsible: true, closable: true, content: <ItemPrice look={l} live={live.total} /> },
      { id: 'stats', title: t('plItemStats'), expandable: true, collapsible: true, closable: true, content: <ItemStatsTable stats={itemStats(l, now)} /> },
      { id: 'appears', title: t('isAppears'), expandable: true, collapsible: true, closable: true, content: <ItemAppears look={l} /> },
      { id: 'owner', title: t('isTabOwner'), expandable: true, collapsible: true, content: holders.length
        ? <Stack direction="column" gap={1}>{holders.map((h) => (
            <ItemCard key={h.id} variant="flat" stackBelow="never" onClick={() => s.go('profile', { profileId: h.id })} media={<PersonAvatar id={h.id} size="md" />}
              title={person(h.id).name} meta={t('isHeldSince', { date: h.at.slice(0, 10) })} aside={h.usd ? <Tag minimal round size="sm">{usd(h.usd)}</Tag> : undefined} />))}</Stack>
        : <Text size="sm" intent="muted">{t('isNoOwner')}</Text> },
      { id: 'specs', title: t('isSpecs'), expandable: true, collapsible: true, closable: true, content: <ItemSpecs look={l} /> },
  ];

  // ── right: chat with the store's agent about this item (the shared chat area) ──
  const chat = <AgentChat agentId={agent.id} context={l.name} prompts={[t('isAskStyle'), t('isAskSwap'), t('isAskPrice')]} />;

  return (
    <>{full && <FullScreen label={l.name} media={<LookImage look={l} src={src} />} onClose={() => setFull(false)} closeLabel={t('close')}
      onPrev={at > 0 ? () => setAngle(keys[at - 1]) : undefined} onNext={at < keys.length - 1 ? () => setAngle(keys[at + 1]) : undefined} prevLabel={t('prev')} nextLabel={t('next')}
      actions={actions.filter((x) => x.id !== 'full').map((x) => ({ ...x }))} />}
    <EntityPage stickLast
      picture={<Image src={itemImage(src)} alt="" fit="cover" fill />}
      /* What it costs is said at once, under its name, and again on the action at the heading's right. */
      title={l.name} sub={<>{usd(l.usd)} · {t('plLive', { v: usd(live.total) })} · {store.name} · {l.rarity}</>}
      action={<Button variant="glass" disabled={w.usd < l.usd} title={w.usd < l.usd ? t('shNoFunds') : undefined} onClick={doBuy}>{t('shBuy', { price: usd(l.usd) })}</Button>}
      /* The picture at the left, as wide as the screen is tall (the kit's middle column) and held in view; at its
         right one column: the page's tabs, and under them the part the tab that is on names. The two share the width
         about evenly (their widths are their weights), so neither is a strip. */
      columns={[
        { id: 'item', title: l.name, label: t('isItem'), content: parts.find((x) => x.id === 'look')?.content, width: '32rem', stick: true },
        { id: 'facts', title: l.name, label: t('isSpecs'), width: '30rem', content: (
          <Stack direction="column" gap={3}>
            <TabList size="sm" variant="pills" aria-label={l.name} activeId={part} onChange={setPart} items={PARTS.map(([id, key]) => ({ id, label: t(key) }))} />
            <PageSections id="item" size="sm" sections={parts.filter((x) => PARTS.find(([id]) => id === part)?.[2].includes(x.id))} />
            {part === 'related' ? left : null}
          </Stack>) },
        { id: 'chat', title: <Stack direction="row" gap={2} align="center"><PersonAvatar id={agent.id} size="xs" /><Text size="sm" weight="semibold">{agent.name}</Text></Stack>, label: t('chat'), content: chat, width: '22rem', folded: true },
      ]} />
    </>
  );
};


