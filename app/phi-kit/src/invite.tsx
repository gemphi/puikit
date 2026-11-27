/**
 * Invites to a host: a link anyone with it opens (`#/<invite>/<code>`, the app's data names the page, `"invite"`), a
 * code made by chance or the viewer's own, how long it lasts and how many times it may be used (`limit.json`
 * `invite`). Those who may invite (`role.tsx`) make them; those who manage pause and resume every invite of the host.
 * The page an invite opens shows the host and Join, or says why it cannot: a code nobody made, a host whose invites
 * are paused, an invite run out. Invites are kept like every user document, so they hold for the viewer's own
 * account in every browser; nobody else's account sees them yet.
 */
import React from 'react';
import { Avatar, Box, Button, Input, Select, Stack, Switch, Text, Title } from '@pui/components';
import { Copy, Link2, Trash2 } from 'lucide-react';
import { assetUrl, type NavItem } from './data';
import { persisted } from './api';
import type { useHosts } from './hosts';
import type { Roles } from './role';
import type { People } from './people';
import { clock, span } from './time';
import words from './talk.json';
import limit from './limit.json';

const W = words.invite;
const L = limit.invite;
const say = (s: string, k: Record<string, string>) => Object.entries(k).reduce((t, [a, b]) => t.replace('{' + a + '}', b), s);

type Invite = { code: string; host: string; space: string; made: number; minutes: number; uses: number; used: number };
type Kept = { invite: Invite[]; paused: Record<string, boolean> };
const KEPT = persisted<Record<string, Kept>>('host-invite', {});
const of = (app: string): Kept => KEPT.get()[app] ?? { invite: [], paused: {} };
const put = (app: string, k: Kept) => KEPT.set({ ...KEPT.get(), [app]: k });
const CODE = new RegExp('^[a-z0-9-]{' + L.least + ',' + L.most + '}$');

/** Whether an invite can still be used, and if not why: nobody made it, its host is paused, it ran out. */
const state = (k: Kept, inv?: Invite): 'ok' | 'unknown' | 'stopped' | 'over' => {
  if (!inv) return 'unknown';
  if (k.paused[inv.host]) return 'stopped';
  const late = inv.minutes > 0 && Date.now() > inv.made + inv.minutes * 60000;
  return late || (inv.uses > 0 && inv.used >= inv.uses) ? 'over' : 'ok';
};

/** The link an invite is, as it would be sent. */
const linkOf = (page: string, code: string) => window.location.href.split('#')[0] + '#/' + page + '/' + code;

/** A host's invites: make one, copy its link, take it back; pause and resume all of them. */
export const Invites: React.FC<{ app: string; page: string; host: string; space: string; roles: Roles; file: People }> = ({ app, page, host, space, roles, file }) => {
  const k = KEPT.use()[app] ?? { invite: [], paused: {} };
  const [code, setCode] = React.useState('');
  const [minutes, setMinutes] = React.useState(String(L.minutes[1]));
  const [uses, setUses] = React.useState(String(L.uses[0]));
  const [note, setNote] = React.useState('');
  const mayInvite = roles.can(space, '', file.me, 'invite'); const manage = roles.can(space, '', file.me, 'manage');
  const mine = k.invite.filter((x) => x.host === host);
  const make = () => {
    const want = code.trim().toLowerCase() || Math.random().toString(36).slice(2, 2 + L.least + 5);
    if (!CODE.test(want)) return setNote(say(W.short, { least: String(L.least), most: String(L.most) }));
    if (k.invite.some((x) => x.code === want)) return setNote(W.taken);
    put(app, { ...k, invite: [...k.invite, { code: want, host, space, made: Date.now(), minutes: Number(minutes), uses: Number(uses), used: 0 }] });
    setCode(''); setNote('');
  };
  const lasts = L.minutes.map((m) => ({ value: String(m), label: m ? span(m) : W.forever }));
  const times = L.uses.map((n) => ({ value: String(n), label: n ? say(W.times, { n: String(n) }) : W.many }));
  return (
    <Stack direction="column" gap={3}>
      <Switch label={k.paused[host] ? W.resume : W.pause} checked={!!k.paused[host]} disabled={!manage} onChange={(e) => put(app, { ...k, paused: { ...k.paused, [host]: e.target.checked } })} />
      {k.paused[host] && <Text size="sm" intent="muted" role="status">{say(W.paused, { host: space })}</Text>}
      {mayInvite && <Box className="phi-region">
        <Stack direction="column" gap={2}>
          <Title level={4} size="sm">{W.make}</Title>
          <Input value={code} placeholder={W.code} aria-label={W.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} />
          <Stack direction="row" gap={2}>
            <Select aria-label={W.lasts} options={lasts} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <Select aria-label={W.uses} options={times} value={uses} onChange={(e) => setUses(e.target.value)} />
            <Button variant="glass" iconLeft={Link2} onClick={make}>{W.make}</Button>
          </Stack>
          {note && <Text size="xs" intent="danger" role="status">{note}</Text>}
        </Stack>
      </Box>}
      {mine.length ? mine.map((x) => {
        const s = state(k, x);
        return (
          <Stack key={x.code} direction="row" gap={2} align="center">
            <Stack direction="column" gap={0} flex="1" minWidth="0">
              <Text as="span" size="sm" mono truncate>{linkOf(page, x.code)}</Text>
              <Text as="span" size="xs" intent="muted">{[say(W.used, { n: String(x.used) }) + (x.uses ? ' / ' + x.uses : ''), x.minutes ? clock(x.made + x.minutes * 60000) : W.forever, { ok: '', unknown: '', stopped: W.isPaused, over: W.isOver }[s]].filter(Boolean).join(' · ')}</Text>
            </Stack>
            <Button variant="icon" aria-label={W.copy} title={W.copy} onClick={() => void navigator.clipboard?.writeText(linkOf(page, x.code)).then(() => setNote(W.copied))}><Copy size={15} /></Button>
            <Button variant="icon" aria-label={W.remove} title={W.remove} onClick={() => put(app, { ...k, invite: k.invite.filter((y) => y.code !== x.code) })}><Trash2 size={15} /></Button>
          </Stack>);
      }) : <Text size="sm" intent="muted">{W.none}</Text>}
    </Stack>
  );
};

/** The page an invite link opens: the host and Join, or why it cannot be joined. Joining counts one use. */
export const InvitePage: React.FC<{ app: string; code: string; hosts: ReturnType<typeof useHosts>; nav: NavItem[]; go: (id: string) => void }> = ({ app, code, hosts, nav = [], go }) => {
  KEPT.use();
  const k = of(app); const inv = k.invite.find((x) => x.code === code.toLowerCase());
  const s = state(k, inv);
  // An invite names its host as people read it: a group of the menu is one the viewer is in (the app's own, joined or
  // made); else the catalogue says which host it is, to join.
  const group = nav.find((g) => g.label === inv?.space);
  const known = group ?? hosts.file?.host.find((h) => h.label === inv?.space);
  const name = inv?.space ?? '';
  const inside = !!group;
  const first = known?.items?.flatMap((x) => x.items ?? [x]).find((x) => !x.head)?.id;
  const join = () => { if (!inv || !known) return; hosts.join(known.id, true); put(app, { ...k, invite: k.invite.map((x) => (x.code === inv.code ? { ...x, used: x.used + 1 } : x)) }); if (first) go(first); };
  const mark = known?.mark ? <Avatar size="xl" deck={0} alt={name} sprite={{ src: assetUrl(known.mark.sheet), cols: known.mark.cols, index: known.mark.index }} /> : <Avatar size="xl" deck={0} alt={name} seed={known?.id} initials={name.slice(0, 1)} />;
  return (
    <Box className="phi-region" maxWidth="32rem">
      <Stack direction="column" gap={3} align="center">
        {inv && mark}
        <Title level={2}>{inv ? say(W.title, { host: name }) : W.unknown}</Title>
        {s === 'stopped' && <Text intent="muted" role="status">{say(W.stopped, { host: name })}</Text>}
        {s === 'over' && <Text intent="muted" role="status">{W.over}</Text>}
        {s === 'ok' && (inside
          ? <Button variant="glass" onClick={() => first && go(first)}>{say(W.open, { host: name })}</Button>
          : <Button variant="glass" onClick={join}>{say(W.join, { host: name })}</Button>)}
        {inside && <Text size="sm" intent="muted">{say(W.joined, { host: name })}</Text>}
      </Stack>
    </Box>
  );
};
