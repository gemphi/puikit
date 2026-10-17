
import React from 'react';
import { Box, Button, Input } from '@pui/components';
import k from '@phi-kit/kit.module.scss';
import { byId, useStored, type DB } from './data';

type C = { id: string; parentId: string | null; authorId: string; text: string; at: number; likes: number };

/** Threaded comments for any item id (replies nest up to 6 deep). Local until the comments API exists. */
export const Comments: React.FC<{ db: DB; targetId: string }> = ({ db, targetId }) => {
  const [all, setAll] = useStored<Record<string, C[]>>('phi.comments', {});
  const [liked, setLiked] = useStored<Record<string, boolean>>('phi.commentLikes', {});
  const [draft, setDraft] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<C | null>(null);
  const list = all[targetId] || [];
  const kids: Record<string, C[]> = {}; list.forEach((c) => (kids[c.parentId || 'root'] ||= []).push(c));
  const rows: (C & { depth: number })[] = [];
  const walk = (key: string, depth: number) => (kids[key] || []).forEach((c) => { rows.push({ ...c, depth }); walk(c.id, depth + 1); });
  walk('root', 0);
  const post = (e: React.FormEvent) => {
    e.preventDefault(); const t = draft.trim(); if (!t) return;
    const c: C = { id: 'c' + Date.now(), parentId: replyTo ? replyTo.id : null, authorId: db.core.currentUserId, text: t, at: Date.now(), likes: 0 };
    setAll({ ...all, [targetId]: [...list, c] }); setDraft(''); setReplyTo(null);
  };
  return (
    <Box as="section" className={k.block}>
      <Box as="h3" className={k.blockTitle}>Comments {rows.length ? <Box as="span" className={k.small}>{rows.length}</Box> : null}</Box>
      {rows.map((c) => { const u = byId(db.core.users, c.authorId); return (
        <Box key={c.id} style={{ marginLeft: Math.min(c.depth, 6) * 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box as="span" className={k.small}><Box as="strong" style={{ color: 'var(--phi-color-text-primary)' }}>{u?.name || 'You'}</Box> · {new Date(c.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Box>
          <Box as="span" className={k.body}>{c.text}</Box>
          <Box className={k.row}>
            <Button size="sm" variant="ghost" onClick={() => setLiked({ ...liked, [c.id]: !liked[c.id] })}>{liked[c.id] ? 'Liked' : 'Like'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setReplyTo(c)}>Reply</Button>
          </Box>
        </Box>); })}
      {!rows.length ? <Box as="span" className={k.small}>No comments yet.</Box> : null}
      {replyTo ? <Box className={k.row}><Box as="span" className={k.small}>Replying to {byId(db.core.users, replyTo.authorId)?.name || 'you'}</Box><Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button></Box> : null}
      <Box as="form" className={k.row} onSubmit={post}>
        <Input className={k.input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={replyTo ? 'Write a reply' : 'Add a comment'} aria-label="Comment" />
        <Button type="submit" variant="primary">Post</Button>
      </Box>
    </Box>
  );
};
