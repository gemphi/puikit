import React, { useState } from 'react';
import { Button, Card, CardBody, Page, Select, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { ShoppingBag } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, listOf, sortsFor, tableFor } from '../../lib/fields';
import { STORES, clubOf, fmt, lookOf, lotsOfPool, poolOf, storeOf, t, usd } from '../../lib/data';
import { lookLive, poolNumbers, quote, useNow } from '../../lib/market';
import { LotCard } from '../../components/Phiegg/Pools';
import { useCart, useOwned } from '../../lib/cart';
import { ListView } from '../../components/Phiegg/Views';
import { LookImage } from '../../components/Phiegg/LookImage';
import type { PoolLot, ShopLook } from '../../types/phiegg';

/** Every club's store: its pools as one row of tabs, then looks (solo) and lots (packs, drops) at moving prices, each
 *  list with Filter & sort and a table sortable by its headings. Looks open in the item sheet; buying spends the wallet. */
export const ShopPage: React.FC = () => {
  const s = useStore(phieggStore); const { cart, offers } = useCart(); const mine = useOwned();
  const store = storeOf(s.storeId); const club = clubOf(store.clubId);
  const pending = offers.filter((o) => o.status === 'pending').length; const now = useNow(2000);
  const [tab, setTab] = useState<string>('looks');
  const poolName = (id: string) => store.pools.find((p) => p.id === id)?.name ?? poolOf(id)?.name ?? '';
  const looks = store.pools.flatMap((p) => p.lookIds.map(lookOf).filter((l): l is ShopLook => !!l));
  const lots = store.pools.flatMap((p) => { const pool = poolOf(p.id); return pool ? lotsOfPool(pool) : []; });
  const totals = store.pools.map((p) => poolOf(p.id)).filter((p): p is NonNullable<typeof p> => !!p).map((p) => poolNumbers(p, now));
  const sold = totals.reduce((n, x) => n + x.sold, 0), supply = totals.reduce((n, x) => n + x.supply, 0);
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="row" justify="between" align="end" wrap gap={3}>
        <Stack direction="column" gap={1}>
          <Title level={2} size="xl">{store.name}</Title>
          <Text intent="secondary">{store.tagline}</Text>
          <Stack direction="row" gap={1} wrap align="center">
            {club && <Button size="sm" variant="ghost" onClick={() => s.go('club', { clubId: club.id })}>{t('byClub', { name: club.name })}</Button>}
            {supply > 0 && <Tag minimal round size="sm">{t('plSold', { sold: fmt(sold), supply: fmt(supply) })}</Tag>}
            {store.pools.map((p) => poolOf(p.id) && <Tag key={p.id} minimal round size="sm" interactive onClick={() => s.go('pool', { poolId: p.id })}>{p.name}</Tag>)}
          </Stack>
        </Stack>
        <Stack direction="row" gap={2} align="center" wrap>
          <Select size="sm" value={store.id} aria-label={t('shStores')} onChange={(e) => s.go('shop', { storeId: e.target.value })}
            options={STORES.map((x) => ({ value: x.id, label: x.name }))} />
          {pending > 0 && <Tag minimal round>{t('shPending', { n: pending })}</Tag>}
          <Button variant="outline" iconLeft={ShoppingBag} onClick={s.openCart}>{t('shCart', { n: cart.length })}</Button>
        </Stack>
      </Stack>
      <TabList size="sm" variant="pills" activeId={tab} onChange={setTab} items={[{ id: 'looks', label: t('lsLooks'), count: looks.length }, ...(lots.length ? [{ id: 'lots', label: t('lsLots'), count: lots.length }] : [])]} />
      {tab === 'looks' ? (
        <ListView<ShopLook> rows={looks} keyOf={(l) => l.id} text={(l) => l.name + ' ' + l.colour + ' ' + l.garments.join(' ')}
          facets={facetsFor<ShopLook>('look', { get: { owned: (l) => (mine[l.id] ? t('lsOwned') : t('lsOpen')) } })}
          sorts={sortsFor<ShopLook>('look')}
          table={[...tableFor<ShopLook>('look'),
            { id: 'live', header: t('lsColLive'), cell: (l) => usd(lookLive(l, now).total), sortValue: (l) => lookLive(l, now).total, align: 'right' },
            { id: 'minted', header: t('lsColMinted'), cell: (l) => l.minted + ' / ' + l.edition, sortValue: (l) => l.minted / (l.edition || 1), align: 'right' }]}
          render={(l) => (
            <Card depth={2} deckDirection="both" tint={l.hex} tintStrength={22} onClick={() => s.openLook(l.id)}><CardBody><Stack direction="column" gap={2}>
              <LookImage look={l} />
              <Stack direction="row" gap={1}><Tag minimal round size="sm">{l.rarity}</Tag>{mine[l.id] ? <Tag intent="success" minimal round size="sm">{t('shOwned')}</Tag> : null}</Stack>
              <Text weight="bold">{l.name}</Text>
              <Text size="xs" intent="muted" numeric>{t('plLive', { v: usd(lookLive(l, now).total) })} · {t('shMinted', { minted: l.minted, edition: l.edition })}</Text>
            </Stack></CardBody></Card>)} />
      ) : (
        <ListView<PoolLot> rows={lots} keyOf={(x) => x.id} text={(x) => x.title}
          facets={facetsFor<PoolLot>('lot')}
          sorts={[{ id: 'value', label: t('lsSortValue'), by: (a, b) => quote(b, now).total - quote(a, now).total }, { id: 'sold', label: t('lsSortSold'), by: (a, b) => quote(b, now).sold / b.supply - quote(a, now).sold / a.supply }, { id: 'new', label: t('lsSortNew'), by: (a, b) => a.opensAt.localeCompare(b.opensAt) }]}
          table={[...tableFor<PoolLot>('lot'),
            { id: 'total', header: t('lsColValue'), cell: (x) => usd(quote(x, now).total), sortValue: (x) => quote(x, now).total, align: 'right' },
            { id: 'sold', header: t('lsColSold'), cell: (x) => fmt(quote(x, now).sold) + ' / ' + fmt(x.supply), sortValue: (x) => quote(x, now).sold / x.supply, align: 'right' }]}
          render={(x) => <LotCard lot={x} now={now} />} />
      )}
    </Stack></Page>
  );
};
