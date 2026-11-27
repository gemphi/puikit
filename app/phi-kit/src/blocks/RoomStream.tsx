import React from 'react';
import { Button, ChatBubble, ChatComposer, Divider, Input, Link, Pressable, Stack, Tag, Text } from '@pui/components';
import { Heart, Pin, PinOff, Reply, Search } from 'lucide-react';
import type { ChatSuggestion } from '@pui/components';
import { Said } from '../mention';
import { PollMaker, PollView, type Poll } from '../poll';
import { KeepMenu } from '../keep';
import { useTyping } from '../typing';
import { persisted } from '../api';
import { iconOf } from '../icons';
import { Face, type Member, type People } from '../people';
import { Shot, type Seen } from './RoomShot';
import words from '../words.json';
import talk from '../talk.json';

const W = words.room;
export const say = (s: string, k: string, v: string) => s.replace('{' + k + '}', v);

/** A reaction: an icon by its name in app data, and how many gave it. */
type Mark = { icon: string; n: number };
/** One message. `day` is the day it was said, as the stream's line reads it; `reply` the id of the one it answers;
 *  `pin` keeps it among the room's pinned. */
export type Message = { id: string; by: string; day?: string; at: string; text?: string; image?: string[]; mark?: Mark[]; reply?: string; pin?: boolean; poll?: Poll };

/** What the viewer wrote, which reactions they gave and what they pinned or unpinned, kept like every user document
 *  (Phiora, or this device). A room's own are under `<app>/<room>`. */
const SENT = persisted<Record<string, Message[]>>('room', {});
const GIVEN = persisted<Record<string, boolean>>('room-mark', {});
const PINNED = persisted<Record<string, boolean>>('room-pin', {});

/** The element a message is, so a quote or a pin can lead to it. */
const dom = (store: string, id: string) => 'room-' + store.replace(/\W+/g, '-') + '-' + id;
export const seek = (store: string, id: string) => document.getElementById(dom(store, id))?.scrollIntoView({ block: 'center', behavior: 'smooth' });
/** A room's messages with the viewer's own after them, and which of them are pinned. */
export const useMessages = (message: Message[], store: string) => {
  const sent = SENT.use(); const pins = PINNED.use();
  const all = [...message, ...(sent[store] ?? [])];
  const pinned = (x: Message) => pins[store + '/' + x.id] ?? !!x.pin;
  return { all, pinned, pin: (x: Message) => PINNED.set({ ...pins, [store + '/' + x.id]: !pinned(x) }) };
};

/** A message in one line: who said it and the start of what they said (a quote, a pinned row). */
export const Line: React.FC<{ file: People; x: Message; name: string; label: string; onClick: () => void }> = ({ file, x, name, label, onClick }) => (
  <Pressable row gap={1} aria-label={label} onClick={onClick}>
    <Face file={file} m={file.member.find((m) => m.id === x.by)} size="xs" />
    <Text as="span" size="xs" weight="semibold">{name}</Text>
    <Text as="span" size="xs" intent="muted" truncate>{x.text ?? W.media}</Text>
  </Pressable>
);

/** Messages in the runs they read in: a run is one person's messages on one day with nobody between them, and a
 *  message that answers another begins a run of its own. `day` is set on the run a new day begins with. */
export const runsOf = (all: Message[]): { day?: string; item: Message[] }[] => all.reduce<{ day?: string; item: Message[] }[]>((runs, x, i) => {
  const prev = all[i - 1]; const turned = !prev || prev.day !== x.day;
  if (!turned && prev.by === x.by && !x.reply) runs[runs.length - 1].item.push(x);
  else runs.push({ day: turned ? x.day : undefined, item: [x] });
  return runs;
}, []);

/**
 * A room's stream, every message from the left, the viewer's own among them: a line where each day begins, one person's messages in a row under one picture and name, the
 * message a reply answers quoted over it (a press leads to it), reactions, pins, and the box it is written in, which
 * says what is being answered. While it is searched (`find` is not null) a field stands over it and only the messages
 * that hold what is typed show. Every part is the kit's; the words are the kit's words file.
 */
export const RoomStream: React.FC<{
  file: People; label: string; topic?: string; message: Message[];
  /** Where this room's own writing, reactions and pins are kept (`<app>/<room>`). */
  store: string; mine: string; onWho: (id: string) => void;
  find?: string | null; onFind?: (text: string) => void;
  /** Stands over the stream, under the search: a call that is on. */
  lead?: React.ReactNode;
  /** Where the room's subject lives elsewhere (its collection's own page), offered beside the topic. */
  link?: string;
  /** The room's id, whether the viewer may write and pin in it (`role.tsx`), and what the composer offers for `@`. */
  room?: string; canWrite?: boolean; canPin?: boolean; suggest?: (word: string) => ChatSuggestion[];
}> = ({ file, label, topic, message, store, mine, onWho, find = null, onFind, lead, link, room = '', canWrite = true, canPin = true, suggest }) => {
  const sent = SENT.use(); const given = GIVEN.use();
  const { all, pinned, pin } = useMessages(message, store);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const typing = useTyping(store);
  React.useEffect(() => setAnswer(null), [store]);
  const member = (id: string): Member | undefined => file.member.find((m) => m.id === id);
  const nameOf = (id: string) => (id === file.me ? mine : member(id)?.name ?? '');
  // Every picture posted in the room, in order: what the viewer steps through when one is opened.
  const seen: Seen[] = all.flatMap((x) => (x.image ?? []).map((src) => ({ src, name: nameOf(x.by), when: [x.day, x.at].filter(Boolean).join(' '), face: <Face file={file} m={member(x.by)} /> })));
  const send = (text: string, poll?: Poll) => {
    const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    SENT.set({ ...sent, [store]: [...(sent[store] ?? []), { id: 'm' + Date.now(), by: file.me, day: W.today, at, ...(text ? { text } : {}), ...(poll ? { poll } : {}), ...(answer ? { reply: answer } : {}) }] });
    setAnswer(null); typing.stop();
  };
  const give = (id: string, icon: string) => { const k = store + '/' + id + '/' + icon; GIVEN.set({ ...given, [k]: !given[k] }); };
  const markOf = (x: Message): (Mark & { on: boolean })[] => {
    const list = (x.mark ?? []).map((k) => ({ ...k, on: !!given[store + '/' + x.id + '/' + k.icon] }));
    if (!list.some((k) => k.icon === 'heart') && given[store + '/' + x.id + '/heart']) list.push({ icon: 'heart', n: 0, on: true });
    return list.map((k) => ({ ...k, n: k.n + (k.on ? 1 : 0) }));
  };

  const one = (x: Message, follows: boolean) => {
    const m = member(x.by); const marks = markOf(x); const kept = pinned(x);
    const q = x.reply ? all.find((y) => y.id === x.reply) : undefined;
    return (
      <ChatBubble key={x.id} id={dom(store, x.id)} follows={follows} time={x.at}
        name={kept ? <>{nameOf(x.by)} <Pin size={11} aria-label={W.pinned} /></> : nameOf(x.by)}
        avatar={<Pressable aria-label={say(W.open, 'name', m?.name ?? '')} tabIndex={follows ? -1 : undefined} onClick={() => onWho(x.by)}><Face file={file} m={m} /></Pressable>}
        quote={q ? <Line file={file} x={q} name={nameOf(q.by)} label={say(W.seek, 'name', nameOf(q.by))} onClick={() => seek(store, q.id)} /> : undefined}
        actions={<>
          <Button variant="icon" aria-label={W.reply} title={W.reply} aria-pressed={answer === x.id} onClick={() => setAnswer(answer === x.id ? null : x.id)}><Reply size={15} /></Button>
          <Button variant="icon" aria-label={W.like} title={W.like} aria-pressed={!!given[store + '/' + x.id + '/heart']} onClick={() => give(x.id, 'heart')}><Heart size={15} /></Button>
        </>}
        more={<Stack direction="column" gap={2}>
          {canPin && <Button variant="glass" iconLeft={kept ? PinOff : Pin} onClick={() => pin(x)}>{kept ? W.unpin : W.pin}</Button>}
          <KeepMenu store={store} room={room} label={label} id={x.id} name={nameOf(x.by)} text={x.text ?? x.poll?.question ?? W.media} />
        </Stack>}>
        <Stack direction="column" gap={2}>
          {x.text && <Said text={x.text} file={file} onWho={onWho} />}
          {x.poll && <PollView poll={x.poll} id={store + '/' + x.id} />}
          {x.image?.length ? <Shot list={x.image} alt={nameOf(x.by)} all={seen} label={say(words.view.room, 'room', label)} /> : null}
          {marks.length ? (
            <Stack direction="row" gap={1} wrap>
              {marks.map((k) => <Button key={k.icon} variant="glass" iconLeft={iconOf(k.icon)} aria-pressed={k.on} onClick={() => give(x.id, k.icon)}>{k.n}</Button>)}
            </Stack>) : null}
        </Stack>
      </ChatBubble>
    );
  };

  const answered = answer ? all.find((y) => y.id === answer) : undefined;
  const sought = (find ?? '').trim().toLowerCase();
  const shown = sought ? all.filter((x) => (x.text ?? '').toLowerCase().includes(sought) || nameOf(x.by).toLowerCase().includes(sought)) : all;
  return (
    <Stack direction="column" gap={3} minHeight="calc(100dvh - 13rem)">
      {find != null && <Input autoFocus icon={<Search size={14} />} value={find} placeholder={say(W.find, 'room', label)} aria-label={say(W.find, 'room', label)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFind?.(e.target.value)} />}
      {topic && find == null && <Text size="sm" intent="muted">{topic}{link ? <> <Link href={link} target="_blank" rel="noreferrer">{W.elsewhere}</Link></> : null}</Text>}
      {lead}
      <Stack direction="column" gap={2} flex="1" role="log" aria-live="polite" aria-label={label}>
        {sought && !shown.length ? <Text size="sm" intent="muted">{W.unfound}</Text> : null}
        {runsOf(shown).map((run) => (
          <React.Fragment key={run.item[0].id}>
            {run.day && <Divider label={run.day} />}
            <Stack direction="column" gap={1}>{run.item.map((x, i) => one(x, i > 0))}</Stack>
          </React.Fragment>))}
      </Stack>
      <Stack direction="column" gap={1}>
        {answered && <Stack direction="row"><Tag icon={<Reply size={12} />} onRemove={() => setAnswer(null)}>{say(W.answer, 'name', nameOf(answered.by))}</Tag></Stack>}
        {typing.said && <Text size="xs" intent="muted" role="status">{typing.said}</Text>}
        {canWrite
          ? <ChatComposer onSend={(text) => send(text)} placeholder={say(W.write, 'room', label)} onDraft={typing.poke} suggest={suggest} suggestLabel={talk.mention.list}
              tools={<PollMaker onPost={(poll) => send('', poll)} />} />
          : <Text size="sm" intent="muted" role="status">{talk.role.readOnly.replace('{room}', label)}</Text>}
      </Stack>
    </Stack>
  );
};
