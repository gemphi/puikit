import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, CardBody, DataTable, Drawer, Pressable, Rows, Stack, TabList, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiSend, hasApi } from '@phi-kit/api';
import { phieggStore } from '../../state/phieggStore';
import { KindForm, actionsOf, describe, fieldLabel, kindLabel, optionsOf, relationsOf, siblingsKeyOf, titleOf, type Relation } from '../../lib/fields';
import { findRecord, liveEdit, liveRemove, recordsOf } from '../../lib/live';
import { Tile } from './Tile';
import { EntityAvatar } from './EntityAvatar';

type Rec = Record<string, unknown> & { id: string };
type Change = { seq: number; action: string; fields: string[] | Record<string, unknown> | null; byHandle?: string | null; at: number };
/** Phiora logs the changed fields as a list of ids (or, older rows, an object of values). */
const changedIds = (f: Change['fields']): string[] => (Array.isArray(f) ? f.map(String) : f ? Object.keys(f) : []).filter((x) => x !== 'id');
const nameOf = (r?: Rec) => String(r?.name ?? r?.title ?? r?.id ?? '');
const ids = (v: unknown): string[] => (Array.isArray(v) ? v : v ? [v] : []).map(String).filter(Boolean);

/** Where a linked record opens: its own page when the app has one, else its record sheet. */
const OPEN: Record<string, (go: (tab: string, p?: Record<string, string>) => void, id: string) => void> = {
  pool: (go, id) => go('pool', { poolId: id }), club: (go, id) => go('club', { clubId: id }), world: (go, id) => go('world', { worldId: id }),
  city: (go, id) => go('city', { cityId: id }), host: (go) => go('hosts'),
};

/**
 * One sheet for any record of any declared kind. Everything on it comes from kinds.json: the fields and their groups
 * (Info), a tab per relation (its own link fields, and every kind that links to it), its siblings (`siblingsBy`: the
 * other PFTs of its pool) as a strip to slide through and a "More from" grid, and its Trail from Phiora's change log.
 * Grids answer to the drawer's own width, so expanding the drawer widens them. Edit swaps in the same KindForm;
 * Remove asks first.
 */
export const RecordSheet: React.FC = () => {
  const s = useStore(phieggStore);
  const o = s.overlay.kind === 'record' ? s.overlay : null;
  const [tab, setTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [trail, setTrail] = useState<Change[] | null>(null);

  const kind = o?.recordKind ?? '';
  const row = o ? (findRecord(kind, o.id) as Rec | undefined) : undefined;
  const sibKey = siblingsKeyOf(kind);
  const parentId = sibKey && row ? String(row[sibKey] ?? '') : '';
  const siblings = (sibKey && parentId ? (recordsOf(kind) as Rec[]).filter((r) => String(r[sibKey] ?? '') === parentId) : row ? [row] : [])
    .slice().sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  const at = Math.max(0, siblings.findIndex((r) => r.id === o?.id));
  const rels = relationsOf(kind);
  const parentRel = rels.find((r) => r.dir === 'out' && r.field === sibKey);
  const parent = parentRel && parentId ? (findRecord(parentRel.kind, parentId) as Rec | undefined) : undefined;
  // Siblings usually share their parent's name ("Bold Pup …"): the strip shows what tells them apart.
  const prefix = (() => {
    if (siblings.length < 2) return '';
    const w = siblings.map((r) => nameOf(r).split(' ')); const max = Math.min(...w.map((x) => x.length)) - 1; let n = 0;
    while (n < max && w.every((x) => x[n] === w[0][n])) n++;
    return n ? w[0].slice(0, n).join(' ') + ' ' : '';
  })();
  const short = (r: Rec) => (prefix && nameOf(r).startsWith(prefix) ? nameOf(r).slice(prefix.length) : nameOf(r));
  // The sheet's own width picks its layout: wide = image left (sticky) and details right; narrow = stacked.
  const bodyRef = useRef<HTMLElement | null>(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const el = bodyRef.current; if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= 880)); ro.observe(el); return () => ro.disconnect();
  });
  const colour = (row?.hex as string | undefined) ?? (parent?.colors as string[] | undefined)?.[0] ?? (parent?.hex as string | undefined);

  // Reset per record; the trail loads when its tab opens.
  useEffect(() => { setEditing(false); setConfirm(false); setTrail(null); }, [o?.id]);
  useEffect(() => {
    if (!o || tab !== 'trail' || trail || !hasApi) return;
    void apiSend<{ changes: Change[] }>('GET', `/tree/change?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(o.id)}&n=50`)
      .then((r) => setTrail(r.ok ? r.body.changes : []));
  }, [o?.id, tab, trail, kind]); // eslint-disable-line react-hooks/exhaustive-deps
  // Slide through siblings with the arrow keys (not while typing or editing).
  const step = (d: number) => { if (siblings.length > 1) s.openRecord(kind, siblings[(at + d + siblings.length) % siblings.length].id); };
  useEffect(() => {
    if (!o || editing) return;
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null; if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }); // re-binds with the current record and siblings
  if (!o) return null;

  const go = (t: string, p?: Record<string, string>) => s.go(t, p as never);
  const openLinked = (k: string, id: string) => (OPEN[k] ? OPEN[k](go, id) : s.openRecord(k, id));
  const done = (msg: string) => { setEditing(false); setTrail(null); phieggStore.setState({ dataRev: Date.now() }); s.flash(msg); };
  const fail = (r: { status: number; message: string }) => (r.status === 401 ? s.openSignIn() : s.flash(r.message));
  const save = async (values: Record<string, unknown>) => { setBusy(true); const r = await liveEdit(kind, o.id, values); setBusy(false); if (r.ok) done('Saved'); else fail(r); };
  const remove = async () => { setBusy(true); const r = await liveRemove(kind, o.id); setBusy(false); if (r.ok) { s.close(); s.flash('Removed'); } else fail(r); };

  // Tabs from the relations: what this record links to, and what links to it.
  const relRows = (r: Relation): Rec[] => r.dir === 'out'
    ? ids(row?.[r.field]).map((id) => (findRecord(r.kind, id) as Rec | undefined) ?? { id, name: optionsOf(r.kind).find((x) => x.value === id)?.label ?? id })
    : (recordsOf(r.kind) as Rec[]).filter((x) => ids(x[r.field]).includes(o.id));
  const relTabs = rels.map((r, i) => ({ r, id: 'rel' + i, rows: row ? relRows(r) : [] })).filter((x) => x.rows.length);
  const tabs = [
    { id: 'info', label: 'Info' },
    ...relTabs.map((x) => ({ id: x.id, label: x.r.label, count: x.rows.length })),
    ...(siblings.length > 1 ? [{ id: 'more', label: 'More from ' + nameOf(parent), count: siblings.length - 1 }] : []),
    { id: 'trail', label: 'Trail' },
  ];
  const current = tabs.some((t) => t.id === tab) ? tab : 'info';
  const info = row ? describe(kind, row) : [];
  const groups = [...new Set(info.map((r) => r.group ?? ''))];

  const card = (k: string, r: Rec) => (
    <Card key={k + r.id} variant="flat" padding="sm" onClick={() => (k === kind ? s.openRecord(k, r.id) : openLinked(k, r.id))}><CardBody>
      <Stack direction="row" gap={3} align="center"><EntityAvatar id={r.id} name={titleOf(k, r)} size="md" />
        <Stack direction="column" gap={0} minWidth="0"><Text weight="bold" truncate>{titleOf(k, r)}</Text><Text size="xs" intent="muted">{kindLabel(k)}</Text></Stack></Stack>
    </CardBody></Card>
  );

  return (
    <Drawer isOpen onClose={() => s.close()} position="right" size="lg" expandable title={row ? titleOf(kind, row) : o.id}
      footer={!editing && row ? (confirm
        ? <Stack direction="row" gap={2} justify="between" align="center"><Text size="sm">Remove this {kindLabel(kind)} for good?</Text><Stack direction="row" gap={2}><Button variant="ghost" onClick={() => setConfirm(false)}>Keep it</Button><Button variant="primary" disabled={busy} onClick={remove}>Remove</Button></Stack></Stack>
        : <Stack direction="row" gap={2} justify="between"><Button variant="ghost" onClick={() => setConfirm(true)}>Remove</Button><Stack direction="row" gap={2}>
          {actionsOf(kind).map((a) => <Button key={a.label} variant="outline" onClick={() => s.openCreate(a.create, { [a.link]: o.id }, { recordKind: kind, id: o.id })}>{a.label}</Button>)}
          <Button variant="primary" onClick={() => setEditing(true)}>Edit</Button></Stack></Stack>) : undefined}>
      {!row ? <Text intent="muted">This record is not here any more.</Text>
        : editing ? <KindForm kind={kind} initial={row} onSubmit={save} submitLabel="Save" cancelLabel="Back" onCancel={() => setEditing(false)} busy={busy} fill />
        : <Box ref={bodyRef}><Stack direction={wide ? 'row' : 'column'} gap={wide ? 5 : 4} align={wide ? 'start' : 'stretch'}>
          <Stack direction="column" gap={3} width={wide ? '42%' : undefined} flex={wide ? 'none' : undefined} style={wide ? { position: 'sticky', top: 0 } : undefined}>
            {siblings.length > 1 && (
              <Stack direction="column" gap={2}>
                <Stack direction="row" justify="between" align="center">
                  <Text size="xs" intent="muted">{`${at + 1} of ${siblings.length} in ${nameOf(parent)}`}</Text>
                  <Stack direction="row" gap={1}>
                    <Button variant="icon" size="sm" aria-label="Previous" onClick={() => step(-1)}><ChevronLeft size={16} /></Button>
                    <Button variant="icon" size="sm" aria-label="Next" onClick={() => step(1)}><ChevronRight size={16} /></Button>
                  </Stack>
                </Stack>
                <Stack direction="row" gap={2} scroll="x" paddingBottom={1} aria-label={'All in ' + nameOf(parent)}>
                  {siblings.map((r) => (
                    <Pressable key={r.id} column gap={1} align="center" flex="none" width="4.5rem" paddingY={1} hover current={r.id === o.id} aria-current={r.id === o.id ? 'true' : undefined}
                      onClick={() => s.openRecord(kind, r.id)} title={nameOf(r)}>
                      <EntityAvatar id={r.id} name={short(r)} size="md" />
                      <Text size="xs" truncate width="100%" align="center" weight={r.id === o.id ? 'bold' : undefined}>{short(r)}</Text>
                    </Pressable>))}
                </Stack>
              </Stack>
            )}
            <Tile tone="accent" color={colour} ratio={wide ? '1/1' : '21/9'} big title={titleOf(kind, row)} sub={[kindLabel(kind), nameOf(parent)].filter(Boolean).join(' · ')}
              depth={{ entityId: row.id, entityName: titleOf(kind, row), clubId: parent?.clubId as string | undefined, worldId: parent?.worldId as string | undefined }}
              badges={<><Tag round size="sm">{kindLabel(kind)}</Tag>{typeof row.rarity === 'string' && <Tag round size="sm" intent="primary">{row.rarity}</Tag>}</>} />
          </Stack>
          <Stack direction="column" gap={4} flex="1" minWidth="0">
            <TabList variant="pills" size="sm" aria-label="Sections" activeId={current} onChange={(id) => setTab(String(id))} items={tabs} />

            {current === 'info' && (
              <Rows cols={2} colsSm={1} minItemWidth="18rem">{groups.map((g) => (
                <Stack key={g || 'more'} direction="column" gap={2}>
                  {g && <Text size="xs" weight="bold" intent="muted">{g}</Text>}
                  <Card variant="flat" padding="md"><CardBody><Stack direction="column" gap={2}>
                    {info.filter((r) => (r.group ?? '') === g).map((r) => (
                      <Stack key={r.id} direction="row" justify="between" gap={3} align="start"><Text size="sm" intent="muted">{r.label}</Text><Text size="sm" weight="medium" align="right">{r.value}</Text></Stack>))}
                  </Stack></CardBody></Card>
                </Stack>))}</Rows>
            )}
            {relTabs.filter((x) => x.id === current).map((x) => (
              <Rows key={x.id} cols={3} colsSm={1} minItemWidth="14rem">{x.rows.map((r) => card(x.r.kind, r))}</Rows>
            ))}
            {current === 'more' && (
              <Rows cols={4} colsSm={2} minItemWidth="10rem">{siblings.filter((r) => r.id !== o.id).map((r) => (
                <Tile key={r.id} tone="accent" color={colour} ratio="4/5" title={short(r)} sub={typeof r.rarity === 'string' ? r.rarity : kindLabel(kind)}
                  depth={{ entityId: r.id, entityName: nameOf(r) }} onClick={() => s.openRecord(kind, r.id)} />))}</Rows>
            )}
            {current === 'trail' && (!hasApi ? <Text intent="muted">The trail lives on Phiora: run with the API to see every change to this record.</Text>
              : !trail ? <Text intent="muted">Loading the trail…</Text>
              : <DataTable<Change> rows={trail} getKey={(c) => c.seq} stickyHeader stickyFirst maxHeight="22rem" limit={8}
                  empty={{ title: 'No changes yet', description: 'Every create, edit and removal of this record shows here.' }}
                  columns={[
                    { id: 'at', header: 'When', cell: (c) => new Date(c.at).toISOString().slice(0, 16).replace('T', ' '), sortValue: (c) => c.at, width: '10rem' },
                    { id: 'action', header: 'What', cell: (c) => (c.action === 'create' ? 'Created' : c.action === 'delete' ? 'Removed' : 'Edited'), sortValue: (c) => c.action },
                    { id: 'by', header: 'Who', cell: (c) => (c.byHandle ? '@' + c.byHandle : 'Phiora'), sortValue: (c) => c.byHandle ?? '' },
                    { id: 'fields', header: 'Changed', cell: (c) => changedIds(c.fields).map((f) => fieldLabel(kind, f)).join(', ') || '·' },
                  ]} defaultSort={{ id: 'at', dir: 'desc' }} />)}
          </Stack>
        </Stack></Box>}
    </Drawer>
  );
};
