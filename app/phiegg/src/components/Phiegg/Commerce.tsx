import React, { useState } from 'react';
import { Box, Button, Drawer, Pressable, Stack, Tag, Text, Title } from '@pui/components';
import { Connected } from './Connected';
import { useStore } from '@pui/store';
import { useWallet } from '@phi-kit/wallet';
import { cityOf, clubOf, fmt, hostOf, lookOf, placeOf, seriesOf, site, storeOfClub, t, usd, worldOf } from '../../lib/data';
import { checkout, removeFromCart, useCart } from '../../lib/cart';
import { hasApi } from '@phi-kit/api';
import { liveCreate } from '../../lib/live';
import { KindForm } from '../../lib/fields';
import { phieggStore } from '../../state/phieggStore';
import { usePlaces } from '../../lib/lazy';
import { LookImage } from './LookImage';
import { EntityPage } from './EntityPage';
import { PersonLine } from './PersonLine';
import { Tile } from './Tile';
import type { ShopLook } from '../../types/phiegg';

const CartDrawer: React.FC = () => {
  const s = useStore(phieggStore); const { cart } = useCart(); const w = useWallet(); const [msg, setMsg] = useState('');
  const [stage, setStage] = useState<'cart' | 'steps'>('cart');
  const items = cart.map(lookOf).filter((l): l is ShopLook => !!l); const total = items.reduce((a, l) => a + l.usd, 0);
  // The checkout steps: the order kind's declared form (data/kinds.json), then pay. The wallet settles the money;
  // the order itself becomes a record in the one database when Phiora is on.
  const place = async (values: Record<string, unknown>) => {
    const ids = items.map((l) => l.id);
    if (!checkout(items, t('shCheckoutLabel', { n: items.length }))) { setMsg(t('shTopUp')); return; }
    if (hasApi) await liveCreate('order', { ...values, title: t('shCheckoutLabel', { n: ids.length }), itemIds: ids, totalUsd: total, at: new Date().toISOString() });
    setStage('cart'); setMsg(t('coPlaced', { n: ids.length })); s.flash(t('coPlaced', { n: ids.length }));
  };
  return (
    <Drawer isOpen onClose={s.close} position="right" size={stage === 'steps' ? 'lg' : 'md'} expandable={stage === 'steps'} title={<Title level={4} size="md">{stage === 'steps' ? t('coCheckout') : t('shYourCart')}</Title>}
      footer={stage === 'cart' && items.length ? <Stack direction="row" justify="between" align="center"><Stack direction="column" gap={0}><Text weight="bold">{t('shTotal', { price: usd(total) })}</Text><Text size="xs" intent="muted">{t('shWallet', { price: usd(w.usd) })}</Text></Stack>
        <Button variant="primary" disabled={w.usd < total} onClick={() => setStage('steps')}>{w.usd < total ? t('shNoFunds') : t('shCheckout')}</Button></Stack> : undefined}>
      <Stack direction="column" gap={3}>
        {stage === 'steps' ? (
          <KindForm kind="order" onSubmit={place} submitLabel={t('coPlace')} cancelLabel={t('coBack')} onCancel={() => setStage('cart')} fill title={t('coCheckout')}
            review={<Stack direction="column" gap={1}>
              <Title level={5} size="sm">{t('coReview')}</Title>
              {items.map((l) => <Stack key={l.id} direction="row" justify="between"><Text size="sm">{l.name}</Text><Text size="sm" numeric>{usd(l.usd)}</Text></Stack>)}
              <Stack direction="row" justify="between"><Text weight="bold">{t('shTotal', { price: usd(total) })}</Text><Text size="xs" intent="muted">{t('shWallet', { price: usd(w.usd) })}</Text></Stack>
            </Stack>} />
        ) : (<>
          {items.length ? items.map((l) => (
            <Stack key={l.id} direction="row" gap={3} align="center">
              <Pressable width="4rem" flex="none" onClick={() => s.openLook(l.id)} aria-label={l.name}><LookImage look={l} cascade={2} /></Pressable>
              <Stack direction="column" gap={0} grow={1}><Text weight="bold">{l.name}</Text><Text size="xs" intent="muted">{usd(l.usd)}</Text></Stack>
              <Button size="sm" variant="ghost" onClick={() => removeFromCart(l.id)}>{t('shRemove')}</Button>
            </Stack>)) : <Text intent="muted">{t('shEmptyCart')}</Text>}
        </>)}
        {msg && <Text size="sm" role="status">{msg}</Text>}
      </Stack>
    </Drawer>
  );
};

/** A place inside a city district, on its own page (#/place/<id>): what it is, who runs it, and where to go next. */
export const PlacePage: React.FC<{ id: string }> = ({ id }) => {
  const s = useStore(phieggStore); usePlaces(); const hit = placeOf(id); if (!hit) return null;
  const { place: p, district, cityId } = hit; const where = cityOf(cityId); const club = clubOf(p.clubId); const store = club && storeOfClub(club.id);
  const kinds = (site as unknown as { placeKinds: Record<string, string> }).placeKinds; const kind = kinds[p.kind] ?? p.kind;
  const others = district.places.filter((x) => x.id !== p.id);
  const tile = (ratio: '16/9') => <Tile animate tone={p.tone} ratio={ratio} depth={{ clubId: p.clubId, worldId: where?.world.id }} title={p.name} sub={district.vibe} badges={<Tag round size="sm">{kind}</Tag>} />;
  const about = (
    <Stack direction="column" gap={3}>
      {tile('16/9')}
      <Text>{p.desc}</Text>
      <Stack direction="row" gap={1} wrap><Tag minimal round size="sm">★ {p.rating}</Tag><Tag minimal round size="sm">{t('ctInside', { n: p.visitors })}</Tag><Tag minimal round size="sm">{p.hours}</Tag></Stack>
      <Stack direction="row" gap={2} wrap>
        <Button variant="primary" onClick={() => s.flash(t('entering', { name: p.name }))}>{t('ctEnter')}</Button>
        {store && <Button variant="outline" onClick={() => s.go('shop', { storeId: store.id })}>{store.name}</Button>}
        {club && <Button variant="ghost" onClick={() => s.go('club', { clubId: club.id })}>{club.name}</Button>}</Stack>
    </Stack>);
  const also = <Stack direction="column" gap={1}>{others.map((o) => <Button key={o.id} size="sm" variant="ghost" align="start" onClick={() => s.openPlace(o.id)}>{o.name} · {kinds[o.kind] ?? o.kind}</Button>)}</Stack>;
  return (
    <EntityPage picture={tile('16/9')} wear={club?.colors?.[0]} title={p.name} sub={<>{kind} · {district.name}{where ? ' · ' + where.city.name + ', ' + where.world.name : ''}</>} columns={[
      { id: 'place', title: p.name, content: about, minWidth: '20rem' },
      ...(others.length ? [{ id: 'also', title: t('ctAlsoIn', { name: district.name }), content: also, width: '19rem' }] : []),
    ]} />
  );
};

export const CommerceOverlays: React.FC = () => {
  const o = useStore(phieggStore).overlay;
  return o.kind === 'cart' ? <CartDrawer /> : null;
};
