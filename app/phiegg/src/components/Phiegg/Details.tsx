import React, { useState } from 'react';
import { Box, Button, Card, Cascade, ChatBubble, Frame, Grid, Image, Input, Pressable, Rows, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import {
  D, STORES, agentOf, castOf, castsOfHost, castsOfPerson, clubOf, fmt, hostOf, hostsOwnedBy, itemImage, itemsOfPerson, lookOf, person,
  pieceOf, roleCategoryOf, roleOf, salesOfItem, salesOfPerson, showOf, seriesOf, statsOfPerson, usd, worldOf,
} from '../../lib/data';
import type { SaleEvent } from '../../types/phiegg';
import { phieggStore, type DetailRef } from '../../state/phieggStore';
import { PersonAvatar } from './PersonAvatar';
import { PersonLine } from './PersonLine';
import { EntityAvatar } from './EntityAvatar';
import { Connected } from './Connected';
import { Tile } from './Tile';
import { LookAttachment } from './LookAttachment';

type S = ReturnType<typeof phieggStore.getState>;
type Tab = { id: string; label: string; n?: number; body: () => React.ReactNode };

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Card variant="flat" padding="sm" hoverable={false} tint="none">
    <Text size="xs" intent="muted">{label}</Text><Title level={5} size="md">{value}</Title>
  </Card>
);
const Stats: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <Rows cols={6} colsSm={2} minItemWidth="8rem">{rows.map(([l, v]) => <Stat key={l} label={l} value={v} />)}</Rows>
);
const Row: React.FC<{ media?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; end?: React.ReactNode; onClick?: () => void }> = ({ media, title, sub, end, onClick }) => {
  const body = <>{media}<Box flex="1" minWidth="0"><Text size="sm" weight="medium">{title}</Text>{sub && <Text size="xs" intent="muted">{sub}</Text>}</Box>{end}</>;
  return onClick
    ? <Pressable row gap={2} pad="sm" fill hover onClick={onClick}>{body}</Pressable>
    : <Stack direction="row" gap={2} align="center" paddingY={1} paddingX={2}>{body}</Stack>;
};
const Empty: React.FC<{ text: string }> = ({ text }) => <Text size="sm" intent="muted">{text}</Text>;

/** Item thumbnail (piece or look) that opens the item's own details. */
const ItemCard: React.FC<{ kind: 'piece' | 'look'; id: string; s: S }> = ({ kind, id, s }) => {
  if (kind === 'look') {
    const l = lookOf(id); if (!l) return null; const v = l.views.FRONT ?? Object.values(l.views)[0];
    return (
      <Pressable onClick={() => s.openDetails({ kind: 'look', id })}>
        <Cascade depth={0} pocket={3} cap={3} tint={l.hex}><Frame ratio="3/4" rounded="md" tint={l.hex} tintStrength={22}>
          {v ? <Image src={itemImage(v)} alt={l.name} loading="lazy" fit="contain" fill /> : <Text size="xs" weight="bold">{l.name}</Text>}
        </Frame></Cascade>
        <Text size="xs" weight="medium">{l.name}</Text><Text size="xs" intent="muted">{usd(l.usd)}</Text>
      </Pressable>
    );
  }
  const p = pieceOf(id); if (!p) return null;
  return <Box><Tile tone={p.tone} ratio="1" deck={1} title={p.name} sub={p.tokenId} depth={{ clubId: p.clubId, personId: p.creatorId }} onClick={() => s.openDetails({ kind: 'piece', id })} /></Box>;
};

const EVENT_INTENT: Record<string, 'success' | 'primary' | 'warning' | undefined> = { sale: 'success', mint: 'primary', offer: 'warning', list: undefined, transfer: undefined };
const itemName = (x: SaleEvent) => (x.itemKind === 'look' ? lookOf(x.itemId)?.name : pieceOf(x.itemId)?.name) ?? x.itemId;
/** OpenSea-style activity table. */
const Activity: React.FC<{ rows: SaleEvent[]; s: S; hideItem?: boolean }> = ({ rows, s, hideItem }) => (
  <Stack direction="column" gap={0}>
    {rows.length === 0 && <Empty text="No activity yet." />}
    {rows.slice(0, 60).map((x) => (
      <Row key={x.id}
        media={<Tag intent={EVENT_INTENT[x.event]} minimal round size="sm">{x.event}</Tag>}
        title={hideItem ? usd(x.priceUsd) : <>{itemName(x)} · {usd(x.priceUsd)}</>}
        sub={<>{x.fromId ? person(x.fromId).name : '·'} → {x.toId ? person(x.toId).name : '·'} · {new Date(x.at).toLocaleDateString()}</>}
        onClick={hideItem ? (x.toId ? () => s.openDetails({ kind: 'person', id: x.toId! }) : undefined) : () => s.openDetails({ kind: x.itemKind, id: x.itemId })} />
    ))}
  </Stack>
);

const HostRow: React.FC<{ id: string; s: S }> = ({ id, s }) => {
  const h = hostOf(id); if (!h) return null; const r = roleOf(h.roleTypeId);
  return <Row media={<EntityAvatar id={h.id} name={h.name} size="md" />} title={h.name} sub={[r?.name, h.genre, fmt(h.members) + ' members'].filter(Boolean).join(' · ')}
    end={<Button size="sm" variant={s.follow[h.id] ? 'secondary' : 'outline'} onClick={(e) => { e.stopPropagation(); s.toggle('follow', h.id); }}>{s.follow[h.id] ? 'Following' : 'Follow'}</Button>}
    onClick={() => s.openDetails({ kind: 'host', id: h.id })} />;
};
const CastRow: React.FC<{ id: string; s: S }> = ({ id, s }) => {
  const c = castOf(id); if (!c) return null;
  return <Row media={<EntityAvatar id={c.id} name={c.title} size="md" />} title={c.title} sub={`${c.kind} · ${c.hostIds.length} hosts · ${fmt(c.plays)} plays`}
    end={c.live ? <Tag intent="error" round size="sm">LIVE</Tag> : undefined} onClick={() => s.openDetails({ kind: 'cast', id: c.id })} />;
};

/** Header + tabs for any record. */
const Panel: React.FC<{ media: React.ReactNode; title: string; sub?: React.ReactNode; actions?: React.ReactNode; tabs: Tab[] }> = ({ media, title, sub, actions, tabs }) => {
  const [tab, setTab] = useState(tabs[0]?.id);
  const cur = tabs.find((x) => x.id === tab) ?? tabs[0];
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={3} align="center">{media}<Stack direction="column" gap={0} minWidth="0"><Title level={4} size="lg">{title}</Title>{sub && <Text size="sm" intent="muted">{sub}</Text>}</Stack></Stack>
      {actions && <Stack direction="row" gap={2} wrap>{actions}</Stack>}
      <Box scroll="x"><TabList size="sm" variant="pills" activeId={cur?.id} onChange={setTab} items={tabs.map((x) => ({ id: x.id, label: x.n != null ? `${x.label} · ${fmt(x.n)}` : x.label }))} /></Box>
      <Box key={cur?.id}>{cur?.body()}</Box>
    </Stack>
  );
};

function personTabs(id: string, s: S): Tab[] {
  const st = statsOfPerson(id); const items = itemsOfPerson(id); const owned = hostsOwnedBy(id); const casts = castsOfPerson(id); const sales = salesOfPerson(id);
  const following = id === D.core.currentUserId ? D.hosts.hosts.filter((h) => s.follow[h.id]) : [];
  return [
    { id: 'items', label: 'Items', n: items.length, body: () => items.length ? <Grid gap={2} xs={2} sm={3}>{items.slice(0, 24).map((it) => <ItemCard key={it.id} kind={it.kind} id={it.id} s={s} />)}</Grid> : <Empty text="No items held." /> },
    { id: 'hosts', label: 'Hosts', n: owned.length + following.length, body: () => (
      <Stack direction="column" gap={2}>
        <Text size="xs" weight="bold">HOSTS (children of this profile)</Text>{owned.length ? owned.map((h) => <HostRow key={h.id} id={h.id} s={s} />) : <Empty text="No hosts yet." />}
        {id === D.core.currentUserId && <><Text size="xs" weight="bold">FOLLOWING</Text>{following.length ? following.map((h) => <HostRow key={h.id} id={h.id} s={s} />) : <Empty text="Follow hosts to see them here." />}</>}
      </Stack>) },
    { id: 'casts', label: 'Casts', n: casts.length, body: () => casts.length ? <Stack direction="column" gap={0}>{casts.map((c) => <CastRow key={c.id} id={c.id} s={s} />)}</Stack> : <Empty text="Not in a cast yet." /> },
    { id: 'stats', label: 'Stats', body: () => <Stats rows={[['Items', fmt(st.items)], ['Volume', usd(st.volumeUsd)], ['Bought', usd(st.boughtUsd)], ['Sold', usd(st.soldUsd)], ['Trades', fmt(st.trades)], ['Floor (listed)', st.floorUsd ? usd(st.floorUsd) : '·'], ['Best sale', st.bestSaleUsd ? usd(st.bestSaleUsd) : '·'], ['Hosts', fmt(st.hosts)], ['Casts', fmt(st.casts)]]} /> },
    { id: 'sales', label: 'Sales', n: sales.length, body: () => <Activity rows={sales} s={s} /> },
    { id: 'links', label: 'Connected', body: () => <Connected kind="person" id={id} max={8} inPanel /> },
  ];
}

/** The details column of the chat sheet: whatever record is on top of the back stack. */
export const Details: React.FC<{ at: DetailRef }> = ({ at }) => {
  const s = useStore(phieggStore);
  const [msg, setMsg] = useState('');
  const k = at.kind, id = at.id;
  if (k === 'person') {
    const p = person(id); const ag = agentOf(id);
    return <Panel key={k + id} media={<PersonAvatar id={id} size="xl" />} title={p.name} sub={<>@{p.handle}{ag ? ' · ' + ag.role : ''} · {fmt(p.followers)} followers</>}
      actions={<>{ag && <Button size="sm" variant="primary" onClick={() => s.openChat(id)}>Chat</Button>}<Button size="sm" variant={s.follow[id] ? 'secondary' : 'outline'} onClick={() => s.toggle('follow', id)}>{s.follow[id] ? 'Following' : 'Follow'}</Button><Button size="sm" variant="ghost" onClick={() => s.go('profile', { profileId: id })}>Open profile</Button></>}
      tabs={[{ id: 'about', label: 'About', body: () => <Stack direction="column" gap={2}><Text>{p.bio}</Text>{ag && <><Text size="sm" intent="muted">{ag.style}</Text><Stack direction="row" gap={1} wrap>{ag.abilities.map((x) => <Tag key={x} minimal round intent="success">{x}</Tag>)}</Stack></>}<Stack direction="row" gap={1} wrap>{p.badges.map((b) => <Tag key={b} minimal round intent="primary">{b}</Tag>)}</Stack></Stack> }, ...personTabs(id, s)]} />;
  }
  if (k === 'host') {
    const h = hostOf(id); if (!h) return <Empty text="Unknown host." />;
    const r = roleOf(h.roleTypeId); const cat = roleCategoryOf(r?.categoryId); const casts = castsOfHost(id); const members = D.core.users.filter((u) => u.hostIds?.includes(id));
    return <Panel key={k + id} media={<EntityAvatar id={id} name={h.name} size="xl" />} title={h.name} sub={[r?.name, cat?.name, h.genre].filter(Boolean).join(' · ')}
      actions={<><Button size="sm" variant={s.follow[id] ? 'secondary' : 'primary'} onClick={() => s.toggle('follow', id)}>{s.follow[id] ? 'Following' : 'Follow host'}</Button>{h.ownerId && <Button size="sm" variant="outline" onClick={() => s.openDetails({ kind: 'person', id: h.ownerId! })}>Profile: {person(h.ownerId).name}</Button>}<Button size="sm" variant="ghost" onClick={() => s.go('hosts')}>Enter host</Button></>}
      tabs={[
        { id: 'role', label: 'Role', body: () => <Stack direction="column" gap={2}><Text size="sm">{r ? `${r.name}, one of 64 host roles in ${cat?.name}. Genres: ${r.genres.join(', ')}.` : 'No role yet.'}</Text><Text size="xs" weight="bold">BEHAVIOURS</Text>{(h.behaviours ?? []).map((b) => <Text key={b} size="sm">• {b}</Text>)}{h.clubId && clubOf(h.clubId) && <Row media={<EntityAvatar id={h.clubId} name={clubOf(h.clubId)!.name} />} title={clubOf(h.clubId)!.name} sub="Club" onClick={() => s.openDetails({ kind: 'club', id: h.clubId! })} />}</Stack> },
        { id: 'casts', label: 'Casts', n: casts.length, body: () => casts.length ? <Stack direction="column" gap={0}>{casts.map((c) => <CastRow key={c.id} id={c.id} s={s} />)}</Stack> : <Empty text="Not cast yet." /> },
        { id: 'members', label: 'Members', n: members.length, body: () => <Stack direction="column" gap={0}>{members.slice(0, 40).map((u) => <Row key={u.id} media={<PersonAvatar id={u.id} size="sm" />} title={u.name} sub={'@' + u.handle} onClick={() => s.openDetails({ kind: 'person', id: u.id })} />)}</Stack> },
        { id: 'stats', label: 'Stats', body: () => <Stats rows={[['Members', fmt(h.members)], ['Online', fmt(h.online)], ['Casts', fmt(casts.length)], ['Plays', fmt(casts.reduce((n, c) => n + c.plays, 0))], ['Views', fmt(casts.reduce((n, c) => n + c.stats.views, 0))], ['Tips', usd(casts.reduce((n, c) => n + c.stats.tipsUsd, 0))]]} /> },
        { id: 'links', label: 'Connected', body: () => <Connected kind="host" id={id} max={8} inPanel /> },
      ]} />;
  }
  if (k === 'cast') {
    const c = castOf(id); if (!c) return <Empty text="Unknown cast." />;
    const chat = [...c.chat, ...((s.comments['cast:' + id] ?? []).map((x) => ({ id: x.id, authorId: x.authorId, text: x.text, at: x.at })))];
    return <Panel key={k + id} media={<EntityAvatar id={id} name={c.title} size="xl" />} title={c.title} sub={<>{c.kind}{c.live ? ' · live now' : ''} · {worldOf(c.worldId)?.name}</>}
      actions={<>{c.showId && <Button size="sm" variant="primary" onClick={() => s.go('show', { showId: c.showId! })}>Watch show</Button>}{c.seriesId && <Button size="sm" variant="primary" onClick={() => s.openSeries(c.seriesId!)}>Watch {c.kind}</Button>}</>}
      tabs={[
        ...((c.memberIds?.length ?? 0) > 0 ? [{ id: 'cast', label: 'Cast', n: c.memberIds!.length, body: () => <Stack direction="column" gap={1}>{c.memberIds!.map((u) => <PersonLine key={u} id={u} size="sm" />)}</Stack> }] : []),
        { id: 'hosts', label: 'Hosts', n: c.hostIds.length, body: () => <Stack direction="column" gap={0}>{c.hostIds.map((h) => <HostRow key={h} id={h} s={s} />)}</Stack> },
        { id: 'live', label: c.live ? 'Live chat' : 'Chat', n: chat.length, body: () => (
          <Stack direction="column" gap={2}>
            {chat.map((m) => <ChatBubble key={m.id} side={m.authorId === D.core.currentUserId ? 'me' : 'them'} avatar={<PersonAvatar id={m.authorId} size="sm" />} name={person(m.authorId).name} time={m.at}>{m.text}{'lookId' in m && <LookAttachment id={(m as { lookId?: string }).lookId} />}</ChatBubble>)}
            <Stack direction="row" gap={2}><Input value={msg} placeholder="Say something…" onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && msg.trim()) { s.comment('cast:' + id, msg); setMsg(''); } }} /><Button variant="primary" onClick={() => { if (msg.trim()) { s.comment('cast:' + id, msg); setMsg(''); } }}>Send</Button></Stack>
          </Stack>) },
        { id: 'looks', label: 'Looks', n: c.lookIds.length, body: () => <Grid gap={2} xs={2} sm={3}>{c.lookIds.map((l) => <ItemCard key={l} kind="look" id={l} s={s} />)}</Grid> },
        { id: 'quests', label: 'Quests', n: c.questIds.length, body: () => c.questIds.length ? <Stack direction="column" gap={0}>{c.questIds.map((q) => { const x = D.economy.quests.find((y) => y.id === q)!; return <Row key={q} media={<EntityAvatar id={q} name={x.title} />} title={x.title} sub={`${fmt(x.reward)} ${x.rewardCoin} · ${fmt(x.entrants)} entrants`} onClick={() => s.go('quests')} />; })}</Stack> : <Empty text="No quests in this cast." /> },
        { id: 'stats', label: 'Stats', body: () => <Stats rows={[['Plays', fmt(c.plays)], ['Views', fmt(c.stats.views)], ['Likes', fmt(c.stats.likes)], ['Chats', fmt(c.stats.chats)], ['Tips', usd(c.stats.tipsUsd)]]} /> },
        { id: 'links', label: 'Connected', body: () => <Connected kind="cast" id={id} max={8} inPanel /> },
      ]} />;
  }
  if (k === 'look' || k === 'piece') {
    const name = k === 'look' ? lookOf(id)?.name : pieceOf(id)?.name; const rows = salesOfItem(id);
    const last = rows.find((x) => x.event === 'sale'); const owner = rows.find((x) => x.event !== 'list' && x.event !== 'offer')?.toId;
    return <Panel key={k + id} media={<Box width="5rem"><ItemCard kind={k} id={id} s={s} /></Box>} title={name ?? id} sub={owner ? <>Owned by {person(owner).name}</> : undefined}
      actions={<>{k === 'look' && <Button size="sm" variant="primary" onClick={() => s.openLook(id)}>Buy / offer</Button>}{owner && <Button size="sm" variant="outline" onClick={() => s.openDetails({ kind: 'person', id: owner })}>Owner</Button>}</>}
      tabs={[
        { id: 'activity', label: 'Activity', n: rows.length, body: () => <Activity rows={rows} s={s} hideItem /> },
        { id: 'stats', label: 'Stats', body: () => <Stats rows={[['Last sale', last ? usd(last.priceUsd) : '·'], ['Sales', fmt(rows.filter((x) => x.event === 'sale').length)], ['Offers', fmt(rows.filter((x) => x.event === 'offer').length)], ['Listed', rows.some((x) => x.event === 'list') ? 'Yes' : 'No']]} /> },
        { id: 'links', label: 'Connected', body: () => <Connected kind={k} id={id} max={8} inPanel /> },
      ]} />;
  }
  // Clubs, worlds, shows, series, roles, quests… : facts + relations.
  const label = k === 'club' ? clubOf(id)?.name : k === 'world' ? worldOf(id)?.name : k === 'show' ? showOf(id)?.title : k === 'series' ? seriesOf(id)?.title : k === 'role' ? roleOf(id)?.name : k === 'store' ? STORES.find((x) => x.id === id)?.name : id;
  return <Panel key={k + id} media={<EntityAvatar id={id} name={label ?? id} size="xl" />} title={label ?? id} sub={k}
    actions={k === 'club' ? <Button size="sm" variant="primary" onClick={() => s.go('club', { clubId: id })}>Open club</Button> : k === 'world' ? <Button size="sm" variant="primary" onClick={() => s.go('world', { worldId: id })}>Enter world</Button> : k === 'show' ? <Button size="sm" variant="primary" onClick={() => s.go('show', { showId: id })}>Watch</Button> : undefined}
    tabs={[{ id: 'links', label: 'Connected', body: () => <Connected kind={k as 'club'} id={id} max={10} inPanel /> }]} />;
};
