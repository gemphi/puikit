import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, ChatBubble, Columns, Drawer, Icon, Input, Pressable, Stack, Sticky, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { Search, Send } from 'lucide-react';
import { D, agentOf, person, t } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { PersonAvatar } from './PersonAvatar';
import { Details } from './Details';

/**
 * The agent chat sheet: a bottom sheet that slides up whenever an agent is opened.
 *   left   , all my agent chats (recent first), then every other agent; search
 *   middle , the full chat with the selected agent
 *   right  , details: tap a face to open that profile's tabs; every link inside pushes, the back arrow pops,
 *             and back from the first record returns to the chat.
 * Each column can expand over the sheet or close (closed columns wait in a strip on the left).
 */
export const ChatSheet: React.FC = () => {
  const s = useStore(phieggStore);
  const o = s.overlay.kind === 'chat' ? s.overlay : null;
  const [q, setQ] = useState(''); const [draft, setDraft] = useState('');
  const end = useRef<HTMLElement | null>(null);
  const ag = o ? agentOf(o.agentId) : undefined;
  const msgs = o ? s.chats[o.agentId] ?? [] : [];
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, o?.agentId]);
  if (!o || !ag) return null;

  const mine = Object.keys(s.chats).filter((id) => agentOf(id));
  const rest = D.agents.agents.map((a) => a.id).filter((id) => !mine.includes(id));
  const ql = q.trim().toLowerCase();
  const list = [...mine, ...rest].filter((id) => !ql || person(id).name.toLowerCase().includes(ql) || (agentOf(id)?.role ?? '').toLowerCase().includes(ql));
  const lastText = (id: string) => { const m = [...(s.chats[id] ?? [])].reverse().find((x) => 'text' in x) as { text: string } | undefined; return m?.text; };
  const send = () => { if (draft.trim()) { s.sendChat(ag.id, draft.trim()); setDraft(''); } };
  const top = o.detail[o.detail.length - 1];

  const agents = (
    <Stack direction="column" gap={1}>
      <Input value={q} placeholder="Search agents" onChange={(e) => setQ(e.target.value)} aria-label="Search agents" />
      {mine.length > 0 && !ql && <Text size="xs" weight="bold" intent="muted">MY CHATS</Text>}
      {list.map((id, i) => {
        const a = agentOf(id)!; const on = id === ag.id; const last = lastText(id);
        return (
          <React.Fragment key={id}>
            {!ql && i === mine.length && mine.length > 0 && <Text size="xs" weight="bold" intent="muted">ALL AGENTS</Text>}
            <Pressable row gap={2} pad="sm" hover selected={on} onClick={() => s.openChat(id)} aria-current={on || undefined}>
              <Box as="span" onClick={(e: React.MouseEvent) => { e.stopPropagation(); s.openChat(id, undefined, true); }} title="Details"><PersonAvatar id={id} size="md" /></Box>
              <Stack as="span" direction="column" gap={0} flex="1" minWidth="0">
                <Text size="sm" weight="semibold">{a.name}</Text>
                <Text size="xs" intent="muted" truncate>{last ?? a.role}</Text>
              </Stack>
            </Pressable>
          </React.Fragment>
        );
      })}
    </Stack>
  );

  const chat = (
    <Stack direction="column" gap={3} minHeight="100%">
      <Stack direction="row" gap={1} wrap>{ag.abilities.map((x) => <Tag key={x} minimal round intent="success">{x}</Tag>)}</Stack>
      <Stack direction="column" gap={2} grow={1}>
        {msgs.map((m, i) => 'look' in m
          ? <ChatBubble key={i} avatar={<Pressable onClick={() => s.openDetails({ kind: 'person', id: ag.id })}><PersonAvatar id={ag.id} size="sm" /></Pressable>}>
              <Stack direction="column" gap={2}><Title level={5} size="md">{m.look.title}</Title><Stack direction="row" gap={1} wrap>{m.look.pieces.map((x) => <Tag key={x} round intent="primary" minimal>{x}</Tag>)}</Stack>
                <Stack direction="row" gap={2}><Button size="sm" variant="primary" onClick={() => s.flash(t('arOpening', { title: m.look.title }))}>{t('tryOn')}</Button><Button size="sm" variant="outline" onClick={() => s.flash(t('saved'))}>{t('saveLook')}</Button></Stack></Stack></ChatBubble>
          : 'action' in m ? <Stack key={i} direction="row" justify="center"><Tag intent="success" round>{m.action}</Tag></Stack>
          : <ChatBubble key={i} side={m.role === 'user' ? 'me' : 'them'}
              avatar={m.role === 'user' ? <Pressable onClick={() => s.openDetails({ kind: 'person', id: D.core.currentUserId })}><PersonAvatar id={D.core.currentUserId} size="sm" /></Pressable>
                : <Pressable onClick={() => s.openDetails({ kind: 'person', id: ag.id })}><PersonAvatar id={ag.id} size="sm" /></Pressable>}>{m.text}</ChatBubble>)}
        <Box ref={end} />
      </Stack>
      <Sticky bottom={-12} surface><Stack direction="column" gap={2}>
        <Stack direction="row" gap={1} wrap>{ag.prompts.map((p) => <Tag key={p} interactive round onClick={() => s.sendChat(ag.id, p)}>{p}</Tag>)}</Stack>
        <Stack direction="row" gap={2}>
          <Input value={draft} placeholder={t('messagePh', { name: ag.name })} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} aria-label={t('messagePh', { name: ag.name })} />
          <Button variant="primary" icon={<Icon icon={Send} size="sm" />} onClick={send}>{t('send')}</Button>
        </Stack>
      </Stack></Sticky>
    </Stack>
  );

  const face = (
    <Pressable row gap={2} onClick={() => s.openDetails({ kind: 'person', id: ag.id })} aria-label={`${ag.name} details`}>
      <PersonAvatar id={ag.id} size="sm" /><Text size="sm" weight="semibold">{ag.name}</Text><Text size="xs" intent="muted">{ag.role}</Text>
    </Pressable>
  );

  return (
    <Drawer isOpen onClose={s.close} position="bottom" size="lg" expandable expandLabel={t('expand')} collapseLabel={t('collapse')}
      title={<Stack direction="row" gap={2} align="center"><Icon icon={Search} size="xs" /><Text size="sm" weight="semibold">Agents</Text><Text size="xs" intent="muted">{mine.length} chats · {D.agents.agents.length} agents</Text></Stack>}>
      <Columns
        expandLabel={t('expand')} collapseLabel={t('collapse')}
        columns={[
          { id: 'agents', title: 'My agents', content: agents, width: '17rem', closable: true, expandable: true },
          { id: 'chat', title: face, label: 'Chat', content: chat, expandable: true, minWidth: '18rem' },
          { id: 'details', title: 'Details', content: top ? <Details at={top} /> : null, width: '26rem', hidden: !top, expandable: true, closable: true,
            onClose: s.closeDetails, onBack: s.detailBack, backLabel: o.detail.length > 1 ? 'Back' : 'Back to chat' },
        ]} />
    </Drawer>
  );
};
