/**
 * Roles and what each may do, for every host (a space) of an app, and for each of its rooms. The app's data says how
 * a host starts (`role.json`, named by the people file's `role`): its owner, its roles and what each can, who holds
 * which, and the rooms where only some roles may see, write, call or pin. What its people change since (a role given
 * or taken, a role made, a room's rights, the host handed to another owner) is Phiora's, the same for everyone in it
 * (`app/phiora-server/src/host.mjs`), and Phiora alone decides what each may do: the page shows what it answers. The
 * owner can do everything; a host with no rule is open to all; a host someone made is theirs and starts with the
 * file's `default` roles.
 */
import React from 'react';
import { Box, Button, Checkbox, Input, Popover, Stack, Tag, Text } from '@pui/components';
import { Crown, Search } from 'lucide-react';
import { assetUrl } from './data';
import { apiGet, apiSend, hasApi, type ApiResult } from './api';
import { Face, spaceOf, type Member, type People } from './people';
import { ROOM_VERB, VERB, memberOf, type HostCard, type Person, type Role, type Rule, type Verb } from './room';
import words from './talk.json';
import limit from './limit.json';

const W = words.role;
const say = (s: string, k: Record<string, string>) => Object.entries(k).reduce((t, [a, b]) => t.replace('{' + a + '}', b), s);
export type { Verb };

/** The part of the role file the page reads itself: the role everyone holds, and the page an invite link opens. */
type RoleFile = { everyone: string; invite?: string };
const files = new Map<string, Promise<RoleFile>>();
/** An app's role file, for the page invite links open (`invite.tsx`) and the name of everyone's role. */
export const useRoles = (_app: string, file: People | null) => {
  const [rf, setRf] = React.useState<RoleFile | null>(null);
  const ref = (file as (People & { role?: string }) | null)?.role;
  React.useEffect(() => {
    if (!ref) return;
    const src = assetUrl(ref);
    if (!files.has(src)) files.set(src, fetch(src).then((r) => r.json()));
    void (files.get(src) as Promise<RoleFile>).then(setRf);
  }, [ref]);
  return { everyone: rf?.everyone ?? 'everyone', invite: rf?.invite };
};

/** A host as Phiora answers it to the viewer: its card (rule, what they may do), its people with accounts, and its
 *  invites for those who make them. */
export type Invite = { code: string; host: string; space: string; made: number; minutes: number; uses: number; used: number; by: string };
type HostAnswer = { host: HostCard; member: Person[]; invite: Invite[] };

/** One host, read from Phiora, and the changes those who may make them ask for; each answer is the host as it now is.
 *  `onChange` hears every change (the room reads what the viewer may do again). */
export const useHost = (app: string, host: string | undefined, onChange?: () => void) => {
  const [got, setGot] = React.useState<HostAnswer | null>(null);
  const path = host ? '/host/' + encodeURIComponent(app) + '/' + encodeURIComponent(host) : null;
  const read = React.useCallback(async () => { if (path && hasApi) { const x = await apiGet<HostAnswer>(path); if (x) setGot(x); } }, [path]);
  React.useEffect(() => { setGot(null); void read(); }, [read]);
  const ask = async (method: string, tail: string, body?: unknown): Promise<ApiResult<unknown>> => {
    if (!path) return { ok: false, status: 0, error: 'no_host', message: '' };
    const r = await apiSend<HostAnswer>(method, path + tail, body);
    if (r.ok && method === 'PATCH') setGot(r.body as HostAnswer); else if (r.ok) await read();
    if (r.ok) onChange?.();
    return r;
  };
  const card = got?.host; const rule = card?.rule;
  return {
    card, rule, member: got?.member ?? [], invite: got?.invite ?? [], me: card?.me ?? [],
    /** Whether the viewer may do that in the host as a whole. */
    can: (verb: Verb) => !!card?.can.host.includes(verb),
    give: (who: string, role: string, on: boolean) => ask('PATCH', '', { give: { who, role, on } }),
    makeOwner: (who: string) => ask('PATCH', '', { owner: who }),
    allow: (room: string, verb: Verb, role: string, on: boolean) => ask('PATCH', '', { allow: { room, verb, role, on } }),
    setCan: (role: Role, verb: Verb, on: boolean) => ask('PATCH', '', { can: { role: role.id, verb, on } }),
    addRole: (label: string) => ask('PATCH', '', { role: label }),
    pause: (paused: boolean) => ask('PATCH', '', { paused }),
    makeInvite: (code: string, minutes: number, uses: number) => ask('POST', '/invite', { code, minutes, uses }),
    takeBack: (code: string) => ask('DELETE', '/invite/' + encodeURIComponent(code)),
  };
};
export type Host = ReturnType<typeof useHost>;

/** A role as a tag in its own intent, or the owner's crown. */
const RoleTag: React.FC<{ r?: Role; owner?: boolean }> = ({ r, owner }) => (owner
  ? <Tag size="sm" minimal round intent="warning" icon={<Crown size={11} />}>{W.owner}</Tag>
  : r ? <Tag size="sm" minimal round intent={r.intent}>{r.label}</Tag> : null);

/** Whether someone is the one a rule names: an id, or the viewer the files speak of when it is the viewer. */
const names = (h: Host, file: People, m: Member, id: string | null | undefined) => !!id && (m.id === id || (m.id === file.me && h.me.includes(id)));
const heldOf = (h: Host, file: People, m: Member) => [...new Set([...(h.rule?.give[m.id] ?? []), ...(m.id === file.me ? h.me.flatMap((w) => h.rule?.give[w] ?? []) : [])])];

/** Everyone of a host by name, each with their roles; one who manages gives and takes roles, the owner hands the host on. */
export const Members: React.FC<{ host: Host; file: People; space: string; name: string }> = ({ host: h, file, space, name }) => {
  const [find, setFind] = React.useState('');
  const r = h.rule;
  const live = h.member.map(memberOf);
  const people = [...(spaceOf(file, space) ?? []), ...live.filter((m) => !(spaceOf(file, space) ?? []).some((x) => x.id === m.id))];
  const sought = find.trim().toLowerCase();
  const list = people.filter((m) => !sought || m.name.toLowerCase().includes(sought) || (m.handle ?? '').includes(sought)).slice(0, limit.mention.most * 6);
  const manage = h.can('manage'); const owner = !!r && h.me.includes(r.owner ?? '');
  const row = (m: Member) => {
    const held = heldOf(h, file, m);
    const edit = r && manage && !names(h, file, m, r.owner);
    return (
      <Stack key={m.id} direction="row" gap={2} align="center">
        <Face file={file} m={m} size="sm" dot />
        <Text as="span" size="sm" truncate flex="1">{m.name}</Text>
        <Stack direction="row" gap={1} wrap>
          <RoleTag owner={names(h, file, m, r?.owner)} />
          {held.map((id) => <RoleTag key={id} r={r?.role.find((x) => x.id === id)} />)}
        </Stack>
        {edit && <Popover portal placement="bottom-end" trigger={<Button variant="glass" size="sm">{W.roles}</Button>}>
          <Stack direction="column" gap={2} minWidth="14rem">
            <Text as="span" size="xs" intent="muted">{say(W.give, { name: m.name })}</Text>
            {r.role.filter((x) => x.id !== r.everyone).map((x) => <Checkbox key={x.id} label={x.label} checked={held.includes(x.id)} onChange={(e) => void h.give(m.id, x.id, e.target.checked)} />)}
            {owner && <Button variant="glass" iconLeft={Crown} onClick={() => void h.makeOwner(m.id)}>{W.makeOwner}</Button>}
          </Stack>
        </Popover>}
      </Stack>);
  };
  return (
    <Stack direction="column" gap={2}>
      <Input icon={<Search size={14} />} value={find} placeholder={W.find} aria-label={W.find} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
      <Text size="xs" intent="muted" numeric>{say(W.count, { n: String(people.length) })}</Text>
      {!manage && <Text size="xs" intent="muted">{say(W.notOwner, { host: name })}</Text>}
      <Stack direction="column" gap={1}>{list.map(row)}</Stack>
    </Stack>
  );
};

/** The roles of a host and what each can; one who manages sets them, and names a new one. */
export const RoleList: React.FC<{ host: Host; name: string }> = ({ host: h, name: host }) => {
  const [name, setName] = React.useState('');
  const r = h.rule; const manage = h.can('manage');
  if (!r) return <Text size="sm" intent="muted">{say(W.notOwner, { host })}</Text>;
  return (
    <Stack direction="column" gap={3}>
      {r.role.map((x) => (
        <Box key={x.id} className="phi-region">
          <Stack direction="column" gap={1}>
            <RoleTag r={x} />
            <Stack direction="row" gap={3} wrap>
              {VERB.map((v) => <Checkbox key={v} label={W[v]} checked={x.can.includes(v)} disabled={!manage} onChange={(e) => void h.setCan(x, v, e.target.checked)} />)}
            </Stack>
          </Stack>
        </Box>))}
      {manage && <Stack direction="row" gap={2}>
        <Input value={name} placeholder={W.newRole} aria-label={W.newRole} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        <Button variant="glass" disabled={!name.trim()} onClick={() => { void h.addRole(name.trim()); setName(''); }}>{W.add}</Button>
      </Stack>}
    </Stack>
  );
};

/** Who may see, write, call and pin in one room: a row for each, a box for each role. */
export const RoomRights: React.FC<{ host: Host; room: string; name: string }> = ({ host: h, room, name }) => {
  const r: Rule | undefined = h.rule; const manage = h.can('manage');
  if (!r) return <Text size="sm" intent="muted">{say(W.notOwner, { host: name })}</Text>;
  const on = (v: Verb, id: string) => r.room[room]?.[v]?.includes(id) ?? !!r.role.find((x) => x.id === id)?.can.includes(v);
  return (
    <Stack direction="column" gap={3}>
      {ROOM_VERB.map((v) => (
        <Stack key={v} direction="column" gap={1}>
          <Text size="sm" weight="medium">{W[v]}</Text>
          <Stack direction="row" gap={3} wrap>
            {r.role.map((x) => <Checkbox key={x.id} label={x.label} checked={on(v, x.id)} disabled={!manage} onChange={(e) => void h.allow(room, v, x.id, e.target.checked)} />)}
          </Stack>
        </Stack>))}
      {!manage && <Text size="xs" intent="muted">{say(W.notOwner, { host: name })}</Text>}
    </Stack>
  );
};
