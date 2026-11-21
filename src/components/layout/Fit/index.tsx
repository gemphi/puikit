import React, { createContext, useContext } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { Stack } from '../Stack';
import { useSectionExpanded } from '../Sections';
import { Pressable } from '../../primitives/Pressable';
import styles from './styles.module.scss';

/** The ratio a Fit gives what it holds: a Frame inside takes it instead of its own. */
const FitRatio = createContext<string | null>(null);
export const useFitRatio = () => useContext(FitRatio);
/** Give what it holds a ratio of its own ('auto' fills the box it is in: a mosaic's big cell). */
export const FitRatioProvider = FitRatio.Provider;

export type FitProps = {
  /** Width over height of the box (1: a square, 0.75: portrait 3:4, 16/9: wide). */
  ratio?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Fit: the largest box of `ratio` that fits the space its parent leaves, centred in it. It grows to fill a flex
 * column (an expanded section, a full-page pane), measures that space as a size container and sizes its box by
 * the narrower side, so a picture uses the whole stage without stretching or scrolling. A Frame inside takes its shape.
 */
export const Fit = ({ ratio = 1, className, children }: FitProps) => (
  <Box className={cn('pui-fit', styles.fit, className)} style={{ '--pui-fit-ratio': String(ratio) } as React.CSSProperties}>
    <Box className={styles.box}><FitRatio.Provider value={`${ratio}/1`}>{children}</FitRatio.Provider></Box>
  </Box>
);

/** An action on the picture itself (like, save, share, cart, full screen): an icon floating over the picture. */
export type MediaStageAction = { id: string; label: string; icon: React.ReactNode; active?: boolean; onClick: () => void };

export type MediaStageProps = {
  /** The picture (an image, a framed render). */
  media: React.ReactNode;
  /** What sits under it (the angles, a caption). */
  children?: React.ReactNode;
  /** Icons floating over the picture's top left, where a render leaves the corner empty; each says its name on hover. */
  actions?: MediaStageAction[];
};

/**
 * MediaStage: a section's picture with its controls under it, sized by the kit, never by the page: a square as wide as
 * its column in its section, and when the section is expanded, the largest square of the whole stage.
 */
export const MediaStage = ({ media, children, actions = [] }: MediaStageProps) => {
  const big = useSectionExpanded();
  const icons = actions.length > 0 && (
    <Box className={styles.actions} role="toolbar">
      {actions.map((a) => (
        <Pressable key={a.id} className={cn(styles.action, a.active && styles.on)} onClick={a.onClick} aria-label={a.label} aria-pressed={a.active} title={a.label}>{a.icon}</Pressable>
      ))}
    </Box>
  );
  return (
    <Stack direction="column" gap={2} className="pui-media-stage">
      <Box className={styles.stage}>
        {big ? <Fit ratio={1}>{media}</Fit> : <Box className={styles.column}><Fit ratio={1}>{media}</Fit></Box>}
        {icons}
      </Box>
      {children}
    </Stack>
  );
};
