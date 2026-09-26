'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Drawer } from '../../overlays/Drawer';
import { Input } from '../../forms/Input';
import { Button } from '../../primitives/Button';
import { Stack } from '../../layout/Stack';
import { CommentList, type CommentListProps } from './list';

export interface CommentsDrawerLabels {
  /** Receives the comment count, e.g. `(n) => `${n} comments``. */
  title: (count: number) => string;
  placeholder: string;
  post: string;
  empty: string;
}

export const DEFAULT_COMMENTS_DRAWER_LABELS: CommentsDrawerLabels = {
  title: (n) => `Comments (${n})`,
  placeholder: 'Add a comment…',
  post: 'Post',
  empty: 'Be the first to comment',
};

export interface CommentsDrawerProps extends Omit<CommentListProps, 'empty' | 'className'> {
  isOpen: boolean;
  onClose: () => void;
  /** Absent means the composer is not offered (a guest, say). */
  onSubmit?: (body: string) => void;
  labels?: Partial<CommentsDrawerLabels>;
}

/**
 * The comments surface: the same `Drawer` the bag uses, holding the comment
 * list and a composer. The title and the dismiss control belong to `Drawer`.
 */
export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  loading,
  onSubmit,
  labels,
}) => {
  const copy = { ...DEFAULT_COMMENTS_DRAWER_LABELS, ...labels };
  const [draft, setDraft] = useState('');

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSubmit?.(body);
    setDraft('');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      size="md"
      title={copy.title(comments.length)}
      footer={
        onSubmit && (
          <Stack direction="row" align="center" gap={2}>
            <Input
              value={draft}
              placeholder={copy.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            <Button variant="primary" size="sm" aria-label={copy.post} icon={<Send size={14} />} onClick={submit} />
          </Stack>
        )
      }
    >
      <CommentList comments={comments} loading={loading} empty={{ title: copy.empty }} />
    </Drawer>
  );
};
