'use client';

import React from 'react';
import { Bookmark, Heart, MessageCircle, Plus, Share2, Check } from 'lucide-react';
import { Avatar } from '../../media/Avatar';
import { Span } from '../../primitives/Span';
import { cn } from '../../../utils/cn';
import styles from '../styles.module.scss';
import { Box } from '../../layout/Box';

/** Copy for the rail's controls. Supplied by the app; defaults are a fallback. */
export interface EngagementRailLabels {
  like: string;
  comment: string;
  save: string;
  share: string;
  follow: string;
  following: string;
}

export const DEFAULT_RAIL_LABELS: EngagementRailLabels = {
  like: 'Like',
  comment: 'Comments',
  save: 'Save',
  share: 'Share',
  follow: 'Follow',
  following: 'Following',
};

export interface EngagementRailProps {
  author: { handle: string; name: string; avatar?: string };
  /** Pre-formatted counts — `1.8M`, not 1800000 — so formatting stays with the locale. */
  counts: { likes: string; comments: string; saves: string; shares: string };
  liked?: boolean;
  saved?: boolean;
  following?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onFollow?: () => void;
  onOpenAuthor?: () => void;
  labels?: Partial<EngagementRailLabels>;
  className?: string;
}

/**
 * The vertical action rail that rides beside an immersive post: avatar with
 * the follow badge on its chin, then like / comments / save / share, each with
 * its count beneath. Counts arrive formatted; state arrives resolved — the
 * rail renders and reports, it never decides.
 */
export const EngagementRail: React.FC<EngagementRailProps> = ({
  author,
  counts,
  liked = false,
  saved = false,
  following = false,
  onLike,
  onComment,
  onSave,
  onShare,
  onFollow,
  onOpenAuthor,
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_RAIL_LABELS, ...labels };

  const item = (
    key: string,
    label: string,
    count: string,
    icon: React.ReactNode,
    onClick?: () => void,
    active?: boolean
  ) => (
    <Box key={key} className={styles.railGroup}>
      <button
        type="button"
        className={styles.railButton}
        data-active={active ? 'true' : undefined}
        aria-label={label}
        aria-pressed={onClick ? active : undefined}
        onClick={onClick}
      >
        {icon}
      </button>
      <Span variant="muted">{count}</Span>
    </Box>
  );

  return (
    <Box className={cn(styles.rail, className)} data-engagement-rail="true">
      <Box className={cn(styles.railGroup, styles.railAvatar)}>
        <button
          type="button"
          className={styles.railButton}
          aria-label={author.name}
          onClick={onOpenAuthor}
        >
          <Avatar src={author.avatar} alt={author.name} initials={author.name.slice(0, 2)} size="md" />
        </button>
        {onFollow && (
          <button
            type="button"
            className={styles.followBadge}
            data-following={following ? 'true' : undefined}
            aria-label={following ? copy.following : copy.follow}
            aria-pressed={following}
            onClick={onFollow}
          >
            {following ? <Check size={11} /> : <Plus size={11} />}
          </button>
        )}
      </Box>

      {item('like', copy.like, counts.likes, <Heart size={22} fill={liked ? 'currentColor' : 'none'} />, onLike, liked)}
      {item('comment', copy.comment, counts.comments, <MessageCircle size={22} />, onComment)}
      {item('save', copy.save, counts.saves, <Bookmark size={22} fill={saved ? 'currentColor' : 'none'} />, onSave, saved)}
      {item('share', copy.share, counts.shares, <Share2 size={22} />, onShare)}
    </Box>
  );
};
