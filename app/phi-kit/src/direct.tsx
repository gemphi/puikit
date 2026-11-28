import React from 'react';
import { Box, Input, Pressable, Stack, Text, Title } from '@pui/components';
import { Search } from 'lucide-react';
import { apiGet, apiSend, hasApi, persisted, served } from './api';
import type { NavItem } from './data';
import { Face, seekPeople, type Member, type People } from './people';
import { memberOf, type Person } from './room';
import words from './words.json';
import limit from './limit.json';

const W = words.direct;

/** The people of the app's files the viewer began a direct conversation with, by app, newest first; kept like every
 *  user document. A conversation with someone who has an account is the room the two share, kept by Phiora. */
const BEGUN = persisted<Record<string, string[]>>('room-direct', {});
/** A direct conversation with someone of the app's files is named after them; no file has to hold it. */
const PREFIX = 'dm-';
export const directRoom = (person: string) => PREFIX + person;
/** Whether a room is a direct conversation, by its name: with someone of the files, or the room two accounts share
 *  (Phiora names it, and says who is in it). */
export const directWith = (room: string): string | undefined => (room.startsWith(PREFIX) ? room.slice(PREFIX.length) : undefined);
/** The direct rooms the viewer shares with other accounts, newest first (`app/phiora-server/src/room.mjs`). */
type Shared = { direct: { room: string; with: Person; at: number }[] };
const shared = (app: string) => served<Shared>('/direct/' + encodeURIComponent(app), { direct: [] });

/** Begin a conversation with a person of the files (once): they stand in the direct list from then on. */
export const beginDirect = (app: string, person: string) => {
  const all = BEGUN.get(); const mine = all[app] ?? [];
  if (!mine.includes(person)) BEGUN.set({ ...all, [app]: [person, ...mine] });
};
/** The room to write to someone in: with someone who has an account, the one the two share (Phiora names it); with
 *  someone of the app's files, the one named after them, begun. */
export const openDirect = async (app: string, m: Member): Promise<string> => {
  const r = m.live && hasApi ? await apiSend<{ room: string }>('POST', '/direct/' + encodeURIComponent(app), { with: m.id }) : null;
  if (!r?.ok) { beginDirect(app, m.id); return directRoom(m.id); }
  void shared(app).refresh();
  return r.body.room;
};

/**
 * The direct list's own entries: the way to find anyone, then everyone the viewer began a conversation with, each
 * with their picture and presence, and the rooms they share with other accounts. The app's data names the menu
 * group they join (`"direct": "<group id>"`).
 */
export const useDirect = (app: string, people: People | null, written: NavItem[]): NavItem[] => {
  const begun = BEGUN.use()[app] ?? []; const rooms = shared(app).use().direct;
  React.useEffect(() => { const t = setInterval(() => { if (!document.hidden) void shared(app).refresh(); }, limit.room.list * 1000); return () => clearInterval(t); }, [app]);
  const has = new Set(written.map((n) => n.who));
  const mine = people ? begun.filter((p) => !has.has(p)).map((p) => people.member.find((m) => m.id === p)).filter(Boolean) as Member[] : [];
  return [{ id: '_people', label: W.find, icon: 'plus' }, ...rooms.map((x) => ({ id: x.room, label: x.with.name, icon: 'user', who: x.with.id })),
    ...mine.map((m) => ({ id: directRoom(m.id), label: m.name, icon: 'user', who: m.id }))];
};

/** The accounts whose handle is what was typed (with or without @): someone not in the app's files is found so. */
export const useAccounts = (app: string, find: string): Member[] => {
  const [found, setFound] = React.useState<Member[]>([]);
  React.useEffect(() => {
    const handle = find.trim(); if (!hasApi || handle.length < 3) { setFound([]); return; }
    let on = true; const t = setTimeout(() => void apiGet<{ person: Person[] }>('/people/' + encodeURIComponent(app) + '?find=' + encodeURIComponent(handle)).then((r) => {
      if (on) setFound((r?.person ?? []).map(memberOf));
    }), 300);
    return () => { on = false; clearTimeout(t); };
  }, [app, find]);
  return found;
};

/** The page a conversation is found or started from: everyone of the app, searched by name or handle, and the account
 *  with the handle typed. A press on a person begins the conversation and goes to it. */
export const FindPeople: React.FC<{ app: string; people: People | null; go: (id: string) => void }> = ({ app, people, go }) => {
  const [find, setFind] = React.useState('');
  const accounts = useAccounts(app, find);
  if (!people) return null;
  const list = [...accounts, ...seekPeople(people, find, 30).filter((m) => !accounts.some((a) => a.id === m.id))];
  return (
    <Box className="phi-region">
      <Stack direction="column" gap={3}>
        <Title level={2}>{W.find}</Title>
        <Input autoFocus icon={<Search size={14} />} value={find} placeholder={W.search} aria-label={W.search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
        <Stack direction="column" gap={1}>
          {list.map((m) => (
            <Pressable key={m.id} row gap={2} fill hover pad="sm" onClick={() => void openDirect(app, m).then(go)}>
              <Face file={people} m={m} size="sm" dot />
              <Stack direction="column" gap={0} flex="1" minWidth="0">
                <Text as="span" size="sm" weight="semibold" truncate>{m.name}</Text>
                {m.handle ? <Text as="span" size="xs" intent="muted" truncate>@{m.handle}</Text> : null}
              </Stack>
            </Pressable>))}
          {!list.length && <Text size="sm" intent="muted">{W.none}</Text>}
        </Stack>
        <Text size="xs" intent="muted" numeric>{W.count.replace('{n}', (people.member.length - 1).toLocaleString('en-US'))}</Text>
      </Stack>
    </Box>
  );
};
