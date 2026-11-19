import React from 'react';
import { Box, Icon, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { Bookmark, Heart, Layers, MessageCircle, Repeat } from 'lucide-react';
import styles from './ShotCard.module.scss';
import { ago, commentCount, fmt, itemImage, person, t, itemOf } from '../../lib/data';
import { renderFor } from '../../lib/depth';
import type { Post } from '../../types/phiegg';
import { phieggStore } from '../../state/phieggStore';
import { PersonLine } from './PersonLine';
import { Pinned } from './Pinned';
import { Tile } from './Tile';

/**
 * The Tile props of a post's slide, the same wherever the post shows (feed card, profile and club grids, the opened
 * post): its own colour and the render of its look (else the one render picked for the post), so the card, its
 * parent and the opened post are always one theme.
 */
export function postTile(post: Post, i = 0) {
  const sl = post.slides[i] ?? post.slides[0]; const look = sl.lookId ? itemOf('look', sl.lookId) : undefined;
  const mid = look?.views.FRONT ? itemImage(look.views.FRONT) : renderFor(post.id + ':' + i, post.clubId, sl.hex)?.src;
  // A slide with its own picture (a world's render) shows it as the card's scene; others keep the drawn scene.
  return { tone: sl.tone, color: sl.hex, image: sl.src ? itemImage(sl.src) : undefined, solo: !!sl.src, depth: { worldId: post.worldId, clubId: post.clubId, personId: post.authorId, mid } };
}

export const ShotCard: React.FC<{ post: Post }> = ({ post }) => {
  const s = useStore(phieggStore);
  const club = itemOf('club', post.clubId); const world = itemOf('world', post.worldId);
  const liked = !!s.liked[post.id]; const first = post.slides[0];
  const count = commentCount(post, s.comments[post.id]?.length ?? 0);
  // The shot is a card of its own; the post around it has no surface (one card), its colour is the shot's.
  const { depth, color, image, solo } = postTile(post);
  const saved = !!s.saved[post.id];
  // The post's actions, the same everywhere (the cascade, the post page): on the picture, down its right, on hover.
  const actions = [
    { id: 'like', label: t('isLike'), icon: <Heart size={18} />, active: liked, onClick: () => s.toggle('liked', post.id) },
    { id: 'comments', label: t('poViewComments'), icon: <MessageCircle size={18} />, onClick: () => s.openComments(post.id) },
    { id: 'reshare', label: t('reshared'), icon: <Repeat size={18} />, onClick: () => s.flash(t('reshared')) },
    { id: 'save', label: t('isSave'), icon: <Bookmark size={18} />, active: saved, onClick: () => { s.toggle('saved', post.id); s.flash(t('saved')); } },
  ];
  return (
    /* A post on the page's light alone (transparent to light, left to right), its author clear of its picture. */
    <Box className={styles.post}><Stack direction="column" gap={4}>
      <Stack direction="row" justify="between" align="center">
        <Stack direction="column" gap={1}><PersonLine id={post.authorId} sub={[club?.name, ago(post.createdAt)].filter(Boolean).join(' · ')} /><Pinned worldId={post.worldId} cityId={post.cityId} /></Stack>
        {post.slides.length > 1 && <Tag minimal round icon={<Icon icon={Layers} size="xs" />}>{post.slides.length}</Tag>}
      </Stack>
      <Tile tone={first.tone} color={color} image={image} solo={solo} title={first.title} sub={first.caption} onClick={() => s.openPost(post.id)} depth={depth} actions={actions}
        badges={world && <Tag round size="sm" interactive onClick={(e) => { e.stopPropagation(); s.go('world', { worldId: world.id }); }}>{world.name}</Tag>} />
      <Stack direction="column" gap={2}>
        <Text size="sm" weight="bold">{t('likes', { n: fmt(post.likes + (liked ? 1 : 0)) })} · {t('comments', { n: count })}</Text>
        <Text size="sm"><Text as="strong" size="sm" weight="bold">{person(post.authorId).handle}</Text> {post.caption} <Text as="span" size="sm" intent="secondary">{post.tags.join(' ')}</Text></Text>
      </Stack>
    </Stack></Box>
  );
};
