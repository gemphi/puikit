import React, { useState } from 'react';
import { Avatar, Button, Card, CardBody, Grid, Page, Pressable, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { Hand, Mic, MicOff } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { D, initials, me, person, t, itemOf } from '../../lib/data';
import { ROOM, sendDm, useDms, useRoom } from '../../lib/messages';
import { ChatColumns } from '../../components/Phiegg/ChatColumns';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import { Details } from '../../components/Phiegg/Details';
import { PageSections } from '../../components/Phiegg/PageSections';
import { PersonLine } from '../../components/Phiegg/PersonLine';
import { LookAttachment } from '../../components/Phiegg/LookAttachment';

/** Conversations (every thread from data/messages.json, persisted per user) and voice rooms you can join, mute and leave. */
export const MessagesPage: React.FC = () => {
  const s = useStore(phieggStore); const dms = useDms(); const room = useRoom(); const my = me();
  const [conv, setConv] = useState(D.messages.thread.conversationId); const [q, setQ] = useState('');
  const [read, setRead] = useState<Record<string, boolean>>({ [D.messages.thread.conversationId]: true });
  const c = D.messages.conversations.find((x) => x.id === conv)!;
  const msgs = dms[conv] ?? [];
  const list = D.messages.conversations.filter((x) => !q.trim() || x.title.toLowerCase().includes(q.trim().toLowerCase()));
  const lastOf = (id: string) => { const m = dms[id]; return m?.length ? m[m.length - 1] : undefined; };
  const [who, setWho] = useState<string | null>(null);
  const people = c.userIds.length ? (
    <Stack direction="column" gap={3}>
      <Stack direction="column" gap={1}>{c.userIds.map((id) => (
        <Pressable key={id} row gap={2} pad="sm" hover selected={(who ?? c.userIds[0]) === id} onClick={() => setWho(id)}><PersonLine id={id} size="sm" /></Pressable>))}</Stack>
      <Details at={{ kind: 'person', id: who ?? c.userIds[0] }} />
    </Stack>) : undefined;
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <ChatColumns height="calc(100vh - 12rem)"
          labels={{ list: t('dmTitle'), search: t('dmFilter'), people: t('dmPeople') }}
          rows={list.map((x) => { const last = lastOf(x.id); return { id: x.id, title: x.title, sub: last?.text ?? x.last, at: last?.at ?? x.at, unread: !read[x.id] ? x.unread : 0, avatar: <Avatar initials={initials(x.title)} size="sm" /> }; })}
          selected={conv} onSelect={(id) => { setConv(id); setWho(null); setRead({ ...read, [id]: true }); }}
          head={<Stack direction="row" gap={2} align="center"><Avatar initials={initials(c.title)} size="xs" /><Text size="sm" weight="semibold">{c.title}</Text></Stack>}
          lines={msgs.map((m) => ({ id: m.id, mine: m.authorId === my.id, avatar: <PersonAvatar id={m.authorId} size="sm" />, who: person(m.authorId).name, at: m.at, text: m.text,
            attachment: 'lookId' in m ? <LookAttachment id={(m as { lookId?: string }).lookId} /> : undefined }))}
          onSend={(v) => sendDm(conv, my.id, v, t('now'))} placeholder={t('messagePh', { name: c.title })} people={people} />
        <PageSections id="messages" sections={[{ id: 'rooms', title: t('voiceRooms'), content: (
        <Grid gap={3} xs={1} sm={2} md={3}>{D.messages.voiceRooms.map((v) => { const inRoom = room.id === v.id; return (
          <Card depth={2} key={v.id} variant={inRoom ? 'default' : 'flat'}><CardBody><Stack direction="column" gap={2}>
            <Stack direction="row" gap={1} align="center"><Tag intent={v.live ? 'success' : undefined} round size="sm">{v.live ? t('live_') : v.startsAt}</Tag><Text size="xs" intent="muted">{itemOf('host', v.hostId)?.name}</Text>
              {inRoom && <Tag intent="primary" round size="sm">{t('vrIn')}</Tag>}</Stack>
            <Text weight="bold">{v.title}</Text>
            <Stack direction="row" gap={1} align="center">{v.speakerIds.map((id) => <Avatar key={id} initials={person(id).initials} size="sm" />)}
              {inRoom && <Avatar initials={my.initials} size="sm" />}<Text size="xs">{t('listening', { n: v.listeners + (inRoom ? 1 : 0) })}</Text></Stack>
            {inRoom
              ? <Stack direction="row" gap={1} wrap>
                  <Button variant="glass" iconLeft={room.muted ? MicOff : Mic} onClick={() => ROOM.set({ ...room, muted: !room.muted })}>{room.muted ? t('vrUnmute') : t('vrMute')}</Button>
                  <Button variant="glass" iconLeft={Hand} onClick={() => ROOM.set({ ...room, hand: !room.hand })}>{room.hand ? t('vrHandDown') : t('vrHand')}</Button>
                  <Button variant="glass" onClick={() => { ROOM.set({ id: null, muted: true, hand: false }); s.flash(t('vrLeft', { name: v.title })); }}>{t('vrLeave')}</Button>
                </Stack>
              : <Button variant="glass" onClick={() => { ROOM.set({ id: v.id, muted: true, hand: false }); s.flash(t('joined', { name: v.title })); }}>{t('join')}</Button>}
          </Stack></CardBody></Card>); })}</Grid>
        ) }]} />
      </Stack>
    </Page>
  );
};
