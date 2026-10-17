import React from 'react';
import { ItemCard, Spinner, SpriteImage, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { useOwned } from '../../lib/cart';
import { D, clubOf, jewelSprite, rideKind, rideSprite, eggsOfHost, fmt, hostOf, lookOf, person, postById, profileItemOfHolder, salesOfItem, seriesOf, t, usd } from '../../lib/data';
import { useCredits } from '../../lib/productions';
import { spriteOfCell } from '../../lib/portraits';
import { phieggStore } from '../../state/phieggStore';
import { EntityAvatar } from './EntityAvatar';
import { LookImage } from './LookImage';
import { Tile } from './Tile';
import { postTile } from './ShotCard';
import { ListView } from './Views';
import type { ItemType, ShopLook } from '../../types/phiegg';

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const allLooks = (): ShopLook[] => [...D.ls.looks, ...D.stores.stores.flatMap((x) => x.looks)] as ShopLook[];

/** A profile's likes, items (profile PFT, looks, EGG items of its hosts), hosts and credits (every role in every title). */
export const ProfileTab: React.FC<{ id: string; tab: 'Likes' | 'Items' | 'Hosts' | 'Credits' }> = ({ id, tab }) => {
  const s = useStore(phieggStore); const owned = useOwned(); const credits = useCredits(tab === 'Credits' ? id : undefined);
  const isMe = id === D.core.currentUserId; const p = person(id);

  if (tab === 'Likes') {
    const feed = D.feed.shots.map((x) => x.id).concat(D.agents.posts.map((x) => x.id));
    const ids = isMe ? Object.keys(s.liked).filter((k) => s.liked[k]) : feed.filter((x) => hash(id + x) % 23 === 0).slice(0, 48);
    const posts = ids.map(postById).filter((x): x is NonNullable<typeof x> => !!x);
    return <ListView rows={posts} keyOf={(x) => x.id} text={(x) => x.caption} empty={t('prNoLikes')} onRow={(x) => s.openPost(x.id)} cols={3}
      facets={[{ id: 'author', label: t('lsAuthor'), get: (x) => person(x.authorId).name }]} sorts={[{ id: 'likes', label: t('lsSortLikes'), by: (a, b) => b.likes - a.likes }]}
      table={[{ id: 't', header: t('lsColName'), cell: (x) => x.slides[0].title, sortValue: (x) => x.slides[0].title }, { id: 'a', header: t('lsAuthor'), cell: (x) => person(x.authorId).name, sortValue: (x) => person(x.authorId).name }, { id: 'l', header: t('lsColLikes'), cell: (x) => fmt(x.likes), sortValue: (x) => x.likes, align: 'right' }]}
      render={(x) => <Tile {...postTile(x)} title={x.slides[0].title} sub={person(x.authorId).name} onClick={() => s.openPost(x.id)} />} />;
  }

  if (tab === 'Hosts') {
    const hs = D.hosts.hosts.filter((h) => h.ownerId === id || (p.user?.hostIds ?? []).includes(h.id));
    return <ListView rows={hs} keyOf={(h) => h.id} text={(h) => h.name} empty={t('prNoHosts')} onRow={(h) => s.openDetails({ kind: 'host', id: h.id })}
      sorts={[{ id: 'm', label: t('lsSortHolders'), by: (a, b) => b.members - a.members }]}
      table={[{ id: 'n', header: t('lsColName'), cell: (h) => h.name, sortValue: (h) => h.name }, { id: 'm', header: t('prMembers'), cell: (h) => fmt(h.members), sortValue: (h) => h.members, align: 'right' }, { id: 'o', header: t('prOnline'), cell: (h) => fmt(h.online), sortValue: (h) => h.online, align: 'right' }]}
      render={(h) => <ItemCard depth={2} deckDirection="right" tint={clubOf(h.clubId)?.colors?.[0]} tintStrength={22} onClick={() => s.openDetails({ kind: 'host', id: h.id })} media={<EntityAvatar id={h.id} name={h.name} size="lg" />} title={h.name} meta={`${fmt(h.members)} ${t('prMembers').toLowerCase()} · ${fmt(h.online)} ${t('prOnline').toLowerCase()}`}>{h.gated}</ItemCard>} />;
  }

  if (tab === 'Credits') {
    if (!credits) return <Spinner />;
    const rows = credits.map(([sid, character, part]) => ({ sid, character, part, x: seriesOf(sid) })).filter((r) => r.x);
    return <ListView rows={rows} keyOf={(r) => r.sid + r.character} text={(r) => r.character + ' ' + r.x!.title} empty={t('prNoCredits')} onRow={(r) => s.openSeries(r.sid)}
      facets={[{ id: 'kind', label: t('prKind'), get: (r) => r.x!.kind }, { id: 'part', label: t('prPart'), get: (r) => r.part }, { id: 'genre', label: t('seGenre'), get: (r) => r.x!.genre }]}
      sorts={[{ id: 'views', label: t('seSortViews'), by: (a, b) => b.x!.views - a.x!.views }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.x!.title.localeCompare(b.x!.title) }]}
      table={[{ id: 't', header: t('prTitle'), cell: (r) => r.x!.title, sortValue: (r) => r.x!.title }, { id: 'c', header: t('prCharacter'), cell: (r) => r.character, sortValue: (r) => r.character },
        { id: 'p', header: t('prPart'), cell: (r) => r.part, sortValue: (r) => r.part }, { id: 'k', header: t('prKind'), cell: (r) => r.x!.kind, sortValue: (r) => r.x!.kind }]}
      render={(r) => <ItemCard depth={2} deckDirection="right" tint={clubOf(r.x!.clubId)?.colors?.[0]} tintStrength={22} onClick={() => s.openSeries(r.sid)} media={<EntityAvatar id={r.x!.clubId} name={r.x!.title} size="lg" />} title={r.x!.title} meta={`${r.character} · ${r.part}`}>{r.x!.genre} · {r.x!.kind}{r.x!.seasonCount && r.x!.seasonCount > 1 ? ` · ${r.x!.seasonCount} seasons` : ''}</ItemCard>} />;
  }

  // Items: the profile PFT they wear, looks they hold (yours, or bought in the ledger), EGG items of their hosts.
  const pft = profileItemOfHolder(id);
  const lookIds = isMe ? Object.keys(owned) : allLooks().filter((l) => salesOfItem(l.id).some((x) => x.toId === id && x.event === 'sale')).map((l) => l.id);
  const hostIds = D.hosts.hosts.filter((h) => h.ownerId === id || (p.user?.hostIds ?? []).includes(h.id)).map((h) => h.id);
  type Row = { id: string; type: ItemType; name: string; usd: number; sub: string; media: React.ReactNode; open: () => void; hex?: string };
  const rows: Row[] = [
    ...(pft ? [{ id: pft.id, hex: pft.bg, type: 'pft' as const, name: pft.name, usd: pft.priceUsd, sub: t('prProfilePft'), media: <SpriteImage sprite={spriteOfCell(pft.sheet, pft.index)} alt={pft.name} />, open: () => s.openAsset(pft.id) }] : []),
    ...lookIds.map(lookOf).filter((l): l is ShopLook => !!l).map((l) => ({ id: l.id, type: 'pft' as const, name: l.name, usd: l.usd, sub: `${l.colour} · ${l.rarity}`, media: <LookImage look={l} cascade={0} />, open: () => s.openLook(l.id), hex: l.hex })),
    // Rides and Maison Once pieces this person holds (their owner on every item).
    ...D.ride.list.filter((r) => r.holderId === id && r.mode === 'sale').map((r) => ({ id: r.id, hex: r.hex, type: 'pft' as const, name: r.name, usd: r.priceUsd, sub: rideKind(r.kind) + ' · ' + r.make, media: <SpriteImage sprite={rideSprite(r)} alt={r.name} ratio="16 / 10" />, open: () => s.openAsset(r.id) })),
    ...D.jewel.list.filter((j) => j.holderId === id).map((j) => ({ id: j.id, hex: j.hex, type: 'pft' as const, name: j.name, usd: j.priceUsd, sub: j.piece + ' · ' + j.metal, media: <SpriteImage sprite={jewelSprite(j)} alt={j.name} />, open: () => s.openAsset(j.id) })),
    ...hostIds.flatMap(eggsOfHost).map((e) => ({ id: e.id, type: 'egg' as const, name: e.name, usd: e.priceUsd, sub: hostOf(e.hostId)?.name ?? '', media: <EntityAvatar id={e.hostId} name={e.name} size="md" />, open: () => s.openAsset(e.id) })),
  ];
  return <ListView<Row> rows={rows} keyOf={(r) => r.id} text={(r) => r.name} empty={t('prNoItems')} onRow={(r) => r.open()} minItemWidth="13rem"
    facets={[{ id: 'type', label: t('asType'), get: (r) => r.type.toUpperCase() }]} sorts={[{ id: 'p', label: t('lsSortPrice'), by: (a, b) => b.usd - a.usd }]}
    table={[{ id: 'n', header: t('lsColName'), cell: (r) => r.name, sortValue: (r) => r.name }, { id: 't', header: t('asType'), cell: (r) => r.type.toUpperCase(), sortValue: (r) => r.type }, { id: 'u', header: t('asPrice'), cell: (r) => usd(r.usd), sortValue: (r) => r.usd, align: 'right' }]}
    render={(r) => <ItemCard depth={1} deckDirection="both" tint={r.hex} tintStrength={22} layout="vertical" onClick={r.open} media={r.media} title={r.name} meta={r.type.toUpperCase()} aside={<Text size="xs" weight="bold" numeric>{usd(r.usd)}</Text>}>{r.sub}</ItemCard>} />;
};
