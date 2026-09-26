import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { Card } from '../../display/card';
import { Stack } from '../Stack';
import { Portal } from './Portal';
import { PortalNavbar } from './PortalNavbar';
import { PortalSidebar } from './PortalSidebar';
import type { PortalItem, PortalSection } from './types';

export interface BlogPost extends PortalItem {
  date?: string;
  author?: string;
  tags?: string[];
}

export interface BlogPortalProps {
  posts: BlogPost[];
  initialPostId?: string;
  activePostId?: string;
  onPostChange?: (id: string) => void;
  brandTitle: string;
  version?: string;
  dark?: boolean;
  onToggleDark?: () => void;
  /** Opens the shared preference surface from the portal navbar. */
  onOpenPreferences?: () => void;
  className?: string;
}

export const BlogPortal: React.FC<BlogPortalProps> = ({
  posts,
  initialPostId,
  activePostId: controlledPostId,
  onPostChange,
  brandTitle,
  version,
  dark,
  onToggleDark,
  onOpenPreferences,
  className = '',
}) => {
  const [internalPostId, setInternalPostId] = useState(initialPostId || posts[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const activePostId = controlledPostId ?? internalPostId;
  const visiblePosts = useMemo(() => posts.filter((post) => !post.hidden && !post.draft), [posts]);
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visiblePosts;
    return visiblePosts.filter((post) => [post.title, post.category, post.summary, post.content, ...(post.tags || [])]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query)));
  }, [visiblePosts, searchQuery]);
  const activePost = visiblePosts.find((post) => post.id === activePostId) || visiblePosts[0];
  const activeIndex = visiblePosts.findIndex((post) => post.id === activePost?.id);
  const previousPost = activeIndex > 0 ? visiblePosts[activeIndex - 1] : undefined;
  const nextPost = activeIndex >= 0 && activeIndex < visiblePosts.length - 1 ? visiblePosts[activeIndex + 1] : undefined;

  const sections = useMemo<PortalSection[]>(() => {
    const grouped = new Map<string, BlogPost[]>();
    for (const post of filteredPosts) grouped.set(post.category, [...(grouped.get(post.category) || []), post]);
    return [...grouped.entries()].map(([title, items]) => ({
      title,
      items: items.map(({ id, title: itemTitle, slug, position }) => ({ id, title: itemTitle, slug, position })),
    }));
  }, [filteredPosts]);

  const selectPost = (id: string) => {
    if (controlledPostId === undefined) setInternalPostId(id);
    onPostChange?.(id);
  };

  if (!activePost) return null;

  return (
    <Portal
      variant="blog"
      className={className}
      header={(
        <PortalNavbar
          brandTitle={brandTitle}
          version={version}
          searchQuery={searchQuery}
          searchPlaceholder="Search posts..."
          onSearchChange={setSearchQuery}
          onHome={() => selectPost(visiblePosts[0].id)}
          dark={dark}
          onToggleDark={onToggleDark}
          onOpenPreferences={onOpenPreferences}
        />
      )}
      sidebar={<PortalSidebar title="Posts" sections={sections} activeItemId={activePost.id} onSelectItem={selectPost} />}
    >
      <Stack direction="column" gap={6} padding={8}>
        <Stack direction="row" gap={2} align="center" wrap>
          <Badge variant="primary">{activePost.category}</Badge>
          {activePost.date && <Text size="sm" color="text-secondary">{activePost.date}</Text>}
          {activePost.author && <Text size="sm" color="text-secondary">by {activePost.author}</Text>}
        </Stack>
        <Stack direction="column" gap={3}>
          <Title level={1}>{activePost.title}</Title>
          {activePost.summary && <Text size="lg" color="text-secondary">{activePost.summary}</Text>}
        </Stack>
        <Card variant="default">
          <Text as="p">{activePost.content}</Text>
        </Card>
        <Stack direction="row" justify="between" align="center">
          {previousPost ? (
            <Button variant="outline" onClick={() => selectPost(previousPost.id)}>
              <ArrowLeft size={16} />
              <span>{previousPost.title}</span>
            </Button>
          ) : <Text as="span" />}
          {nextPost && (
            <Button variant="outline" onClick={() => selectPost(nextPost.id)}>
              <span>{nextPost.title}</span>
              <ArrowRight size={16} />
            </Button>
          )}
        </Stack>
      </Stack>
    </Portal>
  );
};

export default BlogPortal;
