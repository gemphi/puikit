import React, { useState } from 'react';
import { Button, Figure, FigureRow, Frame, Image, Input, Popover, ProgressBar, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { describe, fill } from '../../lib/fields';
import { D, itemOf, site, t, usd, valueAt, worldImage, type ItemRow } from '../../lib/data';
import { buyCoin, enterQuest, leaveQuest, sellCoin, useEconomy } from '../../lib/economy';

/** The parts a card may carry under or beside its face (data/card.json), the same on every layout:
 *  `figures`, declared fields (data/kinds.json) shown as label and value, or `{ label, value }` with a template;
 *  `progress`, a field from 0 to 1 and a template written over the bar; `tags`, templates shown as tags (one whose
 *  fields are all empty is left out; `{ text, intent }` gives it a colour); `act`, what the viewer can do with the
 *  record (one of ACT below); `date`, a field whose day and month stand at a row's start; `art`, the field naming the
 *  world whose art stands beside it. */
export type PartDecl = {
  figures?: (string | { label: string; value: string })[];
  progress?: { field: string; note?: string };
  tags?: (string | { text: string; intent?: 'primary' | 'success' })[];
  act?: string; date?: string; art?: string;
};
type PartProps = { kind: string; row: ItemRow };

/** A template filled, or nothing when every field it names is empty. */
const whole = (kind: string, row: ItemRow, tpl: string) =>
  ((tpl.match(/\{[\w.]+\}/g) ?? []).some((f) => fill(kind, row, f) !== '') ? fill(kind, row, tpl) : '');

/** The figures of a card: declared fields by id, or a label and a template. */
export const Figures: React.FC<PartProps & { of: NonNullable<PartDecl['figures']> }> = ({ kind, row, of }) => {
  const shown = new Map(describe(kind, row).map((d) => [d.id, d]));
  const list = of.map((f) => (typeof f === 'string' ? shown.get(f) && { label: shown.get(f)!.label, value: shown.get(f)!.value } : { label: t(f.label as 'lsColValue'), value: whole(kind, row, f.value) }))
    .filter((f): f is { label: string; value: React.ReactNode } => !!f && f.value !== '');
  return list.length ? <FigureRow>{list.map((f) => <Figure key={f.label} label={f.label} value={f.value} />)}</FigureRow> : null;
};

/** A bar of how far the record has come, with its note and its share. */
export const Progress: React.FC<PartProps & { of: NonNullable<PartDecl['progress']> }> = ({ kind, row, of }) => {
  const v = Number(valueAt(row, of.field) ?? 0);
  return (
    <Stack direction="column" gap={2} surface="region" role="status">
      <Stack direction="row" justify="between" align="center" gap={2}><Text size="xs" intent="muted" truncate>{of.note ? whole(kind, row, of.note) : ''}</Text><Text size="xs" weight="bold" numeric>{Math.round(v * 100)}%</Text></Stack>
      <ProgressBar value={v} size="md" animate={false} />
    </Stack>);
};

/** The tags of a card. */
export const Tags: React.FC<PartProps & { of: NonNullable<PartDecl['tags']> }> = ({ kind, row, of }) => {
  const list = of.map((x) => (typeof x === 'string' ? { text: x } : x)).map((x) => ({ ...x, text: whole(kind, row, x.text) })).filter((x) => x.text);
  return list.length ? <Stack direction="row" gap={1} wrap surface="region">{list.map((x) => <Tag key={x.text} intent={x.intent} minimal round size="sm">{x.text}</Tag>)}</Stack> : null;
};

/** Every world with art; a record with no world borrows one, picked steadily by its id. */
const ART = D.core.worlds.filter((w) => w.image);
const steady = (id: string) => ART[[...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0) % Math.max(1, ART.length)];
/** A row's start when its card names `date` or `art`: the day and month, and the world's art. */
export const DateArt: React.FC<PartProps & { date?: string; art?: string }> = ({ row, date, art }) => {
  const day = date ? String(valueAt(row, date) ?? '') : ''; const src = art ? worldImage(itemOf('world', valueAt(row, art) as string)) ?? worldImage(steady(row.id)) : undefined;
  return (
    <Stack direction="row" gap={3} align="center">
      {day && <Stack direction="column" align="center" gap={0} minWidth="3rem"><Title level={3} size="lg">{day.slice(8, 10)}</Title><Text size="xs" intent="muted">{site.months[Number(day.slice(5, 7)) - 1]}</Text></Stack>}
      {src && <Frame ratio="4/3" width="6.5rem" rounded="md"><Image src={src} alt="" fit="cover" fill loading="lazy" /></Frame>}
    </Stack>);
};

/** An amount popover: type a USD amount, confirm. */
const Amount: React.FC<{ label: string; initial?: number; onConfirm: (n: number) => boolean; variant?: 'primary' | 'outline' }> = ({ label, initial = 100, onConfirm, variant = 'outline' }) => {
  const [open, setOpen] = useState(false); const [v, setV] = useState(String(initial));
  return (
    <Popover portal isOpen={open} onOpenChange={setOpen} placement="bottom-start" trigger={<Button variant={variant}>{label}</Button>}>
      <Stack direction="column" gap={2} minWidth="12rem">
        <Text size="xs" intent="muted" weight="bold">{t('stakeAmt')}</Text>
        <Input type="number" min={1} value={v} aria-label={t('stakeAmt')} onChange={(e) => setV(e.target.value)} />
        <Stack direction="row" gap={1}>{[50, 100, 500].map((n) => <Button key={n} variant="glass" onClick={() => setV(String(n))}>{usd(n)}</Button>)}</Stack>
        <Button variant="glass" onClick={() => { if (onConfirm(Number(v))) setOpen(false); }}>{label} {usd(Number(v) || 0)}</Button>
      </Stack>
    </Popover>
  );
};

const str = (row: ItemRow, f: string) => String(row[f] ?? '');
/** What the viewer can do with a record, by the name a card gives in `act`. Each is written once. */
export const ACT: Record<string, React.FC<PartProps>> = {
  /** An event or a drop: answer it (going, or be reminded of a drop). */
  rsvp: function Rsvp({ row }) {
    const s = useStore(phieggStore); const going = !!s.rsvp[row.id];
    return <Button variant="glass" onClick={() => { s.toggle('rsvp', row.id); if (!going) s.flash(t('calendarAdded')); }}>{going ? t('going') : row.kind === 'drop' ? t('remind') : t('rsvp')}</Button>;
  },
  /** A quest: enter it; once in, go to its world or leave it. */
  quest: function QuestAct({ row }) {
    const s = useStore(phieggStore); const eco = useEconomy(); const world = str(row, 'worldId'); const name = str(row, 'title');
    return eco.quests[row.id]
      ? <Stack direction="row" gap={1} align="center" wrap surface="region"><Tag round intent="success" size="sm">{t('qEntered')}</Tag>
          <Button variant="glass" onClick={() => s.go('world', { worldId: world })}>{itemOf('world', world)?.name ?? t('playQuest')}</Button>
          <Button variant="glass" onClick={() => { leaveQuest(row.id); s.flash(t('qLeft', { name })); }}>{t('qLeave')}</Button></Stack>
      : <Button variant="glass" onClick={() => { enterQuest(row.id); s.flash(t('joined_', { name })); }}>{t('playQuest')}</Button>;
  },
  /** A coin: buy an amount; once held, what is held and selling it. */
  coin: function CoinAct({ row }) {
    const s = useStore(phieggStore); const eco = useEconomy(); const held = eco.coins[row.id] ?? 0; const coin = str(row, 'symbol'); const price = Number(row.price ?? 0);
    return (
      <Stack direction="row" gap={1} align="center" wrap>
        <Amount label={t('buy')} variant="primary" onConfirm={(n) => { const ok = buyCoin(row.id, n); s.flash(ok ? t('bought', { n: (n / price).toFixed(2), coin }) : t('noFunds')); return ok; }} />
        {held > 0 && <Tag intent="primary" round size="sm">{t('lsHeld') + ' ' + held.toFixed(2) + ' ' + coin + ' · ' + usd(held * price)}</Tag>}
        {held > 0 && <Button variant="glass" onClick={() => { const got = sellCoin(row.id); s.flash(t('sold', { coin, usd: usd(got) })); }}>{t('sell')}</Button>}
      </Stack>);
  },
};

/** Whether a card carries any part beyond its face. */
export const hasParts = (d: PartDecl) => !!(d.figures || d.progress || d.tags || d.act);
/** The parts under a card's face, in one order: progress, figures, tags, then what the viewer can do. */
export const Parts: React.FC<PartProps & { decl: PartDecl; actHere?: boolean }> = ({ kind, row, decl, actHere = true }) => {
  const Act = decl.act ? ACT[decl.act] : undefined;
  return (
    <>
      {decl.progress && <Progress kind={kind} row={row} of={decl.progress} />}
      {decl.figures && <Figures kind={kind} row={row} of={decl.figures} />}
      {decl.tags && <Tags kind={kind} row={row} of={decl.tags} />}
      {actHere && Act && <Act kind={kind} row={row} />}
    </>);
};
