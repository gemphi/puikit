'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { useDismiss } from '../../overlays/useDismiss';
import { Input } from '../../forms/Input';
import { Button } from '../../primitives/Button';
import { Title } from '../../primitives/Title';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import { CommentList } from './list';
import type { CommentItemProps } from './item';
import { cn } from '../../../utils/cn';
import styles from '../styles.module.scss';
import { Box } from '../../layout/Box';

export interface CommentsPanelLabels {
  /** Receives the comment count, e.g. `(n) => `${n} comments``. */
  title: (count: number) => string;
  placeholder: string;
  post: string;
  empty: string;
  close: string;
  reply: string;
  /** Receives the handle being replied to. */
  replyingTo: (handle: string) => string;
  cancelReply: string;
}

export const DEFAULT_COMMENTS_PANEL_LABELS: CommentsPanelLabels = {
  title: (n) => `Comments (${n})`,
  placeholder: 'Add a comment…',
  post: 'Post',
  empty: 'Be the first to comment',
  close: 'Close',
  reply: 'Reply',
  replyingTo: (h) => `Replying to @${h}`,
  cancelReply: 'Cancel',
};

export interface CommentsPanelProps {
  comments: CommentItemProps[];
  loading?: boolean;
  /** Total thread size for the title; defaults to the top-level count. */
  count?: number;
  /** Above the thread: the author row and caption, composed by the app. */
  intro?: React.ReactNode;
  onClose?: () => void;
  /** Absent means no composer. A reply target arrives when one is armed. */
  onSubmit?: (body: string, replyTo?: { id: string; handle: string }) => void;
  /**
   * `flow` (default) docks in the layout and pushes its neighbours. `auto`
   * measures: when the row has room beside the playing frame and its rail,
   * the panel floats there and the content does not move at all; when it
   * does not, the panel falls back to the flow and pushes.
   */
  dock?: 'flow' | 'auto';
  labels?: Partial<CommentsPanelLabels>;
  className?: string;
}

/**
 * The comments surface — one panel for the feed, the post page and the
 * overlay, docked so it pushes the stage aside rather than covering it. It
 * wears the rail's own skin: the same border and the mirrored rail gradient,
 * from the same tokens, so the two sides of the screen match by construction.
 * Every comment offers a reply, and threads nest without limit.
 */
export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  loading,
  count,
  intro,
  onClose,
  onSubmit,
  dock = 'flow',
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_COMMENTS_PANEL_LABELS, ...labels };
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; handle: string } | null>(null);
  useDismiss(!!onClose, onClose ?? (() => {}));

  // The calculation `auto` docks by: with the frame centered in the row, the
  // free band on either side is (row − content) / 2. If the panel fits in
  // that band it floats beside the rail and nothing moves; otherwise it
  // joins the flow and pushes.
  const ref = useRef<HTMLElement>(null);
  const [floats, setFloats] = useState(false);
  useLayoutEffect(() => {
    if (dock !== 'auto') return;
    const el = ref.current;
    const row = el?.parentElement;
    if (!el || !row) return;
    const measure = () => {
      const content = row.querySelector("[data-variant='immersive']");
      if (!content) return setFloats(false);
      const rowW = row.getBoundingClientRect().width;
      const contentW = content.getBoundingClientRect().width;
      const panelW = el.getBoundingClientRect().width || 368;
      setFloats((rowW - contentW) / 2 >= panelW);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [dock]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSubmit?.(body, replyTo ?? undefined);
    setDraft('');
    setReplyTo(null);
  };

  // The reply affordance is armed panel-wide; items carry it down the thread.
  const withReply = onSubmit
    ? comments.map((c) => ({ ...c, onReply: (id: string, handle: string) => setReplyTo({ id, handle }), replyLabel: copy.reply }))
    : comments;

  return (
    <aside
      ref={ref}
      className={cn(styles.commentsPanel, dock === 'auto' && floats && styles.commentsPanelFloat, className)}
      data-comments-panel="true"
      data-float={dock === 'auto' && floats ? 'true' : undefined}
    >
      <Box className={styles.commentsPanelHeader}>
        <Title variant="h4" className={styles.commentsPanelTitle}>
          {copy.title(count ?? comments.length)}
        </Title>
        {onClose && (
          <Button variant="ghost" size="sm" aria-label={copy.close} icon={<X size={16} />} onClick={onClose} />
        )}
      </Box>

      <Box className={styles.commentsPanelBody}>
        {intro}
        <CommentList comments={withReply} loading={loading} empty={{ title: copy.empty }} />
      </Box>

      {onSubmit && (
        <Box className={styles.commentsPanelFooter}>
          {replyTo && (
            <Stack direction="row" align="center" justify="between" gap={2}>
              <Span variant="muted">{copy.replyingTo(replyTo.handle)}</Span>
              <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                {copy.cancelReply}
              </Button>
            </Stack>
          )}
          <Box className={styles.commentsComposer}>
            <Input
              value={draft}
              placeholder={copy.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            <Button variant="primary" size="sm" aria-label={copy.post} icon={<Send size={14} />} onClick={submit} />
          </Box>
        </Box>
      )}
    </aside>
  );
};
