import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, Send } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Tag } from '../../primitives/Tag';
import { Text } from '../../primitives/Text';
import { Input } from '../../forms/Input';
import { Popover } from '../../overlays/Popover';
import styles from './styles.module.scss';

export type ChatBubbleProps = {
  /** "them" is anyone else's message: their picture at the left, the band lit from the left. "me" is the viewer's own,
   *  the mirror of it: the picture at the right, the words set to the right, the band lit from the right. */
  side?: 'me' | 'them';
  /** The sender's picture, inside the message's band, always in a holder of its own light. */
  avatar?: React.ReactNode;
  name?: React.ReactNode;
  time?: React.ReactNode;
  /** What can be done with the message at once (like, its replies): icon buttons on grounds at the band's far end. */
  actions?: React.ReactNode;
  /** The rest (reply, sort, copy, the full time), behind three dots after the actions. */
  more?: React.ReactNode;
  /** The three dots' name for assistive tech. */
  moreLabel?: string;
  children?: React.ReactNode;
  className?: string;
};

/**
 * One message, the same in every chat and comment thread: a single band of light holds the whole item, full width,
 * lit from a side and never from its top or foot, whatever it lies in. Theirs runs from the left: picture (in a
 * holder), name over the words, and at the far end the time on a ground of its own lit from the other side, the
 * actions as icons, and three dots for the rest. The viewer's own is the same band turned round. The grounds are the
 * kit's label lights, never a painted colour.
 */
export const ChatBubble = ({ side = 'them', avatar, name, time, actions, more, moreLabel = 'More', children, className }: ChatBubbleProps) => (
  <Box className={cn(styles.row, styles[side], className)} data-side={side}>
    {avatar && <Box className={styles.avatar}>{avatar}</Box>}
    <Box className={styles.col}>
      {name && <Box className={styles.meta}><Text as="span" size="xs" weight="semibold">{name}</Text></Box>}
      <Box className={styles.bubble}>{children}</Box>
    </Box>
    {(time || actions || more) && (
      <Box className={styles.end}>
        {time && <Text as="span" size="xs" variant="muted" numeric className={styles.time}>{time}</Text>}
        {actions && <Box className={styles.actions}>{actions}</Box>}
        {more && (
          <Popover portal placement={side === 'me' ? 'bottom-start' : 'bottom-end'}
            trigger={<Button variant="glass" className={styles.dots} aria-label={moreLabel} icon={<MoreVertical size={14} />} />}>
            <Box className={styles.menu}>{more}</Box>
          </Popover>
        )}
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

export type ChatAreaProps = {
  /** Who or what the chat is with, over the messages on a ground of its own. */
  head?: React.ReactNode;
  /** The messages (ChatBubble, or a CommentThread of them). */
  children: React.ReactNode;
  /** Change it when a message is added: the newest comes into view inside the list, never by scrolling the page. */
  follow?: unknown;
  /** Things to say at a press, between the messages and the box. */
  prompts?: string[];
  onSend: (text: string) => void;
  placeholder?: string;
  sendLabel?: string;
  'aria-label'?: string;
  className?: string;
};

/**
 * A whole chat, the same wherever one is drawn: its head, then every message inside one ground of their own (lit from
 * the left, and the only part that scrolls), then the quick prompts, then the box it is written in on a ground of its
 * own, outside the messages'. A sheet, a page column and a landing page's demo all hand it their messages.
 */
export const ChatArea = ({ head, children, follow, prompts = [], onSend, placeholder, sendLabel, className, ...rest }: ChatAreaProps) => {
  const list = useRef<HTMLElement | null>(null);
  useEffect(() => { const el = list.current; if (el) el.scrollTop = el.scrollHeight; }, [follow]);
  return (
    <Box className={cn(styles.area, className)}>
      {head && <Box className={cn(styles.head, 'phi-region')}>{head}</Box>}
      <Box ref={list} role="log" aria-label={rest['aria-label']} className={styles.list}>{children}</Box>
      {prompts.length > 0 && <Box className={cn(styles.prompts, 'phi-region')}>{prompts.map((p) => <Tag key={p} interactive round onClick={() => onSend(p)}>{p}</Tag>)}</Box>}
      <ChatComposer placeholder={placeholder} sendLabel={sendLabel} onSend={onSend} />
    </Box>
  );
};
