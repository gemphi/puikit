'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { Button } from '../../primitives/Button';
import { PostItem, type PostItemProps, type PostItemVariant } from './item';
import type { ResponsiveValue } from '../../shared/responsive';
import styles from '../styles.module.scss';
import { Box } from '../../layout/Box';

export interface PostListLabels {
  previous: string;
  next: string;
}

export const DEFAULT_POST_LIST_LABELS: PostListLabels = {
  previous: 'Previous post',
  next: 'Next post',
};

export interface PostListProps {
  /** Hide the up/down pager — a docked panel owns the edge, the wheel still scrolls. */
  pager?: boolean;
  posts: Array<Omit<PostItemProps, 'variant'>>;
  variant?: PostItemVariant;
  /** Grid columns for the `card` variant. */
  columns?: ResponsiveValue<number>;
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  labels?: Partial<PostListLabels>;
  className?: string;
}

/**
 * A list of posts. The `immersive` variant is the snap feed: one post per
 * viewport, snapping on the browser's own scroll, with the up/down pager the
 * reference docks to the feed's edge. `card` and `row` delegate to the same
 * `Collection` every other list in the library uses.
 */
export const PostList: React.FC<PostListProps> = ({
  pager = true,
  posts,
  variant = 'card',
  columns = { xs: 2, sm: 3, md: 4, lg: 5 },
  loading,
  skeletonCount = 8,
  empty,
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_POST_LIST_LABELS, ...labels };
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setAtStart(el.scrollTop <= 1);
    setAtEnd(el.scrollTop >= max - 1);
  }, []);

  useEffect(() => {
    measure();
  }, [measure, posts.length]);

  const page = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ top: direction * el.clientHeight });
  };

  // Up/down page the feed from the keyboard — unless the viewer is typing or
  // an overlay owns the screen.
  useEffect(() => {
    if (variant !== 'immersive' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (document.querySelector('[role="dialog"], [data-post-overlay="true"]')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); page(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); page(-1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [variant]);

  if (variant === 'immersive') {
    return (
      <Box className={styles.snapFeed} data-post-feed="true">
        <Box ref={trackRef} className={styles.snapTrack} onScroll={measure}>
          {posts.map((post) => (
            <Box key={post.id} className={styles.snapSlide}>
              <PostItem {...post} variant="immersive" />
            </Box>
          ))}
        </Box>

        {posts.length > 1 && pager && (
          <Box className={styles.pager}>
            <Button
              variant="secondary"
              size="sm"
              className={styles.glassControl}
              aria-label={copy.previous}
              disabled={atStart}
              onClick={() => page(-1)}
              icon={<ChevronUp size={16} />}
            />
            <Button
              variant="secondary"
              size="sm"
              className={styles.glassControl}
              aria-label={copy.next}
              disabled={atEnd}
              onClick={() => page(1)}
              icon={<ChevronDown size={16} />}
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Collection
      items={posts}
      getKey={(p) => p.id}
      renderItem={(post) => <PostItem {...post} variant={variant} />}
      layout={variant === 'card' ? 'grid' : 'stack'}
      columns={columns}
      gap={3}
      loading={loading}
      skeletonCount={skeletonCount}
      skeleton={{ media: true, lines: 2 }}
      empty={empty}
      className={className}
    />
  );
};
