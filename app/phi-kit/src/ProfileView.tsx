import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Label, Stack, StatusRail, TabList, Tag, Text, Textarea, Title } from '@pui/components';
import type { LucideIcon } from 'lucide-react';
import { persisted } from './api';
import words from './words.json';
import css from './profile.module.scss';

const W = words.profile;
/** The width, in rem, from which the identity and the relations sit side by side. */
const ROOM = 46;

/** Something the viewer can do with the profile. The first `primary` ones are named buttons; the rest are icons. */
export type ProfileAction = { id: string; label: string; icon: LucideIcon; primary?: boolean; on?: boolean; onClick: () => void };
/** A record the profile belongs to (a club, a team): its mark and name, opening it. */
export type ProfileMark = { id: string; label: string; media: React.ReactNode; onClick?: () => void };
/** One relation of the profile: a tab with its count, and the records it holds. */
export type ProfilePane = { id: string; label: string; icon?: React.ReactNode; count?: number | string; body: () => React.ReactNode };
/** What a profile shows. All of it is the app's data; nothing here knows what an app's records are. */
export type ProfileRecord = {
  id: string; name: string; handle?: string; role?: string;
  avatar: React.ReactNode; banner?: React.ReactNode;
  /** What the profile is, said in words beside its glyph (verified, an agent, signed in): never a bare badge. */
  status?: { icon: React.ReactNode; label: string };
  bio?: string; more?: string;
  counts?: [string, React.ReactNode][];
  actions?: ProfileAction[];
  /** Buttons an app draws itself (a record's own verbs), in the same region as the actions, and words about it that
   *  are more than a string. */
  controls?: React.ReactNode; about?: React.ReactNode;
  marks?: ProfileMark[];
  tags?: string[];
  facts?: [string, React.ReactNode][];
  /** A private note about this profile, kept with the viewer's account. */
  note?: boolean;
  rail?: React.ComponentProps<typeof StatusRail>['items'];
  panes?: ProfilePane[];
};

/** The viewer's private notes, one per profile, kept like every user document (Phiora, or this device). */
const NOTES = persisted<Record<string, string>>('notes', {});

const Note: React.FC<{ id: string }> = ({ id }) => {
  const all = NOTES.use(); const [v, setV] = useState(all[id] ?? '');
  useEffect(() => setV(NOTES.get()[id] ?? ''), [id]);
  const keep = () => { if ((NOTES.get()[id] ?? '') !== v) NOTES.set({ ...NOTES.get(), [id]: v }); };
  return (
    <Stack direction="column" gap={1}>
      <Text as="span" size="xs" intent="muted">{W.note}</Text>
      <Textarea aria-label={W.note} minRows={2} width="100%" value={v} placeholder={W.notePh} onChange={(e) => setV(e.target.value)} onBlur={keep} />
    </Stack>
  );
};

/** What is on record about them, and the viewer's own note: under the identity on a page, after the relations in a popup. */
const Facts: React.FC<{ r: ProfileRecord }> = ({ r }) => (
  <>
    {r.facts?.length ? (
      <Stack direction="column" gap={0} surface="region">
        {r.facts.map(([l, v]) => (
          <Stack key={l} direction="row" justify="between" gap={3} paddingY={1} className={css.fact}>
            <Text as="span" size="sm" intent="muted">{l}</Text><Text as="span" size="sm" align="right">{v}</Text>
          </Stack>))}
      </Stack>) : null}
    {r.note && <Box surface="region"><Note id={r.id} /></Box>}
  </>
);

/** Who it is: banner, picture, name, what they are, what to do, their numbers, words and memberships. */
const Identity: React.FC<{ r: ProfileRecord; heading: 1 | 2; line?: boolean; children?: React.ReactNode }> = ({ r, heading, line, children }) => {
  const main = (r.actions ?? []).filter((a) => a.primary); const rest = (r.actions ?? []).filter((a) => !a.primary);
  const actions = (main.length > 0 || rest.length > 0 || r.controls) && (
    <Stack direction="row" gap={2} wrap align="center" surface="region">
      {/* Every action is the one button, lit from its foot and never filled; the one that is on is only pressed. */}
      {main.map((a) => <Button key={a.id} variant="glass" iconLeft={a.icon} aria-pressed={a.on} onClick={a.onClick}>{a.label}</Button>)}
      {rest.map((a) => <Button key={a.id} variant="glass" icon={<a.icon size={16} />} aria-label={a.label} title={a.label} aria-pressed={a.on} onClick={a.onClick} />)}
      {r.controls}
    </Stack>
  );
  const name = (
    <Stack direction="column" gap={1} minWidth="0" flex="1" surface="region">
      <Title level={heading} size={line ? 'md' : 'xl'} lineHeight={1.15} className={css.name}>{r.name}</Title>
      {(r.handle || r.role) && <Text size="sm" intent="muted" className={css.name}>{[r.handle && '@' + r.handle, r.role].filter(Boolean).join(' · ')}</Text>}
    </Stack>
  );
  // The line: a profile said in one row (the account's own head, a row in a list).
  if (line) return <Stack direction="row" gap={3} align="center" wrap surface="card" className="phi-row"><Box className="phi-holder">{r.avatar}</Box><Stack direction="column" gap={1} minWidth="12rem" flex="1">{name}{r.bio && <Text size="sm" intent="secondary">{r.bio}</Text>}</Stack>{r.status && <Label icon={r.status.icon}>{r.status.label}</Label>}{actions}</Stack>;
  return (
    // Every part of the card is a region of its own (who it is, what to do, its numbers, its words, where it belongs,
    // its tags, its facts, the note), so each runs against the card and what you press runs against its region (tokens.scss).
    <Stack as="section" direction="column" gap={2} surface="card" aria-label={r.name} className={css.card}>
      {/* The picture stands over the name, with no column beside it, so this part is lit from its foot. */}
      <Stack direction="column" gap={3} surface="region" className={css.stacked}>
        <Box className={css.top}>
          {r.banner && <Box className={css.banner}>{r.banner}</Box>}
          <Box className={r.banner ? css.face : undefined}>{r.avatar}</Box>
        </Box>
        {name}
        {r.status && <Box surface="region"><Label icon={r.status.icon}>{r.status.label}</Label></Box>}
      </Stack>
      {actions}
      {r.counts?.length ? (
        <Stack direction="row" gap={2} wrap surface="region">
          {r.counts.map(([l, v]) => <Stack key={l} direction="column" gap={0} flex="1" surface="region"><Text as="span" font="heading" size="lg" lineHeight={1.1}>{v}</Text><Text as="span" size="xs" intent="muted">{l}</Text></Stack>)}
        </Stack>) : null}
      {(r.bio || r.more || r.about) && (
        <Stack direction="column" gap={2} surface="region">
          {r.about}
          {r.bio && <Text size="sm">{r.bio}</Text>}
          {r.more && <Text size="sm" intent="muted">{r.more}</Text>}
        </Stack>)}
      {r.marks?.length ? (
        <Stack direction="column" gap={1} surface="region">
          {r.marks.map((m) => <Button key={m.id} variant="glass" icon={m.media} onClick={m.onClick}>{m.label}</Button>)}
        </Stack>) : null}
      {r.tags?.length ? <Stack direction="row" gap={1} wrap surface="region">{r.tags.map((x) => <Tag key={x} minimal round size="sm">{x}</Tag>)}</Stack> : null}
      {children}
    </Stack>
  );
};

/** What they have: their highlights, then a tab per relation with its count and that relation's records. */
const Relations: React.FC<{ r: ProfileRecord }> = ({ r }) => {
  const panes = r.panes ?? []; const [tab, setTab] = useState(panes[0]?.id);
  useEffect(() => setTab(panes[0]?.id), [r.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const on = panes.find((p) => p.id === tab) ?? panes[0];
  if (!on && !r.rail?.length) return null;
  return (
    <Stack direction="column" gap={3} minWidth="0">
      {r.rail?.length ? <StatusRail aria-label={W.highlights} items={r.rail} /> : null}
      {panes.length > 1 && <TabList size="sm" variant="pills" place="start" aria-label={r.name} activeId={on.id} onChange={setTab}
        items={panes.map((p) => ({ id: p.id, label: p.label, icon: p.icon, count: p.count }))} />}
      {on && <Box key={on.id} role="tabpanel" aria-label={on.label}>{on.body()}</Box>}
    </Stack>
  );
};

/**
 * The one profile, in every app and every place a profile shows:
 *   page   its identity beside its relations (identity held in view while the relations scroll); one column when narrow
 *   popup  one column for a drawer or a side column: identity, relations, then the facts; `wide` lays it out as the page
 *   line   the identity alone in one row (the account's own head)
 * A profile's tabs are its relations, each with its count, and each shows that relation's own records.
 */
export const ProfileView: React.FC<{ record: ProfileRecord; variant?: 'page' | 'popup' | 'line'; wide?: boolean }> = ({ record: r, variant = 'page', wide }) => {
  // Side by side only where there is room for both parts (the profile's own width, not the screen's): narrower, it is
  // one column with the relations straight after the identity, so a phone shows a person's records without a long scroll.
  const root = useRef<HTMLDivElement | null>(null); const [roomy, setRoomy] = useState(true);
  useEffect(() => {
    const el = root.current; if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setRoomy(el.clientWidth >= ROOM * parseFloat(getComputedStyle(document.documentElement).fontSize)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  if (variant === 'line') return <Identity r={r} heading={2} line />;
  const two = (variant === 'page' || !!wide) && roomy;
  return (
    <Box ref={root} className={css.root}>
      <Box className={[css.grid, two ? css.two : ''].join(' ')}>
        <Box className={css.side}><Identity r={r} heading={variant === 'page' ? 1 : 2}>{two && <Facts r={r} />}</Identity></Box>
        <Relations r={r} />
        {!two && (r.facts?.length || r.note) ? <Stack direction="column" gap={2} surface="card"><Facts r={r} /></Stack> : null}
      </Box>
    </Box>
  );
};
