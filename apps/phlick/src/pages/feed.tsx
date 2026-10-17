import React, { useState } from 'react';
import { Box, Button, Container, EmptyState, Stack } from '@pui/components';
import { PostList, useSocial } from '@pui/social';
import { useSidebarContraction } from '@pui/components';
import { usePostSlides } from '../lib/present';
import { PostComments } from '../components/post-comments';
import { TopicTabs } from '../components/topic-tabs';
import { useAsync } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t, format } from '../locales/t';
import { topicBySlug } from '../lib/topics';
import s from '../styles/phlick.module.scss';
import type { Post } from '../social';

/**
 * The feed — For You or Following, chosen by the route. Data and engagement
 * come from `useSocial`; this page is a topic filter and a variant choice.
 */
export const FeedPage: React.FC<{ kind: 'for-you' | 'following'; lockedTopic?: string }> = ({ kind, lockedTopic }) => {
  const { navigate } = useRouter();
  const social = useSocial<Post>();
  // Comments dock beside the playing feed — no redirect — and the rail
  // contracts to give the panel its room.
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  useSidebarContraction(!!commentsFor);
  const toSlide = usePostSlides(setCommentsFor);
  const [chosen, setChosen] = useState<string | null>(lockedTopic ?? null);
  const topic = lockedTopic ?? chosen;
  // On a category route the tabs steer the URL, so the address bar always
  // names the category the feed is filtered to.
  const onTopic = (next: string | null) => {
    setChosen(next);
    if (lockedTopic) navigate(next ? routes.topic(next) : routes.forYou());
  };
  const posts = topic ? social.feed.posts.filter((p) => p.topic === topic) : social.feed.posts;

  // The route owns which feed is watched; the store follows it.
  React.useEffect(() => {
    if (social.feed.kind !== kind) social.feed.setKind(kind);
  }, [kind, social.feed]);

  if (topic && !social.feed.loading && posts.length === 0) {
    return (
      <Box className={s.feedStage}>
        <TopicTabs topic={topic} onTopic={onTopic} />
        <Container>
          <EmptyState
            title={format(t.feed.emptyTopicTitle, { topic: topicBySlug(topic)?.label ?? topic })}
            description={t.feed.emptyTopicBody}
            action={<Button variant="primary" onClick={() => onTopic(null)}>{t.feed.browseAll}</Button>}
          />
        </Container>
      </Box>
    );
  }

  if (kind === 'following' && !social.feed.loading && social.feed.posts.length === 0) {
    return (
      <EmptyState
        title={t.feed.emptyFollowingTitle}
        description={t.feed.emptyFollowingBody}
        action={
          <Button variant="primary" onClick={() => navigate(routes.forYou())}>
            {t.feed.browse}
          </Button>
        }
      />
    );
  }

  return (
    <Box className={s.feedStage}>
      <TopicTabs topic={topic} onTopic={onTopic} />

      <Box className={s.feedRow}>
        <Box className={s.feedBody}>
          <PostList
            variant="immersive"
            posts={posts.map(toSlide)}
            loading={social.feed.loading}
            pager={!commentsFor}
            labels={{ previous: t.feed.previous, next: t.feed.next }}
          />
        </Box>

        {commentsFor && (() => {
          const open = social.feed.posts.find((x) => x.id === commentsFor);
          return open ? <PostComments post={open} dock="auto" onClose={() => setCommentsFor(null)} /> : null;
        })()}
      </Box>
    </Box>
  );
};
