import React, { useMemo, useState } from 'react';
import { Avatar, Button, Stack, Text } from '@pui/components';
import { CommentsPanel, useSocial, type CommentItemProps } from '@pui/social';
import { useCommentView } from '../lib/present';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t, format } from '../locales/t';
import type { Post } from '../social';

/**
 * The comments for one post, composed onto the module's one panel — the same
 * surface whether it docks beside the feed, the post page's stage, or the
 * profile overlay. The composer appends locally, and replies thread onto any
 * comment, at any depth.
 */
export const PostComments: React.FC<{
  post: Post;
  onClose?: () => void;
  /** Show the author row and caption above the thread. */
  intro?: boolean;
  dock?: 'flow' | 'auto';
  className?: string;
}> = ({ post: p, onClose, intro = false, dock, className }) => {
  const { navigate } = useRouter();
  const social = useSocial<Post>();
  const view = useCommentView(p.id);

  const [added, setAdded] = useState<CommentItemProps[]>([]);
  const [localReplies, setLocalReplies] = useState<Record<string, CommentItemProps[]>>({});
  const [seq, setSeq] = useState(0);

  const submit = (body: string, replyTo?: { id: string; handle: string }) => {
    const mine: CommentItemProps = {
      id: `local-${seq}`,
      author: { handle: 'you', name: 'You' },
      body,
      likes: '0',
      when: 'now',
    };
    setSeq((n) => n + 1);
    if (replyTo) {
      setLocalReplies((r) => ({ ...r, [replyTo.id]: [...(r[replyTo.id] ?? []), mine] }));
    } else {
      setAdded((a) => [mine, ...a]);
    }
  };

  // The viewer's replies thread in at any depth, the local ones last.
  const comments = useMemo(() => {
    const attach = (list: CommentItemProps[]): CommentItemProps[] =>
      list.map((c) => ({
        ...c,
        replies: [...attach(c.replies ?? []), ...(localReplies[c.id] ?? [])],
      }));
    return attach([...added, ...view.comments]);
  }, [added, localReplies, view.comments]);

  const localCount = added.length + Object.values(localReplies).reduce((n, l) => n + l.length, 0);

  const introNode = intro ? (
    <Stack direction="column" gap={3}>
      <Stack direction="row" align="center" justify="between" gap={2}>
        <Stack
          direction="row"
          align="center"
          gap={2}
          data-clickable="true"
          onClick={() => {
            onClose?.();
            navigate(routes.creator(p.author.handle));
          }}
        >
          <Avatar src={p.author.avatar} alt={p.author.name} initials={p.author.name.slice(0, 2)} size="md" />
          <Stack direction="column" gap={0}>
            <Text as="span" weight="semibold">@{p.author.handle}</Text>
            <Text as="span" size="sm" intent="secondary">{p.author.name}</Text>
          </Stack>
        </Stack>
        <Button
          variant={social.engagement.isFollowing(p.author.handle) ? 'outline' : 'primary'}
          size="sm"
          onClick={() => social.engagement.toggleFollow(p.author.handle)}
        >
          {social.engagement.isFollowing(p.author.handle) ? t.rail.following : t.rail.follow}
        </Button>
      </Stack>
      <Text size="sm">
        {p.caption} {p.hashtags?.map((h) => `#${h}`).join(' ')}
      </Text>
    </Stack>
  ) : undefined;

  return (
    <CommentsPanel
      comments={comments}
      loading={view.loading}
      count={view.count + localCount}
      intro={introNode}
      onClose={onClose}
      onSubmit={submit}
      dock={dock}
      labels={{
        title: (n) => format(t.post.commentsTitle, { count: n }),
        placeholder: t.comments.placeholder,
        post: t.comments.post,
        empty: t.comments.empty,
        close: t.comments.close,
        reply: t.comments.reply,
        replyingTo: (h) => format(t.comments.replyingTo, { handle: h }),
        cancelReply: t.comments.cancelReply,
      }}
      className={className}
    />
  );
};
