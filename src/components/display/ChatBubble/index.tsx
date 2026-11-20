import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Input } from '../../forms/Input';
import styles from './styles.module.scss';

export type ChatBubbleProps = {
  /** "me" is the viewer's own message; "them" anyone else's. Both are lit from the left; the viewer's own is the stronger. */
  side?: 'me' | 'them';
  /** The sender's picture, inside the message's band, always in a holder of its own light. */
  avatar?: React.ReactNode;
  name?: React.ReactNode;
  time?: React.ReactNode;
  /** What can be done with the message (like, reply, run, copy): icon buttons at the band's right end. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/**
 * One message, the same in every chat and comment thread: a single band of light holds the whole item, full width,
 * always lit from the left and never from its top or foot, whatever it lies in. The sender's picture stands in a
 * holder; their name is over the words; the time is at the right end on a ground of its own lit from the right, so
 * the two lights meet across the band; its actions are icons after it. The grounds are the kit's label lights.
 */
export const ChatBubble = ({ side = 'them', avatar, name, time, actions, children, className }: ChatBubbleProps) => (
  <Box className={cn(styles.row, styles[side], className)} data-side={side}>
    {avatar && <Box className={styles.avatar}>{avatar}</Box>}
    <Box className={styles.col}>
      {name && (
        <Box className={styles.meta}>
          {name && <Text as="span" size="xs" weight="semibold">{name}</Text>}
        </Box>
      )}
      <Box className={styles.bubble}>{children}</Box>
    </Box>
    {(time || actions) && (
      <Box className={styles.end}>
        {time && <Text as="span" size="xs" variant="muted" numeric className={styles.time}>{time}</Text>}
        {actions && <Box className={styles.actions}>{actions}</Box>}
      </Box>
    )}
  </Box>
);

export type ChatComposerProps = {
  /** What was written, sent with Enter or the button; the box clears itself. */
  onSend: (text: string) => void;
  placeholder?: string;
  /** The send button's name for assistive tech and its tooltip. */
  sendLabel?: string;
  autoFocus?: boolean;
  className?: string;
};

/**
 * Where a message is written, the same under every chat, comment thread and reply: the box and its send button on the
 * kit's one surface, so the foot of a thread is lit like the thread above it.
 */
export const ChatComposer = ({ onSend, placeholder, sendLabel = 'Send', autoFocus, className }: ChatComposerProps) => {
  const [draft, setDraft] = useState('');
  const send = () => { const text = draft.trim(); if (!text) return; onSend(text); setDraft(''); };
  return (
    <Box className={cn(styles.composer, 'phi-region', className)}>
      <Input autoFocus={autoFocus} value={draft} placeholder={placeholder} aria-label={placeholder ?? sendLabel}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && send()} />
      <Button variant="glass" icon={<Send size={16} />} aria-label={sendLabel} title={sendLabel} onClick={send} />
    </Box>
  );
};
