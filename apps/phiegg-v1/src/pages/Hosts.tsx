
import React from 'react';
import { Box, Button, Input, Spinner, Tag } from '@pui/components';
import { NavIcon } from '@phi-kit/icons';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { byId, num, tone, useStored, type DB, type Msg } from '../data';
import type { Open } from '../panels';

type Host = { id: string; name: string; clubId: string; tone: string; members: number; online: number; gated: string; roles: string[]; ownerId: string; rules: string[] };
type Nest = { id: string; hostId: string; parentId: string | null; kind: string; name: string; topic: string; unread: number };
type HostsData = { hosts: Host[]; nests: Nest[]; messages: Record<string, Msg[]> };
const ICON: Record<string, string> = { channel: 'chat', world: 'map', city: 'home', quest: 'vote', voice: 'users', stage: 'chart', gallery: 'grid', category: 'layers' };

let cache: Promise<HostsData> | null = null;
/** hosts.json is ~400 KB, so it loads only when Hosts opens (Phiora: GET /hosts, /nests?hostId=). */
const loadHosts = () => (cache = cache || fetch(import.meta.env.BASE_URL + 'data/hosts.json').then((r) => r.json()));

export const Hosts: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const [hd, setHd] = React.useState<HostsData | null>(null);
  const [hostId, setHostId] = React.useState('');
  const [nestId, setNestId] = React.useState('');
  const [sent, setSent] = useStored<Record<string, Msg[]>>('phi.nestSent', {});
  const [draft, setDraft] = React.useState('');
  React.useEffect(() => { loadHosts().then(setHd); }, []);
  if (!hd) return <Spinner />;
  const host = hd.hosts.find((h) => h.id === hostId);
  if (!host) return (
    <>
      <Box as="header"><Box as="h1" className={k.title}>Hosts</Box><Box as="p" className={k.sub}>Club spaces: channels, worlds, stages and quests.</Box></Box>
      <Box className={k.grid}>{hd.hosts.slice(0, 48).map((h) => { const [bg, ink] = tone(h.tone); return (
        <Box as="button" key={h.id} className={k.card + ' ' + k.cardBtn} onClick={() => { setHostId(h.id); setNestId(hd.nests.find((n) => n.hostId === h.id && n.kind === 'channel')?.id || ''); }}>
          <Box className={s.media} style={{ height: 72, background: bg, color: ink, fontSize: 18 }}>{h.gated}</Box>
          <Box as="h3" className={k.cardTitle}>{h.name}</Box>
          <Box as="span" className={k.small}>{num(h.members)} members · {num(h.online)} online</Box>
        </Box>); })}</Box>
    </>
  );
  const nests = hd.nests.filter((n) => n.hostId === host.id);
  const nest = nests.find((n) => n.id === nestId);
  const msgs = [...(hd.messages[nestId] || []), ...(sent[nestId] || [])];
  const club = byId(db.core.clubs, host.clubId);
  const send = (e: React.FormEvent) => { e.preventDefault(); const t = draft.trim(); if (!t || !nest) return; const at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); setSent({ ...sent, [nestId]: [...(sent[nestId] || []), { id: 'me' + Date.now(), authorId: db.core.currentUserId, at, text: t }] }); setDraft(''); };
  const row = (n: Nest, depth: number) => (
    <Box as="button" key={n.id} className={k.item + (n.id === nestId ? ' ' + k.itemOn : '')} style={{ paddingLeft: 14 + depth * 18 }} onClick={() => setNestId(n.id)}>
      <NavIcon name={ICON[n.kind] || 'chat'} size={16} /><Box as="span" style={{ flex: 1 }}>{n.kind === 'channel' ? '#' + n.name : n.name}</Box>{n.unread ? <Box as="span" className={s.dot}>{n.unread}</Box> : null}
    </Box>
  );
  return (
    <>
      <Box className={k.row} style={{ justifyContent: 'space-between' }}>
        <Box as="header"><Box as="h1" className={k.title}>{host.name}</Box><Box as="p" className={k.sub}>{num(host.members)} members · {num(host.online)} online · {host.gated}</Box></Box>
        <Box className={k.row}>{club ? <Button size="sm" variant="outline" onClick={() => onOpen({ kind: 'club', id: club.id })}>{club.name}</Button> : null}<Button size="sm" variant="ghost" onClick={() => setHostId('')}>All hosts</Button></Box>
      </Box>
      <Box className={s.inbox}>
        <Box className={s.convs}>{nests.filter((n) => !n.parentId).map((n) => [row(n, 0), ...nests.filter((c) => c.parentId === n.id).map((c) => row(c, 1))])}</Box>
        {nest ? (
          <Box className={k.chat}>
            <Box><Box as="h2" className={k.blockTitle}>{nest.kind === 'channel' ? '#' + nest.name : nest.name}</Box><Box as="span" className={k.small}>{nest.topic}</Box></Box>
            <Box className={k.msgs}>
              {msgs.length ? msgs.map((m) => { const u = byId(db.core.users, m.authorId); return <Box key={m.id} className={k.msg + (m.authorId === db.core.currentUserId ? ' ' + k.me : '')}><Box as="strong" style={{ display: 'block', fontSize: 12 }}>{u?.name || m.authorId}</Box>{m.text}</Box>; })
                : <Box as="p" className={k.small}>{nest.kind === 'channel' ? 'No messages yet. Say hello.' : 'Open this ' + nest.kind + ' in its world app.'}</Box>}
            </Box>
            {nest.kind === 'channel' ? <Box as="form" className={k.row} onSubmit={send}><Input className={k.input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={'Message #' + nest.name} aria-label="Message" /><Button type="submit" variant="primary">Send</Button></Box> : null}
          </Box>
        ) : null}
      </Box>
      <Box as="section" className={k.card} style={{ maxWidth: 720 }}>
        <Box as="h2" className={k.blockTitle}>Rules</Box>
        <Box as="ol" className={k.body} style={{ margin: 0, paddingLeft: 18 }}>{host.rules.map((r) => <Box as="li" key={r}>{r}</Box>)}</Box>
        <Box className={k.row}>{host.roles.map((r) => <Tag key={r} minimal round>{r}</Tag>)}</Box>
      </Box>
    </>
  );
};
