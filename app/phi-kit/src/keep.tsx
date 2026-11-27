/**
 * Saved messages and reminders, kept like every user document: a message saved from its menu stays in the viewer's
 * list (`Saved`), with who wrote it, where and what; one to be reminded of is saved with a moment (`limit.json`
 * `remind`), and when it comes a toast says so (`Reminder`, held once by the shell) and the list marks it due until
 * it is done.
 */
import React from 'react';
import { Button, Pressable, Stack, Text, Title, Toast } from '@pui/components';
import { Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import { persisted } from './api';
import { clock, span } from './time';
import words from './talk.json';
import limit from './limit.json';

const W = words.keep;
const say = (s: string, k: Record<string, string>) => Object.entries(k).reduce((t, [a, b]) => t.replace('{' + a + '}', b), s);

/** A message kept: where it is (`<app>/<room>`, the room's id and name), who wrote it and what, and when to remind. */
type Saved = { store: string; room: string; label: string; name: string; text: string; at: number; remind?: number; told?: boolean; done?: boolean };
const KEPT = persisted<Record<string, Saved>>('room-keep', {});

/** Save a message, or unsave it, and be reminded of it: the rows of its menu. */
export const KeepMenu: React.FC<{ store: string; room: string; label: string; id: string; name: string; text: string }> = ({ store, room, label, id, name, text }) => {
  const all = KEPT.use(); const key = store + '/' + id; const kept = all[key];
  const put = (v?: Saved) => { const next = { ...KEPT.get() }; if (v) next[key] = v; else delete next[key]; KEPT.set(next); };
  const base: Saved = { store, room, label, name, text, at: Date.now() };
  return (
    <Stack direction="column" gap={1}>
      <Button variant="glass" iconLeft={kept ? BookmarkCheck : Bookmark} aria-pressed={!!kept} onClick={() => put(kept ? undefined : base)}>{kept ? W.unsave : W.save}</Button>
      <Text as="span" size="xs" intent="muted">{kept?.remind && !kept.done ? say(W.at, { when: clock(kept.remind) }) : W.remind}</Text>
      <Stack direction="row" gap={1} wrap>
        {limit.remind.minutes.map((m) => <Button key={m} variant="glass" size="sm" iconLeft={Clock} onClick={() => put({ ...(kept ?? base), remind: Date.now() + m * 60000, told: false, done: false })}>{say(W.in, { when: span(m) })}</Button>)}
      </Stack>
    </Stack>
  );
};

/** The viewer's saved messages, those whose reminder came first; a press goes to the room. */
export const Saved: React.FC<{ go: (room: string) => void }> = ({ go }) => {
  const all = KEPT.use();
  const list = Object.entries(all).sort(([, a], [, b]) => Number(!!b.told && !b.done) - Number(!!a.told && !a.done) || b.at - a.at);
  const put = (key: string, v?: Saved) => { const next = { ...KEPT.get() }; if (v) next[key] = v; else delete next[key]; KEPT.set(next); };
  return (
    <Stack direction="column" gap={3}>
      <Title level={2}>{W.list}</Title>
      {list.length ? list.map(([key, x]) => (
        <Stack key={key} direction="row" gap={2} align="center">
          <Pressable row gap={2} fill hover pad="sm" onClick={() => go(x.room)}>
            <Stack direction="column" gap={0} flex="1" minWidth="0">
              <Text as="span" size="sm" weight={x.told && !x.done ? 'semibold' : 'normal'} truncate>{x.name} · {x.label}</Text>
              <Text as="span" size="xs" intent="muted" truncate>{x.text}</Text>
              {x.remind && !x.done && <Text as="span" size="xs" intent={x.told ? 'warning' : 'muted'}>{say(W.at, { when: clock(x.remind) })}</Text>}
            </Stack>
          </Pressable>
          {x.remind && !x.done && <Button variant="glass" size="sm" onClick={() => put(key, { ...x, done: true })}>{W.done}</Button>}
          <Button variant="glass" size="sm" onClick={() => put(key)}>{W.unsave}</Button>
        </Stack>)) : <Text size="sm" intent="muted">{W.empty}</Text>}
    </Stack>
  );
};

/** Says a reminder when its moment comes, wherever the viewer is; held once, by the shell. */
export const Reminder: React.FC<{ go: (room: string) => void }> = ({ go }) => {
  const all = KEPT.use(); const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);
  const due = Object.entries(all).find(([, x]) => x.remind && !x.told && !x.done && x.remind <= now);
  if (!due) return null;
  const [key, x] = due;
  const told = () => KEPT.set({ ...KEPT.get(), [key]: { ...x, told: true } });
  return <Toast message={say(W.due, { name: x.name, room: x.label }) + ': ' + x.text} onClose={() => { told(); go(x.room); }} />;
};
