import React, { useMemo } from 'react';
import { Button, Page, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { fmt, itemOf, storeOf, t } from '../../lib/data';
import { poolNumbers, useNow } from '../../lib/market';
import { useCart } from '../../lib/cart';
import { TabLists } from '../../components/Phiegg/KindList';
import { inPlace, placeLabel } from '../../lib/shopMenu';
import { routeOf, rowsOf } from '../../lib/route';
import type { ShopLook } from '../../types/phiegg';

/** A shop: its name and numbers, then its path's tabs (data/route.json). Each tab is a kind and the rows of it that
 *  belong to this shop, drawn by the one list of any kind; the page names no kind and no card. */
const TABS = routeOf('shop').tab ?? [];

export const ShopPage: React.FC = () => {
  const s = useStore(phieggStore); const { offers } = useCart();
  const store = storeOf(s.storeId); const club = itemOf('club', store.clubId);
  const pending = offers.filter((o) => o.status === 'pending').length; const now = useNow(2000);
  const cat = s.shopView.cat;
  // Each tab with its rows; a tab that follows the menu keeps the rows under the entry picked. Only tabs with rows show.
  const tabs = useMemo(() => TABS.map((tab) => ({ tab, rows: rowsOf(tab, store).filter((r) => !tab.menu || inPlace(r as unknown as ShopLook, cat)) })).filter((x) => x.rows.length > 0),
    [store, cat, s.dataRev]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = store.pools.map((p) => itemOf('pool', p.id)).filter((p): p is NonNullable<typeof p> => !!p).map((p) => poolNumbers(p, now));
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
            {store.pools.map((p) => itemOf('pool', p.id) && <Tag key={p.id} minimal round size="sm" interactive onClick={() => s.go('pool', { poolId: p.id })}>{p.name}</Tag>)}
          </Stack>
        </Stack>
        <Stack direction="row" gap={2} align="center" wrap>
          <Button variant="glass" onClick={() => s.go('shops')}>{t('pgShops')}</Button>
          {pending > 0 && <Tag minimal round>{t('shPending', { n: pending })}</Tag>}
        </Stack>
      </Stack>
      <TabLists tabs={tabs} on={s.shopView.tab} onTab={(id) => s.setShopView({ tab: id, cat: '' })} label={store.name}>
        {/* The menu entry picked (Women, Women · Dresses...) over its rows, with the way back to all of them. */}
        {(tab) => (tab.menu && cat ? (
          <Stack direction="row" gap={2} align="center">
            <Tag round>{placeLabel(store.id, cat)}</Tag>
            <Button variant="ghost" size="sm" onClick={() => s.setShopView({ cat: '' })}>{t('seAll')}</Button>
          </Stack>) : null)}
      </TabLists>
    </Stack></Page>
  );
};
