'use client';

import React, { useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { PostItem, type PostItemProps } from './item';
import { cn } from '../../../utils/cn';
import styles from '../styles.module.scss';
import { Box } from '../../layout/Box';

export interface PostStageLabels {
  close: string;
  previous: string;
  next: string;
}

export const DEFAULT_POST_STAGE_LABELS: PostStageLabels = {
  close: 'Close',
  previous: 'Previous post',
  next: 'Next post',
};

export interface PostStageProps {
  /** The post, exactly as `PostItem` takes it; rendered immersive. */
  post: PostItemProps;
  /** Back to wherever the viewer came from; absent means no close control. */
  onClose?: () => void;
  /** Adjacent posts in the feed order; absent ends disable the chevrons. */
  onPrev?: () => void;
  onNext?: () => void;
  /** `square` crops the opened frame to 1/1 — the opened-post shape. */
  shape?: 'portrait' | 'square';
  labels?: Partial<PostStageLabels>;
  className?: string;
}

/**
 * A post with the stage to itself — the post page's frame. The close control
 * sits top-left and the prev/next chevrons ride the right edge, all glass;
 * up/down walk the feed from the keyboard, left/right walk a deck's slides.
 */
export const PostStage: React.FC<PostStageProps> = ({
  post,
  onClose,
  onPrev,
  onNext,
  shape = 'portrait',
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_POST_STAGE_LABELS, ...labels };

  useEffect(() => {
    if ((!onPrev && !onNext) || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (document.querySelector('[role="dialog"], [data-post-overlay="true"]')) return;
      if (e.key === 'ArrowUp' && onPrev) { e.preventDefault(); onPrev(); }
      else if (e.key === 'ArrowDown' && onNext) { e.preventDefault(); onNext(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  return (
    <Box className={cn(styles.stageBox, className)} data-post-stage="true" data-shape={shape}>
      <PostItem {...post} variant="immersive" onOpen={undefined} keyboard />

      {onClose && (
        <button
          type="button"
          className={cn(styles.railButton, styles.stageClose)}
          aria-label={copy.close}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      )}

      {(onPrev || onNext) && (
        <Box className={styles.stageNav}>
          <button
            type="button"
            className={styles.railButton}
            aria-label={copy.previous}
            disabled={!onPrev}
            onClick={onPrev}
          >
            <ChevronUp size={20} />
          </button>
          <button
            type="button"
            className={styles.railButton}
            aria-label={copy.next}
            disabled={!onNext}
            onClick={onNext}
          >
            <ChevronDown size={20} />
          </button>
        </Box>
      )}
    </Box>
  );
};
