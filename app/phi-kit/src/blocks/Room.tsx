import React from 'react';
import { Avatar, Box, Button, ChatBubble, ChatComposer, Columns, Frame, Label, Picture, Pressable, Spinner, Stack, Text } from '@pui/components';
import { BellOff, Circle, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { assetUrl, type Block } from '../data';
import { persisted } from '../api';
import { useMe } from '../auth';
import { NavIcon, iconOf } from '../icons';
import { ProfileView, type ProfileRecord } from '../ProfileView';
import words from '../words.json';

const W = words.room;
const say = (s: string, k: string, v: string) => s.replace('{' + k + '}', v);

/** Who can be in a room. `face` is their cell on the app's portrait sheet; `banner` a picture reference. */
type Member = { id: string; name: string; handle?: string; role?: string; bio?: string; state?: string; face?: number; banner?: string; since?: string; tag?: string[] };
/** A reaction: an icon by its name in app data, and how many gave it. */
type Mark = { icon: string; n: number };
type Message = { id: string; by: string; at: string; text?: string; image?: string[]; mark?: Mark[] };
/** One room: a direct message (`with` a member) or a channel of a space (`member` lists who is in it). */
type RoomSpec = { label: string; icon?: string; space?: string; topic?: string; with?: string; member?: string[]; message: Message[] };
/** The file a room block reads (`source`): the people, the portrait sheet, and every room of the app. */
type RoomFile = { me: string; sheet?: { src: string; cols: number }; member: Member[]; room: Record<string, RoomSpec> };

/** What the viewer wrote and which reactions they gave, kept like every user document (Phiora, or this device). */
const SENT = persisted<Record<string, Message[]>>('room', {});
const GIVEN = persisted<Record<string, boolean>>('room-mark', {});
const FOLLOWED = persisted<Record<string, boolean>>('room-follow', {});

const Face: React.FC<{ file: RoomFile; m?: Member; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ file, m, size = 'md' }) => (
  file.sheet && m?.face != null
    ? <Avatar size={size} alt={m.name} deck={0} sprite={{ src: assetUrl(file.sheet.src), cols: file.sheet.cols, index: m.face }} />
    : <Avatar size={size} alt={m?.name ?? ''} seed={m?.id} deck={0} initials={(m?.name ?? '?').slice(0, 1)} />
);

/** The pictures of a message: each whole in its own frame, never cropped. */
const Shot: React.FC<{ list: string[]; alt: string }> = ({ list, alt }) => (
  <Stack direction="row" gap={2} wrap>
    {list.map((src) => <Frame key={src} ratio="1/1" width="min(12.5rem, 100%)" rounded="md"><Picture src={assetUrl(src)} alt={alt} /></Frame>)}
  </Stack>
);

/** A member as the one profile: who they are, what to do, the spaces they are in and the pictures they posted. */
const profileOf = (file: RoomFile, m: Member, go: (room: string) => void): ProfileRecord => {
  const followed = !!FOLLOWED.get()[m.id];
  const rooms = Object.entries(file.room);
  const space = [...new Set(rooms.filter(([, r]) => r.space && r.member?.includes(m.id)).map(([, r]) => r.space as string))];
  const shot = rooms.flatMap(([, r]) => r.message.filter((x) => x.by === m.id).flatMap((x) => x.image ?? []));
  const direct = rooms.find(([, r]) => r.with === m.id)?.[0];
  return {
    id: m.id, name: m.name, handle: m.handle, role: m.role, bio: m.bio, tags: m.tag, note: true,
    avatar: <Face file={file} m={m} size="xl" />,
    banner: m.banner ? <Frame ratio="3/1" rounded="md"><Picture src={assetUrl(m.banner)} alt="" /></Frame> : undefined,
    status: m.state ? { icon: <Circle size={12} />, label: m.state } : undefined,
    actions: [
      ...(direct ? [{ id: 'message', label: W.message, icon: MessageCircle, primary: true, onClick: () => go(direct) }] : []),
      { id: 'follow', label: followed ? W.following : W.follow, icon: UserPlus, primary: true, on: followed, onClick: () => FOLLOWED.set({ ...FOLLOWED.get(), [m.id]: !followed }) },
      { id: 'quiet', label: 'Mute', icon: BellOff, onClick: () => undefined },
    ],
    facts: [...(m.since ? [[W.since, m.since] as [string, React.ReactNode]] : []), [W.space, space.length]],
    panes: [
      { id: 'space', label: W.space, count: space.length, body: () => <Stack direction="column" gap={2}>{space.length ? space.map((s) => <Label key={s} icon={<NavIcon name="users" size={14} />}>{s}</Label>) : <Text size="sm" intent="muted">{W.none}</Text>}</Stack> },
      { id: 'media', label: W.media, count: shot.length, body: () => (shot.length ? <Shot list={shot} alt={m.name} /> : <Text size="sm" intent="muted">{W.none}</Text>) },
    ],
  };
};

/**
 * The chat block's `room` variant: a direct message or a channel, the same in every app.
 *   { "kind": "chat", "variant": "room", "source": "data/room.json", "room": "lobby" }
 * The stream is the kit's chat messages with their pictures and reactions over the kit's composer; beside it a column
 * holds the people of the room and, for the one picked, the one profile. Both columns are the kit's Columns, so the
 * profile closes and comes back from the shell's right sidebar like any other panel.
 */
export const Room: React.FC<{ b: Block }> = ({ b }) => {
  const [file, setFile] = React.useState<RoomFile | null>(null);
  const [who, setWho] = React.useState<string | null>(null);
  const sent = SENT.use(); const given = GIVEN.use(); FOLLOWED.use();
  const account = useMe();
  const src = assetUrl(b.source as string);
  React.useEffect(() => { void fetch(src).then((r) => r.json()).then(setFile); }, [src]);
  React.useEffect(() => setWho(null), [b.room]);
  // A phone shows one column at a time (the kit's Columns): the stream, and the profile only once a face is picked.
  const [narrow, setNarrow] = React.useState(() => window.matchMedia('(max-width: 720px)').matches);
  React.useEffect(() => { const q = window.matchMedia('(max-width: 720px)'); const f = () => setNarrow(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, []);
  if (!file) return <Spinner />;
  const spec = file.room[b.room as string];
  if (!spec) return <Text intent="secondary">{W.none}</Text>;
  const key = (b.app ?? 'app') + '/' + b.room;
  const member = (id: string) => file.member.find((m) => m.id === id);
  const me = member(file.me);
  const mine = account && !account.guest ? account.name : me?.name ?? W.you;
  const all = [...spec.message, ...(sent[key] ?? [])];
  const go = (room: string) => { window.location.hash = '/' + room; };
  const send = (text: string) => SENT.set({ ...sent, [key]: [...(sent[key] ?? []), { id: 'm' + Date.now(), by: file.me, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text }] });
  const give = (id: string, icon: string) => { const k = key + '/' + id + '/' + icon; GIVEN.set({ ...given, [k]: !given[k] }); };
  const markOf = (x: Message): (Mark & { on: boolean })[] => {
    const list = (x.mark ?? []).map((k) => ({ ...k, on: !!given[key + '/' + x.id + '/' + k.icon] }));
    if (!list.some((k) => k.icon === 'heart') && given[key + '/' + x.id + '/heart']) list.push({ icon: 'heart', n: 0, on: true });
    return list.map((k) => ({ ...k, n: k.n + (k.on ? 1 : 0) }));
  };
  // Who the side column is about: the one picked, else the other side of a direct message.
  const shown = member(who ?? spec.with ?? '');
  const people = (spec.member ?? []).map(member).filter(Boolean) as Member[];

  const stream = (
    <Stack direction="column" gap={3} minHeight="calc(100dvh - 13rem)">
      {spec.topic && <Text size="sm" intent="muted">{spec.topic}</Text>}
      <Stack direction="column" gap={2} flex="1" role="log" aria-live="polite" aria-label={spec.label}>
        {all.map((x) => {
          const m = member(x.by); const own = x.by === file.me; const marks = markOf(x);
          return (
            <ChatBubble key={x.id} side={own ? 'me' : 'them'} name={own ? mine : m?.name} time={x.at}
              avatar={<Pressable aria-label={say(W.open, 'name', m?.name ?? '')} onClick={() => setWho(x.by)}><Face file={file} m={m} /></Pressable>}
              actions={<Button variant="icon" size="sm" aria-label={W.like} title={W.like} aria-pressed={!!given[key + '/' + x.id + '/heart']} onClick={() => give(x.id, 'heart')}><Heart size={15} /></Button>}>
              <Stack direction="column" gap={2}>
                {x.text && <Text as="span" size="sm">{x.text}</Text>}
                {x.image?.length ? <Shot list={x.image} alt={m?.name ?? ''} /> : null}
                {marks.length ? (
                  <Stack direction="row" gap={1} wrap>
                    {marks.map((k) => <Button key={k.icon} size="sm" variant={k.on ? 'primary' : 'glass'} iconLeft={iconOf(k.icon)} aria-pressed={k.on} onClick={() => give(x.id, k.icon)}>{k.n}</Button>)}
                  </Stack>) : null}
              </Stack>
            </ChatBubble>
          );
        })}
      </Stack>
      <ChatComposer onSend={send} placeholder={say(W.write, 'room', spec.label)} />
    </Stack>
  );

  const side = shown
    ? <ProfileView variant="popup" record={profileOf(file, shown, go)} />
    : (
      <Stack direction="column" gap={1}>
        {people.map((m) => (
          <Pressable key={m.id} row gap={2} hover pad="sm" onClick={() => setWho(m.id)}>
            <Face file={file} m={m} size="sm" />
            <Stack direction="column" gap={0} minWidth="0" flex="1"><Text as="span" size="sm">{m.name}</Text>{m.state && <Text as="span" size="xs" intent="muted">{m.state}</Text>}</Stack>
          </Pressable>))}
      </Stack>);

  return (
    <Box>
      <Columns columns={[
        { id: 'stream', title: <Label icon={<NavIcon name={spec.icon ?? (spec.with ? 'user' : 'hash')} size={14} />}>{spec.label}</Label>, label: spec.label, content: stream },
        { id: 'profile', title: shown ? W.profile : W.member, label: shown ? W.profile : W.member, width: '21rem', closable: !narrow, content: side, hidden: narrow && !who,
          onBack: shown && who && (narrow || people.length) ? () => setWho(null) : undefined },
      ]} />
    </Box>
  );
};
