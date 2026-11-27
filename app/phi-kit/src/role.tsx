/**
 * Roles and what each may do, for every host (a space) of an app, and for each of its rooms. The app's data says how
 * a host starts (`role.json`, named by the people file's `role`): its owner, its roles and what each can, who holds
 * which, and the rooms where only some roles may see, write, call or pin. What the viewer changes since (a role given
 * or taken, a role made, a room's rights, the host handed to another owner) is kept like every user document and
 * wins over the file. The owner can do everything; a host with no rule is open to all; a host the viewer made is
 * theirs and starts with the file's `default` roles. Nobody is on the other side yet, so changes are the viewer's.
 */
import React from 'react';
import { Box, Button, Checkbox, Input, Popover, Stack, Tag, Text } from '@pui/components';
import { Crown, Search } from 'lucide-react';
import { assetUrl } from './data';
import { persisted } from './api';
import { madeHost } from './hosts';
import { Face, spaceOf, type Member, type People } from './people';
import words from './talk.json';
import limit from './limit.json';

const W = words.role;
const say = (s: string, k: Record<string, string>) => Object.entries(k).reduce((t, [a, b]) => t.replace('{' + a + '}', b), s);

/** What a role may do in a host's rooms. */
export type Verb = 'see' | 'write' | 'call' | 'pin' | 'invite' | 'manage';
export const VERB: Verb[] = ['see', 'write', 'call', 'pin', 'invite', 'manage'];
/** The verbs a room's rights are set for; the rest hold for the whole host. */
const ROOM_VERB: Verb[] = ['see', 'write', 'call', 'pin'];
type Role = { id: string; label: string; intent?: 'primary' | 'success' | 'warning' | 'error' | 'info'; can: Verb[] };
type Rule = { owner?: string; role: Role[]; give: Record<string, string[]>; room: Record<string, Partial<Record<Verb, string[]>>> };
/** The file: the role everyone holds, the roles a host with none of its own starts with, each host's rule, and the
 *  page an invite link opens (`invite.tsx`). */
type RoleFile = { everyone: string; default: Role[]; space: Record<string, Partial<Rule>>; invite?: string };
/** What the viewer changed, by `<app>/<host>`. */
type Kept = { owner?: string; role?: Role[]; give?: Record<string, string[]>; room?: Rule['room'] };
const KEPT = persisted<Record<string, Kept>>('host-role', {});
const files = new Map<string, Promise<RoleFile>>();

/** Every host's rules for the viewer, and what they may change. */
export const useRoles = (app: string, file: People | null) => {
  const [rf, setRf] = React.useState<RoleFile | null>(null);
  const kept = KEPT.use();
  const ref = (file as (People & { role?: string }) | null)?.role;
  React.useEffect(() => {
    if (!ref) return;
    const src = assetUrl(ref);
    if (!files.has(src)) files.set(src, fetch(src).then((r) => r.json()));
    void (files.get(src) as Promise<RoleFile>).then(setRf);
  }, [ref]);
  const everyone = rf?.everyone ?? 'everyone';
  /** A host's rule: the file's, the viewer's changes over it; none for a host the file leaves open. */
  const rule = (space?: string): Rule | undefined => {
    if (!space || !rf) return undefined;
    const own = rf.space[space]; const mine = madeHost(app, space); const k = kept[app + '/' + space] ?? {};
    if (!own && !mine && !k.role) return undefined;
    const base: Role[] = own?.role ?? rf.default;
    const role = [...base.map((r) => k.role?.find((x) => x.id === r.id) ?? r), ...(k.role ?? []).filter((x) => !base.some((r) => r.id === x.id))];
    const room = { ...own?.room };
    Object.entries(k.room ?? {}).forEach(([id, v]) => { room[id] = { ...room[id], ...v }; });
    return { owner: k.owner ?? own?.owner ?? (mine ? file?.me : undefined), role, give: { ...own?.give, ...k.give }, room };
  };
  const rolesOf = (r: Rule, who: string) => [everyone, ...(r.give[who] ?? [])];
  /** Whether someone may do that in a room of a host. */
  const can = (space: string | undefined, room: string, who: string, verb: Verb): boolean => {
    const r = rule(space); if (!r || r.owner === who) return true;
    const held = rolesOf(r, who); const only = r.room[room]?.[verb];
    return only ? held.some((id) => only.includes(id)) : r.role.some((x) => held.includes(x.id) && x.can.includes(verb));
  };
  const change = (space: string, next: (k: Kept) => Kept) => { const key = app + '/' + space; KEPT.set({ ...KEPT.get(), [key]: next(KEPT.get()[key] ?? {}) }); };
  return {
    rule, can, rolesOf, everyone, invite: rf?.invite,
    give: (space: string, who: string, role: string, on: boolean) => change(space, (k) => {
      const now = rule(space)?.give[who] ?? [];
      return { ...k, give: { ...k.give, [who]: on ? [...new Set([...now, role])] : now.filter((x) => x !== role) } };
    }),
    makeOwner: (space: string, who: string) => change(space, (k) => ({ ...k, owner: who })),
    allow: (space: string, room: string, verb: Verb, role: string, on: boolean) => change(space, (k) => {
      const r = rule(space); const now = r?.room[room]?.[verb] ?? r?.role.filter((x) => x.can.includes(verb)).map((x) => x.id) ?? [];
      return { ...k, room: { ...k.room, [room]: { ...k.room?.[room], [verb]: on ? [...new Set([...now, role])] : now.filter((x) => x !== role) } } };
    }),
    setCan: (space: string, role: Role, verb: Verb, on: boolean) => change(space, (k) => ({ ...k, role: [...(k.role ?? []).filter((x) => x.id !== role.id), { ...role, can: on ? [...new Set([...role.can, verb])] : role.can.filter((x) => x !== verb) }] })),
    addRole: (space: string, label: string) => change(space, (k) => ({ ...k, role: [...(k.role ?? []), { id: 'r' + Date.now().toString(36), label, can: ['see', 'write', 'call'] }] })),
  };
};
export type Roles = ReturnType<typeof useRoles>;

/** A role as a tag in its own intent, or the owner's crown. */
const RoleTag: React.FC<{ r?: Role; owner?: boolean }> = ({ r, owner }) => (owner
  ? <Tag size="sm" minimal round intent="warning" icon={<Crown size={11} />}>{W.owner}</Tag>
  : r ? <Tag size="sm" minimal round intent={r.intent}>{r.label}</Tag> : null);

/** Everyone of a host by name, each with their roles; one who manages gives and takes roles, the owner hands the host on. */
export const Members: React.FC<{ roles: Roles; file: People; space: string; host: string }> = ({ roles, file, space, host }) => {
  const [find, setFind] = React.useState('');
  const r = roles.rule(space); const me = file.me;
  const people = spaceOf(file, space) ?? [];
  const sought = find.trim().toLowerCase();
  const list = people.filter((m) => !sought || m.name.toLowerCase().includes(sought) || (m.handle ?? '').includes(sought)).slice(0, limit.mention.most * 6);
  const manage = roles.can(space, '', me, 'manage');
  const row = (m: Member) => {
    const held = r?.give[m.id] ?? [];
    const edit = r && manage && m.id !== r.owner;
    return (
      <Stack key={m.id} direction="row" gap={2} align="center">
        <Face file={file} m={m} size="sm" dot />
        <Text as="span" size="sm" truncate flex="1">{m.name}</Text>
        <Stack direction="row" gap={1} wrap>
          <RoleTag owner={r?.owner === m.id} />
          {held.map((id) => <RoleTag key={id} r={r?.role.find((x) => x.id === id)} />)}
        </Stack>
        {edit && <Popover portal placement="bottom-end" trigger={<Button variant="glass" size="sm">{W.roles}</Button>}>
          <Stack direction="column" gap={2} minWidth="14rem">
            <Text as="span" size="xs" intent="muted">{say(W.give, { name: m.name })}</Text>
            {r.role.filter((x) => x.id !== roles.everyone).map((x) => <Checkbox key={x.id} label={x.label} checked={held.includes(x.id)} onChange={(e) => roles.give(space, m.id, x.id, e.target.checked)} />)}
            {r.owner === me && <Button variant="glass" iconLeft={Crown} onClick={() => roles.makeOwner(space, m.id)}>{W.makeOwner}</Button>}
          </Stack>
        </Popover>}
      </Stack>);
  };
  return (
    <Stack direction="column" gap={2}>
      <Input icon={<Search size={14} />} value={find} placeholder={W.find} aria-label={W.find} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
      <Text size="xs" intent="muted" numeric>{say(W.count, { n: String(people.length) })}</Text>
      {!manage && <Text size="xs" intent="muted">{say(W.notOwner, { host })}</Text>}
      <Stack direction="column" gap={1}>{list.map(row)}</Stack>
    </Stack>
  );
};

/** The roles of a host and what each can; one who manages sets them, and names a new one. */
export const RoleList: React.FC<{ roles: Roles; file: People; space: string; host: string }> = ({ roles, file, space, host }) => {
  const [name, setName] = React.useState('');
  const r = roles.rule(space); const manage = roles.can(space, '', file.me, 'manage');
  if (!r) return <Text size="sm" intent="muted">{say(W.notOwner, { host })}</Text>;
  return (
    <Stack direction="column" gap={3}>
      {r.role.map((x) => (
        <Box key={x.id} className="phi-region">
          <Stack direction="column" gap={1}>
            <RoleTag r={x} />
            <Stack direction="row" gap={3} wrap>
              {VERB.map((v) => <Checkbox key={v} label={W[v]} checked={x.can.includes(v)} disabled={!manage} onChange={(e) => roles.setCan(space, x, v, e.target.checked)} />)}
            </Stack>
          </Stack>
        </Box>))}
      {manage && <Stack direction="row" gap={2}>
        <Input value={name} placeholder={W.newRole} aria-label={W.newRole} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        <Button variant="glass" disabled={!name.trim()} onClick={() => { roles.addRole(space, name.trim()); setName(''); }}>{W.add}</Button>
      </Stack>}
    </Stack>
  );
};

/** Who may see, write, call and pin in one room: a row for each, a box for each role. */
export const RoomRights: React.FC<{ roles: Roles; file: People; space: string; room: string; host: string }> = ({ roles, file, space, room, host }) => {
  const r = roles.rule(space); const manage = roles.can(space, room, file.me, 'manage');
  if (!r) return <Text size="sm" intent="muted">{say(W.notOwner, { host })}</Text>;
  const on = (v: Verb, id: string) => r.room[room]?.[v]?.includes(id) ?? !!r.role.find((x) => x.id === id)?.can.includes(v);
  return (
    <Stack direction="column" gap={3}>
      {ROOM_VERB.map((v) => (
        <Stack key={v} direction="column" gap={1}>
          <Text size="sm" weight="medium">{W[v]}</Text>
          <Stack direction="row" gap={3} wrap>
            {r.role.map((x) => <Checkbox key={x.id} label={x.label} checked={on(v, x.id)} disabled={!manage} onChange={(e) => roles.allow(space, room, v, x.id, e.target.checked)} />)}
          </Stack>
        </Stack>))}
      {!manage && <Text size="xs" intent="muted">{say(W.notOwner, { host })}</Text>}
    </Stack>
  );
};
