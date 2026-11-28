/**
 * A room as Phiora shares it with the people in it (`app/phiora-server/src/room.mjs`): what the viewer may do there,
 * every message its people wrote (after the app's own, which its data holds), the marks, pins and votes on any
 * message, and the people who wrote. A page with a room open asks again every few seconds (`limit.json` `room`) and
 * hears only what changed. Only the people of a room read it: a host's, the two of a direct room, or, in a
 * conversation with someone of the app's files, the writer alone. Without Phiora a stand-in keeps what this page
 * writes, so an app still runs on its own.
 */
import React from 'react';
import { apiGet, apiSend, hasApi, persisted, type ApiResult } from './api';
import { useMe } from './auth';
import type { Poll } from './poll';
import type { Member, People, Presence } from './people';
import type { Message } from './blocks/RoomStream';
import { dayOf, hourOf } from './time';
import limit from './limit.json';
import talk from './talk.json';

/** What someone may do in a host and its rooms. */
export type Verb = 'see' | 'write' | 'call' | 'pin' | 'invite' | 'manage';
export const VERB: Verb[] = ['see', 'write', 'call', 'pin', 'invite', 'manage'];
/** The verbs a room's rights are set for; the rest hold for the whole host. */
export const ROOM_VERB: Verb[] = ['see', 'write', 'call', 'pin'];
export type Role = { id: string; label: string; intent?: 'primary' | 'success' | 'warning' | 'error' | 'info'; can: Verb[] };
/** A host's rule as Phiora answers it: its owner, roles, who holds which, the rooms only some roles may use. */
export type Rule = { owner: string | null; role: Role[]; give: Record<string, string[]>; room: Record<string, Partial<Record<Verb, string[]>>>; everyone: string };
/** The host a room is in, as the viewer reads it: whether they are in it, what they may do, and its rule (`me` is
 *  every name they answer to in it). */
export type HostCard = { id: string; label: string; kind: 'open' | 'catalogue' | 'made'; in: boolean; paused: boolean; can: { host: Verb[]; room?: Verb[] }; rule?: Rule; me?: string[] };
/** Someone with an account, as others see them. */
export type Person = { id: string; name: string; handle?: string | null; presence?: Presence; state?: string };
/** A message as Phiora keeps it: its id in the room, who said it (their account) and when (ms). */
export type Said = { id: string; by: string; at: number; text?: string; image?: string[]; reply?: string; poll?: Poll };
/** What people did to one message: pinned or not, each mark with how many and whether the viewer gave it, the votes. */
export type Marked = { pin?: boolean; mark: Record<string, { n: number; mine: boolean }>; vote: { count: number[]; mine: number[] } };
export type Live = { key: string; kind: 'host' | 'direct' | 'own'; can: Verb[]; stamp: string; host?: HostCard; member?: string[]; message: Said[]; mark: Record<string, Marked>; people: Person[] };

/** The stand-in without Phiora: what this page wrote and did, by room, kept on this device. */
const STAND = persisted<Record<string, { message: Said[]; mark: Record<string, Marked> }>>('room-stand', {});
const standOf = (key: string): Live => ({ key, kind: 'own', can: ROOM_VERB, stamp: '', message: STAND.get()[key]?.message ?? [], mark: STAND.get()[key]?.mark ?? {}, people: [] });
const NONE: Marked = { mark: {}, vote: { count: [], mine: [] } };
/** What the stand-in does with what a page asks, as Phiora would. */
const stand = (key: string, me: string, tail: string, body: Record<string, unknown>) => {
  const all = STAND.get(); const room = { message: [...(all[key]?.message ?? [])], mark: { ...all[key]?.mark } };
  const id = String(body.message ?? ''); const m: Marked = { ...NONE, ...room.mark[id], mark: { ...room.mark[id]?.mark } };
  switch (tail) {
    case '': room.message.push({ ...(body as Omit<Said, 'id' | 'by' | 'at'>), id: String(body.ref), by: me, at: Date.now() }); break;
    case '/mark': { const icon = String(body.icon); m.mark[icon] = { n: body.on ? 1 : 0, mine: !!body.on }; room.mark[id] = m; break; }
    case '/pin': room.mark[id] = { ...m, pin: !!body.on }; break;
    default: { const pick = body.pick as number[]; room.mark[id] = { ...m, vote: { count: pick.map(() => 1), mine: pick } }; }
  }
  STAND.set({ ...all, [key]: room });
};

/** A room, read now and again every few seconds while it is open, and what the viewer does in it. */
export const useRoom = (app: string, room: string) => {
  const key = app + '/' + room; const path = '/room/' + encodeURIComponent(app) + '/' + encodeURIComponent(room);
  const me = useMe(); const stood = STAND.use();
  const [live, setLive] = React.useState<Live | null>(null);
  const [refused, setRefused] = React.useState<string | null>(null);
  const stamp = React.useRef(''); const ask = React.useRef<() => Promise<void>>(async () => undefined);
  React.useEffect(() => {
    setLive(null); setRefused(null); stamp.current = '';
    if (!hasApi) return;
    let on = true;
    ask.current = async () => {
      const got = await apiGet<Live | { same: true; stamp: string }>(path + (stamp.current ? '?seen=' + encodeURIComponent(stamp.current) : ''));
      if (!on || !got || 'same' in got) return;
      stamp.current = got.stamp; setLive(got);
    };
    void ask.current();
    const t = setInterval(() => { if (!document.hidden) void ask.current(); }, limit.room.every * 1000);
    return () => { on = false; clearInterval(t); };
  }, [path, me?.id]);
  const shown = hasApi ? live : standOf(key); void stood;
  /** Ask Phiora for something in the room, then read the room again at once. */
  const post = async (tail: string, body: Record<string, unknown>) => {
    if (!hasApi) return stand(key, me?.id ?? '', tail, body);
    const r: ApiResult<unknown> = await apiSend('POST', path + tail, body);
    setRefused(r.ok ? null : r.message);
    stamp.current = ''; await ask.current();
  };
  return {
    live: shown, refused,
    /** Read the room again now (after the viewer's rights changed). */
    refresh: () => { stamp.current = ''; return ask.current(); },
    /** Say something: words, a poll, answering a message. It shows at once, and as Phiora has it once it answers. */
    send: (said: { text?: string; poll?: Poll; reply?: string }) => {
      const ref = 'm' + Date.now();
      if (live && me) setLive({ ...live, message: [...live.message, { ...said, id: ref, by: me.id, at: Date.now() }] });
      return post('', { ref, ...said });
    },
    mark: (message: string, icon: string, on: boolean) => post('/mark', { message, icon, on }),
    pin: (message: string, on: boolean) => post('/pin', { message, on }),
    vote: (message: string, pick: number[]) => post('/vote', { message, pick }),
  };
};
export type RoomLive = ReturnType<typeof useRoom>;
/** What people did to a message, as the room has it (nothing yet, for one nobody touched). */
export const markedOf = (live: Live | null, id: string): Marked => live?.mark[id] ?? NONE;

/** A message of the room's people as a stream reads it: the day and the hour it was said. */
export const spoken = (x: Said): Message => ({ id: x.id, by: x.by, day: dayOf(x.at), at: hourOf(x.at), ...(x.text ? { text: x.text } : {}), ...(x.image ? { image: x.image } : {}), ...(x.reply ? { reply: x.reply } : {}), ...(x.poll ? { poll: x.poll } : {}) });
/** A room's messages: the app's own, then what its people wrote, never those of someone the viewer muted. */
export const messagesOf = (own: Message[], live: Live | null, quiet: Record<string, boolean>): Message[] =>
  [...own, ...(live?.message ?? []).map(spoken)].filter((x) => !quiet[x.by]);
/** A message's marks: the app's own counts with the room's people's added (the viewer's among them), then those
 *  only the people gave. */
export const marksOf = (own: { icon: string; n: number }[], theirs: Marked['mark']): { icon: string; n: number; on: boolean }[] => {
  const list = own.map((k) => ({ icon: k.icon, n: k.n + (theirs[k.icon]?.n ?? 0), on: !!theirs[k.icon]?.mine }));
  return [...list, ...Object.entries(theirs).filter(([icon, k]) => k.n && !list.some((y) => y.icon === icon)).map(([icon, k]) => ({ icon, n: k.n, on: k.mine }))];
};

/** Someone with an account as a member of the app's people: their status's words, else how they show. */
export const memberOf = (p: Person): Member => ({ id: p.id, name: p.name, handle: p.handle ?? undefined, presence: p.presence ?? 'off', state: p.state ?? talk.status.shown[p.presence ?? 'off'], live: true });
/** The people of an app's file with everyone of the room who has an account, so their names and faces read like any
 *  member's; `self` is the viewer's account, who is the viewer as surely as the file's `me`. */
export const withPeople = <T extends People>(file: T | null, people: Person[], self?: string): T | null => {
  if (!file) return file;
  const known = new Set(file.member.map((m) => m.id));
  const more: Member[] = people.filter((p) => !known.has(p.id)).map(memberOf);
  return more.length || self ? { ...file, member: more.length ? [...file.member, ...more] : file.member, self } : file;
};
