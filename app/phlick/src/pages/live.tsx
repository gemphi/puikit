import React from 'react';
import { Container, Stack, Tag, Text, Title } from '@pui/components';
import { PostList, useSocialConfig, formatCount } from '@pui/social';
import { useAsync } from '@pui/shop';
import { usePostSlides } from '../lib/present';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { presentationOf } from '../lib/presentation';
import { t } from '../locales/t';
import s from '../styles/phlick.module.scss';
import type { Post } from '../social';

/**
 * Who is on air: the trending set re-presented as live rooms — each tile
 * carries the LIVE flag and its viewer count. Same list, same mapper; the
 * page contributes only the badge.
 */
export const LivePage: React.FC = () => {
  const { adapter, locale } = useSocialConfig<Post>();
  const { navigate } = useRouter();
  const toSlide = usePostSlides((postId) => navigate(routes.post(postId)));

  const rooms = useAsync<Post[]>(
    () => adapter.getTrending?.() ?? Promise.resolve([]),
    [adapter]
  );

  return (
    <Container size="xl" className={s.pagePad}>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Title level={2}>{t.live.title}</Title>
          <Text intent="secondary">{t.live.body}</Text>
        </Stack>
        <PostList
          variant="card"
          posts={(rooms.data ?? []).slice(0, 64).map((p) => ({
            ...toSlide(p),
            ratio: presentationOf('live').ratio,
            badge: <Tag intent="error" size="sm">{t.live.badge}</Tag>,
            views: `${formatCount(Math.round((p.stats.views ?? 0) / 40), locale)} ${t.live.viewers}`,
          }))}
          loading={rooms.loading}
          columns={presentationOf('live').columns}
        />
      </Stack>
    </Container>
  );
};
