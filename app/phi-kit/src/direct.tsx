import React from 'react';
import { Box, Input, Pressable, Stack, Text, Title } from '@pui/components';
import { Search } from 'lucide-react';
import { persisted } from './api';
import type { NavItem } from './data';
import { Face, seekPeople, type Member, type People } from './people';
import words from './words.json';

const W = words.direct;

/** The people the viewer began a direct conversation with, by app, newest first; kept like every user document. */
const BEGUN = persisted<Record<string, string[]>>('room-direct', {});
/** A direct conversation's room is named after the person it is with; no file has to hold it. */
const PREFIX = 'dm-';
export const directRoom = (person: string) => PREFIX + person;
/** The person a room is a direct conversation with, when its name says it is one. */
export const directWith = (room: string): string | undefined => (room.startsWith(PREFIX) ? room.slice(PREFIX.length) : undefined);

/** Begin a conversation with a person (once): they stand in the direct list from then on. */
export const beginDirect = (app: string, person: string) => {
  const all = BEGUN.get(); const mine = all[app] ?? [];
  if (!mine.includes(person)) BEGUN.set({ ...all, [app]: [person, ...mine] });
};

/**
 * The direct list's own entries: the way to find anyone, then everyone the viewer began a conversation with, each
 * with their picture and presence. The app's data names the menu group they join (`"direct": "<group id>"`).
 */
export const useDirect = (app: string, people: People | null, written: NavItem[]): NavItem[] => {
  const begun = BEGUN.use()[app] ?? [];
  const has = new Set(written.map((n) => n.who));
  const mine = people ? begun.filter((p) => !has.has(p)).map((p) => people.member.find((m) => m.id === p)).filter(Boolean) as Member[] : [];
  return [{ id: '_people', label: W.find, icon: 'plus' }, ...mine.map((m) => ({ id: directRoom(m.id), label: m.name, icon: 'user', who: m.id }))];
};

/** The page a conversation is found or started from: everyone of the app, searched by name or handle. A press on a
 *  person begins the conversation and goes to it. */
export const FindPeople: React.FC<{ app: string; people: People | null; go: (id: string) => void }> = ({ app, people, go }) => {
  const [find, setFind] = React.useState('');
  if (!people) return null;
  const list = seekPeople(people, find, 30);
  return (
    <Box className="phi-region">
      <Stack direction="column" gap={3}>
        <Title level={2}>{W.find}</Title>
        <Input autoFocus icon={<Search size={14} />} value={find} placeholder={W.search} aria-label={W.search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
        <Stack direction="column" gap={1}>
          {list.map((m) => (
            <Pressable key={m.id} row gap={2} fill hover pad="sm" onClick={() => { beginDirect(app, m.id); go(directRoom(m.id)); }}>
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
