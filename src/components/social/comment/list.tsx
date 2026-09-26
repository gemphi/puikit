import React from 'react';
import { Collection, type CollectionEmpty } from '../../display/collection';
import { CommentItem, type CommentItemProps } from './item';

export interface CommentListProps {
  comments: CommentItemProps[];
  loading?: boolean;
  skeletonCount?: number;
  empty?: CollectionEmpty;
  className?: string;
}

/** A stack of comments, through the library's one collection renderer. */
export const CommentList: React.FC<CommentListProps> = ({
  comments,
  loading,
  skeletonCount = 5,
  empty,
  className,
}) => (
  <Collection
    items={comments}
    getKey={(c) => c.id}
    renderItem={(comment) => <CommentItem {...comment} />}
    layout="stack"
    gap={3}
    loading={loading}
    skeletonCount={skeletonCount}
    skeleton={{ media: false, lines: 2 }}
    empty={empty}
    className={className}
  />
);
