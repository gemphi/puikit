import React, { useState } from 'react';
import { Avatar, Button, Container, EmptyState, Stack, Tag, Tabs, Text, Title, Divider, useSidebarContraction } from '@pui/components';
import { PostList, PostOverlay, useSocial, useSocialConfig, formatCount } from '@pui/social';
import { BadgeCheck } from 'lucide-react';
import { useAsync } from '@pui/shop';
import { usePostSlides } from '../lib/present';
import { presentationOf } from '../lib/presentation';
import { PostComments } from '../components/post-comments';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';
import s from '../styles/phlick.module.scss';
import type { Post } from '../social';
import type { SocialAuthor } from '@pui/types';

/** A creator's page: header with the follow call, then their grid. */
export const CreatorPage: React.FC<{ handle: string }> = ({ handle }) => {
  const { navigate } = useRouter();
  const { adapter, locale } = useSocialConfig<Post>();
  const social = useSocial<Post>();

  // A clicked post opens in place, over the grid, comments at its side.
  const [openId, setOpenId] = useState<string | null>(null);
  useSidebarContraction(!!openId);
  const toSlide = usePostSlides(setOpenId, setOpenId);

  const creator = useAsync<SocialAuthor | null>(
    () => adapter.getCreator?.(handle) ?? Promise.resolve(null),
    [adapter, handle]
  );
  const posts = useAsync<Post[]>(
    () => adapter.getCreatorPosts?.(handle) ?? Promise.resolve([]),
    [adapter, handle]
  );
  // Liked: the viewer's own likes, joined against the full feed.
  const all = useAsync<Post[]>(() => adapter.getFeed?.('for-you') ?? Promise.resolve([]), [adapter]);
  const liked = (all.data ?? []).filter((p) => social.engagement.hasLiked(p.id));

  const openPost =
    [...(posts.data ?? []), ...(all.data ?? [])].find((p) => p.id === openId) ?? null;

  if (!creator.loading && !creator.data) {
    return (
      <EmptyState
        title={t.profile.notFoundTitle}
        description={t.profile.notFoundBody}
        action={
          <Button variant="primary" onClick={() => navigate(routes.forYou())}>
            {t.profile.back}
          </Button>
        }
      />
    );
  }

  const c = creator.data;
  const following = c ? social.engagement.isFollowing(c.handle) : false;
  const stat = (label: string, value: number | undefined) => (
    <Stack key={label} direction="row" align="center" gap={1}>
      <Text as="span" weight="semibold">{formatCount(value ?? 0, locale)}</Text>
      <Text as="span" size="sm" intent="secondary">{label}</Text>
    </Stack>
  );

  return (
    <Container size="xl" className={s.pagePad}>
      <Stack direction="column" gap={5}>
        {c && (
          <Stack direction="row" align="center" gap={4} wrap>
            <Avatar src={c.avatar} alt={c.name} initials={c.name.slice(0, 2)} size="xl" />
            <Stack direction="column" gap={2}>
              <Stack direction="row" align="center" gap={2}>
                <Title level={3}>@{c.handle}</Title>
                {c.verified && (
                  <Tag intent="primary" minimal round size="sm">
                    <BadgeCheck size={12} /> {c.name}
                  </Tag>
                )}
              </Stack>
              {c.bio && <Text intent="secondary">{c.bio}</Text>}
              <Stack direction="row" gap={4} wrap>
                {stat(t.profile.following, c.stats?.following)}
                {stat(t.profile.followers, c.stats?.followers)}
                {stat(t.profile.likes, c.stats?.likes)}
              </Stack>
            </Stack>
            <Button
              variant={following ? 'outline' : 'primary'}
              onClick={() => social.engagement.toggleFollow(c.handle)}
            >
              {following ? t.profile.unfollow : t.profile.follow}
            </Button>
          </Stack>
        )}

        <Divider />

        <Stack direction="column" gap={3}>
          <Tabs
            items={[
              {
                id: 'videos',
                label: t.profile.videosTab,
                content: (
                  <PostList
                    variant="card"
                    posts={(posts.data ?? []).map(toSlide)}
                    loading={posts.loading}
                    columns={presentationOf('creator').columns}
                  />
                ),
              },
              {
                id: 'liked',
                label: t.profile.likedTab,
                content: (
                  <PostList
                    variant="card"
                    posts={liked.map(toSlide)}
                    loading={all.loading}
                    columns={presentationOf('creator').columns}
                    empty={{ title: t.profile.likedEmptyTitle, description: t.profile.likedEmptyBody }}
                  />
                ),
              },
            ]}
          />
        </Stack>
      </Stack>

      <PostOverlay
        isOpen={!!openPost}
        defaultCommentsOpen={false}
        onClose={() => setOpenId(null)}
        post={openPost ? { ...toSlide(openPost), onOpen: undefined } : null}
        panel={openPost ? (close) => <PostComments post={openPost} intro onClose={close} /> : undefined}
        labels={t.overlay}
      />
    </Container>
  );
};
