import React, { useState } from 'react';
import { Avatar, Button, Card, CardBody, Col, Grid, Icon, Input, Page, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { Hand, Mic, MicOff, Search as SearchIcon } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { D, hostOf, initials, me, person, t } from '../../lib/data';
import { ROOM, sendDm, useDms, useRoom } from '../../lib/messages';
import { Composer } from '../../components/Phiegg/Overlays';
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
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Title level={2} size="xl">{t('dmTitle')}</Title>
        <Grid gap={4} xs={1} lg={12}>
          <Col span={4} xs={12} lg={4}><Stack direction="column" gap={2}>
            <Input value={q} placeholder={t('dmFilter')} aria-label={t('dmFilter')} icon={<Icon icon={SearchIcon} size="xs" />} onChange={(e) => setQ(e.target.value)} />
            {list.map((x) => { const last = lastOf(x.id); const unread = !read[x.id] && x.unread > 0; return (
              <Button key={x.id} variant={x.id === conv ? 'primary' : 'ghost'} onClick={() => { setConv(x.id); setRead({ ...read, [x.id]: true }); }}
                align="start" tall>
                <Stack direction="row" gap={2} align="center" width="100%" minWidth="0">
                  <Avatar initials={initials(x.title)} size="sm" />
                  <Stack direction="column" gap={0} align="start" grow={1} minWidth="0">
                    <Text size="sm" weight="bold">{x.title}</Text>
                    <Text size="xs" truncate opacity={0.75} maxWidth="100%">{last?.text ?? x.last}</Text>
                  </Stack>
                  <Stack direction="column" gap={0} align="end"><Text size="xs" opacity={0.7}>{last?.at ?? x.at}</Text>{unread && <Tag round size="sm" intent="primary">{t('dmUnread', { n: x.unread })}</Tag>}</Stack>
                </Stack>
              </Button>); })}
          </Stack></Col>
          <Col span={8} xs={12} lg={8}><Card depth={2}><CardBody><Stack direction="column" gap={3}>
            <Stack direction="row" gap={2} align="center"><Avatar initials={initials(c.title)} size="md" /><Stack direction="column" gap={0}><Title level={4} size="md">{c.title}</Title>
              <Text size="xs" intent="muted">{c.userIds.map((id) => '@' + person(id).handle).join(' · ')}</Text></Stack></Stack>
            <Stack direction="column" gap={2} maxHeight="52vh" scroll="y">
              {msgs.map((m) => <Stack key={m.id} direction="column" gap={1}><PersonLine id={m.authorId} sub={m.at} size="sm" /><Text size="sm">{m.text}</Text>{'lookId' in m && <LookAttachment id={(m as { lookId?: string }).lookId} />}</Stack>)}
            </Stack>
            <Composer placeholder={t('messagePh', { name: c.title })} onSend={(v) => sendDm(conv, my.id, v, t('now'))} />
          </Stack></CardBody></Card></Col>
        </Grid>

        <Title level={3} size="lg">{t('voiceRooms')}</Title>
        <Grid gap={3} xs={1} sm={2} md={3}>{D.messages.voiceRooms.map((v) => { const inRoom = room.id === v.id; return (
          <Card depth={2} key={v.id} variant={inRoom ? 'default' : 'flat'}><CardBody><Stack direction="column" gap={2}>
            <Stack direction="row" gap={1} align="center"><Tag intent={v.live ? 'success' : undefined} round size="sm">{v.live ? t('live_') : v.startsAt}</Tag><Text size="xs" intent="muted">{hostOf(v.hostId)?.name}</Text>
              {inRoom && <Tag intent="primary" round size="sm">{t('vrIn')}</Tag>}</Stack>
            <Text weight="bold">{v.title}</Text>
            <Stack direction="row" gap={1} align="center">{v.speakerIds.map((id) => <Avatar key={id} initials={person(id).initials} size="sm" />)}
              {inRoom && <Avatar initials={my.initials} size="sm" />}<Text size="xs">{t('listening', { n: v.listeners + (inRoom ? 1 : 0) })}</Text></Stack>
            {inRoom
              ? <Stack direction="row" gap={1} wrap>
                  <Button size="sm" variant={room.muted ? 'outline' : 'primary'} iconLeft={room.muted ? MicOff : Mic} onClick={() => ROOM.set({ ...room, muted: !room.muted })}>{room.muted ? t('vrUnmute') : t('vrMute')}</Button>
                  <Button size="sm" variant={room.hand ? 'primary' : 'outline'} iconLeft={Hand} onClick={() => ROOM.set({ ...room, hand: !room.hand })}>{room.hand ? t('vrHandDown') : t('vrHand')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { ROOM.set({ id: null, muted: true, hand: false }); s.flash(t('vrLeft', { name: v.title })); }}>{t('vrLeave')}</Button>
                </Stack>
              : <Button size="sm" variant="primary" onClick={() => { ROOM.set({ id: v.id, muted: true, hand: false }); s.flash(t('joined', { name: v.title })); }}>{t('join')}</Button>}
          </Stack></CardBody></Card>); })}</Grid>
      </Stack>
    </Page>
  );
};
