import React from 'react';
import { ChatBubble, ChatComposer, Stack } from '@pui/components';
import type { Block } from '../data';
import { chat } from '../api';

type Msg = { role: 'user' | 'assistant'; text: string };

/** Persona chat via Phiora's model proxy (POST {VITE_PHI_API}/chat); the block's fallback answers when no API is set or it fails.
 *  The messages and the box they are written in are the kit's own (ChatBubble, ChatComposer), as in every other chat. */
export const Chat: React.FC<{ b: Block }> = ({ b }) => {
  const [msgs, setMsgs] = React.useState<Msg[]>(b.messages || []);
  const send = async (t: string) => {
    const next: Msg[] = [...msgs, { role: 'user', text: t }];
    setMsgs(next);
    const r = await chat(b.app || '', b.persona || '', next);
    setMsgs((m) => [...m, { role: 'assistant', text: r ? r.text : b.fallback || 'Noted.' }]);
  };
  return (
    <Stack direction="column" gap={3} surface="panel" minHeight="24rem">
      <Stack direction="column" gap={2} flex="1" aria-live="polite">
        {msgs.map((m, i) => <ChatBubble key={i} side={m.role === 'user' ? 'me' : 'them'} name={m.role === 'user' ? undefined : b.persona}>{m.text}</ChatBubble>)}
      </Stack>
      <ChatComposer onSend={send} placeholder={b.placeholder || 'Message ' + (b.persona || '')} />
    </Stack>
  );
};
