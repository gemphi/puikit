/**
 * Invites to a host: a link anyone with it opens (`#/<invite>/<code>`, the app's data names the page, `"invite"`), a
 * code made by chance or the viewer's own, how long it lasts and how many times it may be used (`limit.json`
 * `invite`). Those who may invite (`role.tsx`) make them; those who manage pause and resume every invite of the host.
 * The page an invite opens shows the host and Join, or says why it cannot: a code nobody made, a host whose invites
 * are paused, an invite run out. Invites are Phiora's (`app/phiora-server/src/host.mjs`): a link one account makes
 * opens for anyone, and joining with it lets them into the host.
 */
import React from 'react';
import { Avatar, Box, Button, Input, Select, Stack, Switch, Text, Title } from '@pui/components';
import { Copy, Link2, Trash2 } from 'lucide-react';
import { assetUrl } from './data';
import { apiGet, apiSend } from './api';
import { useMe } from './auth';
import { refreshHosts } from './hosts';
import type { Host } from './role';
import { clock, span } from './time';
import words from './talk.json';
import limit from './limit.json';

const W = words.invite;
const L = limit.invite;
const say = (s: string, k: Record<string, string>) => Object.entries(k).reduce((t, [a, b]) => t.replace('{' + a + '}', b), s);
const CODE = new RegExp('^[a-z0-9-]{' + L.least + ',' + L.most + '}$');

/** Whether an invite can still be used, and if not why: its host is paused, it ran out. */
const state = (paused: boolean, inv: { made: number; minutes: number; uses: number; used: number }): 'ok' | 'stopped' | 'over' => {
  if (paused) return 'stopped';
  const late = inv.minutes > 0 && Date.now() > inv.made + inv.minutes * 60000;
  return late || (inv.uses > 0 && inv.used >= inv.uses) ? 'over' : 'ok';
};

/** The link an invite is, as it would be sent. */
const linkOf = (page: string, code: string) => window.location.href.split('#')[0] + '#/' + page + '/' + code;

/** A host's invites: make one, copy its link, take it back; pause and resume all of them. */
export const Invites: React.FC<{ page: string; host: Host; space: string }> = ({ page, host: h, space }) => {
  const [code, setCode] = React.useState('');
  const [minutes, setMinutes] = React.useState(String(L.minutes[1]));
  const [uses, setUses] = React.useState(String(L.uses[0]));
  const [note, setNote] = React.useState('');
  const mayInvite = h.can('invite'); const manage = h.can('manage'); const paused = !!h.card?.paused;
  const make = async () => {
    const want = code.trim().toLowerCase();
    if (want && !CODE.test(want)) return setNote(say(W.short, { least: String(L.least), most: String(L.most) }));
    const r = await h.makeInvite(want, Number(minutes), Number(uses));
    if (!r.ok) return setNote(({ taken: W.taken, bad_code: say(W.short, { least: String(L.least), most: String(L.most) }) } as Record<string, string>)[r.error] ?? r.message);
    setCode(''); setNote('');
  };
  const lasts = L.minutes.map((m) => ({ value: String(m), label: m ? span(m) : W.forever }));
  const times = L.uses.map((n) => ({ value: String(n), label: n ? say(W.times, { n: String(n) }) : W.many }));
  return (
    <Stack direction="column" gap={3}>
      <Switch label={paused ? W.resume : W.pause} checked={paused} disabled={!manage} onChange={(e) => void h.pause(e.target.checked)} />
      {paused && <Text size="sm" intent="muted" role="status">{say(W.paused, { host: space })}</Text>}
      {mayInvite && <Box className="phi-region">
        <Stack direction="column" gap={2}>
          <Title level={4} size="sm">{W.make}</Title>
          <Input value={code} placeholder={W.code} aria-label={W.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} />
          <Stack direction="row" gap={2}>
            <Select aria-label={W.lasts} options={lasts} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <Select aria-label={W.uses} options={times} value={uses} onChange={(e) => setUses(e.target.value)} />
            <Button variant="glass" iconLeft={Link2} onClick={() => void make()}>{W.make}</Button>
          </Stack>
          {note && <Text size="xs" intent="danger" role="status">{note}</Text>}
        </Stack>
      </Box>}
      {h.invite.length ? h.invite.map((x) => {
        const s = state(paused, x);
        return (
          <Stack key={x.code} direction="row" gap={2} align="center">
            <Stack direction="column" gap={0} flex="1" minWidth="0">
              <Text as="span" size="sm" mono truncate>{linkOf(page, x.code)}</Text>
              <Text as="span" size="xs" intent="muted">{[say(W.used, { n: String(x.used) }) + (x.uses ? ' / ' + x.uses : ''), x.minutes ? clock(x.made + x.minutes * 60000) : W.forever, { ok: '', stopped: W.isPaused, over: W.isOver }[s]].filter(Boolean).join(' · ')}</Text>
            </Stack>
            <Button variant="icon" aria-label={W.copy} title={W.copy} onClick={() => void navigator.clipboard?.writeText(linkOf(page, x.code)).then(() => setNote(W.copied))}><Copy size={15} /></Button>
            <Button variant="icon" aria-label={W.remove} title={W.remove} onClick={() => void h.takeBack(x.code)}><Trash2 size={15} /></Button>
          </Stack>);
      }) : <Text size="sm" intent="muted">{W.none}</Text>}
    </Stack>
  );
};

/** What an invite opens, as Phiora says: whether it can be used, the host, and whether the viewer is in it. */
type Opened = { state: 'ok' | 'unknown' | 'stopped' | 'over'; inside?: boolean; host?: { id: string; label: string; first?: string | null; mark?: { sheet: string; cols: number; index: number } | null } };

/** The page an invite link opens: the host and Join, or why it cannot be joined. Joining counts one use. */
export const InvitePage: React.FC<{ app: string; code: string; go: (id: string) => void }> = ({ app, code, go }) => {
  const me = useMe();
  const [got, setGot] = React.useState<Opened | null>(null);
  const [note, setNote] = React.useState('');
  const path = '/invite/' + encodeURIComponent(app) + '/' + encodeURIComponent(code.toLowerCase());
  React.useEffect(() => { void apiGet<Opened>(path).then((x) => setGot(x ?? { state: 'unknown' })); }, [path, me?.id]);
  const inv = got?.host; const s = got?.state ?? 'unknown'; const name = inv?.label ?? '';
  const join = async () => {
    const r = await apiSend<{ host: { first?: string | null } }>('POST', path);
    if (!r.ok) return setNote(r.message);
    await refreshHosts(app); if (r.body.host.first) go(r.body.host.first);
  };
  const mark = inv?.mark ? <Avatar size="xl" deck={0} alt={name} sprite={{ src: assetUrl(inv.mark.sheet), cols: inv.mark.cols, index: inv.mark.index }} /> : <Avatar size="xl" deck={0} alt={name} seed={inv?.id} initials={name.slice(0, 1)} />;
  if (!got) return null;
  return (
    <Box className="phi-region" maxWidth="32rem">
      <Stack direction="column" gap={3} align="center">
        {inv && mark}
        <Title level={2}>{inv ? say(W.title, { host: name }) : W.unknown}</Title>
        {s === 'stopped' && <Text intent="muted" role="status">{say(W.stopped, { host: name })}</Text>}
        {s === 'over' && <Text intent="muted" role="status">{W.over}</Text>}
        {s === 'ok' && (got.inside
          ? <Button variant="glass" onClick={() => inv?.first && go(inv.first)}>{say(W.open, { host: name })}</Button>
          : !me || me.guest ? <Text intent="muted" role="status">{say(W.signIn, { host: name })}</Text>
          : <Button variant="glass" onClick={() => void join()}>{say(W.join, { host: name })}</Button>)}
        {got.inside && <Text size="sm" intent="muted">{say(W.joined, { host: name })}</Text>}
        {note && <Text size="xs" intent="danger" role="status">{note}</Text>}
      </Stack>
    </Box>
  );
};
