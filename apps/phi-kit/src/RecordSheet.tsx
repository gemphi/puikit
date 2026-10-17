import React from 'react';
import { Avatar, Box, Button, Card, DataTable, Drawer, Frame, Image, Input, ItemCard, Panes, Rows, Spinner, Stack, Tag, Text, Textarea, Title, type DataTableColumn, type Pane } from '@pui/components';
import { Gavel, Heart, MessageCircle, Send, Share2, ShoppingBag } from 'lucide-react';
import { apiGet, apiSend, refreshAll } from './api';
import { useMe } from './auth';
import { assetUrl } from './data';
import { kindSpecs, referrers, type FieldSpec, type KindSpec } from './kindspecs';

type Row = Record<string, unknown> & { id: string };
const text = (v: unknown) => (v == null || typeof v === 'object' ? '' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));
const human = (k: string) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const when = (v: unknown) => { const s = text(v); return /^\d{4}-\d\d-\d\dT/.test(s) ? new Date(s).toLocaleString('en-US', { dateStyle: 'medium' }) : s; };
const nameOf = (r?: Row) => (r ? text(r.name) || text(r.title) || text(r.label) || r.id : '');
const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const titleOf = (spec: KindSpec | undefined, r?: Row) => (!r ? '' : spec?.title ? spec.title.replace(/\{(\w+)\}/g, (_, k) => text(r[k])) : nameOf(r));
const fieldsOf = (spec?: KindSpec) => (Array.isArray(spec?.fields) ? spec!.fields : []);
const SKIP = new Set(['id', 'slug', 'srcId', 'created_at', 'ownerId', 'name', 'title', 'label', 'image']);
const MONEY = /usd|amount|target|price|floor|valuation|raise|ask|ticket|cost|fee|pledge/i;
const compact = (n: number) => (Math.abs(n) >= 1000 ? Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : String(n));
const linkTarget = (f: FieldSpec | undefined, field: string) => f?.kind ?? (/Id$/.test(field) ? field.replace(/Id$/, '') : null);

/** The comments for a record, as a panel that slides in from the right of the sheet when the chat button is tapped.
 *  Reads live (kind `comment`, pointing at this record) and posts a new comment back to Phiora. */
const CommentsPanel: React.FC<{ kind: string; id: string; title: string; open: boolean; onClose: () => void }> = ({ kind, id, title, open, onClose }) => {
  const me = useMe();
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [draft, setDraft] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState('');
  const load = React.useCallback(() => { void apiGet<{ rows: Row[] }>(`/tree/rows?kind=comment&n=50&where=targetId:${encodeURIComponent(id)}`).then((r) => setRows((r?.rows ?? []).slice().sort((a, b) => Number(b.at ?? 0) - Number(a.at ?? 0)))); }, [id]);
  React.useEffect(() => { if (open) { setRows(null); setNote(''); load(); } }, [open, load]);
  const post = async () => {
    const body = draft.trim(); if (!body) return; setBusy(true); setNote('');
    const r = await apiSend<{ item: Row }>('POST', '/tree/item', { kind: 'comment', fields: { targetId: id, targetKind: kind, body, authorName: me?.name || 'Someone', at: Date.now() } });
    setBusy(false);
    if (r.ok) { setDraft(''); load(); } else { setNote(r.status === 401 || r.status === 403 ? 'Sign in to comment.' : 'Comments aren’t open on this yet.'); }
  };
  return (
    <Drawer isOpen={open} onClose={onClose} position="right" size="md" title={`Comments · ${title}`}>
      <Box padding={4} flex="1" minWidth="0" scroll="y">
        <Stack direction="column" gap={3}>
          <Stack direction="row" gap={2} align="start">
            <Avatar size="sm" initials={initials(me?.name ?? 'You')} seed={me?.id} alt="" />
            <Stack direction="column" gap={2} flex="1" minWidth="0">
              <Textarea value={draft} onChange={(e) => setDraft((e.target as HTMLTextAreaElement).value)} placeholder="Add a comment…" rows={2} />
              <Box><Button variant="primary" size="sm" iconLeft={Send} onClick={post} disabled={busy || !draft.trim()}>Post</Button></Box>
              {note ? <Text size="xs" intent="muted">{note}</Text> : null}
            </Stack>
          </Stack>
          {rows == null ? <Stack align="center" padding={4}><Spinner /></Stack>
            : rows.length === 0 ? <Text size="sm" intent="muted">No comments yet — be the first.</Text>
            : rows.map((c) => (
              <Stack key={c.id} direction="row" gap={2} align="start" surface="card">
                <Avatar size="sm" initials={initials(text(c.authorName) || 'A')} seed={text(c.ownerId) || c.id} alt="" />
                <Stack direction="column" gap={1} flex="1" minWidth="0">
                  <Stack direction="row" gap={2} align="baseline" wrap>
                    <Text as="span" size="sm" weight="medium">{text(c.authorName) || 'Someone'}</Text>
                    <Text as="span" size="xs" intent="muted">{c.at ? new Date(Number(c.at)).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : when(c.created_at)}</Text>
                  </Stack>
                  <Text size="sm">{text(c.body)}</Text>
                </Stack>
              </Stack>
            ))}
        </Stack>
      </Box>
    </Drawer>
  );
};

/** A record of any kind as a card list, driven by the kind's spec and the API, built only from shared puijs
 *  components (ItemCard, DataTable, Rows, Panes) — surfaces, gradients and spacing are the framework's, nothing bespoke.
 *  Spec fields → a DataTable; money fields → their own Pricing pane on the right with the usual buy/offer/like/comment/
 *  share bar; reference props and referrers → panes that open their own sheet. Expanded, the panes move and resize.
 *  Opens at #/<kind>/<id>. */
export const RecordSheet: React.FC<{ kind: string; id: string; onClose: () => void; go: (hash: string) => void; formFor?: (createKind: string) => string | undefined }> = ({ kind, id, onClose, go, formFor }) => {
  const [specs, setSpecs] = React.useState<Record<string, KindSpec> | null>(null);
  const [rec, setRec] = React.useState<Row | null>(null);
  const [links, setLinks] = React.useState<{ field: string; kind: string; row: Row }[]>([]);
  const [related, setRelated] = React.useState<{ kind: string; label: string; rows: Row[] }[]>([]);
  const [siblings, setSiblings] = React.useState<Row[]>([]);
  const [missing, setMissing] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
  const [comments, setComments] = React.useState(false);
  const [rev, setRev] = React.useState(0);
  const [pledge, setPledge] = React.useState<string>('');
  const [backing, setBacking] = React.useState(false);
  const [backNote, setBackNote] = React.useState('');

  React.useEffect(() => {
    let live = true; setRec(null); setMissing(false); setLinks([]); setRelated([]); setSiblings([]); setComments(false); setLiked(false);
    void Promise.all([kindSpecs(), apiGet<{ item: Row }>(`/tree/item/${kind}/${encodeURIComponent(id)}`)]).then(async ([sp, r]) => {
      if (!live) return; setSpecs(sp);
      if (!r?.item) { setMissing(true); return; }
      const item = r.item; setRec(item); const spec = sp[kind];
      const refs = fieldsOf(spec).filter((f) => f.control === 'link').map((f) => [f.id, linkTarget(f, f.id)!] as const).filter(([, k]) => k);
      const got = await Promise.all(refs.map(async ([fid, k]) => { const v = text(item[fid]); if (!v) return null; const rr = await apiGet<{ item: Row }>(`/tree/item/${k}/${encodeURIComponent(v)}`).catch(() => null); return rr?.item ? { field: fid, kind: k, row: rr.item } : null; }));
      if (live) setLinks(got.filter((x): x is { field: string; kind: string; row: Row } => !!x));
      // Related sections: the kind's declared `sections` when it has them (the author's labels and order), else the
      // automatic referrers (every kind that points back at this one). Both are { kind, field, label }.
      const back = spec?.sections?.length ? spec.sections : referrers(sp, kind);
      const pages = await Promise.all(back.map(async (b) => ({ ...b, rows: (await apiGet<{ rows: Row[] }>(`/tree/rows?kind=${b.kind}&n=8&where=${b.field}:${encodeURIComponent(id)}`).catch(() => null))?.rows ?? [] })));
      if (live) setRelated(pages.filter((p) => p.rows.length));
      // Variants: other records of this kind that share the kind's `siblingsBy` value (a round's pool-mates, etc.).
      const sb = spec?.siblingsBy; const sbv = sb ? text(item[sb]) : '';
      if (sb && sbv) { const sib = (await apiGet<{ rows: Row[] }>(`/tree/rows?kind=${kind}&n=12&where=${sb}:${encodeURIComponent(sbv)}`).catch(() => null))?.rows ?? []; if (live) setSiblings(sib.filter((r) => r.id !== item.id)); }
    });
    return () => { live = false; };
  }, [kind, id, rev]);

  const spec = specs?.[kind];
  const fieldLabel = (f: string) => fieldsOf(spec).find((x) => x.id === f)?.label ?? human(f);
  const isMoney = (f: string) => { const fs = fieldsOf(spec).find((x) => x.id === f); return fs?.format === 'usd' || MONEY.test(f); };
  const show = (f: string, v: unknown) => { const fs = fieldsOf(spec).find((x) => x.id === f); return typeof v === 'number' ? (fs?.format === 'usd' || MONEY.test(f) ? '$' + compact(v) : v.toLocaleString('en-US')) : when(v); };
  const img = rec ? assetUrl(text(rec.image)) : undefined;

  const allKeys = rec ? Object.keys(rec).filter((k) => !SKIP.has(k) && !/Ids?$/.test(k) && typeof rec[k] !== 'object' && text(rec[k])) : [];
  const rowOf = (k: string) => ({ id: k, label: fieldLabel(k), value: show(k, rec![k]) });
  const specRows = allKeys.filter((k) => !isMoney(k)).map(rowOf);
  const moneyRows = allKeys.filter(isMoney).map(rowOf);
  const headline = moneyRows[0];
  const fieldCols: DataTableColumn<{ id: string; label: string; value: string }>[] = [
    { id: 'label', header: 'Field', cell: (r) => <Text as="span" size="sm" intent="muted">{r.label}</Text>, width: '11rem' },
    { id: 'value', header: 'Value', cell: (r) => <Text as="span" size="sm" weight="medium">{r.value}</Text> },
  ];
  const recordCard = (r: Row, k: string, meta?: React.ReactNode) => (
    <ItemCard key={k + r.id} layout="auto" mediaSize="sm" onClick={() => go('#/' + k + '/' + r.id)}
      media={<Avatar size="sm" src={assetUrl(text(r.image))} alt="" initials={initials(nameOf(r))} seed={r.id} />}
      title={nameOf(r)} meta={meta} />
  );

  // The kind's create-actions (e.g. a round's "Back this round" → an order): these are the Buy/Offer of this record.
  const specActions = spec?.actions?.length ? spec.actions.filter((a) => formFor?.(a.create)) : [];
  const runAction = (a: { create: string; link: string }) => { const fv = formFor?.(a.create); if (fv) { onClose(); go('#/' + fv + '?' + a.link + '=' + encodeURIComponent(id)); } };
  // Backable: a create-action that makes an `order` linking by `roundId`. The server settles it — the pledge moves
  // from the wallet to the round — so the primary button takes an amount and backs in one tap rather than a form.
  const backAction = (spec?.actions ?? []).find((a) => a.create === 'order' && a.link === 'roundId');
  const minTicket = rec ? Number(rec.minTicket) || 0 : 0;
  const doBack = async () => {
    const amt = Number(pledge) || minTicket; if (!(amt > 0) || backing) return;
    setBacking(true); setBackNote('');
    const r = await apiSend<{ round?: { raised: number } }>('POST', '/tree/item', { kind: 'order', fields: { roundId: id, amount: amt } });
    setBacking(false);
    if (r.ok) { setBackNote('Backed · $' + compact(amt)); setPledge(''); await refreshAll(); setRev((x) => x + 1); }
    else setBackNote(r.status === 401 || r.status === 403 ? 'Sign in to back this.' : r.message || 'Couldn’t back this.');
  };
  // The usual five: buy/back, offer, like, comment, share — the first two come from the kind's own actions.
  const commerceBar = (
    <Stack direction="row" gap={2} wrap align="center">
      {backAction
        ? <Button variant="primary" size="sm" iconLeft={ShoppingBag} onClick={doBack} disabled={backing}>{backing ? 'Backing…' : backAction.label}</Button>
        : specActions[0]
          ? <Button variant="primary" size="sm" iconLeft={ShoppingBag} onClick={() => runAction(specActions[0])}>{specActions[0].label}</Button>
          : <Button variant="primary" size="sm" iconLeft={ShoppingBag} disabled>Buy</Button>}
      {specActions.find((a) => a !== backAction)
        ? <Button variant="outline" size="sm" iconLeft={Gavel} onClick={() => runAction(specActions.find((a) => a !== backAction)!)}>{specActions.find((a) => a !== backAction)!.label}</Button>
        : <Button variant="outline" size="sm" iconLeft={Gavel} disabled>Offer</Button>}
      <Button variant={liked ? 'primary' : 'outline'} size="sm" iconLeft={Heart} onClick={() => setLiked((v) => !v)}>{liked ? 'Liked' : 'Like'}</Button>
      <Button variant="outline" size="sm" iconLeft={MessageCircle} onClick={() => setComments(true)}>Comment</Button>
      <Button variant="outline" size="sm" iconLeft={Share2} onClick={() => { try { void navigator.clipboard?.writeText(location.href); } catch { /* no clipboard */ } }}>Share</Button>
    </Stack>
  );

  // Pricing lives in its own pane (the right third when expanded): the headline figure, a pledge box for backable
  // records, the five-button bar, and the money breakdown.
  const pricingNode = (headline || specActions.length) ? (
    <Stack direction="column" gap={4}>
      <Card variant="hero">
        <Stack direction="column" gap={3}>
          {headline ? <Stack direction="column" gap={1}><Text as="span" size="xs" intent="muted">{headline.label}</Text><Title level={2} size="3xl" style={{ lineHeight: 1 }}>{headline.value}</Title></Stack> : null}
          {backAction ? (
            <Stack direction="row" gap={2} align="center" wrap>
              <Box width="9rem"><Input type="number" value={pledge} onChange={(e) => setPledge((e.target as HTMLInputElement).value)} placeholder={minTicket ? String(minTicket) : 'Amount'} aria-label="Pledge amount" /></Box>
              <Text as="span" size="xs" intent="muted">{minTicket ? `min ${minTicket}` : ''}</Text>
            </Stack>
          ) : null}
          {commerceBar}
          {backNote ? <Text size="xs" intent={backNote.startsWith('Backed') ? 'success' : 'muted'}>{backNote}</Text> : null}
        </Stack>
      </Card>
      {moneyRows.length ? <DataTable rows={moneyRows} getKey={(r) => r.id} columns={fieldCols} /> : null}
    </Stack>
  ) : null;

  const recordNode = (
    <Card variant="hero">
      <Stack direction="column" gap={3}>
        {img ? <Frame ratio="16/9" rounded="lg"><Image src={img} alt="" fit="cover" fill /></Frame> : null}
        <Stack direction="row" gap={3} justify="between" align="start" wrap>
          <Stack direction="column" gap={1}><Title level={2} size="xl">{titleOf(spec, rec!)}</Title><Box><Tag minimal round size="sm">{spec?.label ?? human(kind)}</Tag></Box></Stack>
          <Button variant="ghost" size="sm" iconLeft={MessageCircle} onClick={() => setComments(true)}>Comments</Button>
        </Stack>
        {specRows.length ? <DataTable rows={specRows} getKey={(r) => r.id} columns={fieldCols} /> : null}
      </Stack>
    </Card>
  );
  const linkedNode = links.length ? <Rows cols={2} minItemWidth="12rem">{links.map((l) => recordCard(l.row, l.kind, fieldLabel(l.field)))}</Rows> : null;
  // Variants: the kind's siblings (same `siblingsBy` value) — a round's pool-mates, a zone's areas, and so on.
  const variantsNode = siblings.length ? <Rows cols={1} minItemWidth="12rem">{siblings.map((r) => recordCard(r, kind, human(kind)))}</Rows> : null;

  // Sections spawned from the data: the record, its pricing (if any money), what it links to, its variants (siblings),
  // and a pane per kind that refers to it. Expanded, these are movable, resizable columns, pricing pinned to the right.
  const panes: Pane[] = rec ? [
    { id: 'record', title: spec?.label ?? human(kind), node: recordNode },
    ...(linkedNode ? [{ id: 'linked', title: 'Linked', node: linkedNode }] : []),
    ...(variantsNode ? [{ id: 'variants', title: 'Variants', node: variantsNode }] : []),
    ...related.map((rel) => ({ id: 'rel-' + rel.kind, title: rel.label, node: <Rows cols={1} minItemWidth="12rem">{rel.rows.map((r) => recordCard(r, rel.kind, human(rel.kind)))}</Rows> })),
    ...(pricingNode ? [{ id: 'pricing', title: 'Pricing', node: pricingNode }] : []),
  ] : [];

  const stacked = (
    <Stack direction="column" gap={4}>
      {recordNode}
      {pricingNode ? <Stack direction="column" gap={2}><Title level={4} size="sm">Pricing</Title>{pricingNode}</Stack> : null}
      {linkedNode ? <Stack direction="column" gap={2}><Title level={4} size="sm">Linked</Title>{linkedNode}</Stack> : null}
      {variantsNode ? <Stack direction="column" gap={2}><Title level={4} size="sm">Variants</Title><Rows cols={3} minItemWidth="13rem">{siblings.map((r) => recordCard(r, kind, human(kind)))}</Rows></Stack> : null}
      {related.map((rel) => (
        <Stack key={rel.kind} direction="column" gap={2}>
          <Title level={4} size="sm">{rel.label}</Title>
          <Rows cols={3} minItemWidth="13rem">{rel.rows.map((r) => recordCard(r, rel.kind, human(rel.kind)))}</Rows>
        </Stack>
      ))}
    </Stack>
  );

  const body = missing ? <Text intent="muted">This {human(kind)} is no longer here.</Text> : !rec ? <Stack align="center" padding={6}><Spinner /></Stack>
    : expanded && panes.length > 1 ? <Panes panes={panes} /> : stacked;

  return (
    <>
      <Drawer isOpen onClose={onClose} position="bottom" size="lg" expandable expanded={expanded} onExpandedChange={setExpanded} title={rec ? titleOf(spec, rec) : human(kind)}>
        <Box padding={5} flex="1" minWidth="0" scroll="y">{body}</Box>
      </Drawer>
      {rec ? <CommentsPanel kind={kind} id={id} title={titleOf(spec, rec)} open={comments} onClose={() => setComments(false)} /> : null}
    </>
  );
};
