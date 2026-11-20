import React, { useEffect, useMemo, useState } from 'react';
import { Button, FullScreen, Image, Stack, TabList, Tag } from '@pui/components';
import { Share2, Store as StoreIcon } from 'lucide-react';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { fmt, itemOf, storeOf, t, worldImage } from '../../lib/data';
import { mediaUrl } from '../../lib/media';
import { poolNumbers, useNow } from '../../lib/market';
import { useCart } from '../../lib/cart';
import { KindList } from '../../components/Phiegg/KindList';
import { EntityPage } from '../../components/Phiegg/EntityPage';
import { Mention } from '../../components/Phiegg/Mention';
import { Tile } from '../../components/Phiegg/Tile';
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
  // It opens as a profile does: its club's banner and its name first, its tabs under the name, then its own square
  // card in the centre and the rows of the tab that is on. The card opens the shop full screen.
  const at = tabs.find((x) => x.tab.id === s.shopView.tab) ?? tabs[0];
  const [full, setFull] = useState(false);
  useEffect(() => setFull(false), [store.id]);
  const worlds = (club?.worldIds ?? []).map((w) => itemOf('world', w)).filter((w): w is NonNullable<typeof w> => !!w);
  const seen = worlds.find((w) => w.gallery?.length);
  const picture = seen?.gallery?.[0] ? mediaUrl(seen.gallery[0].lg) : worldImage(worlds[0]);
  const card = <Tile tone={club?.tone ?? 'neutral'} ratio="1" big grid depth={{ clubId: club?.id, worldId: club?.worldIds[0], personId: club?.founderId }} />;
  const share = () => { void navigator.clipboard?.writeText(location.href); s.flash(t('isCopied')); };
  // Everything you can press about the shop is one kind of button, and its club is named with its thumbnail.
  const about = (
    <Stack direction="row" gap={2} wrap align="center">
      {club && <Mention id={club.id} />}
      {store.pools.map((p) => itemOf('pool', p.id) && <Button key={p.id} variant="glass" onClick={() => s.go('pool', { poolId: p.id })}>{p.name}</Button>)}
      <Button variant="glass" onClick={() => s.go('shops')}>{t('pgShops')}</Button>
      {supply > 0 && <Tag minimal round>{t('plSold', { sold: fmt(sold), supply: fmt(supply) })}</Tag>}
      {pending > 0 && <Tag minimal round>{t('shPending', { n: pending })}</Tag>}
    </Stack>
  );
  const rows = at ? (
    <Stack direction="column" gap={3}>
      {about}
      {/* The menu entry picked (Women, Women · Dresses...) over its rows, with the way back to all of them. */}
      {at.tab.menu && cat ? (
        <Stack direction="row" gap={2} align="center">
          <Tag round>{placeLabel(store.id, cat)}</Tag>
          <Button variant="glass" onClick={() => s.setShopView({ cat: '' })}>{t('seAll')}</Button>
        </Stack>) : null}
      <KindList key={at.tab.id} kind={at.tab.kind} rows={at.rows} label={store.name} />
    </Stack>) : about;
  return (<>
    {full && <FullScreen label={store.name} fill={picture} tint={club?.colors?.[0]} onClose={() => setFull(false)} closeLabel={t('close')}
      media={picture ? <Image src={picture} alt={store.name} fit="contain" fill /> : card} infoLabel={store.name}
      actions={[
        { id: 'shops', label: t('pgShops'), icon: <StoreIcon size={18} />, onClick: () => s.go('shops') },
        { id: 'share', label: t('isShare'), icon: <Share2 size={18} />, onClick: share },
      ]}>
      {about}
    </FullScreen>}
    <EntityPage wear={club?.colors?.[0]} picture={picture ? <Image src={picture} alt="" fit="cover" fill /> : undefined}
      title={store.name} sub={store.tagline}
      hero={{ card, onCard: () => setFull(true), cardLabel: t('isFull'),
        tabs: tabs.length > 1 ? <TabList size="sm" variant="pills" aria-label={store.name} activeId={at?.tab.id} onChange={(id) => s.setShopView({ tab: id, cat: '' })}
          items={tabs.map(({ tab, rows: r }) => ({ id: tab.id, label: tab.label, count: fmt(r.length) }))} /> : undefined }}
      columns={[{ id: 'shop', title: store.name, label: store.name, content: rows, minWidth: '20rem' }]} />
  </>);
};
