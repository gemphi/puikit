import React, { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '../../primitives/Button';
import { Avatar } from '../../media/Avatar';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import styles from '../styles.module.scss';
import { Box } from '../../layout/Box';

export interface CommentItemProps {
  id: string;
  author: { handle: string; name: string; avatar?: string };
  body: string;
  /** Pre-formatted like count. */
  likes: string;
  /** A relative or absolute time, already formatted by the app's locale. */
  when?: string;
  liked?: boolean;
  onLike?: (id: string) => void;
  likeLabel?: string;
  /** Start a reply to this comment; threads nest without limit. */
  onReply?: (id: string, handle: string) => void;
  replyLabel?: string;
  /** Threaded replies, this same shape all the way down. */
  replies?: CommentItemProps[];
  /** Receives the reply count, e.g. `(n) => `View ${n} replies``. */
  repliesLabel?: (count: number) => string;
  hideRepliesLabel?: string;
  className?: string;
}

/** One comment: avatar, handle, body, time — with its own small like. */
export const CommentItem: React.FC<CommentItemProps> = ({
  id,
  author,
  body,
  likes,
  when,
  liked = false,
  onLike,
  likeLabel = 'Like',
  onReply,
  replyLabel = 'Reply',
  replies,
  repliesLabel = (n) => `View ${n} ${n === 1 ? 'reply' : 'replies'}`,
  hideRepliesLabel = 'Hide replies',
  className,
}) => {
  const [open, setOpen] = useState(false);

  // A fresh reply of the viewer's own should be visible, not filed away.
  const replyCount = replies?.length ?? 0;
  const seen = useRef(replyCount);
  useEffect(() => {
    if (replyCount > seen.current) setOpen(true);
    seen.current = replyCount;
  }, [replyCount]);

  return (
    <Stack direction="row" align="start" gap={2} className={className} data-comment="true">
    <Avatar src={author.avatar} alt={author.name} initials={author.name.slice(0, 2)} size="sm" />
    <Stack direction="column" gap={0} className={styles.commentMain}>
      <Text as="span" size="sm" weight="semibold">@{author.handle}</Text>
      <Text as="span" size="sm" className={styles.commentBody}>{body}</Text>
      <Stack direction="row" align="center" gap={2} className={styles.commentMeta}>
        {when && <Span variant="muted">{when}</Span>}
        {onReply && (
          <button type="button" className={styles.commentReply} onClick={() => onReply(id, author.handle)}>
            {replyLabel}
          </button>
        )}
      </Stack>

      {replies && replies.length > 0 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={styles.replyToggle}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? hideRepliesLabel : repliesLabel(replies.length)}
          </Button>
          {open && (
            <Box className={styles.replies}>
              {replies.map((r) => (
                <CommentItem
                  key={r.id}
                  {...r}
                  onLike={onLike}
                  likeLabel={likeLabel}
                  onReply={onReply}
                  replyLabel={replyLabel}
                />
              ))}
            </Box>
          )}
        </>
      )}
    </Stack>
      {onLike && (
        <Stack direction="column" align="center" gap={0}>
          <button
            type="button"
            className={styles.commentLike}
            data-active={liked ? 'true' : undefined}
            aria-label={likeLabel}
            aria-pressed={liked}
            onClick={() => onLike(id)}
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <Span variant="muted">{likes}</Span>
        </Stack>
      )}
    </Stack>
  );
};
