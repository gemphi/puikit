
import React from 'react';
import { Box, Button, Input } from '@pui/components';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { byId, initials, tone, useStored, type DB, type Msg } from '../data';
import type { Open } from '../panels';

/** Conversations list + thread. Sent messages persist locally until the messaging API exists. */
export const Messages: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const meId = db.core.currentUserId;
  const convs = db.messages.conversations;
  const [cur, setCur] = React.useState(convs[0]?.id || '');
  const [q, setQ] = React.useState('');
  const [sent, setSent] = useStored<Record<string, Msg[]>>('phi.sent', {});
  const [read, setRead] = useStored<Record<string, boolean>>('phi.read', {});
  const [draft, setDraft] = React.useState('');
  const c = convs.find((x) => x.id === cur);
  const msgs = [...(db.messages.threads[cur] || []), ...(sent[cur] || [])];
  const list = convs.filter((x) => !q || x.title.toLowerCase().includes(q.toLowerCase()));
  const pick = (id: string) => { setCur(id); setRead({ ...read, [id]: true }); };
  const send = (e: React.FormEvent) => {
    e.preventDefault(); const t = draft.trim(); if (!t) return;
    const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setSent({ ...sent, [cur]: [...(sent[cur] || []), { id: 'me' + Date.now(), authorId: meId, at, text: t }] }); setDraft('');
  };
  return (
    <>
      <Box as="header"><Box as="h1" className={k.title}>Messages</Box></Box>
      <Box className={s.inbox}>
        <Box className={s.convs}>
          <Input className={k.input} style={{ flex: 'none' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" />
          {list.map((x) => { const u = byId(db.core.users, x.userIds[0]); const [bg, ink] = tone(u?.tone || 'sand'); const unread = !read[x.id] && x.unread > 0; return (
            <Box as="button" key={x.id} className={k.item + (x.id === cur ? ' ' + k.itemOn : '')} style={{ minHeight: 60, borderRadius: 'var(--phi-radius-md)' }} onClick={() => pick(x.id)}>
              <Box as="span" className={s.mini} style={{ background: bg, color: ink }}>{initials(x.title)}</Box>
              <Box as="span" style={{ flex: 1, minWidth: 0 }}><Box as="strong" style={{ display: 'block' }}>{x.title}</Box><Box as="span" className={k.small} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.last}</Box></Box>
              {unread ? <Box as="span" className={s.dot}>{x.unread}</Box> : <Box as="span" className={k.small}>{x.at}</Box>}
            </Box>); })}
        </Box>
        {c ? (
          <Box className={k.chat}>
            <Box className={k.row} style={{ justifyContent: 'space-between' }}>
              <Box as="h2" className={k.blockTitle}>{c.title}</Box>
              {c.userIds[0] && byId(db.core.users, c.userIds[0]) ? <Button size="sm" variant="ghost" onClick={() => onOpen({ kind: 'user', id: c.userIds[0] })}>Profile</Button> : null}
            </Box>
            <Box className={k.msgs} aria-live="polite">
              {msgs.map((mm) => <Box key={mm.id} className={k.msg + (mm.authorId === meId ? ' ' + k.me : '')}>{mm.text}<Box className={k.small} style={{ color: 'inherit', opacity: 0.7, marginTop: 4 }}>{mm.at}</Box></Box>)}
            </Box>
            <Box as="form" className={k.row} onSubmit={send}>
              <Input className={k.input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={'Message ' + c.title} aria-label="Message" />
              <Button type="submit" variant="primary">Send</Button>
            </Box>
          </Box>
        ) : null}
      </Box>
    </>
  );
};
