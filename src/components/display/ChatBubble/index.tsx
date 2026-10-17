import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../../primitives/Text';
import styles from './styles.module.scss';

export type ChatBubbleProps = {
  /** "me" sits right on the --phi-bubble-me fill; "them" sits left on --phi-bubble-them. */
  side?: 'me' | 'them';
  /** Photo / avatar beside the bubble. */
  avatar?: React.ReactNode;
  name?: React.ReactNode;
  time?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/** One chat message. Fills come from tokens so an app's gradient choice reaches its chats. */
export const ChatBubble = ({ side = 'them', avatar, name, time, children, className }: ChatBubbleProps) => (
  <Box className={cn(styles.row, styles[side], className)} data-side={side}>
    {avatar && <Box className={styles.avatar}>{avatar}</Box>}
    <Box className={styles.col}>
      {name && <Text size="xs" variant="muted" className={styles.name}>{name}</Text>}
      <Box className={styles.bubble}>{children}</Box>
      {time && <Text size="xs" variant="muted" className={styles.time}>{time}</Text>}
    </Box>
  </Box>
);
