import React from 'react';
import { Avatar, Box, Button, Input, Label, Pressable, Stack, Text, Title } from '@pui/components';
import { Search } from 'lucide-react';
import { assetUrl, type AppData, type NavItem } from './data';
import { persisted } from './api';
import { NavIcon } from './icons';
import words from './words.json';

const W = words.host;
const say = (s: string, k: string, v: string) => s.replace('{' + k + '}', v);

/** A room a new host starts with: its name, the heading it stands under, and whether it is one people are in. */
type Start = { label: string; head: string; kind?: 'voice' };
type Template = { id: string; label: string; icon: string; room: Start[] };
/** A host in the catalogue: its menu group as the shell draws it, and how many people it has. */
export type Host = NavItem & { members?: number; online?: number };
/** The catalogue an app's data names (`"host": "data/host.json"`): every host there is, and what a new one starts from. */
type HostFile = { template: Template[]; host: Host[] };
/** A room of a host someone made: enough for the room block to draw it. */
export type MadeRoom = { label: string; space: string; kind?: 'voice'; member: string[]; message: never[] };
type Made = { group: NavItem; room: Record<string, MadeRoom> };

/** Which hosts the viewer joined or left (by `<app>/<host>`), and the hosts they made, kept like every user document. */
const IN = persisted<Record<string, boolean>>('host-in', {});
const MADE = persisted<Record<string, Made[]>>('host-made', {});
const files = new Map<string, Promise<HostFile>>();

/** A room of a host the viewer made, by its id (the room block asks when the app's own file has no such room). */
export const madeRoom = (app: string, id: string): MadeRoom | undefined => (MADE.get()[app] ?? []).map((m) => m.room[id]).find(Boolean);

/**
 * An app's hosts: the catalogue, the ones the viewer is in (as menu groups for the rail), and joining, leaving and
 * making one. A host is joined from the start when the app's data says so (`joined`), until the viewer says otherwise.
 */
export const useHosts = (data: AppData | null) => {
  const [file, setFile] = React.useState<HostFile | null>(null);
  const within = IN.use(); const made = MADE.use();
  const ref = data?.host; const app = data?.app ?? '';
  React.useEffect(() => {
    if (!ref) return;
    const src = assetUrl(ref);
    if (!files.has(src)) files.set(src, fetch(src).then((r) => r.json()));
    void (files.get(src) as Promise<HostFile>).then(setFile);
  }, [ref]);
  const joined = (id: string) => within[app + '/' + id] ?? !!data?.joined?.includes(id);
  const mine = made[app] ?? [];
  return {
    on: !!ref, file, joined, made: mine,
    nav: [...(file?.host.filter((h) => joined(h.id)) ?? []), ...mine.map((m) => m.group)] as NavItem[],
    join: (id: string, on: boolean) => IN.set({ ...within, [app + '/' + id]: on }),
    /** Make a host from a template: its rooms under their headings, the first of them returned to go to. */
    create: (name: string, t: Template): string => {
      const id = 'm' + Date.now().toString(36);
      const rooms = t.room.map((r, i) => ({ ...r, id: id + '-' + i }));
      const heads = [...new Set(rooms.map((r) => r.head))];
      const group: NavItem = { id, label: name, icon: t.icon, items: heads.map((h, i) => ({ id: id + '-h' + i, label: h, icon: 'hash', head: true,
        items: rooms.filter((r) => r.head === h).map((r) => ({ id: r.id, label: r.label, icon: r.kind ? 'volume' : 'hash', ...(r.kind ? { crowd: r.id } : {}) })) })) };
      const room = Object.fromEntries(rooms.map((r) => [r.id, { label: r.label, space: name, ...(r.kind ? { kind: r.kind } : {}), member: [], message: [] } as MadeRoom]));
      MADE.set({ ...made, [app]: [...mine, { group, room }] });
      return rooms[0].id;
    },
    remove: (id: string) => MADE.set({ ...made, [app]: mine.filter((m) => m.group.id !== id) }),
  };
};

const mark = (h: Host) => (h.mark
  ? <Avatar size="sm" deck={0} alt={h.label} sprite={{ src: assetUrl(h.mark.sheet), cols: h.mark.cols, index: h.mark.index }} />
  : <Avatar size="sm" deck={0} alt={h.label} seed={h.id} initials={h.label.slice(0, 1)} />);

/**
 * The page a person adds a host from: make one of their own (a name, then how it starts, from the catalogue's
 * templates), or join one there is. Every host of the catalogue can be joined and left; the list shows the first
 * that match what is typed.
 */
export const Hosts: React.FC<{ hosts: ReturnType<typeof useHosts>; go: (id: string) => void }> = ({ hosts, go }) => {
  const [name, setName] = React.useState('');
  const [find, setFind] = React.useState('');
  const file = hosts.file;
  if (!file) return null;
  const sought = find.trim().toLowerCase();
  const list = file.host.filter((h) => !sought || h.label.toLowerCase().includes(sought)).slice(0, 24);
  return (
    <Stack direction="column" gap={4}>
      <Box className="phi-region">
        <Stack direction="column" gap={3}>
          <Title level={2}>{W.create}</Title>
          <Text size="sm" intent="muted">{W.lead}</Text>
          <Input value={name} placeholder={W.name} aria-label={W.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          <Stack direction="column" gap={1}>
            {file.template.map((t) => (
              <Pressable key={t.id} row gap={2} fill hover pad="sm" disabled={!name.trim()} onClick={() => go(hosts.create(name.trim(), t))}>
                <Label icon={<NavIcon name={t.icon} size={16} />}>{t.label}</Label>
                <Text as="span" size="xs" intent="muted" truncate>{t.room.map((r) => r.label).join(' · ')}</Text>
              </Pressable>))}
          </Stack>
          {hosts.made.map((m) => (
            <Stack key={m.group.id} direction="row" gap={2} align="center" justify="between">
              <Label icon={<NavIcon name={m.group.icon} size={16} />}>{m.group.label}</Label>
              <Button variant="glass" onClick={() => hosts.remove(m.group.id)}>{W.remove}</Button>
            </Stack>))}
        </Stack>
      </Box>
      <Box className="phi-region">
        <Stack direction="column" gap={3}>
          <Title level={2}>{W.join}</Title>
          <Input icon={<Search size={14} />} value={find} placeholder={W.find} aria-label={W.find} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
          <Stack direction="column" gap={1}>
            {list.map((h) => { const inside = hosts.joined(h.id); return (
              <Stack key={h.id} direction="row" gap={2} align="center">
                {mark(h)}
                <Stack direction="column" gap={0} flex="1" minWidth="0">
                  <Text as="span" size="sm" weight="semibold" truncate>{h.label}</Text>
                  <Text as="span" size="xs" intent="muted" numeric>{say(W.members, 'n', (h.members ?? 0).toLocaleString('en-US'))}</Text>
                </Stack>
                <Button variant="glass" aria-pressed={inside} onClick={() => hosts.join(h.id, !inside)}>{inside ? W.leave : W.enter}</Button>
              </Stack>); })}
            {!list.length && <Text size="sm" intent="muted">{W.none}</Text>}
          </Stack>
          <Text size="xs" intent="muted" numeric>{say(W.count, 'n', String(file.host.length))}</Text>
        </Stack>
      </Box>
    </Stack>
  );
};
