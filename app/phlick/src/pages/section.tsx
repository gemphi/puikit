import React from 'react';
import { Container, Stack, Tag, Title, Text } from '@pui/components';
import { PostList } from '@pui/social';
import { useAsync } from '@pui/shop';
import { getSectionPosts } from '../lib/services';
import { presentationOf } from '../lib/presentation';
import { usePostSlides } from '../lib/present';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t, format } from '../locales/t';
import s from '../styles/phlick.module.scss';
import type { Post } from '../social';

const SECTION_LABELS: Record<string, string> = t.sections as unknown as Record<string, string>;
const SHOP_LABELS: Record<string, string> = t.shopCategories as unknown as Record<string, string>;
const labelOf = (slug: string): string =>
  SHOP_LABELS[slug] ?? SECTION_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);

/**
 * A named section — Snaps, Shows, Lands, Shops… — as a titled catalogue. The
 * items are the section's own generated picks (64 at least; some sections
 * carry 128, 256 or 512), each opening on the post page like any other post.
 * Shops badge every tile with its floor: high-end fashion, jewelry, watches…
 */
export const SectionPage: React.FC<{ name: string }> = ({ name }) => {
  const { navigate } = useRouter();
  const toSlide = usePostSlides((postId) => navigate(routes.post(postId)));
  const label = labelOf(name);

  const look = presentationOf(name);
  const posts = useAsync<Post[]>(() => getSectionPosts(name, labelOf), [name]);
  const items = (posts.data ?? []).map((p) => ({
    ...toSlide(p),
    ratio: look.ratio,
    badge: look.badge === 'category' ? (
      <Tag intent="primary" minimal round size="sm">{labelOf(p.topic)}</Tag>
    ) : undefined,
  }));

  return (
    <Container size="xl" className={s.pagePad}>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Title level={2}>{label}</Title>
          <Text intent="secondary">
            {format(t.sections.itemsBody, { count: items.length, name: label })}
          </Text>
        </Stack>
        <PostList
          variant={look.variant}
          posts={items}
          loading={posts.loading}
          columns={look.columns}
          empty={{ title: t.explore.emptyTitle, description: t.explore.emptyBody }}
        />
      </Stack>
    </Container>
  );
};
