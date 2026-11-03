import React from 'react';
import { Box, Button, Input, Stack } from '@pui/components';
import type { Block } from '../data';
import { chat } from '../api';
import s from '../kit.module.scss';

type Msg = { role: 'user' | 'assistant'; text: string };

/** Persona chat via Phiora's model proxy (POST {VITE_PHI_API}/chat); the block's fallback answers when no API is set or it fails. */
export const Chat: React.FC<{ b: Block }> = ({ b }) => {
  const [msgs, setMsgs] = React.useState<Msg[]>(b.messages || []);
  const [draft, setDraft] = React.useState('');
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = draft.trim(); if (!t) return;
    const next: Msg[] = [...msgs, { role: 'user', text: t }];
    setDraft(''); setMsgs(next);
    const r = await chat(b.app || '', b.persona || '', next);
    setMsgs((m) => [...m, { role: 'assistant', text: r ? r.text : b.fallback || 'Noted.' }]);
  };
  return (
    <Box className={s.chat}>
      <Box className={s.msgs} aria-live="polite">
        {msgs.map((m, i) => <Box key={i} className={s.msg + (m.role === 'user' ? ' ' + s.me : '')}>{m.text}</Box>)}
      </Box>
      <Stack as="form" direction="row" gap={2} wrap align="center" onSubmit={send}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={b.placeholder || 'Message ' + (b.persona || '')} aria-label="Message" />
        <Button type="submit" variant="primary">Send</Button>
      </Stack>
    </Box>
  );
};
