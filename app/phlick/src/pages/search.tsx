import React from 'react';
import { Avatar, Button, Container, Divider, EmptyState, Stack, Text, Title } from '@pui/components';
import { PostList, useSocial } from '@pui/social';
import { useAsync } from '@pui/shop';
import { searchPosts, searchCreators } from '../lib/services';
import { usePostSlides } from '../lib/present';
import { presentationOf } from '../lib/presentation';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t, format } from '../locales/t';
import s from '../styles/phlick.module.scss';
import type { Post } from '../social';

/** Search results: matching creators first, then the matching videos. */
export const SearchPage: React.FC = () => {
  const { query, navigate } = useRouter();
  const q = query.get('q') ?? '';
  const social = useSocial<Post>();

  const toSlide = usePostSlides(() => {});

  const results = useAsync<Post[]>(() => searchPosts(q), [q]);
  const creators = useAsync<Post['author'][]>(() => searchCreators(q), [q]);
  const loading = results.loading || creators.loading;
  const empty = !loading && (results.data ?? []).length === 0 && (creators.data ?? []).length === 0;

  return (
    <Container size="xl" className={s.pagePad}>
      <Stack direction="column" gap={5}>
        <Title level={3}>{q ? format(t.search.resultsFor, { query: q }) : t.search.title}</Title>

        {empty ? (
          <EmptyState
            title={t.search.emptyTitle}
            description={t.search.emptyBody}
            action={
              <Button variant="primary" onClick={() => navigate(routes.explore())}>
                {t.feed.browse}
              </Button>
            }
          />
        ) : (
          <>
            {(creators.data ?? []).length > 0 && (
              <Stack direction="column" gap={3}>
                <Title level={6}>{t.search.creators}</Title>
                {(creators.data ?? []).map((c) => (
                  <Stack key={c.handle} direction="row" align="center" justify="between" gap={2} wrap>
                    <Stack
                      direction="row"
                      align="center"
                      gap={2}
                      data-clickable="true"
                      onClick={() => navigate(routes.creator(c.handle))}
                    >
                      <Avatar src={c.avatar} alt={c.name} initials={c.name.slice(0, 2)} size="md" />
                      <Stack direction="column" gap={0}>
                        <Text as="span" weight="semibold">@{c.handle}</Text>
                        <Text as="span" size="sm" intent="secondary">{c.name}</Text>
                      </Stack>
                    </Stack>
                    <Button
                      variant={social.engagement.isFollowing(c.handle) ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => social.engagement.toggleFollow(c.handle)}
                    >
                      {social.engagement.isFollowing(c.handle) ? t.rail.following : t.rail.follow}
                    </Button>
                  </Stack>
                ))}
                <Divider />
              </Stack>
            )}

            <Stack direction="column" gap={3}>
              <Title level={6}>{t.search.videos}</Title>
              <PostList
                variant="card"
                posts={(results.data ?? []).map(toSlide)}
                loading={loading}
                columns={presentationOf('search').columns}
                empty={{ title: t.search.emptyTitle, description: t.search.emptyBody }}
              />
            </Stack>
          </>
        )}
      </Stack>

    </Container>
  );
};
