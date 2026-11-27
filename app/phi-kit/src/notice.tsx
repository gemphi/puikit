/**
 * What the viewer is told of, kept like every user document: a room or a whole host muted for a while or until
 * unmuted (`limit.json` `mute`); for each host, whether every message, only mentions or nothing is counted, and
 * whether `@everyone` and `@here` reach them; and the inbox, every mention of the viewer and every answer to what they
 * wrote, read or not. A muted room counts nothing on the menu but a mention of the viewer.
 */
import React from 'react';
import { Button, Popover, Pressable, Select, Stack, Switch, TabList, Text, Title } from '@pui/components';
import { Bell, BellOff } from 'lucide-react';
import { persisted } from './api';
import { mentions } from './mention';
import { Face, type People } from './people';
import { clock, span } from './time';
import words from './talk.json';
import limit from './limit.json';

const W = words.notice;
const say = (s: string, k: Record<string, string>) => Object.entries(k).reduce((t, [a, b]) => t.replace('{' + a + '}', b), s);

type Level = 'all' | 'only' | 'nothing';
/** A mute is until a moment, or 0 for until unmuted; by `<app>/<room>`, or `<app>/#<host>` for a whole host. */
type Kept = { mute: Record<string, number>; level: Record<string, Level>; everyone: Record<string, boolean>; read: Record<string, boolean> };
const KEPT = persisted<Kept>('notice', { mute: {}, level: {}, everyone: {}, read: {} });
const hostKey = (app: string, space: string) => app + '/#' + space;

/** Until when a room is muted, by itself or by its host: 0 for until unmuted, undefined when it is not. */
export const mutedUntil = (k: Kept, app: string, room: string, space?: string): number | undefined => {
  const live = (v?: number) => (v === undefined ? undefined : v === 0 || v > Date.now() ? v : undefined);
  return live(k.mute[app + '/' + room]) ?? (space ? live(k.mute[hostKey(app, space)]) : undefined);
};
export const useNotice = () => KEPT.use();
/** How many of the messages waiting in a room the menu counts. */
export const counted = (k: Kept, app: string, room: string, space: string | undefined, waiting: number) =>
  (mutedUntil(k, app, room, space) !== undefined || (space && k.level[hostKey(app, space)] === 'nothing') ? 0 : waiting);
const setMute = (key: string, until?: number) => { const k = KEPT.get(); const mute = { ...k.mute }; if (until === undefined) delete mute[key]; else mute[key] = until; KEPT.set({ ...k, mute }); };

/** How long to mute something for, or unmute it, and until when it is muted now. */
const MuteChoice: React.FC<{ id: string; until?: number; name: string }> = ({ id, until, name }) => (
  <Stack direction="column" gap={1} minWidth="13rem">
    <Text as="span" size="xs" intent="muted" role="status">{until === undefined ? name : until ? say(W.mutedUntil, { when: clock(until) }) : W.mutedEver}</Text>
    <Stack direction="row" gap={1} wrap>
      {limit.mute.minutes.map((m) => <Button key={m} variant="glass" size="sm" onClick={() => setMute(id, m ? Date.now() + m * 60000 : 0)}>{m ? span(m) : W.ever}</Button>)}
      {until !== undefined && <Button variant="glass" size="sm" onClick={() => setMute(id)}>{W.unmute}</Button>}
    </Stack>
  </Stack>
);

/** Mute a room for a while, or unmute it: the bell at the end of its head. */
export const MuteMenu: React.FC<{ app: string; room: string; space?: string; label: string }> = ({ app, room, space, label }) => {
  const k = KEPT.use(); const until = mutedUntil(k, app, room, space);
  const name = say(W.muteRoom, { room: label });
  return (
    <Popover portal placement="bottom-end" trigger={<Button variant="icon" aria-label={name} title={name} aria-pressed={until !== undefined}>{until !== undefined ? <BellOff size={15} /> : <Bell size={15} />}</Button>}>
      <MuteChoice id={app + '/' + room} until={mutedUntil(k, app, room)} name={name} />
    </Popover>
  );
};

/** A host's notifications: muted or not, what is counted, whether `@everyone` reaches the viewer. */
export const NoticeTab: React.FC<{ app: string; space: string }> = ({ app, space }) => {
  const k = KEPT.use(); const key = hostKey(app, space);
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="column" gap={1}>
        <Text size="sm" weight="medium">{say(W.muteHost, { host: space })}</Text>
        <MuteChoice id={key} until={mutedUntil(k, app, '', space)} name={say(W.muteHost, { host: space })} />
      </Stack>
      <Stack direction="column" gap={1}>
        <Text size="sm" weight="medium">{W.level}</Text>
        <Select aria-label={W.level} value={k.level[key] ?? 'all'} options={(['all', 'only', 'nothing'] as Level[]).map((v) => ({ value: v, label: W[v] }))}
          onChange={(e) => KEPT.set({ ...KEPT.get(), level: { ...KEPT.get().level, [key]: e.target.value as Level } })} />
      </Stack>
      <Switch label={W.everyone} checked={k.everyone[key] ?? true} onChange={(e) => KEPT.set({ ...KEPT.get(), everyone: { ...KEPT.get().everyone, [key]: e.target.checked } })} />
    </Stack>
  );
};

type Room = { label: string; space?: string; message: { id: string; by: string; day?: string; at: string; text?: string; reply?: string }[] };
type Item = { key: string; room: string; label: string; by: string; day?: string; at: string; text?: string; why: 'mention' | 'reply' };

/** Every mention of the viewer and answer to them in an app's rooms, newest first; `@everyone` only where it reaches them. */
export const inboxOf = (app: string, file: People & { room: Record<string, Room> }, k: Kept): Item[] => Object.entries(file.room).flatMap(([id, r]) => {
  const key = r.space ? hostKey(app, r.space) : '';
  const all = (k.everyone[key] ?? true) && k.level[key] !== 'nothing';
  return r.message.flatMap((x): Item[] => {
    if (x.by === file.me) return [];
    const m = mentions(x.text, file);
    const reply = !!x.reply && r.message.find((y) => y.id === x.reply)?.by === file.me;
    const why = m.me || (m.all && all) ? 'mention' : reply ? 'reply' : undefined;
    return why ? [{ key: app + '/' + id + '/' + x.id, room: id, label: r.label, by: x.by, day: x.day, at: x.at, text: x.text, why }] : [];
  });
}).reverse();
export const unreadOf = (items: Item[], k: Kept) => items.filter((x) => !k.read[x.key]).length;

/** The inbox: mentions and replies, a press going to the room; read once opened, or all at once. */
export const Inbox: React.FC<{ app: string; file: (People & { room: Record<string, Room> }) | null; go: (room: string) => void }> = ({ app, file, go }) => {
  const k = KEPT.use(); const [tab, setTab] = React.useState<'mention' | 'reply'>('mention');
  if (!file) return null;
  const items = inboxOf(app, file, k);
  const shown = items.filter((x) => x.why === tab);
  const read = (keys: string[]) => KEPT.set({ ...KEPT.get(), read: { ...KEPT.get().read, ...Object.fromEntries(keys.map((x) => [x, true])) } });
  const name = (id: string) => file.member.find((m) => m.id === id)?.name ?? '';
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={2} align="center" justify="between">
        <Title level={2}>{W.inbox}</Title>
        <Button variant="glass" disabled={!unreadOf(items, k)} onClick={() => read(items.map((x) => x.key))}>{W.read}</Button>
      </Stack>
      <TabList size="sm" variant="pills" aria-label={W.inbox} activeId={tab} onChange={(id) => setTab(id as 'mention' | 'reply')}
        items={[{ id: 'mention', label: W.mentions }, { id: 'reply', label: W.replies }]} />
      {shown.length ? shown.map((x) => (
        <Pressable key={x.key} row gap={2} fill hover pad="sm" onClick={() => { read([x.key]); go(x.room); }}>
          <Face file={file} m={file.member.find((m) => m.id === x.by)} size="sm" />
          <Stack direction="column" gap={0} flex="1" minWidth="0">
            <Text as="span" size="sm" weight={k.read[x.key] ? 'normal' : 'semibold'} truncate>{name(x.by)} · {say(W.in, { room: x.label })}</Text>
            <Text as="span" size="xs" intent="muted" truncate>{x.text}</Text>
          </Stack>
          <Text as="span" size="xs" intent="muted">{[x.day, x.at].filter(Boolean).join(' ')}</Text>
        </Pressable>)) : <Text size="sm" intent="muted">{W.empty}</Text>}
    </Stack>
  );
};
