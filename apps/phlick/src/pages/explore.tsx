import React, { useState } from 'react';
import { Container, Stack, Title, Text } from '@pui/components';
import { PostList, useSocialConfig } from '@pui/social';
import { useAsync } from '@pui/shop';
import { getSectionPosts } from '../lib/services';
import { topicBySlug } from '../lib/topics';
import { presentationOf } from '../lib/presentation';
import { usePostSlides } from '../lib/present';
import { TopicTabs } from '../components/topic-tabs';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';
import s from '../styles/phlick.module.scss';
import type { Post } from '../social';

/** The trending grid, under the same category header as the feed. */
export const ExplorePage: React.FC = () => {
  const { adapter } = useSocialConfig<Post>();
  const { navigate } = useRouter();
  const toSlide = usePostSlides((postId) => navigate(routes.post(postId)));
  const [topic, setTopic] = useState<string | null>(null);

  // Trending is its own adapter call, not a re-sort of the personal feed —
  // reusing the feed here inherited its Following narrowing, so a viewer who
  // followed two creators saw a two-creator "Explore".
  const trending = useAsync<Post[]>(
    () =>
      topic
        ? getSectionPosts(topic, (slug) => topicBySlug(slug)?.label ?? slug)
        : adapter.getTrending?.() ?? Promise.resolve([]),
    [adapter, topic]
  );
  const posts = trending.data ?? [];
  // The page has a look; a chosen topic brings its OWN — shape, columns, all.
  const look = presentationOf(topic ?? 'explore');

  return (
    <div className={s.feedStage}>
      <TopicTabs topic={topic} onTopic={setTopic} />

      <div className={s.explorePad}>
        <Container size="xl">
          <Stack direction="column" gap={4}>
            <Stack direction="column" gap={1}>
              <Title level={2}>{t.explore.title}</Title>
              <Text intent="secondary">{t.explore.body}</Text>
            </Stack>
            <PostList
              variant={look.variant}
              posts={posts.map((p) => ({ ...toSlide(p), ratio: look.ratio }))}
              loading={trending.loading}
              columns={look.columns}
              empty={{ title: t.explore.emptyTitle, description: t.explore.emptyBody }}
            />
          </Stack>
        </Container>
      </div>
    </div>
  );
};
