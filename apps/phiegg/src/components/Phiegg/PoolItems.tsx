import React from 'react';
import { Avatar, ItemCard, SpriteImage, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { D, clubOf, eggsOfPool, fmt, hostOf, lookOf, person, pftsOfPool, profilesOfPool, sumsOfPool, t, usd } from '../../lib/data';
import { spriteOfCell } from '../../lib/portraits';
import { phieggStore } from '../../state/phieggStore';
import { EntityAvatar } from './EntityAvatar';
import { LookImage } from './LookImage';
import { ListView } from './Views';
import type { ItemType, Pool, ShopLook } from '../../types/phiegg';

/** A sibling's name without the words every sibling shares ("Bold Pup Night Coat" → "Night Coat"). */
const distinctName = (name: string, all: string[]) => {
  if (all.length < 2) return name; const w = all.map((x) => x.split(' ')); const max = Math.min(...w.map((x) => x.length)) - 1; let n = 0;
  while (n < max && w.every((x) => x[n] === w[0][n])) n++;
  return n ? name.split(' ').slice(n).join(' ') : name;
};
type Row = { id: string; type: ItemType; kind: string; name: string; usd: number; sub: string; media: React.ReactNode; open: () => void; hex?: string };

/** Every item a pool holds, of all three types: PFT (looks and profile PFTs), EGG (gate, earnings, land), SUM. */
export const PoolItems: React.FC<{ pool: Pool }> = ({ pool }) => {
  const s = useStore(phieggStore); const rate = D.assets.eggUsd;
  const looks = (pool.lookIds ?? []).map(lookOf).filter((l): l is ShopLook => !!l);
  const rows: Row[] = [
    ...looks.map((l) => ({ id: l.id, type: 'pft' as const, kind: t('itLook'), name: l.name, usd: l.usd, sub: `${l.colour} · ${l.rarity}`, media: <LookImage look={l} cascade={0} />, open: () => s.openLook(l.id), hex: l.hex })),
    ...pftsOfPool(pool.id).map((x, _i, all) => ({ id: x.id, hex: x.hex ?? pool.colors?.[0], type: 'pft' as const, kind: 'Minted PFT', name: x.name, usd: x.priceUsd ?? 0, sub: [x.rarity, x.edition ? 'edition of ' + fmt(x.edition) : ''].filter(Boolean).join(' · '), media: <EntityAvatar id={x.id} name={distinctName(x.name, all.map((y) => y.name))} size="md" />, open: () => s.openRecord('pft', x.id) })),
    ...profilesOfPool(pool).map((p) => ({ id: p.id, hex: p.bg, type: 'pft' as const, kind: t('itProfile'), name: p.name, usd: p.priceUsd, sub: p.holderId ? t('asHolder') + ' ' + person(p.holderId).name : p.tokenId, media: <SpriteImage sprite={spriteOfCell(p.sheet, p.index)} alt={p.name} radius="lg" />, open: () => s.openAsset(p.id) })),
    ...eggsOfPool(pool).map((e) => ({ id: e.id, hex: clubOf(e.clubId)?.colors?.[0], type: 'egg' as const, kind: t(e.kind === 'gate' ? 'itGate' : e.kind === 'earnings' ? 'itEarnings' : 'itLand'), name: e.name, usd: e.priceUsd, sub: `${fmt(e.priceEgg)} EGG · ${hostOf(e.hostId)?.name ?? ''}`, media: <EntityAvatar id={e.hostId} name={e.name} size="md" />, open: () => s.openAsset(e.id) })),
    ...sumsOfPool(pool).map((m) => ({ id: m.id, hex: clubOf(m.clubId)?.colors?.[1] ?? clubOf(m.clubId)?.colors?.[0], type: 'sum' as const, kind: t('itMachine'), name: m.name, usd: m.tvlEgg * rate, sub: `${m.apy}% APY · ${m.strategy}`, media: <Avatar size="md" initials="Σ" seed={m.id} />, open: () => s.openAsset(m.id) })),
  ];
  const typeLabel = (x: ItemType) => t(x === 'pft' ? 'itPft' : x === 'egg' ? 'itEgg' : 'itSum');
  return (
    <ListView<Row> rows={rows} keyOf={(r) => r.id} text={(r) => r.name + ' ' + r.sub} onRow={(r) => r.open()} minItemWidth="13rem"
      facets={[{ id: 'type', label: t('asType'), get: (r) => typeLabel(r.type) }, { id: 'kind', label: t('asKind'), get: (r) => r.kind }]}
      sorts={[{ id: 'price', label: t('lsSortPrice'), by: (a, b) => b.usd - a.usd }, { id: 'cheap', label: t('lsSortCheap'), by: (a, b) => a.usd - b.usd }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
      table={[{ id: 'name', header: t('lsColName'), cell: (r) => r.name, sortValue: (r) => r.name }, { id: 'type', header: t('asType'), cell: (r) => typeLabel(r.type), sortValue: (r) => r.type },
        { id: 'kind', header: t('asKind'), cell: (r) => r.kind, sortValue: (r) => r.kind }, { id: 'usd', header: t('asPrice'), cell: (r) => usd(r.usd), sortValue: (r) => r.usd, align: 'right' }]}
      render={(r) => <ItemCard depth={1} deckDirection="both" tint={r.hex} tintStrength={22} layout="vertical" onClick={r.open} media={r.media} title={r.name} meta={typeLabel(r.type) + ' · ' + r.kind}
        aside={<Text size="xs" weight="bold" numeric>{usd(r.usd)}</Text>}>{r.sub}</ItemCard>} />
  );
};
