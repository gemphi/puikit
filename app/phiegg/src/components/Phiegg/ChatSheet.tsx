import React from 'react';
import { Button, Drawer, Icon, Pressable, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { Bookmark, Play, Search } from 'lucide-react';
import { D, person, t, itemOf } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { ChatColumns, type ChatLine, type ChatRow } from './ChatColumns';
import { PersonAvatar } from './PersonAvatar';
import { Details } from './Details';

/**
 * The agent chat sheet: a bottom sheet that slides up whenever an agent is opened. It is the app's one chat
 * (ChatColumns), handed the agents as its conversations:
 *   left   , my agent chats (recent first), then every other agent; search
 *   middle , the full chat with the selected agent: what it can do, the thread, its prompts and the composer
 *   right  , details: tap a face to open that profile's tabs; every link inside pushes, the back arrow pops,
 *             and back from the first record returns to the chat.
 */
export const ChatSheet: React.FC = () => {
  const s = useStore(phieggStore);
  const o = s.overlay.kind === 'chat' ? s.overlay : null;
  const ag = o ? itemOf('agent', o.agentId) : undefined;
  if (!o || !ag) return null;
  const msgs = s.chats[o.agentId] ?? [];

  const mine = Object.keys(s.chats).filter((id) => itemOf('agent', id));
  const rest = D.agents.agents.map((a) => a.id).filter((id) => !mine.includes(id));
  const lastText = (id: string) => { const m = [...(s.chats[id] ?? [])].reverse().find((x) => 'text' in x) as { text: string } | undefined; return m?.text; };
  const rows: ChatRow[] = [...mine, ...rest].map((id) => ({
    id, title: person(id).name, sub: lastText(id) ?? itemOf('agent', id)?.role, group: mine.includes(id) ? t('chMine') : t('chAll'),
    avatar: <PersonAvatar id={id} size="sm" />, onAvatar: () => s.openChat(id, undefined, true),
  }));

  // A message's picture opens its sender; what can be done with a look (run it, keep it) sits at the right as icons.
  const face = (id: string) => <Pressable onClick={() => s.openDetails({ kind: 'person', id })}><PersonAvatar id={id} size="sm" /></Pressable>;
  const act = (G: typeof Play, label: string, onClick: () => void) => <Button key={label} size="sm" variant="ghost" icon={<Icon icon={G} size="sm" />} aria-label={label} title={label} onClick={onClick} />;
  const lines: ChatLine[] = msgs.map((m, i) => {
    const id = String(i);
    if ('look' in m) return { id, mine: false, avatar: face(ag.id), who: ag.name,
      text: <Title level={5} size="md">{m.look.title}</Title>,
      attachment: <Stack direction="row" gap={1} wrap>{m.look.pieces.map((x) => <Tag key={x} round minimal>{x}</Tag>)}</Stack>,
      actions: <>{act(Play, t('tryOn'), () => s.flash(t('arOpening', { title: m.look.title })))}{act(Bookmark, t('saveLook'), () => s.flash(t('saved')))}</> };
    if ('action' in m) return { id, mine: false, avatar: face(ag.id), who: ag.name, text: m.action };
    const me = m.role === 'user';
    return { id, mine: me, avatar: face(me ? D.core.currentUserId : ag.id), who: me ? undefined : ag.name, text: m.text };
  });
  const top = o.detail[o.detail.length - 1];

  return (
    <Drawer isOpen onClose={s.close} position="bottom" size="lg" expandable expandLabel={t('expand')} collapseLabel={t('collapse')}
      title={<Stack direction="row" gap={2} align="center"><Icon icon={Search} size="xs" /><Text size="sm" weight="semibold">{t('chAgents')}</Text><Text size="xs" intent="muted">{t('chCount', { chats: mine.length, agents: D.agents.agents.length })}</Text></Stack>}>
      <ChatColumns
        labels={{ list: t('chAgents'), search: t('chSearch'), people: t('details') }}
        rows={rows} selected={ag.id} onSelect={(id) => s.openChat(id)}
        head={<Pressable row gap={2} onClick={() => s.openDetails({ kind: 'person', id: ag.id })} aria-label={t('chDetailsOf', { name: ag.name })}>
          <PersonAvatar id={ag.id} size="sm" /><Text size="sm" weight="semibold">{ag.name}</Text><Text size="xs" intent="muted">{ag.role}</Text></Pressable>}
        intro={<Stack direction="row" gap={1} wrap>{ag.abilities.map((x) => <Tag key={x} minimal round>{x}</Tag>)}</Stack>}
        lines={lines} prompts={ag.prompts} onSend={(v) => s.sendChat(ag.id, v)} placeholder={t('messagePh', { name: ag.name })}
        people={top ? <Details at={top} /> : undefined}
        peopleNav={{ onClose: s.closeDetails, onBack: s.detailBack, backLabel: o.detail.length > 1 ? t('chBack') : t('chBackToChat') }} />
    </Drawer>
  );
};
