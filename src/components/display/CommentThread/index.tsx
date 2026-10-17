import React, { useMemo, useState } from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Card, CardBody } from '../card';
import styles from './styles.module.scss';

export type ThreadItem = {
  id: string;
  /** null for a top-level comment. */
  parentId: string | null;
  author: React.ReactNode;
  /** Time, role, anything under the author. */
  meta?: React.ReactNode;
  text: React.ReactNode;
};

export type CommentThreadLabels = {
  reply?: string;
  /** "Show 4 replies" */
  show?: (n: number) => string;
  hide?: string;
};

export type CommentThreadProps = {
  comments: ThreadItem[];
  /** Replies deeper than this are drawn at this level (default 6). */
  maxDepth?: number;
  /** Levels open on first render; deeper replies start folded (default: all open). */
  openDepth?: number;
  onReply?: (id: string) => void;
  labels?: CommentThreadLabels;
  className?: string;
  'aria-label'?: string;
  /** The thread sits on its own card with this many cascaded copies above it (0 for a bare list). Default 2. */
  depth?: number;
  /** Scroll the thread inside its card past this height (the cascade stays outside the scroll). */
  maxHeight?: string;
};

const DEFAULTS: Required<CommentThreadLabels> = { reply: 'Reply', show: (n) => `Show ${n} ${n === 1 ? 'reply' : 'replies'}`, hide: 'Hide replies' };

/**
 * CommentThread: nested replies drawn as a tree. Each level sits on a rail in the theme colour, indented by a token,
 * and every comment with replies can fold them. Order is the order of `comments`; parents may come after children.
 */
export const CommentThread = ({ comments, maxDepth = 6, openDepth = Infinity, onReply, labels, className, depth = 2, maxHeight, ...rest }: CommentThreadProps) => {
  const L = { ...DEFAULTS, ...labels };
  const kids = useMemo(() => {
    const ids = new Set(comments.map((c) => c.id)); const m = new Map<string, ThreadItem[]>();
    for (const c of comments) { const k = c.parentId && ids.has(c.parentId) ? c.parentId : ''; (m.get(k) ?? m.set(k, []).get(k)!).push(c); }
    return m;
  }, [comments]);
  const count = useMemo(() => { const memo = new Map<string, number>(); const n = (id: string): number => memo.get(id) ?? (memo.set(id, (kids.get(id) ?? []).reduce((s, c) => s + 1 + n(c.id), 0)), memo.get(id)!); return n; }, [kids]);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const node = (c: ThreadItem, level: number): React.ReactNode => {
    const children = kids.get(c.id) ?? []; const total = count(c.id);
    const open = toggled[c.id] ?? level + 1 < openDepth;
    return (
      <Box key={c.id} role="listitem" className={styles.comment} data-depth={Math.min(level, maxDepth)}>
        <Box className={styles.head}><Box className={styles.author}>{c.author}</Box>{c.meta != null && <Box as="span" className={styles.meta}>{c.meta}</Box>}</Box>
        <Box className={styles.text}>{c.text}</Box>
        {(onReply || total > 0) && (
          <Box className={styles.actions}>
            {onReply && <Button size="sm" variant="ghost" className={styles.action} onClick={() => onReply(c.id)}>{L.reply}</Button>}
            {total > 0 && <Button size="sm" variant="ghost" className={styles.action} aria-expanded={open} onClick={() => setToggled((x) => ({ ...x, [c.id]: !open }))}>{open ? L.hide : L.show(total)}</Button>}
          </Box>
        )}
        {open && children.length > 0 && (
          <Box role="list" className={cn(styles.replies, level + 1 >= maxDepth && styles.flat)} data-level={level + 1}>
            {children.map((k) => node(k, level + 1))}
          </Box>
        )}
      </Box>
    );
  };
  const list = <Box role="list" aria-label={rest['aria-label']} className={cn(styles.thread, !depth && className)}>{(kids.get('') ?? []).map((c) => node(c, 0))}</Box>;
  // The comment column carries its own cascade: the thread is a card with copies stacked above it, like every deck.
  return depth ? <Card depth={depth} hoverable={false} tint="none" className={cn(styles.card, className)}><CardBody className={styles.scroll} style={maxHeight ? { maxHeight } : undefined}>{list}</CardBody></Card> : list;
};
