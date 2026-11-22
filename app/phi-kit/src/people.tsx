import React from 'react';
import { Avatar } from '@pui/components';
import { assetUrl } from './data';
import { persisted } from './api';

/** Whether a person is about, as the kit's avatar shows it. */
export type Presence = 'here' | 'away' | 'busy' | 'off';
/** Every presence, in the order a list of people runs: who is here first, who is off last. */
export const PRESENCE: Presence[] = ['here', 'away', 'busy', 'off'];
/** Someone of an app. `face` is their cell on a portrait sheet, the app's one or their own (`sheet`); `banner` a
 *  picture reference; `state` says in words what `presence` says as a dot; `link` is how many people they are linked to. */
export type Member = { id: string; name: string; handle?: string; role?: string; bio?: string; state?: string; presence?: Presence; sheet?: string; face?: number; link?: number; banner?: string; since?: string; tag?: string[] };
/** The people of an app: who the viewer is, the portrait sheet, and everyone. A file that holds more (an app's rooms)
 *  is still this; `room` is who is in each, where the file says. */
export type People = { me: string; sheet?: { src: string; cols: number }; member: Member[]; room?: Record<string, { member?: string[]; unread?: number }>;
  /** The file that holds who is linked to whom, read only when someone's connections are opened. */
  link?: string;
  /** How the viewer's friends start: who they are friends with, and who has asked to be (`friends.tsx`). */
  friend?: { with?: string[]; asked?: string[] };
  /** Everyone in a space (a host), by the space's name, as places in `member`: the people of all its text rooms. */
  space?: Record<string, number[]> };

/** The rooms the viewer has joined (a voice room), by `<app>/<room>`, kept like every user document. */
export const JOINED = persisted<Record<string, boolean>>('room-in', {});
/** The rooms the viewer has opened, by `<app>/<room>`: what waited in them waits no more. */
export const READ = persisted<Record<string, boolean>>('room-read', {});
/** How many messages wait in a room: what its data says, until the viewer opens it. */
export const waitingIn = (file: People, app: string, room: string, read: Record<string, boolean>): number => (read[app + '/' + room] ? 0 : file.room?.[room]?.unread ?? 0);
/** Who is in a room now: the people its data names, and the viewer once they have joined. */
export const crowdOf = (file: People, room: string, joined: boolean): Member[] =>
  [...(file.room?.[room]?.member ?? []).filter((id) => id !== file.me), ...(joined ? [file.me] : [])].map((id) => file.member.find((m) => m.id === id)).filter(Boolean) as Member[];

/** The member a caller on a room's line is, by the handle or the name Phiora knows them by; never the viewer, who
 *  is shown as themself. */
export const memberFor = (file: People, name: string, handle?: string | null): Member | undefined =>
  file.member.find((m) => m.id !== file.me && ((!!handle && m.handle === handle) || m.name === name));

/** The people whose name or handle holds what was typed, never the viewer; everyone when nothing was typed. */
export const seekPeople = (file: People, find: string, most: number): Member[] => {
  const sought = find.trim().toLowerCase();
  return file.member.filter((m) => m.id !== file.me && (!sought || m.name.toLowerCase().includes(sought) || (m.handle ?? '').toLowerCase().includes(sought))).slice(0, most);
};

/** The people of a space, when the file names them (`space`). */
export const spaceOf = (file: People, space?: string): Member[] | undefined =>
  (space ? file.space?.[space] : undefined)?.map((i) => file.member[i]).filter(Boolean);

const cache = new Map<string, Promise<People>>();
/** An app's people, from the file its data names (`"people": "data/room.json"`); read once, whoever asks. */
export const loadPeople = <T extends People = People>(ref: string): Promise<T> => {
  const src = assetUrl(ref);
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.json()));
  return cache.get(src) as Promise<T>;
};

type Links = { id: string[]; link: number[][] };
const links = new Map<string, Promise<Links>>();
/** The people someone is linked to, from the app's link file (everyone once, and for each the places of their links). */
export const linkedTo = async (file: People, id: string): Promise<Member[]> => {
  if (!file.link) return [];
  const src = assetUrl(file.link);
  if (!links.has(src)) links.set(src, fetch(src).then((r) => r.json()));
  const all = await (links.get(src) as Promise<Links>);
  const by = new Map(file.member.map((m) => [m.id, m]));
  return (all.link[all.id.indexOf(id)] ?? []).map((i) => by.get(all.id[i])).filter(Boolean) as Member[];
};

/** A person's picture: their cell of a sheet, else the kit's default profile icon. `dot` adds their presence. */
export const Face: React.FC<{ file: Pick<People, 'sheet'>; m?: Member; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; dot?: boolean }> = ({ file, m, size = 'md', dot }) => {
  const presence = dot && m?.presence ? { presence: m.presence, presenceLabel: m.state } : {};
  return file.sheet && m?.face != null
    ? <Avatar size={size} alt={m.name} deck={0} sprite={{ src: assetUrl(m.sheet ?? file.sheet.src), cols: file.sheet.cols, index: m.face }} {...presence} />
    : <Avatar size={size} alt={m?.name ?? ''} seed={m?.id} deck={0} initials={(m?.name ?? '?').slice(0, 1)} {...presence} />;
};
