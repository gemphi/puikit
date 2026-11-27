import React from 'react';
import { Button, Icon, Image, RelationList, Stack, Tag, Text, WorldScene } from '@pui/components';
import { useStore } from '@pui/store';
import * as L from 'lucide-react';
import { BadgeCheck, ExternalLink, Layers, Pencil, Receipt, Share2, Sparkles, UserCheck, UserPlus, Wand2 } from 'lucide-react';
import { ProfileView, type ProfilePane, type ProfileRecord } from '@phi-kit/ProfileView';
import { D, commentCount, firstName, fmt, itemImage, itemOf, person, postsBy, salesOfPerson, site, statsOfPerson, storySets, t, usd } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import type { Post } from '../../types/phiegg';
import { listLabels, relationGroups } from './Connected';
import { Activity } from './Details';
import { EntityAvatar } from './EntityAvatar';
import { PersonAvatar } from './PersonAvatar';
import { ProfileTab } from './ProfileTabs';
import { postTile } from './ShotCard';
import { Tile } from './Tile';
import { ListView } from './Views';

type S = ReturnType<typeof phieggStore.getState>;
const SITE = site as unknown as { profileTabs: string[]; profileTabsMore: string[]; profileTabIcons: Record<string, string>; profileRail: { min: number } };
const glyph = (name: string) => { const G = (L as unknown as Record<string, L.LucideIcon>)[SITE.profileTabIcons[name] ?? '']; return G ? <Icon icon={G} size="xs" /> : undefined; };

/** A person's shots as the app's list: tile, grid or table, with its filters and sorts. */
const Shots: React.FC<{ posts: Post[]; s: S; cols: number }> = ({ posts, s, cols }) => (
  <ListView<Post> rows={posts} keyOf={(x) => x.id} text={(x) => x.caption + ' ' + x.slides.map((y) => y.title).join(' ')} cols={cols} onRow={(x) => s.openPost(x.id)}
    facets={[{ id: 'kind', label: t('lsColKind'), get: (x) => x.kind }, { id: 'club', label: t('lsColClub'), get: (x) => itemOf('club', x.clubId)?.name }, { id: 'world', label: t('lsWorld'), get: (x) => itemOf('world', x.worldId)?.name }]}
    sorts={[{ id: 'new', label: t('lsSortRecent'), by: (a, b) => b.createdAt.localeCompare(a.createdAt) }, { id: 'likes', label: t('lsSortLikes'), by: (a, b) => b.likes - a.likes }]}
    table={[{ id: 'title', header: t('lsColName'), cell: (x) => x.slides[0].title, sortValue: (x) => x.slides[0].title }, { id: 'date', header: t('lsColDate'), cell: (x) => x.createdAt.slice(0, 10), sortValue: (x) => x.createdAt },
      { id: 'likes', header: t('lsColLikes'), cell: (x) => fmt(x.likes), sortValue: (x) => x.likes, align: 'right' }, { id: 'comments', header: t('lsColComments'), cell: (x) => commentCount(x), sortValue: (x) => commentCount(x), align: 'right' }]}
    render={(x) => <Tile {...postTile(x)} title={x.slides[0].title} onClick={() => s.openPost(x.id)}
      sub={t('likes', { n: fmt(x.likes) }) + ' · ' + t('comments', { n: commentCount(x, s.comments[x.id]?.length ?? 0) })} badges={x.slides.length > 1 && <Tag round size="sm" icon={<Icon icon={Layers} size="xs" />}>{x.slides.length}</Tag>} />} />
);

/** A person as the kit's profile record: who they are, and a tab per relation the data holds for them. */
function recordOf(id: string, s: S, page: boolean, own: boolean): ProfileRecord {
  const p = person(id); const ag = itemOf('agent', p.id); const isMe = p.id === D.core.currentUserId;
  const posts = postsBy(p.id); const sets = storySets(p.id); const st = statsOfPerson(p.id); const sales = salesOfPerson(p.id);
  const clubs = p.clubIds.map((c) => itemOf('club', c)).filter((c): c is NonNullable<typeof c> => !!c);

  // The tabs are the person's relations, an icon each and no totals (the user's ask, 2026-11-27); (lib/relations.ts), the ones the profile leads with first, then the fullest.
  // Their shots are every post they wrote (postsBy), shown as the app's list; the other relations as picture cards.
  const SHOTS = SITE.profileTabs[0];
  const groups = relationGroups('person', p.id, s).filter((g) => g.id !== SHOTS);
  const rank = (g: { id: string; items: unknown[] }) => { const i = SITE.profileTabs.indexOf(g.id); return i >= 0 ? -1e6 + i : -g.items.length; };
  const panes: ProfilePane[] = [
    ...(posts.length ? [{ id: SHOTS, label: SHOTS, icon: glyph(SHOTS), body: () => <Shots posts={posts} s={s} cols={page ? 3 : 2} /> }] : []),
    ...[...groups].sort((a, b) => rank(a) - rank(b)).map((g) => ({ id: g.id, label: String(g.label), icon: g.icon, body: () => <RelationList groups={[g]} max={page ? 12 : 6} {...listLabels()} /> })),
  ];
  // What a person holds, likes and is credited in: relations kept outside the record's own fields.
  for (const x of SITE.profileTabsMore) panes.push({ id: x, label: x, icon: glyph(x), body: () => <ProfileTab id={p.id} tab={x as 'Likes'} /> });
  if (sales.length) panes.push({ id: 'sales', label: t('colSales'), icon: <Icon icon={Receipt} size="xs" />, body: () => <Activity rows={sales} s={s} /> });
  if (ag) panes.push({ id: 'ask', label: t('prAsk'), icon: <Icon icon={Sparkles} size="xs" />, body: () => (
    <Stack direction="column" gap={2} align="start"><Text size="sm">{ag.askHint}</Text>
      {ag.prompts.map((q) => <Button key={q} variant="glass" onClick={() => s.openChat(ag.id, q)}>{q}</Button>)}
      <Stack direction="row" gap={1} wrap>{ag.abilities.map((x) => <Tag key={x} minimal round size="sm">{x}</Tag>)}</Stack></Stack>) });

  const about: [string, React.ReactNode][] = ag ? [[t('house'), ag.house], [t('home'), ag.home], [t('chats'), ag.stats.conversations], [t('looks'), ag.stats.looks], [t('rating'), ag.stats.rating], [t('since'), ag.since]] : p.user?.wallet ? [[t('wallet'), p.user.wallet]] : [];
  const celeb: [string, React.ReactNode][] = p.user?.celebStats ? Object.entries(p.user.celebStats).filter(([k]) => k !== 'kind').map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()), typeof v === 'number' ? fmt(v) : String(v)]) : [];
  const ledger: [string, React.ReactNode][] = ([[t('lsColItems'), st.items && fmt(st.items)], [t('colVolume'), st.volumeUsd && usd(st.volumeUsd)], [t('prBought'), st.boughtUsd && usd(st.boughtUsd)], [t('lsColSold'), st.soldUsd && usd(st.soldUsd)]] as [string, React.ReactNode][]).filter(([, v]) => !!v);
  const link = location.origin + import.meta.env.BASE_URL + 'profile/' + p.id;

  return {
    id: p.id, name: p.name, handle: p.handle, role: ag?.role,
    avatar: <PersonAvatar id={p.id} size="xl" />,
    banner: <Tile tone={p.tone} ratio="3/1" grid solo depth={{ clubId: p.clubIds[0] }} />,
    status: ag ? { icon: <Icon icon={Sparkles} size="xs" />, label: t('aiAgent') + ' · ' + ag.house } : p.verified ? { icon: <Icon icon={BadgeCheck} size="xs" />, label: t('verified') } : undefined,
    bio: p.bio, more: ag?.style,
    counts: [[t('shots'), fmt(posts.length)], [t('followers'), fmt(p.followers)], [t('following').toLowerCase(), fmt(p.following)]],
    actions: [
      ...(ag ? [{ id: 'chat', label: t('chatWith', { name: firstName(p.name) }), icon: Sparkles, primary: true, onClick: () => s.openChat(p.id) }] : []),
      ...(!isMe ? [{ id: 'follow', label: s.follow[p.id] ? t('following') : t('follow'), icon: s.follow[p.id] ? UserCheck : UserPlus, primary: true, on: !!s.follow[p.id], onClick: () => s.toggle('follow', p.id) }] : []),
      ...(isMe && !ag ? [{ id: 'edit', label: t('editProfile'), icon: Pencil, primary: true, onClick: s.openEditProfile }] : []),
      ...(!own ? [{ id: 'open', label: t('viewProfile'), icon: ExternalLink, onClick: () => s.go('profile', { profileId: p.id }) }] : []),
      ...(ag ? [{ id: 'summon', label: t('summon'), icon: Wand2, onClick: () => s.summon(p.id) }] : []),
      { id: 'share', label: t('isShare'), icon: Share2, onClick: () => { void navigator.clipboard?.writeText(link); s.flash(t('isCopied')); } },
    ],
    marks: clubs.map((c) => ({ id: c.id, label: c.name, media: <EntityAvatar id={c.id} name={c.name} size="sm" />, onClick: () => s.go('club', { clubId: c.id }) })),
    tags: p.badges,
    facts: [...about, ...celeb, ...ledger],
    note: !isMe,
    rail: [
      ...sets.map((h, i) => ({ id: h.id, label: h.label, sub: h.frames.length + ' moments', thumb: <WorldScene seed={h.id} />, onClick: () => s.openStory(p.id, i) })),
      ...(page ? posts.filter((x) => x.slides[0]?.src).slice(0, Math.max(SITE.profileRail.min - sets.length, 0)).map((x) => ({ id: x.id, label: itemOf('world', x.worldId)?.name ?? x.slides[0].title, sub: fmt(x.likes),
        thumb: <Image src={itemImage(x.slides[0].src!)} alt="" fit="cover" fill />, onClick: () => s.openPost(x.id) })) : []),
    ],
    panes,
  };
}

/** A person, wherever they show: their page, the drawer at the right, the chat's details column. One profile (kit). */
export const PersonProfile: React.FC<{ id: string; variant: 'page' | 'popup'; wide?: boolean }> = ({ id, variant, wide }) => {
  const s = useStore(phieggStore);
  return <ProfileView key={id} variant={variant} wide={wide} record={recordOf(id, s, variant === 'page' || !!wide, variant === 'page')} />;
};
