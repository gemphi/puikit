import React, { useEffect, useState } from 'react';
import { Box, Button, FullScreen, Icon, Image, Stack, TabList, Text, type FullScreenAction, type FullScreenMenuItem, type SectionDef } from '@pui/components';
import * as L from 'lucide-react';
import { PageSections } from '../../components/Phiegg/PageSections';
import { ViewGrid } from '../../components/Phiegg/Views';
import styles from './PostPage.module.scss';
import { useStore } from '@pui/store';
import { Bookmark, Heart, MessageCircle, Share2, ShoppingBag, User } from 'lucide-react';
import { D, ago, commentCount, fmt, itemImage, itemImageLarge, person, postById, shotPost, site, t, itemOf } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { Connected } from '../../components/Phiegg/Connected';
import { PersonLine } from '../../components/Phiegg/PersonLine';
import { Pinned } from '../../components/Phiegg/Pinned';
import { postTile } from '../../components/Phiegg/ShotCard';
import { Tile } from '../../components/Phiegg/Tile';
import { useCityParts } from '../../components/Phiegg/CityParts';
import { PostComments } from '../../components/Phiegg/Overlays';


type MenuItem = { id: string; label: string; icon: string; section?: string; action?: string };
const MENU = (site as unknown as { postMenu: { items: MenuItem[] } }).postMenu.items;
const glyph = (name: string) => { const G = (L as unknown as Record<string, L.LucideIcon>)[name]; return G ? <Icon icon={G} size="sm" /> : null; };

/** A post's menu (site.json postMenu), the sheet's first column: an entry with a section shows when that section is on
 *  the sheet, one with an action when it can act here; nothing that could do nothing is given. */
const postMenu = (s: ReturnType<typeof phieggStore.getState>, on: Set<string>, o: { worldId: string | null; lookId?: string }): FullScreenMenuItem[] => {
  const can: Record<string, boolean> = { join: !!o.worldId, shop: !!o.lookId };
  const go = (m: MenuItem) => {
    switch (m.action) {
      case 'join': if (o.worldId) s.go('world', { worldId: o.worldId }); break;
      case 'shop': if (o.lookId) s.openLook(o.lookId); break;
    }
  };
  return MENU.filter((m) => (m.section ? on.has(m.section) : !!m.action && can[m.action]))
    .map((m) => ({ id: m.id, label: m.label, icon: glyph(m.icon), section: m.section, onClick: () => go(m) }));
};

/**
 * A post full screen (#/post/<id>), the way a short-video app opens one: over the whole app, its picture a big square
 * in the middle, closed from the top left, the next slide or post on the right (and with the keys), its buttons along
 * the foot (comments and the author open in their drawers), and a sheet that peeks in under the square with the next
 * posts of its world and scrolls up over it with everything the post links to.
 */
export const PostPage: React.FC = () => {
  const s = useStore(phieggStore);
  const post = postById(s.postId); const n = post?.slides.length ?? 1;
  const [slide, setSlide] = useState(0);
  // Hooks before any early return: the city's sections (its own page's), for the bottom of the sheet.
  const cityParts = useCityParts(itemOf('world', post?.worldId) ?? D.core.worlds[0]);
  useEffect(() => { setSlide(0); }, [s.postId]);
  if (!post) return <Text intent="muted">{t('prNoLikes')}</Text>;
  const sl = post.slides[slide] ?? post.slides[0];
  const liked = !!s.liked[post.id]; const saved = !!s.saved[post.id];
  const count = commentCount(post, s.comments[post.id]?.length ?? 0);
  const club = itemOf('club', post.clubId); const world = itemOf('world', post.worldId);
  // The next posts: the same world's, else the same author's, else the newest.
  const others = D.feed.shots.filter((x) => x.id !== post.id && (post.worldId ? x.worldId === post.worldId : x.authorId === post.authorId));
  const more = (others.length ? others : D.feed.shots.filter((x) => x.id !== post.id)).slice(0, 24).map(shotPost);
  const step = (d: number) => {
    const to = slide + d;
    if (to >= 0 && to < n) { setSlide(to); return; }
    const next = d > 0 ? more[0] : undefined;
    if (next) s.openPost(next.id); else if (d < 0 && s.hist.length) s.back();
  };
  const close = () => (s.hist.length ? s.back() : s.go('feed'));
  const tile = postTile(post, slide);
  // One set of actions: the foot bar over the picture and the post's own column both show it.
  const acts: FullScreenAction[] = [
        { id: 'like', label: t('isLike'), icon: <Icon icon={Heart} size="sm" />, count: fmt(post.likes + (liked ? 1 : 0)), active: liked, onClick: () => s.toggle('liked', post.id) },
        { id: 'comments', label: t('poViewComments'), icon: <Icon icon={MessageCircle} size="sm" />, count: fmt(count), onClick: () => s.openComments(post.id, slide) },
        { id: 'save', label: t('isSave'), icon: <Icon icon={Bookmark} size="sm" />, active: saved, onClick: () => { s.toggle('saved', post.id); s.flash(t('saved')); } },
        { id: 'share', label: t('isShare'), icon: <Icon icon={Share2} size="sm" />, onClick: () => { void navigator.clipboard?.writeText(location.href); s.flash(t('isCopied')); } },
        ...(sl.lookId ? [{ id: 'look', label: t('poShopLook'), icon: <Icon icon={ShoppingBag} size="sm" />, onClick: () => s.openLook(sl.lookId as string) }] : []),
        { id: 'author', label: t('viewProfile'), icon: <Icon icon={User} size="sm" />, onClick: () => s.openPerson(person(post.authorId).id) },
  ];
  const media = sl.src
    ? <Image src={itemImageLarge(sl.src)} alt={sl.title} fit="contain" fill />
    : <Tile key={slide} animate {...tile} ratio="1" big title={sl.title} sub={sl.caption} />;
  // The sheet: the post itself as Info (who, what, its actions), its chat and what it links to on the left; at the
  // bottom what its city holds (views, zones, posts, PFTs, hosts...), the same sections as the city's own page.
  const info: SectionDef[] = [
    { id: 'post', title: t('wdAbout'), content: (
      <Stack direction="column" gap={3}>
        <PersonLine id={post.authorId} sub={[club?.name, ago(post.createdAt)].filter(Boolean).join(' · ')} />
        <Pinned worldId={post.worldId} cityId={post.cityId} />
        <Text size="md">{post.caption} <Text as="span" intent="secondary">{post.tags.join(' ')}</Text></Text>
        <Box className={styles.acts}>{acts.map((a) => (
          <Button key={a.id} variant="glass" size="sm" icon={a.icon} aria-label={a.label} title={a.label} aria-pressed={a.active} onClick={a.onClick}>{a.count}</Button>))}</Box>
      </Stack>) },
    { id: 'chat', title: t('chat'), hint: fmt(count), content: <PostComments postId={post.id} slide={slide} /> },
    { id: 'related', title: t('asLinked'), content: <Connected kind="post" id={post.id} bare /> },
  ];
  const views: SectionDef = { id: 'views', title: t('ctViews'), hint: String(n), hidden: n < 2, content: (
    <TabList size="sm" variant="pills" aria-label={t('slideOf', { i: slide + 1, n })} activeId={String(slide)} onChange={(id) => setSlide(Number(id))}
      items={post.slides.map((x, i) => ({ id: String(i), label: x.caption ?? t('poCover'), icon: x.src ? <Box as="span" className={styles.thumb}><Image src={itemImage(x.src)} alt="" fit="cover" fill /></Box> : undefined }))} />) };
  const bottom: SectionDef[] = [views, ...(world
    ? cityParts.filter((x) => x.id !== 'about' && x.id !== 'related')
    : [{ id: 'posts', title: t('wdPosts'), hint: String(more.length), content: (
        <ViewGrid cols={3} minItemWidth="10rem">{more.map((p) => <Tile key={p.id} {...postTile(p)} ratio="4/5" title={p.slides[0].title} sub={person(p.authorId).name} onClick={() => s.openPost(p.id)} />)}</ViewGrid>) }])];
  const on = new Set([...info, ...bottom].filter((x) => !x.hidden).map((x) => x.id));
  return (
    <FullScreen label={sl.title} media={media} onClose={close} closeLabel={t('close')} fill={sl.src ? itemImage(sl.src) : undefined}
      menu={postMenu(s, on, { worldId: post.worldId, lookId: sl.lookId })} menuLabel={t('poMenu')} infoLabel={t('wdAbout')}
      onPrev={slide > 0 || s.hist.length ? () => step(-1) : undefined} onNext={slide < n - 1 || more.length ? () => step(1) : undefined}
      prevLabel={t('prev')} nextLabel={t('next')}
      actions={acts}>
      <Box className={styles.cols}>
        <Box className={styles.side}><PageSections id="post-info" size="sm" sections={info} /></Box>
        <Box className={styles.mid}><PageSections id="post-city" size="sm" sections={bottom} /></Box>
      </Box>
    </FullScreen>
  );
};
