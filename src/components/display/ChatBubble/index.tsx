import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Input } from '../../forms/Input';
import styles from './styles.module.scss';

export type ChatBubbleProps = {
  /** "me" is the viewer's own message (its light runs from the right); "them" anyone else's (from the left). */
  side?: 'me' | 'them';
  /** The sender's picture, inside the message's band. */
  avatar?: React.ReactNode;
  name?: React.ReactNode;
  time?: React.ReactNode;
  /** What can be done with the message (like, reply, run, copy): icon buttons at the band's right end. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/**
 * One message, the same in every chat and comment thread: a single band of light holds the whole item (the sender's
 * picture, their name, the words, the time), full width, and its actions sit at the right as icons. Their messages
 * are lit from the left, the viewer's own from the right; the band is the kit's label light, never a painted colour.
 */
export const ChatBubble = ({ side = 'them', avatar, name, time, actions, children, className }: ChatBubbleProps) => (
  <Box className={cn(styles.row, styles[side], className)} data-side={side}>
    {avatar && <Box className={styles.avatar}>{avatar}</Box>}
    <Box className={styles.col}>
      {(name || time) && (
        <Box className={styles.meta}>
          {name && <Text as="span" size="xs" weight="semibold">{name}</Text>}
          {time && <Text as="span" size="xs" variant="muted">{time}</Text>}
        </Box>
      )}
      <Box className={styles.bubble}>{children}</Box>
    </Box>
    {actions && <Box className={styles.actions}>{actions}</Box>}
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
    <Box className={cn(styles.composer, className)} data-surface="composer">
      <Input autoFocus={autoFocus} value={draft} placeholder={placeholder} aria-label={placeholder ?? sendLabel}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && send()} />
      <Button variant="glass" icon={<Send size={16} />} aria-label={sendLabel} title={sendLabel} onClick={send} />
    </Box>
  );
};
