import React, { useEffect, useState } from 'react';
import { Box, Button, Icon, Stack, Tag, Text, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, Repeat, ShoppingBag } from 'lucide-react';
import { D, ago, clubOf, commentCount, fmt, person, postById, site, t, worldOf } from '../../lib/data';
import { usePageTheme } from '../../lib/pageTheme';
import { phieggStore } from '../../state/phieggStore';
import { Connected } from '../../components/Phiegg/Connected';
import { PersonLine } from '../../components/Phiegg/PersonLine';
import { postTile } from '../../components/Phiegg/ShotCard';
import { Tile, tileColour } from '../../components/Phiegg/Tile';
import styles from './PostPage.module.scss';

/** A post's own page, where a post click lands. Everything you then do from here (comments, the look, the author)
 *  opens in a sheet over it, so you keep your place. */
export const PostPage: React.FC = () => {
  const s = useStore(phieggStore);
  const post = postById(s.postId); const n = post?.slides.length ?? 1;
  const [slide, setSlide] = useState(0); const [auto, setAuto] = useState(true);
  useEffect(() => { setSlide(0); setAuto(true); }, [s.postId]);
  useEffect(() => { if (!auto || n < 2) return; const id = setInterval(() => setSlide((i) => (i + 1) % n), site.autoplay.slideMs); return () => clearInterval(id); }, [auto, n]);
  // The page wears the slide's render colour, the same theme as the post's card.
  const pt = post ? postTile(post, slide) : undefined; const sl = post?.slides[slide] ?? post?.slides[0];
  usePageTheme(pt && sl ? tileColour({ tone: sl.tone, title: sl.title, sub: sl.caption, depth: pt.depth, color: pt.color }).hex : undefined, null, 'soft', 'post');
  if (!post || !sl) return <Text intent="muted">{t('prNoLikes')}</Text>;
  const liked = !!s.liked[post.id]; const saved = !!s.saved[post.id];
  const count = commentCount(post, s.comments[post.id]?.length ?? 0);
  const step = (d: number) => { setAuto(false); setSlide((i) => (i + d + n) % n); };
  const club = clubOf(post.clubId); const world = worldOf(post.worldId);
  const mine = post.authorId === D.core.currentUserId && D.feed.shots.some((x) => x.id === post.id);
  return (
    <Box className={styles.page}>
      <Box className={styles.stage}>
        <Tile key={slide} animate {...postTile(post, slide)} ratio="4/5" big title={sl.title} sub={sl.caption}
          badges={<>{n > 1 && <Tag round size="sm">{t('slideOf', { i: slide + 1, n })}</Tag>}{n > 1 && <Tag round size="sm" interactive onClick={() => setAuto(!auto)}>{auto ? t('autoplayOn') : t('autoplayOff')}</Tag>}</>} />
        {n > 1 && <Stack direction="row" justify="center" gap={2}>
          <Button variant="ghost" icon={<Icon icon={ChevronLeft} size="sm" />} onClick={() => step(-1)} aria-label={t('prev')} />
          <TabList size="sm" variant="pills" aria-label="Slides" activeId={String(slide)} onChange={(id) => { setAuto(false); setSlide(Number(id)); }} items={post.slides.map((_, i) => ({ id: String(i), label: String(i + 1) }))} />
          <Button variant="ghost" icon={<Icon icon={ChevronRight} size="sm" />} onClick={() => step(1)} aria-label={t('next')} />
        </Stack>}
      </Box>
      <Stack direction="column" gap={4} className={styles.side}>
        <PersonLine id={post.authorId} sub={[club?.name, ago(post.createdAt)].filter(Boolean).join(' · ')} />
        <Text>{post.caption} <Text as="span" intent="primary">{post.tags.join(' ')}</Text></Text>
        {world && <Box><Tag round interactive onClick={() => s.go('world', { worldId: world.id })}>{world.name}</Tag></Box>}
        <Stack direction="row" gap={2} wrap>
          <Button variant={liked ? 'secondary' : 'outline'} iconLeft={Heart} onClick={() => s.toggle('liked', post.id)}>{fmt(post.likes + (liked ? 1 : 0))}</Button>
          <Button variant="outline" iconLeft={MessageCircle} onClick={() => s.openComments(post.id, slide)}>{fmt(count)}</Button>
          <Button variant="outline" icon={<Icon icon={Repeat} size="sm" />} onClick={() => s.flash(t('reshared'))} aria-label={t('reshared')} />
          <Button variant={saved ? 'secondary' : 'outline'} icon={<Icon icon={Bookmark} size="sm" />} onClick={() => { s.toggle('saved', post.id); s.flash(t('saved')); }} aria-label={t('saved')} />
        </Stack>
        {sl.lookId && <Box><Button variant="primary" iconLeft={ShoppingBag} onClick={() => s.openLook(sl.lookId as string)}>{t('poShopLook')}</Button></Box>}
        <Box><Button variant="ghost" onClick={() => s.openPerson(person(post.authorId).id)}>{t('viewProfile')}</Button><Button variant="ghost" onClick={() => s.openComments(post.id, slide)}>{t('poViewComments')}</Button></Box>
        {mine && <Box><Button size="sm" variant="danger" onClick={() => s.removeShot(post.id)}>{t('shotRemove')}</Button></Box>}
      </Stack>
      <Box className={styles.more}><Connected kind="post" id={post.id} /></Box>
    </Box>
  );
};
