import React, { useState } from 'react';
import { Button, Card, CardBody, Col, Grid, Page, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { Plus } from 'lucide-react';
import { D, clubOf, fmt, hostOf, roleOf, site, t, worldOf } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { PersonLine } from '../../components/Phiegg/PersonLine';
import { Composer } from '../../components/Phiegg/Overlays';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import type { Nest } from '../../types/phiegg';
import { LookAttachment } from '../../components/Phiegg/LookAttachment';

const glyph = site.nestGlyphs as Record<string, string>;

export const HostsPage: React.FC = () => {
  const s = useStore(phieggStore);
  const [hostId, setHostId] = useState(D.hosts.hosts[0].id); const [picked, setPicked] = useState<string | null>(null);
  const nests = s.nests.filter((n) => n.hostId === hostId); const nest = nests.find((n) => n.id === picked) ?? nests[0];
  const host = hostOf(hostId)!; const world = worldOf(nest?.worldId);
  const tree: [Nest, number][] = []; const walk = (pid: string | null, d: number) => nests.filter((n) => (n.parentId ?? null) === pid).forEach((n) => { tree.push([n, d]); walk(n.id, d + 1); });
  walk(null, 0);
  return (
    <Page>
      <Grid gap={4} xs={1} lg={12}>
        <Col span={3} xs={12} lg={3}><Card depth={2}><CardBody><Stack direction="column" gap={2}>
          <TabList size="sm" variant="pills" aria-label="Hosts" activeId={hostId} onChange={(id) => { setHostId(id); setPicked(null); }} items={D.hosts.hosts.map((h) => ({ id: h.id, label: h.name, icon: <EntityAvatar id={h.id} name={h.name} size="xs" /> }))} />
          <Stack direction="row" gap={2} align="center"><EntityAvatar id={host.id} name={host.name} size="lg" /><Stack direction="column" gap={0}><Title level={4} size="md">{host.name}</Title><Text size="xs" intent="muted">{fmt(host.members)} members</Text></Stack><Button size="sm" variant="outline" onClick={() => s.openDetails({ kind: 'host', id: host.id })}>Details</Button></Stack>
          <Stack direction="row" gap={1} wrap><Tag intent="success" minimal round size="sm">{host.gated}</Tag><Tag minimal round size="sm">{t('online', { n: fmt(host.online) })}</Tag></Stack>
          {tree.map(([n, d]) => <Button key={n.id} size="sm" variant={n.id === nest?.id ? 'primary' : 'ghost'} onClick={() => setPicked(n.id)} indent={d}>
            {glyph[n.kind]} {n.name}{n.unread ? ' · ' + n.unread : ''}</Button>)}
          <Button variant="primary" iconLeft={Plus} onClick={() => s.openNest(hostId, nest?.kind === 'world' ? nest.id : null, nest?.kind === 'world' ? 'city' : 'channel')}>{t('nest')}</Button>
        </Stack></CardBody></Card></Col>
        <Col span={6} xs={12} lg={6}>{nest && <Stack direction="column" gap={3}>
          <Tile tone={host.tone} ratio="21/8" big grid title={host.name} sub={[roleOf(host.roleTypeId)?.name, host.genre, fmt(host.members) + ' members'].filter(Boolean).join(' · ')} onClick={() => s.openDetails({ kind: 'host', id: host.id })}
            depth={{ clubId: host.clubId, worldId: clubOf(host.clubId)?.worldIds[0], personId: host.ownerId, entityId: host.id, entityName: host.name }} />
          <Stack direction="column" gap={0}><Title level={3} size="lg">{glyph[nest.kind]} {nest.name}</Title><Text size="sm" intent="muted">{nest.topic}</Text></Stack>
          {world && <><Tile tone={world.tone} ratio="21/8" big grid title={world.name} sub={world.description} depth={{ worldId: world.id, clubId: world.clubId, personId: world.creatorId }} />
            <Stack direction="row" gap={2}><Button variant="primary" onClick={() => s.go('world', { worldId: world.id })}>{t('openWorld')}</Button><Button variant="outline" onClick={() => s.openNest(hostId, nest.id, 'city')}>{t('nestCity')}</Button></Stack></>}
          {(s.nestMsgs[nest.id] ?? []).map((m) => <Stack key={m.id} direction="column" gap={1}><PersonLine id={m.authorId} sub={m.at} size="sm" /><Text size="sm">{m.text}</Text>{'lookId' in m && <LookAttachment id={(m as { lookId?: string }).lookId} />}</Stack>)}
          <Composer placeholder={t('messagePh', { name: nest.name })} onSend={(v) => s.nestMsg(nest.id, v)} />
        </Stack>}</Col>
        <Col span={3} xs={12} lg={3}><Card depth={2}><CardBody><Stack direction="column" gap={2}><Title level={5} size="sm">{t('onlineByHoldings')}</Title>
          {D.core.users.map((u, i) => <PersonLine key={u.id} id={u.id} sub={host.roles[Math.min(i, host.roles.length - 1)]} size="sm" />)}
          {D.agents.agents.slice(0, 3).map((a) => <PersonLine key={a.id} id={a.id} sub={t('aiAgent')} size="sm" />)}
        </Stack></CardBody></Card></Col>
      </Grid>
    </Page>
  );
};
