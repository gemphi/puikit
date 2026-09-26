'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X } from 'lucide-react';
import { usePortalTarget } from '../../overlays/usePortalTarget';
import { useDismiss } from '../../overlays/useDismiss';
import { PostItem, type PostItemProps } from './item';
import { cn } from '../../../utils/cn';
import styles from '../styles.module.scss';
import { Box } from '../../layout/Box';

export interface PostOverlayLabels {
  close: string;
  showComments: string;
  hideComments: string;
}

export const DEFAULT_POST_OVERLAY_LABELS: PostOverlayLabels = {
  close: 'Close',
  showComments: 'Show comments',
  hideComments: 'Hide comments',
};

export interface PostOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /** The post, exactly as `PostItem` takes it; rendered immersive. */
  post?: PostItemProps | null;
  /**
   * The side panel — author row, caption, thread, composer — composed by the
   * app. When present, a toggle on the stage shows and hides it like a drawer.
   * A function receives the panel's own close, for its dismiss control.
   */
  panel?: React.ReactNode | ((closePanel: () => void) => React.ReactNode);
  /** Whether the panel starts open. */
  defaultCommentsOpen?: boolean;
  labels?: Partial<PostOverlayLabels>;
  className?: string;
}

/**
 * A post opened in place — from a profile grid, say — rather than on its own
 * page: the immersive frame with its rail on a dimmed, blurred stage, and the
 * comment thread in a side panel that toggles like a drawer. Escape and the
 * backdrop both dismiss; every control on the stage is glass, never a fill.
 */
export const PostOverlay: React.FC<PostOverlayProps> = ({
  isOpen,
  onClose,
  post,
  panel,
  defaultCommentsOpen = true,
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_POST_OVERLAY_LABELS, ...labels };
  const portalTarget = usePortalTarget();
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen);
  useDismiss(isOpen, onClose);

  // Each opening starts from the configured rest state.
  useEffect(() => {
    if (isOpen) setCommentsOpen(defaultCommentsOpen);
  }, [isOpen, defaultCommentsOpen]);

  if (!isOpen || !portalTarget || !post) return null;

  // The rail's comment control toggles the panel, same as the stage toggle —
  // inside the overlay a comment click never navigates anywhere.
  const postProps = post.rail
    ? { ...post, rail: { ...post.rail, onComment: () => setCommentsOpen((o) => !o) } }
    : post;

  return createPortal(
    <Box
      className={cn(styles.postOverlay, className)}
      role="dialog"
      aria-modal="true"
      data-post-overlay="true"
    >
      <Box className={styles.postOverlayBackdrop} onClick={onClose} aria-hidden="true" />

      <Box className={styles.postOverlayStage}>
        <PostItem {...postProps} variant="immersive" onOpen={undefined} keyboard />
        <button
          type="button"
          className={cn(styles.railButton, styles.postOverlayClose)}
          aria-label={copy.close}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        {panel && (
          <button
            type="button"
            className={cn(styles.railButton, styles.postOverlayPanelToggle)}
            aria-label={commentsOpen ? copy.hideComments : copy.showComments}
            aria-expanded={commentsOpen}
            onClick={() => setCommentsOpen((o) => !o)}
          >
            <MessageCircle size={20} />
          </button>
        )}
      </Box>

      {panel && commentsOpen && (
        <Box className={styles.postOverlayPanel}>
          {typeof panel === 'function' ? panel(() => setCommentsOpen(false)) : panel}
        </Box>
      )}
    </Box>,
    portalTarget
  );
};
