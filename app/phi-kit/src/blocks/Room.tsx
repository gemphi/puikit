import React from 'react';
import { Accordion, AccordionItem, Box, Columns, Frame, Label, Picture, Pressable, Spinner, Stack, Text } from '@pui/components';
import { BellOff, Circle, Clock, MessageCircle, Smile, Star, UserCheck, UserPlus } from 'lucide-react';
import { assetUrl, type Block } from '../data';
import { hasApi, persisted } from '../api';
import { useMe } from '../auth';
import { NavIcon } from '../icons';
import { Face, PRESENCE, QUIET, READ, isMe, linkedTo, loadPeople, spaceOf, type Member, type People } from '../people';
import { ProfileView, type ProfileRecord } from '../ProfileView';
import { madeRoom } from '../hosts';
import { beginDirect, directWith, openDirect } from '../direct';
import { NEXT, bondOf, setBond, useBonds, type Bond } from '../friends';
import { useRoom, withPeople } from '../room';
import { RoomCall } from './RoomCall';
import { RoomHead, RoomRing } from './RoomHead';
import { RoomStream, useMessages, type Message } from './RoomStream';
import { Shot } from './RoomShot';
import { RoomVoice } from './RoomVoice';
import { leaveVoice } from '../voice';
import { useHost, useRoles } from '../role';
import { MuteMenu } from '../notice';
import { suggestOf } from '../mention';
import { StatusDialog, useStatus } from '../status';
import { HostButton, RoomHost } from './RoomHost';
import words from '../words.json';
import talk from '../talk.json';

const W = words.room;

/** One room: a direct message (`with` a member) or a channel of a space (`member` lists who is in it). A room of
 *  `kind` voice is one people are in, not one they write in. */
type RoomSpec = { label: string; kind?: 'voice'; link?: string; icon?: string; space?: string; topic?: string; with?: string; member?: string[]; message: Message[] };
/** The file a room block reads (`source`): the app's people, and every room of the app. */
type RoomFile = People & { room: Record<string, RoomSpec> };

/** The picture a friend's button wears at each bond: ask, waiting, answer, friends. */
const BOND_ICON: Record<Bond, typeof UserPlus> = { none: UserPlus, sent: Clock, asked: UserCheck, with: UserCheck };
/** Whom the viewer follows, kept like every user document (Phiora, or this device). */
const FOLLOWED = persisted<Record<string, boolean>>('room-follow', {});

/** A row of a person: their picture with their presence, and their name. A press opens them. */
const Person: React.FC<{ file: People; m: Member; onWho: (id: string) => void }> = ({ file, m, onWho }) => (
  <Pressable row gap={2} fill hover pad="sm" onClick={() => onWho(m.id)}>
    <Face file={file} m={m} size="sm" dot />
    <Text as="span" size="sm" truncate>{m.name}</Text>
  </Pressable>
);

/** Everyone a person is linked to, read when their connections are opened. */
const Linked: React.FC<{ file: People; id: string; onWho: (id: string) => void }> = ({ file, id, onWho }) => {
  const [list, setList] = React.useState<Member[] | null>(null);
  React.useEffect(() => { setList(null); void linkedTo(file, id).then(setList); }, [file, id]);
  if (!list) return <Spinner />;
  return list.length ? <Stack direction="column" gap={1}>{list.map((m) => <Person key={m.id} file={file} m={m} onWho={onWho} />)}</Stack> : <Text size="sm" intent="muted">{W.none}</Text>;
};

/** A member as the one profile: who they are, what to do, the spaces they are in, who they are linked to and the
 *  pictures they posted. */
const profileOf = (app: string, file: RoomFile, m: Member, go: (room: string) => void, onWho: (id: string) => void, onStatus: () => void): ProfileRecord => {
  const followed = !!FOLLOWED.get()[m.id]; const bond = bondOf(app, file, m.id); const quiet = !!QUIET.get()[m.id]; const self = isMe(file, m.id);
  const rooms = Object.entries(file.room);
  const at = file.member.indexOf(m);
  const space = [...new Set([...rooms.filter(([, r]) => r.space && r.member?.includes(m.id)).map(([, r]) => r.space as string),
    ...Object.entries(file.space ?? {}).filter(([, list]) => list.includes(at)).map(([name]) => name)])];
  const shot = rooms.flatMap(([, r]) => r.message.filter((x) => x.by === m.id).flatMap((x) => x.image ?? []));
  // The room to write to them in: the one the file has, else the one the two share (named after them when they have
  // no account).
  const written = rooms.find(([, r]) => r.with === m.id)?.[0];
  return {
    id: m.id, name: m.name, handle: m.handle, role: m.role, bio: m.bio, tags: m.tag, note: true,
    avatar: <Face file={file} m={m} size="xl" dot />,
    banner: m.banner ? <Frame ratio="3/1" rounded="md"><Picture src={assetUrl(m.banner)} alt="" /></Frame> : undefined,
    status: m.state ? { icon: <Circle size={12} />, label: m.state } : undefined,
    actions: [
      ...(self ? [] : [{ id: 'message', label: W.message, icon: MessageCircle, primary: true, onClick: () => (written ? go(written) : void openDirect(app, m).then(go)) }]),
      ...(self ? [{ id: 'status', label: talk.status.set, icon: Smile, primary: true, onClick: onStatus }] : []),
      ...(self ? [] : [{ id: 'friend', label: bond === 'with' ? words.friend.with : NEXT[bond].label, icon: BOND_ICON[bond], primary: true, on: bond === 'with', onClick: () => setBond(app, m, NEXT[bond].to) }]),
      { id: 'follow', label: followed ? W.following : W.follow, icon: Star, primary: true, on: followed, onClick: () => FOLLOWED.set({ ...FOLLOWED.get(), [m.id]: !followed }) },
      // Muting someone hides what they write from the viewer, wherever they write it, until they are unmuted.
      ...(self ? [] : [{ id: 'quiet', label: quiet ? talk.room.unmute : talk.room.mute, icon: BellOff, on: quiet, onClick: () => QUIET.set({ ...QUIET.get(), [m.id]: !quiet }) }]),
    ],
    facts: [...(m.since ? [[W.since, m.since] as [string, React.ReactNode]] : []), [W.space, space.length], ...(m.link ? [[W.linked, m.link] as [string, React.ReactNode]] : [])],
    panes: [
      ...(m.link ? [{ id: 'linked', label: W.linked, count: m.link, body: () => <Linked file={file} id={m.id} onWho={onWho} /> }] : []),
      { id: 'space', label: W.space, count: space.length, body: () => <Stack direction="column" gap={2}>{space.length ? space.map((s) => <Label key={s} icon={<NavIcon name="users" size={14} />}>{s}</Label>) : <Text size="sm" intent="muted">{W.none}</Text>}</Stack> },
      { id: 'media', label: W.media, count: shot.length, body: () => (shot.length ? <Shot list={shot} alt={m.name} /> : <Text size="sm" intent="muted">{W.none}</Text>) },
    ],
  };
};

/**
 * The chat block's `room` variant: a direct message or a channel, the same in every app.
 *   { "kind": "chat", "variant": "room", "source": "data/room.json", "room": "lobby" }
 * The stream (RoomStream) is the kit's chat messages with their days, replies, pictures and reactions over the kit's
 * composer; beside it a column holds the people of the room, each with their presence, and, for the one picked, the
 * one profile. Both columns are the kit's Columns, so the
 * profile closes and comes back from the shell's right sidebar like any other panel.
 */
export const Room: React.FC<{ b: Block }> = ({ b }) => {
  const [raw, setFile] = React.useState<RoomFile | null>(null);
  const app = b.app ?? 'app';
  // The room as its people share it (`room.ts`): what the viewer may do, what they all wrote, and who they are.
  const live = useRoom(app, b.room as string);
  const account = useMe();
  const guest = !account || account.guest;
  // The viewer as their status says (`status.tsx`), with everyone of the room who has an account among the people.
  const shownFile = useStatus(raw);
  const file = React.useMemo(() => withPeople(shownFile, live.live?.people ?? [], guest ? undefined : account?.id), [shownFile, live.live?.people, guest, account?.id]);
  const roles = useRoles(app, file);
  // The host the room is in, as Phiora has it (`role.tsx`): its rule, its people, its invites.
  const host = useHost(app, live.live?.host?.id, () => void live.refresh());
  const [status, setStatus] = React.useState(false);
  const [hostOpen, setHostOpen] = React.useState(false);
  const [who, setWho] = React.useState<string | null>(null);
  const [find, setFind] = React.useState<string | null>(null);
  const [shut, setShut] = React.useState<Record<string, boolean>>({});
  const [call, setCall] = React.useState<{ video: boolean } | null>(null);
  FOLLOWED.use(); QUIET.use(); useBonds(app, file);
  const src = b.source as string;
  React.useEffect(() => { void loadPeople<RoomFile>(src).then(setFile); }, [src]);
  const store = (b.app ?? 'app') + '/' + b.room;
  // Opening a room reads it: what waited in it waits no more, here and on the menu.
  React.useEffect(() => { setWho(null); setFind(null); setCall(null); if (!READ.get()[store]) READ.set({ ...READ.get(), [store]: true });
    // Opening a direct conversation begins it: the person stands in the direct list from then on.
    const person = directWith(b.room as string); if (person && raw?.member.some((m) => m.id === person)) beginDirect(app, person); }, [b.room, store, raw]);
  const { all, pinned } = useMessages(file?.room[b.room as string]?.message ?? [], live);
  // A phone shows one column at a time (the kit's Columns): the stream, and the profile only once a face is picked.
  const [narrow, setNarrow] = React.useState(() => window.matchMedia('(max-width: 720px)').matches);
  React.useEffect(() => { const q = window.matchMedia('(max-width: 720px)'); const f = () => setNarrow(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, []);
  if (!file || (hasApi && !live.live && directWith(b.room as string) && !file.room[b.room as string])) return <Spinner />;
  // A room the file does not hold: one of a host somebody made, or a direct conversation: with someone of the files,
  // named after them, or the room two accounts share, which Phiora says is theirs.
  const pair = live.live?.kind === 'direct' ? live.live.member?.find((id) => !isMe(file, id)) : undefined;
  const other = file.member.find((m) => m.id === (pair ?? directWith(b.room as string)));
  const spec: RoomSpec | undefined = file.room[b.room as string] ?? madeRoom(b.app ?? 'app', b.room as string) ?? (other ? { label: other.name, with: other.id, message: [] } : undefined);
  if (!spec) return <Text intent="secondary">{W.none}</Text>;
  const member = (id: string) => file.member.find((m) => m.id === id);
  const mine = !guest && account ? account.name : member(file.me)?.name ?? W.you;
  const go = (room: string) => { window.location.hash = '/' + room; };
  // Who the side column is about: the one picked, else the other side of a direct message.
  const shown = member(who ?? spec.with ?? '');
  const voice = spec.kind === 'voice';
  // What the viewer may do here is Phiora's to say; one who is not signed in sees what the app's data holds.
  const may = (verb: 'see' | 'write' | 'call' | 'pin') => (!hasApi || (verb === 'see' && guest) || (live.live ? live.live.can.includes(verb) : verb === 'see'));
  // Who is here: in a voice room those in it now; in any other room of a space everyone of the space; and everyone
  // with an account who wrote in it, or is the other side of a direct room.
  const people = [...((!voice && spaceOf(file, spec.space)) || ((spec.member ?? []).map(member).filter(Boolean) as Member[])), ...file.member.filter((m) => m.live && !isMe(file, m.id))];
  // The people of the room in sections, one for each presence that someone has, named in that presence's own words.
  const sections = PRESENCE.map((id) => ({ id, member: people.filter((m) => (m.presence ?? 'off') === id) })).filter((g) => g.member.length)
    .map((g) => ({ ...g, label: g.member[0].state ?? g.id }));
  const stream = !may('see') ? <Text intent="secondary" role="status">{talk.role.unseen.replace('{room}', spec.label)}</Text>
    : voice
    ? <RoomVoice file={file} room={b.room as string} label={spec.label} topic={spec.topic} store={store} onWho={setWho} />
    : <RoomStream file={file} label={spec.label} topic={spec.topic} message={spec.message} live={live} store={store} mine={mine} onWho={setWho} find={find} onFind={setFind} link={spec.link}
        room={b.room as string} canWrite={may('write')} canPin={may('pin')} suggest={suggestOf(file, people)} signIn={hasApi && guest}
        lead={call ? <RoomCall key={String(call.video)} file={file} label={spec.label} store={store} rung={spec.with ? people.concat(member(spec.with) ?? []).filter((m) => m.id !== file.me) : people.filter((m) => m.id !== file.me).slice(0, 8)} video={call.video} onEnd={() => setCall(null)} /> : null} />;
  const head = voice ? undefined
    : <RoomHead file={file} label={spec.label} store={store} pinned={all.filter(pinned)} nameOf={(id) => (isMe(file, id) ? mine : member(id)?.name ?? '')} finding={find != null} onFind={() => setFind(find == null ? '' : null)} onCall={(video) => { leaveVoice(); setCall({ video }); }} side={narrow ? undefined : 'profile'}
        canCall={may('call')} tools={<>{spec.space && host.card && <HostButton space={spec.space} onOpen={() => setHostOpen(true)} />}<MuteMenu app={app} room={b.room as string} space={spec.space} label={spec.label} /></>} />;

  const side = shown
    ? <ProfileView variant="popup" record={profileOf(app, file, shown, go, setWho, () => setStatus(true))} />
    : (
      <Accordion>
        {sections.map((g) => (
          <AccordionItem key={g.id} title={g.label + ' · ' + g.member.length} open={!shut[g.id]} onToggle={() => setShut({ ...shut, [g.id]: !shut[g.id] })}>
            {g.member.map((m) => <Person key={m.id} file={file} m={m} onWho={setWho} />)}
          </AccordionItem>))}
      </Accordion>);

  return (
    <Box>
      <StatusDialog open={status} onClose={() => setStatus(false)} />
      {spec.space && host.card && <RoomHost app={app} invite={roles.invite} file={file} host={host} space={spec.space} room={b.room as string} label={spec.label} open={hostOpen} onClose={() => setHostOpen(false)} />}
      <Columns columns={[
        { id: 'stream', title: <><Label icon={<NavIcon name={spec.icon ?? (spec.with ? 'user' : voice ? 'volume' : 'hash')} size={14} />}>{spec.label}</Label>{!voice && <RoomRing store={store} onJoin={() => { leaveVoice(); setCall({ video: false }); }} />}</>, label: spec.label, content: stream, actions: head },
        { id: 'profile', title: shown ? W.profile : W.member, label: shown ? W.profile : W.member, width: '21rem', closable: !narrow, content: side, hidden: narrow && !who,
          onBack: shown && who && (narrow || people.length) ? () => setWho(null) : undefined },
      ]} />
    </Box>
  );
};
