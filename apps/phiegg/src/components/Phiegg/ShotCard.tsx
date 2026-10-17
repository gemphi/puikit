import React from 'react';
import { Button, Card, CardBody, Icon, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { Bookmark, Heart, Layers, MessageCircle, Repeat } from 'lucide-react';
import { ago, clubOf, commentCount, fmt, itemImage, lookOf, person, t, worldOf } from '../../lib/data';
import { renderFor } from '../../lib/depth';
import type { Post } from '../../types/phiegg';
import { phieggStore } from '../../state/phieggStore';
import { PersonLine } from './PersonLine';
import { Tile } from './Tile';

/**
 * The Tile props of a post's slide, the same wherever the post shows (feed card, profile and club grids, the opened
 * post): its own colour and the render of its look (else the one render picked for the post), so the card, its
 * parent and the opened post are always one theme.
 */
export function postTile(post: Post, i = 0) {
  const sl = post.slides[i] ?? post.slides[0]; const look = sl.lookId ? lookOf(sl.lookId) : undefined;
  const mid = look?.views.FRONT ? itemImage(look.views.FRONT) : renderFor(post.id + ':' + i, post.clubId, sl.hex)?.src;
  return { tone: sl.tone, color: sl.hex, depth: { worldId: post.worldId, clubId: post.clubId, personId: post.authorId, mid } };
}

export const ShotCard: React.FC<{ post: Post }> = ({ post }) => {
  const s = useStore(phieggStore);
  const club = clubOf(post.clubId); const world = worldOf(post.worldId);
  const liked = !!s.liked[post.id]; const first = post.slides[0];
  const count = commentCount(post, s.comments[post.id]?.length ?? 0);
  // The shot is a card of its own; the post around it has no surface (one card), its colour is the shot's.
  const { depth, color } = postTile(post);
  return (
    /* A post is a card whose wash pools at the bottom; its deck hangs below (the opposite cascade of the image
       above it), so the shot reads as cut into the card in 3D. */
    <Card depth={2} deckDirection="down" padding="sm" hoverable={false}><CardBody><Stack direction="column" gap={2}>
      <Stack direction="row" justify="between" align="center">
        <PersonLine id={post.authorId} sub={[club?.name, ago(post.createdAt)].filter(Boolean).join(' · ')} />
        {post.slides.length > 1 && <Tag minimal round icon={<Icon icon={Layers} size="xs" />}>{post.slides.length}</Tag>}
      </Stack>
      <Tile tone={first.tone} color={color} title={first.title} sub={first.caption} onClick={() => s.openPost(post.id)} depth={depth}
        badges={world && <Tag round size="sm" interactive onClick={(e) => { e.stopPropagation(); s.go('world', { worldId: world.id }); }}>{world.name}</Tag>} />
      <Stack direction="row" gap={1} justify="between">
        <Stack direction="row" gap={1}>
          <Button variant="ghost" size="sm" icon={<Icon icon={Heart} size="sm" />} onClick={() => s.toggle('liked', post.id)} aria-label={t('likes', { n: '' })} />
          <Button variant="ghost" size="sm" icon={<Icon icon={MessageCircle} size="sm" />} onClick={() => s.openPost(post.id)} aria-label={t('comments', { n: count })} />
          <Button variant="ghost" size="sm" icon={<Icon icon={Repeat} size="sm" />} onClick={() => s.flash(t('reshared'))} aria-label={t('reshared')} />
        </Stack>
        <Button variant="ghost" size="sm" icon={<Icon icon={Bookmark} size="sm" />} onClick={() => { s.toggle('saved', post.id); s.flash(t('saved')); }} aria-label={t('saved')} />
      </Stack>
      <Text size="sm" weight="bold" intent={liked ? 'primary' : 'default'}>{t('likes', { n: fmt(post.likes + (liked ? 1 : 0)) })} · {t('comments', { n: count })}</Text>
      <Text size="sm"><Text as="strong" size="sm" weight="bold">{person(post.authorId).handle}</Text> {post.caption} <Text as="span" size="sm" intent="primary">{post.tags.join(' ')}</Text></Text>
    </Stack></CardBody></Card>
  );
};
