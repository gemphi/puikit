import React, { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, ChevronUp, Clock, Heart, Reply } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { ChatBubble, ChatComposer } from '../ChatBubble';
import styles from './styles.module.scss';

export type ThreadItem = {
  id: string;
  /** null for a top-level comment. */
  parentId: string | null;
  /** Who wrote it (a name), above the bubble. */
  author: React.ReactNode;
  /** Their picture beside the bubble. */
  avatar?: React.ReactNode;
  /** Time, role, anything under the bubble. */
  meta?: React.ReactNode;
  text: React.ReactNode;
  /** Written by the viewer: the bubble sits on the right, as in a chat. */
  mine?: boolean;
  likes?: number;
  liked?: boolean;
  /** More that can be done with this one (run, save, copy): icons after like and reply. */
  actions?: React.ReactNode;
};

export type CommentThreadLabels = {
  reply?: string;
  /** "Show 4 replies" */
  show?: (n: number) => string;
  hide?: string;
  like?: string;
  send?: string;
  /** The reply box's placeholder. */
  replyTo?: string;
  /** The three dots, and what they hold: the order of the thread. */
  more?: string; oldest?: string; newest?: string; liked?: string;
  /** "3 likes" */
  likes?: (n: number) => string;
};
type Order = 'oldest' | 'newest' | 'liked';

export type CommentThreadProps = {
  comments: ThreadItem[];
  /** Replies deeper than this are drawn at this level (default 6). */
  maxDepth?: number;
  /** Levels open on first render; deeper replies start folded (default: all open). */
  openDepth?: number;
  /** A reply written under a comment (the thread opens its own reply box); without it there is no Reply. */
  onReply?: (parentId: string, text: string) => void;
  /** A like toggled on a comment; without it there is no Like. */
  onLike?: (id: string) => void;
  labels?: CommentThreadLabels;
  className?: string;
  'aria-label'?: string;
  /** Scroll the thread past this height. */
  maxHeight?: string;
  /** A new comment written at the foot of the thread; with it the thread ends in its composer. */
  onSend?: (text: string) => void;
  /** The foot composer's placeholder. */
  placeholder?: string;
};

const DEFAULTS: Required<CommentThreadLabels> = {
  reply: 'Reply', show: (n) => `Show ${n} ${n === 1 ? 'reply' : 'replies'}`, hide: 'Hide replies', like: 'Like', send: 'Send', replyTo: 'Reply...',
  more: 'More', oldest: 'Oldest first', newest: 'Newest first', liked: 'Most liked', likes: (n) => `${n} ${n === 1 ? 'like' : 'likes'}`,
};

/**
 * CommentThread: comments, replies and chat lines, on the same ChatBubble as every chat. A comment has no ground but
 * its own band (lit from the left, like every message); its replies sit under it, each level stepping in by one
 * space (16px), so depth reads from the step alone, with no box round a box and no line. A like and a comment's
 * replies are icons on grounds at the band's far end; three dots after them hold the rest: the time, the likes,
 * Reply, and the order of the whole thread (oldest, newest, most liked). Its actions are icons at the right of the band:
 * Like toggles through onLike, Reply opens the composer under the comment and sends through onReply, a count folds or
 * shows its replies. With onSend the thread ends in the same composer, on the same surface.
 */
export const CommentThread = ({ comments, maxDepth = 6, openDepth = Infinity, onReply, onLike, labels, className, maxHeight, onSend, placeholder, ...rest }: CommentThreadProps) => {
  const L = { ...DEFAULTS, ...labels };
  const kids = useMemo(() => {
    const ids = new Set(comments.map((c) => c.id)); const m = new Map<string, ThreadItem[]>();
    for (const c of comments) { const k = c.parentId && ids.has(c.parentId) ? c.parentId : ''; (m.get(k) ?? m.set(k, []).get(k)!).push(c); }
    return m;
  }, [comments]);
  const count = useMemo(() => {
    const memo = new Map<string, number>();
    const n = (id: string): number => memo.get(id) ?? (memo.set(id, (kids.get(id) ?? []).reduce((s, c) => s + 1 + n(c.id), 0)), memo.get(id)!);
    return n;
  }, [kids]);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [replying, setReplying] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('oldest');
  const ordered = (list: ThreadItem[]) => (order === 'newest' ? [...list].reverse() : order === 'liked' ? [...list].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)) : list);
  const ORDERS: [Order, string, typeof Clock][] = [['oldest', L.oldest, ArrowUpNarrowWide], ['newest', L.newest, ArrowDownWideNarrow], ['liked', L.liked, Heart]];
  const reply = (id: string, text: string) => { onReply?.(id, text); setReplying(null); setToggled((x) => ({ ...x, [id]: true })); };

  const node = (c: ThreadItem, level: number): React.ReactNode => {
    const children = kids.get(c.id) ?? []; const total = count(c.id);
    const open = toggled[c.id] ?? level + 1 < openDepth;
    return (
      <Box key={c.id} role="listitem" className={styles.comment} data-depth={Math.min(level, maxDepth)}>
        {/* The comment's actions are icons at the right of its own band: like, reply, and its replies folded or shown. */}
        <ChatBubble side={c.mine ? 'me' : 'them'} avatar={c.avatar} name={c.author} time={c.meta} moreLabel={L.more}
          more={<>
            {(c.meta || c.likes) ? <Text as="span" size="xs" variant="muted" className={styles.fact}>{[c.meta, c.likes ? L.likes(c.likes) : null].filter(Boolean).map((x, k) => <React.Fragment key={k}>{k ? ' · ' : null}{x}</React.Fragment>)}</Text> : null}
            {onReply && <Button variant="glass" iconLeft={Reply} aria-expanded={replying === c.id} onClick={() => setReplying(replying === c.id ? null : c.id)}>{L.reply}</Button>}
            {ORDERS.map(([id, label, I]) => <Button key={id} variant="glass" iconLeft={I} aria-pressed={order === id} onClick={() => setOrder(id)}>{label}</Button>)}
          </>}
          actions={(onLike || total > 0 || c.actions) ? <>
            {onLike && (
              <Button variant="glass" className={styles.action} aria-pressed={!!c.liked} aria-label={L.like} title={L.like} onClick={() => onLike(c.id)}
                icon={<Heart size={14} fill={c.liked ? 'currentColor' : 'none'} />}>{c.likes ? String(c.likes) : undefined}</Button>
            )}
            {total > 0 && <Button variant="glass" className={styles.action} aria-expanded={open} aria-label={open ? L.hide : L.show(total)} title={open ? L.hide : L.show(total)}
              icon={open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} onClick={() => setToggled((x) => ({ ...x, [c.id]: !open }))}>{String(total)}</Button>}
            {c.actions}
          </> : undefined}>{c.text}</ChatBubble>
        {replying === c.id && <Box className={styles.reply}><ChatComposer autoFocus placeholder={L.replyTo} sendLabel={L.send} onSend={(text) => reply(c.id, text)} /></Box>}
        {open && children.length > 0 && (
          <Box role="list" className={cn(styles.replies, level + 1 >= maxDepth && styles.flat)} data-level={level + 1}>
            {ordered(children).map((k) => node(k, level + 1))}
          </Box>
        )}
      </Box>
    );
  };
  const list = (
    <Box role="list" aria-label={rest['aria-label']} className={cn(styles.thread, maxHeight && styles.scroll, !onSend && className)} style={maxHeight ? { maxHeight } : undefined}>
      {ordered(kids.get('') ?? []).map((c) => node(c, 0))}
    </Box>
  );
  // With a composer the thread and its foot are one column: the list scrolls, the composer stays.
  return onSend ? <Box className={cn(styles.area, className)}>{list}<ChatComposer placeholder={placeholder} sendLabel={L.send} onSend={onSend} /></Box> : list;
};
