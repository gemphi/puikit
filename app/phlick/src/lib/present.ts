import { useCallback } from 'react';
import { useSocial, useComments } from '@pui/social';
import { useRouter } from '../router';
import { routes } from './routes';
import { t, format, plural } from '../locales/t';
import type { Post } from '../social';

/**
 * The one place a post becomes slide props — the Chanel `useProductCards`
 * discipline carried over: pages pass the result to `PostList` and choose the
 * variant, nothing more.
 */
export const usePostSlides = (
  onOpenComments: (postId: string) => void,
  /** Where a clicked post goes; the default is its own page. */
  onOpenPost?: (postId: string) => void
) => {
  const { navigate } = useRouter();
  const social = useSocial<Post>();
  const { engagement, format: fmt } = social;

  return useCallback(
    (p: Post) => ({
      id: p.id,
      author: p.author,
      caption: p.caption,
      hashtags: p.hashtags,
      sound: p.sound,
      poster: p.poster,
      slides: p.slides,
      views: p.stats.views !== undefined ? fmt.count(p.stats.views) : undefined,
      labels: { mute: t.feed.mute, unmute: t.feed.unmute },
      // A clicked post goes to its own page unless the caller redirects it —
      // the profile grid opens an overlay in place instead.
      onOpen: () => (onOpenPost ? onOpenPost(p.id) : navigate(routes.post(p.id))),
      rail: {
        counts: {
          likes: fmt.count(engagement.likeCount(p)),
          comments: fmt.count(p.stats.comments),
          saves: fmt.count(engagement.saveCount(p)),
          shares: fmt.count(p.stats.shares),
        },
        liked: engagement.hasLiked(p.id),
        saved: engagement.hasSaved(p.id),
        following: engagement.isFollowing(p.author.handle),
        onLike: () => engagement.toggleLike(p.id),
        onSave: () => engagement.toggleSave(p.id),
        onFollow: () => engagement.toggleFollow(p.author.handle),
        onComment: () => onOpenComments(p.id),
        onShare: () => void navigator.clipboard?.writeText(`${location.origin}${location.pathname}#/post/${p.id}`).catch(() => {}),
        onOpenAuthor: () => navigate(routes.creator(p.author.handle)),
        labels: t.rail,
      },
    }),
    [navigate, engagement, fmt, onOpenComments, onOpenPost]
  );
};

/** Comments for one post, mapped for `CommentList` and localised. */
export const useCommentView = (postId: string | null) => {
  const { comments, loading } = useComments(postId);
  const { format: fmt, engagement } = useSocial<Post>();

  return {
    loading,
    count: comments.length,
    comments: comments.map((c) => ({
      id: c.id,
      author: c.author,
      body: c.body,
      likes: fmt.count(engagement.commentLikeCount(c.id, c.likes)),
      when: c.postedAt,
      liked: engagement.hasLikedComment(c.id),
      onLike: engagement.toggleCommentLike,
      likeLabel: t.comments.like,
      replies: c.replies?.map((r) => ({
        id: r.id,
        author: r.author,
        body: r.body,
        likes: fmt.count(engagement.commentLikeCount(r.id, r.likes)),
        when: r.postedAt,
        liked: engagement.hasLikedComment(r.id),
      })),
      repliesLabel: (n: number) => plural(n, t.comments.viewReply, t.comments.viewReplies),
      hideRepliesLabel: t.comments.hideReplies,
    })),
    labels: {
      title: (n: number) => format(t.comments.title, { count: n }),
      placeholder: t.comments.placeholder,
      post: t.comments.post,
      empty: t.comments.empty,
    },
  };
};
