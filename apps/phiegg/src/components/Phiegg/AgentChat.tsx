import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, ChatBubble, Input, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { Send } from 'lucide-react';
import { D, agentOf, greetingOf, t } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { PersonAvatar } from './PersonAvatar';

export type AgentChatProps = {
  agentId: string;
  /** What the chat is about (an item, a list), appended to messages that do not mention it. */
  context?: string;
  prompts?: string[];
};

/** The chat area every sheet reuses: the agent's thread, quick prompts and the composer, the same props everywhere. */
export const AgentChat: React.FC<AgentChatProps> = ({ agentId, context, prompts = [] }) => {
  const s = useStore(phieggStore); const agent = agentOf(agentId) ?? D.agents.agents[0];
  const [draft, setDraft] = useState(''); const end = useRef<HTMLElement | null>(null);
  const msgs = s.chats[agent.id] ?? [];
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);
  const send = (text: string) => { const x = text.trim(); if (!x) return; s.sendChat(agent.id, context && !x.includes(context) ? `${x}, ${context}` : x); setDraft(''); };
  return (
    <Stack direction="column" gap={2} minHeight="100%">
      <Stack direction="row" gap={2} align="center"><PersonAvatar id={agent.id} size="xs" /><Text size="sm" weight="semibold">{agent.name}</Text><Text size="xs" intent="muted">{agent.role}</Text></Stack>
      <Stack direction="column" gap={2} grow={1}>
        {msgs.length === 0 && <ChatBubble avatar={<PersonAvatar id={agent.id} size="sm" />}>{greetingOf(agent)}</ChatBubble>}
        {msgs.map((m, i) => 'text' in m
          ? <ChatBubble key={i} side={m.role === 'user' ? 'me' : 'them'} avatar={<PersonAvatar id={m.role === 'user' ? D.core.currentUserId : agent.id} size="sm" />}>{m.text}</ChatBubble>
          : 'look' in m ? <ChatBubble key={i} avatar={<PersonAvatar id={agent.id} size="sm" />}><Text size="sm" weight="bold">{m.look.title}</Text><Text size="xs">{m.look.pieces.join(' · ')}</Text></ChatBubble>
          : <Stack key={i} direction="row" justify="center"><Tag intent="success" round>{m.action}</Tag></Stack>)}
        <Box ref={end} />
      </Stack>
      {prompts.length > 0 && <Stack direction="row" gap={1} wrap>{prompts.map((p) => <Tag key={p} interactive round onClick={() => send(p)}>{p}</Tag>)}</Stack>}
      <Stack direction="row" gap={2}>
        <Input value={draft} placeholder={t('messagePh', { name: agent.name })} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(draft)} aria-label={t('messagePh', { name: agent.name })} />
        <Button variant="primary" icon={<Send size={16} />} onClick={() => send(draft)} aria-label={t('send')} />
      </Stack>
    </Stack>
  );
};
