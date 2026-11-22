/**
 * Friends: who the viewer is friends with, who has asked to be, and whom the viewer asked. The app's people file names
 * how it starts (`friend: { with, asked }`); what the viewer does since (ask, cancel, accept, decline, remove) is kept
 * like every user document and wins over the file. Nobody is on the other side yet, so a request sent waits.
 */
import React from 'react';
import { Box, Button, Input, Pressable, Stack, TabList, Text, Title } from '@pui/components';
import { Check, MessageCircle, Search, UserPlus, X } from 'lucide-react';
import { persisted } from './api';
import type { NavItem } from './data';
import { directRoom } from './direct';
import { Face, seekPeople, type Member, type People } from './people';
import words from './words.json';

const W = words.friend;

/** How the viewer and a person stand: friends, the viewer asked, they asked, or nothing. */
export type Bond = 'with' | 'sent' | 'asked' | 'none';
const KEPT = persisted<Record<string, Record<string, Bond>>>('room-friend', {});
const from = (file: People, kept: Record<string, Bond> | undefined, id: string): Bond =>
  kept?.[id] ?? (file.friend?.with?.includes(id) ? 'with' : file.friend?.asked?.includes(id) ? 'asked' : 'none');
export const bondOf = (app: string, file: People, id: string): Bond => from(file, KEPT.get()[app], id);
export const setBond = (app: string, id: string, bond: Bond) => { const all = KEPT.get(); KEPT.set({ ...all, [app]: { ...all[app], [id]: bond } }); };
/** What one press does from each bond, and what it leads to: ask, take the request back, accept, or part. */
export const NEXT: Record<Bond, { to: Bond; label: string }> = {
  none: { to: 'sent', label: W.ask }, sent: { to: 'none', label: W.cancel }, asked: { to: 'with', label: W.accept }, with: { to: 'none', label: W.remove },
};
/** Everyone the viewer has a bond with, by bond; read again whenever one changes. */
export const useBonds = (app: string, file: People | null): Record<Exclude<Bond, 'none'>, Member[]> => {
  const kept = KEPT.use()[app];
  const of = (bond: Bond) => (file ? file.member.filter((m) => m.id !== file.me && from(file, kept, m.id) === bond) : []);
  return { with: of('with'), sent: of('sent'), asked: of('asked') };
};
/** The menu's entry for friends, counting who waits for an answer; it leads the direct list. */
export const useFriendEntry = (app: string, file: People | null): NavItem => ({ id: '_friends', label: W.title, icon: 'users', count: useBonds(app, file).asked.length || undefined });

type Act = { label: string; icon: React.ReactNode; onClick: () => void };
/** A person in a list of friends: their picture, name and a line about them (a press writes to them), then what can
 *  be done. */
const Row: React.FC<{ file: People; m: Member; sub?: string; onOpen: () => void; act: Act[] }> = ({ file, m, sub, onOpen, act }) => (
  <Stack direction="row" gap={1} align="center">
    <Pressable row gap={2} fill hover pad="sm" onClick={onOpen}>
      <Face file={file} m={m} size="sm" dot />
      <Stack direction="column" gap={0} flex="1" minWidth="0">
        <Text as="span" size="sm" weight="semibold" truncate>{m.name}</Text>
        <Text as="span" size="xs" intent="muted" truncate>{sub ?? m.state}</Text>
      </Stack>
    </Pressable>
    {act.map((a) => <Button key={a.label} variant="icon" aria-label={a.label + ' - ' + m.name} title={a.label} onClick={a.onClick}>{a.icon}</Button>)}
  </Stack>
);

/** The friends page: who is here now, everyone, the requests that wait (theirs to answer, the viewer's to take back),
 *  and a search of all the app's people to ask someone new. */
export const Friends: React.FC<{ app: string; people: People | null; go: (id: string) => void }> = ({ app, people, go }) => {
  const bonds = useBonds(app, people);
  const [tab, setTab] = React.useState('here');
  const [find, setFind] = React.useState('');
  if (!people) return null;
  const write = (m: Member) => () => go(directRoom(m.id));
  const step = (m: Member, bond: Bond, icon: React.ReactNode): Act => ({ label: NEXT[bond].label, icon, onClick: () => setBond(app, m.id, NEXT[bond].to) });
  const message = (m: Member): Act => ({ label: W.message, icon: <MessageCircle size={15} />, onClick: write(m) });
  const friend = (m: Member) => <Row key={m.id} file={people} m={m} onOpen={write(m)} act={[message(m), step(m, 'with', <X size={15} />)]} />;
  const here = bonds.with.filter((m) => (m.presence ?? 'off') !== 'off');
  const sought = seekPeople(people, find, 30);
  const none = (text: string) => <Text size="sm" intent="muted">{text}</Text>;
  return (
    <Box className="phi-region">
      <Stack direction="column" gap={3}>
        <Title level={2}>{W.title}</Title>
        <TabList size="sm" variant="pills" place="start" aria-label={W.title} activeId={tab} onChange={setTab} items={[
          { id: 'here', label: W.here, count: here.length }, { id: 'all', label: W.all, count: bonds.with.length },
          { id: 'pending', label: W.pending, count: bonds.asked.length + bonds.sent.length || undefined }, { id: 'add', label: W.add }]} />
        {tab === 'here' && <Stack direction="column" gap={1}>{here.length ? here.map(friend) : none(W.nobody)}</Stack>}
        {tab === 'all' && <Stack direction="column" gap={1}>{bonds.with.length ? bonds.with.map(friend) : none(W.nobody)}</Stack>}
        {tab === 'pending' && (
          <Stack direction="column" gap={1}>
            {bonds.asked.map((m) => <Row key={m.id} file={people} m={m} sub={W.asked} onOpen={write(m)} act={[step(m, 'asked', <Check size={15} />), { label: W.decline, icon: <X size={15} />, onClick: () => setBond(app, m.id, 'none') }]} />)}
            {bonds.sent.map((m) => <Row key={m.id} file={people} m={m} sub={W.yours} onOpen={write(m)} act={[step(m, 'sent', <X size={15} />)]} />)}
            {!bonds.asked.length && !bonds.sent.length && none(W.nothing)}
            {bonds.sent.length > 0 && <Text size="xs" intent="muted">{W.waits}</Text>}
          </Stack>)}
        {tab === 'add' && (
          <Stack direction="column" gap={1}>
            <Input autoFocus icon={<Search size={14} />} value={find} placeholder={W.search} aria-label={W.search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
            {sought.map((m) => { const bond = bondOf(app, people, m.id); return <Row key={m.id} file={people} m={m} sub={bond === 'none' ? m.handle && '@' + m.handle : W[bond]} onOpen={write(m)} act={[step(m, bond, bond === 'none' ? <UserPlus size={15} /> : bond === 'asked' ? <Check size={15} /> : <X size={15} />)]} />; })}
            {!sought.length && none(W.unfound)}
          </Stack>)}
      </Stack>
    </Box>
  );
};
