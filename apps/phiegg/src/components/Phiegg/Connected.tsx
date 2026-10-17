import React from 'react';
import { Box, Image, RelationList, SpriteImage } from '@pui/components';
import type { RelationGroup, RelationItem } from '@pui/components';
import { useStore } from '@pui/store';
import { castOf, pieceOf, roleCategoryOf, roleOf, D, STORES, cityOf, clubOf, eventOf, fmt, hostOf, itemImage, lookOf, person, postById, seriesOf, showOf, t, worldImage, worldOf, jewelOf, jewelSprite, rideKind, rideOf, rideSprite } from '../../lib/data';
import { lookFor, sceneFor } from '../../lib/depth';
import { relationsOf, type Kind, type Ref } from '../../lib/relations';
import { phieggStore } from '../../state/phieggStore';
import { PersonAvatar } from './PersonAvatar';
import { EntityAvatar } from './EntityAvatar';

type S = ReturnType<typeof phieggStore.getState>;
const KIND_LABEL: Record<Kind, string> = { person: 'People', club: 'Clubs', world: 'Worlds', city: 'Cities', host: 'Hosts', nest: 'Nests', post: 'Shots', show: 'Shows', event: 'Events', series: 'Series', quest: 'Quests', coin: 'Coins', store: 'Stores', look: 'Looks', room: 'Voice rooms', role: 'Roles', cast: 'Casts', piece: 'Pieces', ride: 'Rides', jewel: 'Jewellery' };
const img = (src?: string) => (src ? <Image src={src} alt="" loading="lazy" /> : undefined);
const glyph = (id: string, name: string) => <EntityAvatar id={id} name={name} size="sm" />;

/** Label, thumbnail and where it opens, for any related record. */
function describe(r: Ref, s: S): RelationItem | null {
  const it = describeBase(r, s);
  return it;
}
function describeBase(r: Ref, s: S): RelationItem | null {
  const k = r.kind + ':' + r.id;
  switch (r.kind) {
    case 'person': { const p = person(r.id); return { id: k, label: p.name, sub: '@' + p.handle, media: <PersonAvatar id={p.id} size="sm" />, onClick: () => s.openPerson(p.id) }; }
    case 'club': { const c = clubOf(r.id); return c ? { id: k, label: c.name, sub: c.ticker + ' · ' + fmt(c.holders) + ' ' + t('holders'), media: glyph(c.id, c.name), onClick: () => s.go('club', { clubId: c.id }) } : null; }
    case 'world': { const w = worldOf(r.id); return w ? { id: k, label: w.name, sub: fmt(w.visitorsNow) + ' inside', media: img(worldImage(w)), onClick: () => s.go('world', { worldId: w.id }) } : null; }
    case 'city': { const c = cityOf(r.id); return c ? { id: k, label: c.city.name, sub: c.world.name, media: img(worldImage(c.world)), onClick: () => s.go('city', { cityId: r.id }) } : null; }
    case 'host': { const h = hostOf(r.id); return h ? { id: k, label: h.name, sub: (h as unknown as { members?: number }).members ? fmt((h as unknown as { members: number }).members) + ' members' : undefined, media: glyph(h.id, h.name), onClick: () => s.openDetails(r) } : null; }
    case 'nest': { const n = D.hosts.nests.find((x) => x.id === r.id); return n ? { id: k, label: '#' + n.name, sub: n.kind, media: glyph(n.id, n.name), onClick: () => (n.kind === 'collection' ? s.go('collection', { nestId: n.id }) : s.go('hosts')) } : null; }
    case 'post': { const p = postById(r.id); return p ? { id: k, label: p.slides[0]?.title ?? p.caption, sub: person(p.authorId).name, media: img(sceneFor(p.id, p.worldId, p.clubId)), onClick: () => s.openPost(p.id) } : null; }
    case 'show': { const x = showOf(r.id); return x ? { id: k, label: x.title, sub: x.season, media: img(worldImage(worldOf(x.worldId))), onClick: () => s.go('show', { showId: x.id }) } : null; }
    case 'event': { const e = eventOf(r.id); return e ? { id: k, label: e.title, sub: new Date(e.startsAt).toLocaleDateString(), media: glyph(e.id, e.title), onClick: () => s.go('events') } : null; }
    case 'series': { const x = seriesOf(r.id); return x ? { id: k, label: x.title, sub: x.kind + ' · ' + x.era, media: img(worldImage(worldOf(x.worldId))), onClick: () => s.openSeries(x.id) } : null; }
    case 'quest': { const q = D.economy.quests.find((x) => x.id === r.id); return q ? { id: k, label: q.title, sub: fmt(q.reward) + ' ' + q.rewardCoin, media: glyph(q.id, q.title), onClick: () => s.go('quests') } : null; }
    case 'coin': { const c = D.economy.coins.find((x) => x.id === r.id); return c ? { id: k, label: c.name, sub: '$' + c.price, media: glyph(c.id, c.name), onClick: () => s.go('coins') } : null; }
    case 'store': { const st = STORES.find((x) => x.id === r.id); return st ? { id: k, label: st.name, sub: st.looks.length + ' looks', media: img(lookFor(st.id, st.clubId)), onClick: () => s.go('shop', { storeId: st.id }) } : null; }
    case 'look': { const l = lookOf(r.id); const v = l && (l.views.FRONT ?? Object.values(l.views)[0]); return l ? { id: k, label: l.name, sub: '$' + fmt(l.usd), media: v ? img(itemImage(v)) : glyph(l.id, l.name), onClick: () => s.openLook(l.id) } : null; }
    case 'role': { const x = roleOf(r.id); return x ? { id: k, label: x.name, sub: roleCategoryOf(x.categoryId)?.name, media: glyph(x.id, x.name), onClick: () => s.openDetails(r) } : null; }
    case 'cast': { const c = castOf(r.id); return c ? { id: k, label: c.title, sub: c.kind + (c.live ? ' · live' : '') + ' · ' + c.hostIds.length + ' hosts', media: glyph(c.id, c.title), onClick: () => s.openDetails(r) } : null; }
    case 'ride': { const x = rideOf(r.id); return x ? { id: k, label: x.name, sub: rideKind(x.kind) + ' · ' + x.make, media: <SpriteImage sprite={rideSprite(x)} alt="" ratio="16 / 10" radius="sm" />, onClick: () => s.openAsset(x.id) } : null; }
    case 'jewel': { const x = jewelOf(r.id); return x ? { id: k, label: x.name, sub: x.piece + ' · ' + x.metal, media: <SpriteImage sprite={jewelSprite(x)} alt="" radius="sm" />, onClick: () => s.openAsset(x.id) } : null; }
    case 'piece': { const p = pieceOf(r.id); return p ? { id: k, label: p.name, sub: p.tokenId, media: glyph(p.id, p.name), onClick: () => s.openDetails(r) } : null; }
    case 'room': { const v = D.messages.voiceRooms.find((x) => x.id === r.id); return v ? { id: k, label: v.title, sub: fmt(v.listeners) + ' listening', media: glyph(v.id, v.title), onClick: () => s.go('messages') } : null; }
  }
}

/** Everything a record links to and everything that links to it, each one a step away. */
/** `inPanel`: inside the chat sheet's details column every item pushes onto that column instead of navigating. */
export const Connected: React.FC<{ kind: Kind; id: string; max?: number; inPanel?: boolean; bare?: boolean }> = ({ kind, id, max = 6, inPanel, bare }) => {
  const s = useStore(phieggStore);
  const groups: RelationGroup[] = relationsOf({ kind, id }).map((g) => ({
    id: g.rel, label: g.rel, kind: KIND_LABEL[g.refs[0].kind],
    items: g.refs.map((r) => { const x = describe(r, s); return x && inPanel ? { ...x, onClick: () => s.openDetails(r) } : x; }).filter((x): x is RelationItem => !!x),
  }));
  if (!groups.some((g) => g.items.length)) return null;
  return (
    <Box>
      <RelationList title={bare ? undefined : t('connected')} groups={groups} max={max} showAllLabel={(n) => t('showAllN', { n })} showLessLabel={t('showLess')} />
    </Box>
  );
};
