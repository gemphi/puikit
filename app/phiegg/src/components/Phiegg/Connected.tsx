import React, { useEffect, useState } from 'react';
import { Box, Icon, RelationList, SpriteImage, Stack, TabList } from '@pui/components';
import type { RelationGroup, RelationItem } from '@pui/components';
import { useStore } from '@pui/store';
import * as L from 'lucide-react';
import { D, STORES, cityOf, fmt, itemImage, person, postById, profileItemOfHolder, site, t, jewelSprite, rideKind, rideSprite, itemOf } from '../../lib/data';
import { mediaUrl } from '../../lib/media';
import { lookFor } from '../../lib/depth';
import { spriteOfCell } from '../../lib/portraits';
import { relationsOf, type Kind, type Ref } from '../../lib/relations';
import { phieggStore } from '../../state/phieggStore';
import type { World } from '../../types/phiegg';
import { PersonAvatar } from './PersonAvatar';
import { EntityAvatar } from './EntityAvatar';

type S = ReturnType<typeof phieggStore.getState>;
const SITE = site as unknown as { kindLabels: Record<string, string>; kindIcons: Record<string, string>; kindCards: Record<string, { ratio?: string; layout?: 'grid' | 'slider' }>; relationNames: Record<string, string> };
/** A kind's card: its picture's shape and whether its row slides (site.json kindCards). */
export const cardOf = (kind: string) => SITE.kindCards[kind] ?? {};
/** A kind's glyph (site.json kindIcons). */
export const kindIcon = (kind: string, size: 'xs' | 'sm' = 'sm') => {
  const G = (L as unknown as Record<string, L.LucideIcon>)[SITE.kindIcons[kind] ?? ''];
  return G ? <Icon icon={G} size={size} /> : undefined;
};
/** What a set of records of a kind is called (site.json kindLabels). */
export const kindLabel = (kind: string) => SITE.kindLabels[kind] ?? kind;
const glyph = (id: string, name: string) => <EntityAvatar id={id} name={name} size="lg" />;
/** A world's own finished view (never a drawn stand-in scene). */
const worldPicture = (w?: World) => (w?.gallery?.length ? mediaUrl(w.gallery[0].sm) : undefined);
const look = (seed: string, clubId?: string | null) => { const src = lookFor(seed, clubId); return src ? itemImage(src) : undefined; };

/** Label, picture and where it opens, for any related record. */
function describe(r: Ref, s: S): RelationItem | null {
  const it = describeBase(r);
  // Every related record opens its own page (state openRef); only people open on the right.
  return it && { ...it, onClick: r.kind === 'person' ? () => s.openDetails(r) : r.kind === 'nest' ? it.onClick : () => s.openRef(r) };
}
function describeBase(r: Ref): RelationItem | null {
  const k = r.kind + ':' + r.id; const s = phieggStore.getState();
  switch (r.kind) {
    case 'person': { const p = person(r.id); const pft = profileItemOfHolder(p.id);
      return { id: k, label: p.name, sub: '@' + p.handle, image: pft ? <SpriteImage sprite={spriteOfCell(pft.sheet, pft.index)} alt="" /> : undefined, media: <PersonAvatar id={p.id} size="lg" /> }; }
    case 'club': { const c = itemOf('club', r.id); return c ? { id: k, label: c.name, sub: c.ticker + ' · ' + fmt(c.holders) + ' ' + t('holders'), image: worldPicture(itemOf('world', c.worldIds.find((w) => itemOf('world', w)?.gallery?.length))) ?? look(c.id, c.id), media: glyph(c.id, c.name) } : null; }
    case 'world': { const w = itemOf('world', r.id); return w ? { id: k, label: w.name, sub: fmt(w.visitorsNow) + ' inside', image: worldPicture(w), media: glyph(w.id, w.name) } : null; }
    case 'city': { const c = cityOf(r.id); return c ? { id: k, label: c.city.name, sub: c.world.name, image: worldPicture(c.world), media: glyph(r.id, c.city.name) } : null; }
    case 'host': { const h = itemOf('host', r.id); return h ? { id: k, label: h.name, sub: fmt(h.members) + ' members', image: worldPicture(itemOf('world', (h as { worldId?: string }).worldId)), media: glyph(h.id, h.name) } : null; }
    case 'nest': { const n = D.hosts.nests.find((x) => x.id === r.id); return n ? { id: k, label: '#' + n.name, sub: n.kind, media: glyph(n.id, n.name), onClick: () => (n.kind === 'collection' ? s.go('collection', { nestId: n.id }) : s.go('hosts')) } : null; }
    case 'post': { const p = postById(r.id); return p ? { id: k, label: p.slides[0]?.title ?? p.caption, sub: person(p.authorId).name, image: p.slides[0]?.src ? itemImage(p.slides[0].src) : look(p.id, p.clubId) } : null; }
    case 'show': { const x = itemOf('show', r.id); const l = itemOf('look', x?.looks?.[0]?.lookId ?? ''); return x ? { id: k, label: x.title, sub: x.season, image: l?.views.FRONT ? itemImage(l.views.FRONT) : worldPicture(itemOf('world', x.worldId)) ?? look(x.id, x.clubId), media: glyph(x.id, x.title) } : null; }
    case 'event': { const e = itemOf('event', r.id); return e ? { id: k, label: e.title, sub: new Date(e.startsAt).toLocaleDateString(), image: worldPicture(itemOf('world', e.worldId)), media: glyph(e.id, e.title) } : null; }
    case 'series': { const x = itemOf('series', r.id); return x ? { id: k, label: x.title, sub: x.kind + ' · ' + x.era, image: worldPicture(itemOf('world', x.worldId)), media: glyph(x.id, x.title) } : null; }
    case 'quest': { const q = D.economy.quests.find((x) => x.id === r.id); return q ? { id: k, label: q.title, sub: fmt(q.reward) + ' ' + q.rewardCoin, media: glyph(q.id, q.title) } : null; }
    case 'coin': { const c = D.economy.coins.find((x) => x.id === r.id); return c ? { id: k, label: c.name, sub: '$' + c.price, media: glyph(c.id, c.name) } : null; }
    case 'store': { const st = STORES.find((x) => x.id === r.id); const v = st?.looks[0]?.views.FRONT; return st ? { id: k, label: st.name, sub: st.looks.length + ' looks', image: v ? itemImage(v) : look(st.id, st.clubId), media: glyph(st.id, st.name) } : null; }
    case 'look': { const l = itemOf('look', r.id); const v = l && (l.views.FRONT ?? Object.values(l.views)[0]); return l ? { id: k, label: l.name, sub: '$' + fmt(l.usd), image: v ? itemImage(v) : undefined, media: glyph(l.id, l.name) } : null; }
    case 'role': { const x = itemOf('role', r.id); return x ? { id: k, label: x.name, sub: itemOf('roleCategory', x.categoryId)?.name, media: glyph(x.id, x.name) } : null; }
    case 'cast': { const c = itemOf('cast', r.id); return c ? { id: k, label: c.title, sub: c.kind + (c.live ? ' · live' : '') + ' · ' + c.hostIds.length + ' hosts', image: worldPicture(itemOf('world', c.worldId)), media: glyph(c.id, c.title) } : null; }
    case 'ride': { const x = itemOf('ride', r.id); return x ? { id: k, label: x.name, sub: rideKind(x.kind) + ' · ' + x.make, image: <SpriteImage sprite={rideSprite(x)} alt="" ratio={cardOf('ride').ratio} /> } : null; }
    case 'jewel': { const x = itemOf('jewel', r.id); return x ? { id: k, label: x.name, sub: x.piece + ' · ' + x.metal, image: <SpriteImage sprite={jewelSprite(x)} alt="" ratio={cardOf('jewel').ratio} /> } : null; }
    case 'piece': { const p = itemOf('piece', r.id); return p ? { id: k, label: p.name, sub: p.tokenId + ' · ' + p.trait, image: look(p.id, (p as { clubId?: string }).clubId), media: glyph(p.id, p.name) } : null; }
    case 'profilePft': { const x = itemOf('profilePft', r.id); return x ? { id: k, label: x.name, sub: '$' + fmt(x.priceUsd), image: <SpriteImage sprite={spriteOfCell(x.sheet, x.index)} alt="" ratio={cardOf('profilePft').ratio} /> } : null; }
    case 'egg': { const x = itemOf('egg', r.id); return x ? { id: k, label: x.name, sub: fmt(x.priceEgg) + ' EGG · ' + x.sold + '/' + x.supply, image: worldPicture(itemOf('world', x.worldId)), media: glyph(x.id, x.name) } : null; }
    case 'sum': { const x = itemOf('sum', r.id); return x ? { id: k, label: x.name, sub: x.apy + '% APY · ' + fmt(x.holders) + ' ' + t('holders'), media: glyph(x.id, x.name) } : null; }
    case 'room': { const v = D.messages.voiceRooms.find((x) => x.id === r.id); return v ? { id: k, label: v.title, sub: fmt(v.listeners) + ' listening', media: glyph(v.id, v.title) } : null; }
  }
}

/** A record's relations as groups: each its name, the kind it holds, its glyph and its records. */
export function relationGroups(kind: Kind, id: string, s: S): RelationGroup[] {
  return relationsOf({ kind, id }).map((g) => ({
    // One word for a heading (site.json relationNames); the kind is its glyph, not a second phrase.
    id: g.rel, label: SITE.relationNames[g.rel] ?? g.rel, icon: kindIcon(g.refs[0].kind), ...SITE.kindCards[g.refs[0].kind],
    items: g.refs.map((r) => describe(r, s)).filter((x): x is RelationItem => !!x),
  })).filter((g) => g.items.length > 0);
}

export const listLabels = () => ({ showAllLabel: (n: number) => t('showAllN', { n }), showLessLabel: t('showLess'), labels: { grid: t('lyGrid'), slider: t('lySlider') } });

/** Everything a record links to and everything that links to it, each one a step away, one row per relation. */
export const Connected: React.FC<{ kind: Kind; id: string; max?: number; inPanel?: boolean; bare?: boolean }> = ({ kind, id, max = 3, bare }) => {
  const s = useStore(phieggStore);
  const groups = relationGroups(kind, id, s);
  if (!groups.length) return null;
  return <Box><RelationList title={bare ? undefined : t('connected')} groups={groups} max={max} {...listLabels()} /></Box>;
};

/**
 * A record's tabs are its relations (a club's PFTs, worlds, hosts, shots, members…), every one the data has: a centred
 * row that scrolls sideways and stays under the header, each tab with its record's picture when it is one record
 * (a founder, a host) and its kind's glyph otherwise, and its count. The chosen relation's records are picture cards
 * three across, grid or slider.
 */
export const RelationTabs: React.FC<{ kind: Kind; id: string; first?: string[] }> = ({ kind, id, first = [] }) => {
  const s = useStore(phieggStore);
  const groups = relationGroups(kind, id, s);
  // The record's own items lead (its PFTs, pieces, looks), then the rest biggest first; single links last.
  const rank = (g: RelationGroup) => { const i = first.indexOf(g.id); return i >= 0 ? -1e6 + i : -g.items.length; };
  const order = [...groups].sort((a, b) => rank(a) - rank(b));
  const [tab, setTab] = useState(order[0]?.id);
  useEffect(() => setTab(order[0]?.id), [kind, id]);
  const on = order.find((g) => g.id === tab) ?? order[0];
  if (!on) return null;
  const thumb = (g: RelationGroup) => {
    const one = g.items.length === 1 ? g.items[0] : undefined;
    return typeof one?.image === 'string' ? <Box as="span" className="ph-tab-thumb"><img src={one.image} alt="" /></Box> : one?.media && g.items.length === 1 ? <Box as="span" className="ph-tab-thumb">{one.media}</Box> : g.icon;
  };
  return (
    <Stack direction="column" gap={3}>
      <TabList size="sm" variant="pills" place="center" aria-label={t('connected')} activeId={on.id} onChange={setTab}
        items={order.map((g) => ({ id: g.id, label: g.label, icon: thumb(g), count: g.items.length > 1 ? fmt(g.items.length) : undefined }))} />
      <RelationList key={on.id} groups={[on]} max={12} {...listLabels()} />
    </Stack>
  );
};
