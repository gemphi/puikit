import React, { useState } from 'react';
import { Avatar, Button, Page, Pressable, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { Plus } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { D, fmt, me, person, site, t, itemOf } from '../../lib/data';
import { ChatColumns } from '../../components/Phiegg/ChatColumns';
import { Details } from '../../components/Phiegg/Details';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import { PersonLine } from '../../components/Phiegg/PersonLine';
import { LookAttachment } from '../../components/Phiegg/LookAttachment';
import type { Nest } from '../../types/phiegg';

const glyph = site.nestGlyphs as Record<string, string>;
/** How many people a host's side column lists (site.json hostPeople). */
const PEOPLE = (site as unknown as { hostPeople: number }).hostPeople;

/**
 * One host (the path's hostId), on the chat every other chat uses (ChatColumns): its nests down the left in their
 * tree, the nest that is open in the middle with its messages and composer, its people on the right. The list of every
 * host is the `hosts` path (data/route.json).
 */
export const HostPage: React.FC = () => {
  const s = useStore(phieggStore); const my = me();
  const host = itemOf('host', s.hostId) ?? D.hosts.hosts[0]; const hostId = host.id;
  const [picked, setPicked] = useState<string | null>(null); const [who, setWho] = useState<string | null>(null);
  const nests = s.nests.filter((n) => n.hostId === hostId);
  const tree: [Nest, number][] = []; const walk = (pid: string | null, d: number) => nests.filter((n) => (n.parentId ?? null) === pid).forEach((n) => { tree.push([n, d]); walk(n.id, d + 1); });
  walk(null, 0);
  const nest = nests.find((n) => n.id === picked) ?? tree[0]?.[0]; const world = itemOf('world', nest?.worldId);
  // Its own people first (those who list it); a host nobody lists shows the first of everyone.
  const own = D.core.users.filter((u) => u.hostIds?.includes(hostId)); const people = (own.length ? own : D.core.users).slice(0, PEOPLE);
  const shown = who ?? people[0]?.id;
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="row" justify="between" align="end" wrap gap={3}>
        <Stack direction="row" gap={3} align="center">
          <EntityAvatar id={host.id} name={host.name} size="lg" />
          <Stack direction="column" gap={1}>
            <Title level={2} size="xl">{host.name}</Title>
            <Text intent="secondary">{[itemOf('role', host.roleTypeId)?.name, host.genre, fmt(host.members) + ' members'].filter(Boolean).join(' · ')}</Text>
            <Stack direction="row" gap={1} wrap align="center"><Tag minimal round size="sm">{host.gated}</Tag><Tag minimal round size="sm">{t('online', { n: fmt(host.online) })}</Tag></Stack>
          </Stack>
        </Stack>
        <Stack direction="row" gap={2} align="center" wrap>
          <Button variant="primary" iconLeft={Plus} onClick={() => s.openNest(hostId, nest?.kind === 'world' ? nest.id : null, nest?.kind === 'world' ? 'city' : 'channel')}>{t('nest')}</Button>
          <Button variant="glass" onClick={() => s.openDetails({ kind: 'host', id: host.id })}>{t('details')}</Button>
          <Button variant="glass" onClick={() => s.go('hosts')}>{t('pgHosts')}</Button>
        </Stack>
      </Stack>
      {nest && <ChatColumns height="calc(100vh - 16rem)"
        labels={{ list: t('pgHosts'), search: t('dmFilter'), people: t('dmPeople') }}
        rows={tree.map(([n, d]) => ({ id: n.id, title: ' '.repeat(d) + n.name, sub: n.topic, unread: n.unread, avatar: <Avatar initials={glyph[n.kind]} size="sm" /> }))}
        selected={nest.id} onSelect={(id) => setPicked(id)}
        head={<Text size="sm" weight="semibold">{glyph[nest.kind]} {nest.name}</Text>}
        intro={<Stack direction="row" gap={2} align="center" wrap>
          <Text size="sm" intent="muted">{nest.topic}</Text>
          {world && <><Button size="sm" variant="glass" onClick={() => s.go('world', { worldId: world.id })}>{t('openWorld')}</Button><Button size="sm" variant="glass" onClick={() => s.openNest(hostId, nest.id, 'city')}>{t('nestCity')}</Button></>}
        </Stack>}
        lines={(s.nestMsgs[nest.id] ?? []).map((m) => ({ id: m.id, mine: m.authorId === my.id, avatar: <PersonAvatar id={m.authorId} size="sm" />, who: person(m.authorId).name, at: m.at, text: m.text,
          attachment: 'lookId' in m ? <LookAttachment id={(m as { lookId?: string }).lookId} /> : undefined }))}
        onSend={(v) => s.nestMsg(nest.id, v)} placeholder={t('messagePh', { name: nest.name })}
        people={<Stack direction="column" gap={3}>
          <Stack direction="column" gap={1}>
            {people.map((u, i) => <Pressable key={u.id} row gap={2} pad="sm" hover selected={shown === u.id} onClick={() => setWho(u.id)}><PersonLine id={u.id} sub={host.roles[Math.min(i, host.roles.length - 1)]} size="sm" /></Pressable>)}
          </Stack>
          {shown && <Details at={{ kind: 'person', id: shown }} />}
        </Stack>} />}
    </Stack></Page>
  );
};
