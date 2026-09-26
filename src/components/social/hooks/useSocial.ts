import { useCallback } from 'react';
import { useFeed, type FeedResult } from './useFeed';
import { useSocialConfig, type ResolvedSocialConfig } from '../provider';
import { useSocialStore } from '../../../store/social';
import { formatCount } from '../logic/format';
import type { SocialPost } from '../../../types/social';

export interface EngagementResult {
  hasLiked: (postId: string) => boolean;
  hasSaved: (postId: string) => boolean;
  isFollowing: (handle: string) => boolean;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (handle: string) => void;
  /** A stat adjusted by the viewer's own action, so a like moves the count. */
  likeCount: (post: SocialPost) => number;
  saveCount: (post: SocialPost) => number;
  hasLikedComment: (commentId: string) => boolean;
  toggleCommentLike: (commentId: string) => void;
  /** A comment's like count, adjusted by the viewer's own like. */
  commentLikeCount: (commentId: string, likes: number) => number;
}

export interface SocialResult<T extends SocialPost = SocialPost> {
  feed: FeedResult<T>;
  engagement: EngagementResult;
  format: { count: (n: number) => string };
  config: ResolvedSocialConfig<T>;
}

/**
 * The operational entry point — the social module's `useShop`. One hook, and
 * a page is composition: `const social = useSocial()` and everything from the
 * feed to the like toggles is in hand.
 */
export function useSocial<T extends SocialPost = SocialPost>(): SocialResult<T> {
  const config = useSocialConfig<T>();
  const feed = useFeed<T>();
  const liked = useSocialStore((s) => s.liked);
  const saved = useSocialStore((s) => s.saved);
  const following = useSocialStore((s) => s.following);
  const toggleLike = useSocialStore((s) => s.toggleLike);
  const toggleSave = useSocialStore((s) => s.toggleSave);
  const toggleFollow = useSocialStore((s) => s.toggleFollow);
  const likedComments = useSocialStore((s) => s.likedComments);
  const toggleCommentLike = useSocialStore((s) => s.toggleCommentLike);

  const count = useCallback((n: number) => formatCount(n, config.locale), [config.locale]);

  return {
    feed,
    engagement: {
      hasLiked: (id) => liked.includes(id),
      hasSaved: (id) => saved.includes(id),
      isFollowing: (handle) => following.includes(handle),
      toggleLike,
      toggleSave,
      toggleFollow,
      likeCount: (post) => post.stats.likes + (liked.includes(post.id) ? 1 : 0),
      saveCount: (post) => post.stats.saves + (saved.includes(post.id) ? 1 : 0),
      hasLikedComment: (id) => likedComments.includes(id),
      toggleCommentLike,
      commentLikeCount: (id, likes) => likes + (likedComments.includes(id) ? 1 : 0),
    },
    format: { count },
    config,
  };
}
