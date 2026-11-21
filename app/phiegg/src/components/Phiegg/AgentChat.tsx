import React from 'react';
import { ChatArea, ChatBubble, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { D, greetingOf, t, itemOf } from '../../lib/data';
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
  const s = useStore(phieggStore); const agent = itemOf('agent', agentId) ?? D.agents.agents[0];
  const msgs = s.chats[agent.id] ?? [];
  const send = (text: string) => { const x = text.trim(); if (!x) return; s.sendChat(agent.id, context && !x.includes(context) ? `${x}, ${context}` : x); };
  const who = <PersonAvatar id={agent.id} size="sm" />;
  return (
    <ChatArea aria-label={agent.name} follow={msgs.length} prompts={prompts} onSend={send} placeholder={t('messagePh', { name: agent.name })} sendLabel={t('send')}
      head={<><PersonAvatar id={agent.id} size="xs" /><Text size="sm" weight="semibold">{agent.name}</Text><Text size="xs" intent="muted">{agent.role}</Text></>}>
      {msgs.length === 0 && <ChatBubble avatar={who} name={agent.name}>{greetingOf(agent)}</ChatBubble>}
      {msgs.map((m, i) => 'text' in m
        ? <ChatBubble key={i} side={m.role === 'user' ? 'me' : 'them'} avatar={<PersonAvatar id={m.role === 'user' ? D.core.currentUserId : agent.id} size="sm" />}>{m.text}</ChatBubble>
        : 'look' in m ? <ChatBubble key={i} avatar={who}><Text size="sm" weight="bold">{m.look.title}</Text><Text size="xs">{m.look.pieces.join(' · ')}</Text></ChatBubble>
        : <Stack key={i} direction="row" justify="center"><Tag intent="success" round>{m.action}</Tag></Stack>)}
    </ChatArea>
  );
};
