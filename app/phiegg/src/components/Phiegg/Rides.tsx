import React from 'react';
import { ItemCard, SpriteImage, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { fmt, jewelSprite, person, ridePrice, rideSprite, t, usd, worldOf, rideKind, rideMode } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { ListView } from './Views';
import type { JewelItem, RideItem } from '../../types/phiegg';

/**
 * Every list of rides in the app (the Rides page, a world, a club): kind, use, world and make are filters; price,
 * speed and A to Z are sorts; list mode is a table. Each card takes its ride's colour, and opening one dresses the page.
 */
export const RideList: React.FC<{ rows: RideItem[]; cols?: number; world?: boolean }> = ({ rows, cols = 4, world = true }) => {
  const s = useStore(phieggStore);
  const kind = (r: RideItem) => rideKind(r.kind); const mode = (r: RideItem) => rideMode(r.mode);
  return (
    <ListView<RideItem> rows={rows} keyOf={(r) => r.id} text={(r) => [r.name, r.make, r.lift, r.body, kind(r), mode(r), ...r.theme.kinds].join(' ')} cols={cols} minItemWidth="13rem" onRow={(r) => s.openAsset(r.id)}
      facets={[{ id: 'kind', label: t('rdKind'), get: kind }, { id: 'mode', label: t('rdMode'), get: mode }, ...(world ? [{ id: 'world', label: t('lsWorld'), get: (r: RideItem) => worldOf(r.worldId)?.name }] : []), { id: 'make', label: t('lsMake'), get: (r) => r.make }]}
      sorts={[{ id: 'price', label: t('lsSortPrice'), by: (a, b) => ridePrice(b) - ridePrice(a) }, { id: 'ticket', label: t('lsSortTicket'), by: (a, b) => ridePrice(a) - ridePrice(b) }, { id: 'speed', label: t('lsSortSpeed'), by: (a, b) => b.topKmh - a.topKmh }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
      table={[{ id: 'name', header: t('lsColName'), cell: (r) => r.name, sortValue: (r) => r.name }, { id: 'kind', header: t('rdKind'), cell: kind, sortValue: kind }, { id: 'mode', header: t('rdMode'), cell: mode, sortValue: mode },
        ...(world ? [{ id: 'world', header: t('lsWorld'), cell: (r: RideItem) => worldOf(r.worldId)?.name ?? '', sortValue: (r: RideItem) => worldOf(r.worldId)?.name ?? '' }] : []),
        { id: 'speed', header: t('lsColSpeed'), cell: (r) => (r.kind === 'fun' ? '·' : fmt(r.topKmh) + ' km/h'), sortValue: (r) => r.topKmh, align: 'right' },
        { id: 'price', header: t('lsColPrice'), cell: (r) => usd(ridePrice(r)), sortValue: (r) => ridePrice(r), align: 'right' }]}
      render={(r) => (
        <ItemCard depth={2} deckDirection="both" variant="flat" layout="vertical" tint={r.hex} onClick={() => s.openAsset(r.id)}
          media={<SpriteImage sprite={rideSprite(r)} alt={r.name} ratio="16 / 10" radius="lg" />}
          title={r.name} meta={`${kind(r)} · ${r.make}`} aside={<Text size="sm" weight="bold" numeric>{usd(ridePrice(r))}</Text>}>
          <Stack direction="row" gap={1} wrap><Tag minimal round size="sm" intent={r.mode === 'sale' ? undefined : 'primary'}>{mode(r)}</Tag>{r.theme.kinds.map((k) => <Tag key={k} minimal round size="sm">{k}</Tag>)}<Tag minimal round size="sm">{person(r.holderId).name}</Tag></Stack>
        </ItemCard>)} />
  );
};

/** Maison Once's pieces: piece, metal, stone and street are filters; the cards take the stone's or the metal's colour. */
export const JewelList: React.FC<{ rows: JewelItem[]; cols?: number }> = ({ rows, cols = 4 }) => {
  const s = useStore(phieggStore);
  return (
    <ListView<JewelItem> rows={rows} keyOf={(j) => j.id} text={(j) => [j.name, j.piece, j.metal, j.stone ?? '', j.movement ?? ''].join(' ')} cols={cols} minItemWidth="11rem" onRow={(j) => s.openAsset(j.id)}
      facets={[{ id: 'piece', label: t('jwPiece'), get: (j) => j.piece }, { id: 'metal', label: t('jwMetal'), get: (j) => j.metal }, { id: 'stone', label: t('jwStone'), get: (j) => j.stone ?? undefined }, { id: 'held', label: t('jwEdition'), get: (j) => (j.holderId ? t('jwSold') : t('jwAvailable')) }]}
      sorts={[{ id: 'price', label: t('lsSortPrice'), by: (a, b) => b.priceUsd - a.priceUsd }, { id: 'cheap', label: t('lsSortCheap'), by: (a, b) => a.priceUsd - b.priceUsd }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
      table={[{ id: 'name', header: t('lsColName'), cell: (j) => j.name, sortValue: (j) => j.name }, { id: 'piece', header: t('jwPiece'), cell: (j) => j.piece, sortValue: (j) => j.piece },
        { id: 'metal', header: t('jwMetal'), cell: (j) => j.metal, sortValue: (j) => j.metal }, { id: 'stone', header: t('jwStone'), cell: (j) => j.stone ?? '·', sortValue: (j) => j.stone ?? '' },
        { id: 'price', header: t('lsColPrice'), cell: (j) => usd(j.priceUsd), sortValue: (j) => j.priceUsd, align: 'right' }]}
      render={(j) => (
        <ItemCard depth={2} deckDirection="both" variant="flat" layout="vertical" tint={j.hex} onClick={() => s.openAsset(j.id)}
          media={<SpriteImage sprite={jewelSprite(j)} alt={j.name} radius="lg" />} title={j.name} meta={`${j.piece} · ${j.metal}${j.stone ? ' · ' + j.stone : ''}`}
          aside={<Text size="sm" weight="bold" numeric>{usd(j.priceUsd)}</Text>}>
          <Stack direction="row" gap={1} wrap><Tag minimal round size="sm" intent={j.holderId ? undefined : 'success'}>{j.holderId ? t('jwSold') : t('jwAvailable')}</Tag><Tag minimal round size="sm">{t('jwEdition')}</Tag></Stack>
        </ItemCard>)} />
  );
};
