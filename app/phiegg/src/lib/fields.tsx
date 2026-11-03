// The kinds of kinds: data/kinds.json declares, for every kind, its fields and the control each one uses
// (text, textarea, radio, select, number), which fields filter (facet), sort and show as table columns, and
// which are editable. Every list's Filter & sort drawer, every record table and every edit sheet reads this one
// file, so controls are declared once and configurable, never hand-built per page.
import React from 'react';
import { Input, RelationPicker, type RelationOption, Select, StepForm, type StepFormSection, type StepFormStep, TabList, Textarea, type DataTableColumn } from '@pui/components';
import { CircleUser, Coins, FileText, Layers, Link2, Palette, Truck, Package, CreditCard, MapPin, ClipboardCheck, ShieldCheck, Sparkles } from 'lucide-react';
import kindsJson from '../data/kinds.json';
import { D, PFTS, clubOf, fmt, person, poolOf, site, t, usd, worldOf, type SiteCopyKey } from './data';
import type { ListFacet, ListSort } from '../components/Phiegg/Views';

export type FieldDecl = {
  id: string; path?: string; label: string;
  /** Which step of the kind's form this field sits on (1-based; the kind's `steps` names them). */
  step?: number;
  /** The control this field is edited and filtered with: text, textarea, radio, select, number. */
  control?: string;
  options?: string[]; via?: string; format?: string; align?: 'right';
  /** Relation target for link/links controls, and the bordered group this field sits in on its step. */
  kind?: string; group?: string;
  facet?: boolean; table?: boolean; editable?: boolean;
};
export type SortDecl = { id: string; label: string; path: string; dir?: 'asc' | 'desc' | 'az'; abs?: boolean; numeric?: boolean };
export type KindAction = { label: string; create: string; link: string };
type KindDecl = { fields?: FieldDecl[]; sorts?: SortDecl[]; steps?: string[]; label?: string; siblingsBy?: string; actions?: KindAction[]; title?: string };
/** What a record of a kind can start (kinds.json `actions`): "Rent" on a PFT creates a rental linked to it. */
export const actionsOf = (kind: string): KindAction[] => KINDS[kind]?.actions ?? [];
const KINDS = kindsJson as Record<string, KindDecl>;
/** The declarations are records in Phiora too (kind kindSpec, app phiegg, seeded from data/kinds.json): a fields,
    facets, sorts or steps change made there replaces the bundled declaration. Returns how many changed. */
export function applyKinds(rows: Record<string, unknown>[]): number {
  let n = 0;
  for (const r of rows) {
    if (r.app !== 'phiegg' || typeof r.name !== 'string') continue;
    const { id: _id, slug: _slug, name, app: _app, ...decl } = r as Record<string, unknown> & { name: string };
    if (JSON.stringify(KINDS[name]) !== JSON.stringify(decl)) { KINDS[name] = decl as KindDecl; n++; }
  }
  return n;
}

export const fieldsOf = (kind: string): FieldDecl[] => KINDS[kind]?.fields ?? [];
export type Relation = { dir: 'out' | 'in'; kind: string; field: string; label: string };
/** Every relation of a kind, read from the declarations: its own link fields (out), and every other kind's link
    fields that point at it (in). A record's tabs come from these, so a new link field is a new tab, nothing else. */
export function relationsOf(kind: string): Relation[] {
  const out = fieldsOf(kind).filter((f) => (f.control === 'link' || f.control === 'links') && f.kind)
    .map((f) => ({ dir: 'out' as const, kind: f.kind!, field: f.id, label: label(f.label) }));
  const inn = Object.entries(KINDS).flatMap(([k, d]) => (d.fields ?? []).filter((f) => (f.control === 'link' || f.control === 'links') && f.kind === kind)
    .map((f) => ({ dir: 'in' as const, kind: k, field: f.id, label: KINDS[k]?.label ? KINDS[k]!.label + 's' : k })));
  return [...out, ...inn];
}
/** The field a kind's siblings share (kinds.json `siblingsBy`): a PFT's siblings are the other PFTs of its pool. */
export const siblingsKeyOf = (kind: string): string | undefined => KINDS[kind]?.siblingsBy;

/** A field's declared label for people (Price USD), else its id. */
export const fieldLabel = (kind: string, id: string): string => { const f = fieldsOf(kind).find((x) => x.id === id); return f ? label(f.label) : id; };

/** A kind's name for people (kinds.json `label`), else its key. */
export const kindLabel = (kind: string): string => KINDS[kind]?.label ?? kind;
const label = (k: string) => (k in site.copy ? t(k as SiteCopyKey) : k);
const dig = (r: unknown, path: string): unknown => path.split('.').reduce<unknown>((v, k) => (v == null ? v : (v as Record<string, unknown>)[k]), r);

/** Named resolvers a field's `via` can point at: ids become names, dates become months, site maps label codes. */
const VIA: Record<string, (v: unknown, r: unknown) => string | undefined> = {
  person: (v) => (typeof v === 'string' && v ? person(v).name : undefined),
  club: (v) => (typeof v === 'string' ? clubOf(v)?.name : undefined),
  world: (v) => (typeof v === 'string' ? worldOf(v)?.name : undefined),
  pool: (v) => (typeof v === 'string' ? poolOf(v)?.name : undefined),
  month: (v) => (typeof v === 'string' ? (site as unknown as { months: string[] }).months[Number(v.slice(5, 7)) - 1] : undefined),
  cities: (v) => (Array.isArray(v) ? v.length + ' cities' : undefined),
  mine: (v) => (v === D.core.currentUserId ? t('lsYours') : t('lsOthers')),
  mineOwned: () => undefined, // pages that know ownership override this by field id
};
const via = (f: FieldDecl) => (v: unknown, r: unknown): string | undefined => {
  if (!f.via) return v == null ? undefined : String(v);
  if (f.via.startsWith('site:')) { const m = (site as unknown as Record<string, Record<string, string>>)[f.via.slice(5)]; return m?.[String(v)] ?? (v == null ? undefined : String(v)); }
  return VIA[f.via]?.(v, r);
};
const FMT: Record<string, (v: unknown) => React.ReactNode> = {
  fmt: (v) => fmt(Number(v ?? 0)),
  usd: (v) => usd(Number(v ?? 0)),
  dollars: (v) => (v ? '$' + fmt(Number(v)) : '·'),
  date: (v) => String(v ?? '').slice(0, 10),
};

type Over<T> = { get?: Record<string, (r: T) => string | undefined>; cell?: Record<string, (r: T) => React.ReactNode> };

/** The Filter & sort drawer's facets for a kind, straight from kinds.json; override a field's getter by id. */
export function facetsFor<T>(kind: string, over: Over<T> = {}): ListFacet<T>[] {
  return fieldsOf(kind).filter((f) => f.facet).map((f) => ({
    id: f.id, label: label(f.label),
    get: over.get?.[f.id] ?? ((r: T) => via(f)(dig(r, f.path ?? f.id), r)),
  }));
}
/** The sort menu for a kind: declared direction (asc, desc, a-z), absolute or numeric compare where asked. */
export function sortsFor<T>(kind: string): ListSort<T>[] {
  return (KINDS[kind]?.sorts ?? []).map((sd) => ({
    id: sd.id, label: label(sd.label),
    by: (a: T, b: T) => {
      const va = dig(a, sd.path); const vb = dig(b, sd.path);
      if (sd.dir === 'az') return String(va ?? '').localeCompare(String(vb ?? ''), undefined, sd.numeric ? { numeric: true } : undefined);
      const na = sd.abs ? Math.abs(Number(va ?? 0)) : Number(va ?? 0); const nb = sd.abs ? Math.abs(Number(vb ?? 0)) : Number(vb ?? 0);
      return sd.dir === 'asc' ? na - nb : nb - na;
    },
  }));
}
/** The list-mode table for a kind; append page-only columns after, override a cell by field id. */
export function tableFor<T>(kind: string, over: Over<T> = {}): DataTableColumn<T>[] {
  return fieldsOf(kind).filter((f) => f.table).map((f) => ({
    id: f.id, header: label(f.label),
    cell: over.cell?.[f.id] ?? ((r: T) => { const v = dig(r, f.path ?? f.id); return f.format ? FMT[f.format]?.(v) : f.via ? via(f)(v, r) ?? '·' : ((v ?? '·') as React.ReactNode); }),
    sortValue: (r: T) => { const v = dig(r, f.path ?? f.id); return (f.via ? via(f)(v, r) : v) as string | number; },
    ...(f.align ? { align: f.align } : {}),
  }));
}
/** A record as people read it, from its kind's declaration: each declared field's label and shown value (links become
    the linked records' names, formats and resolvers applied), in declared order, empty fields left out. */
export function describe(kind: string, row: Record<string, unknown>): { id: string; label: string; value: React.ReactNode; group?: string }[] {
  return fieldsOf(kind).map((f) => {
    const raw = dig(row, f.path ?? f.id);
    if (raw == null || raw === '' || (Array.isArray(raw) && !raw.length)) return null;
    const value: React.ReactNode = f.control === 'link' || f.control === 'links'
      ? (Array.isArray(raw) ? raw : [raw]).map((id) => optionsOf(f.kind ?? '').find((o) => o.value === id)?.label ?? String(id)).join(' · ')
      : f.format ? FMT[f.format]?.(raw) : f.via ? via(f)(raw, row) ?? String(raw) : String(raw);
    return { id: f.id, label: label(f.label), value, group: f.group };
  }).filter((x): x is NonNullable<typeof x> => !!x);
}

/** How a record is named: its kind's `title` template ("{renterId} · {days} days"), placeholders filled with shown
    values (links become names), else its name or title, else its id. */
export function titleOf(kind: string, row: Record<string, unknown>): string {
  const tpl = KINDS[kind]?.title;
  if (tpl) {
    const shownOf = new Map(describe(kind, row).map((d) => [d.id, typeof d.value === 'string' || typeof d.value === 'number' ? String(d.value) : String(dig(row, d.id) ?? '')]));
    const out = tpl.replace(/\{(\w+)\}/g, (_, f: string) => shownOf.get(f) ?? '').replace(/(\s·\s)+$/, '').replace(/^(\s·\s)+/, '').trim();
    if (out) return out;
  }
  return String(row.name ?? row.title ?? row.id ?? '');
}

/** Facets, sorts and table for a ListView in one spread: `{...listOf('look', { get: { owned } })}`. */
export const listOf = <T,>(kind: string, over: Over<T> = {}) => ({ facets: facetsFor<T>(kind, over), sorts: sortsFor<T>(kind), table: tableFor<T>(kind, over) });

/** Existing records of a kind, as picker options: relation fields link against these. */
export const optionsOf = (kind: string): RelationOption[] => {
  switch (kind) {
    case 'club': return D.core.clubs.map((c) => ({ value: c.id, label: c.name, sub: fmt(c.holders) + ' holders' }));
    case 'world': return D.core.worlds.map((w) => ({ value: w.id, label: w.name }));
    case 'city': return D.core.worlds.flatMap((w) => w.cities.map((c) => ({ value: c.id, label: c.name, sub: w.name })));
    case 'host': return D.hosts.hosts.map((h) => ({ value: h.id, label: h.name }));
    case 'nest': return D.hosts.nests.map((n) => ({ value: n.id, label: n.name }));
    case 'person': return D.core.users.map((u) => ({ value: u.id, label: u.name, sub: '@' + u.handle }));
    case 'quest': return D.economy.quests.map((q) => ({ value: q.id, label: q.title }));
    case 'pool': return D.pools.pools.map((p) => ({ value: p.id, label: p.name, sub: clubOf(p.clubId)?.name }));
    case 'pft': return PFTS.map((x) => ({ value: x.id, label: x.name, sub: poolOf(x.poolId)?.name }));
    default: return [];
  }
};

/** One declared control, rendered: radio = pills, select, textarea, number, text, or a relation picker (link, links). */
export const FieldControl: React.FC<{ field: FieldDecl; value: string; onChange: (v: string) => void }> = ({ field, value, onChange }) => {
  switch (field.control) {
    case 'textarea': return <Textarea value={value} rows={3} onChange={(e) => onChange(e.target.value)} />;
    case 'radio': return <TabList size="sm" variant="pills" activeId={value} onChange={(id) => onChange(String(id))} items={(field.options ?? []).map((o) => ({ id: o, label: o }))} />;
    case 'select': return <Select value={value} onChange={(e) => onChange(e.target.value)} options={(field.options ?? []).map((o) => ({ value: o, label: o }))} />;
    case 'link': case 'links': {
      const opts = optionsOf(field.kind ?? '');
      const sel = value ? value.split(',').filter(Boolean) : [];
      return <RelationPicker options={opts} value={sel} multi={field.control === 'links'} onChange={(ids) => onChange(ids.join(','))} placeholder={'Search ' + (field.kind ?? '') + 's'} />;
    }
    case 'number': return <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />;
    default: return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
  }
};
export const editableFields = (kind: string) => fieldsOf(kind).filter((f) => f.editable);
export const stepsOf = (kind: string): string[] => KINDS[kind]?.steps ?? [];

/** Step name -> rail icon. New step names fall back to a spark. */
const STEP_ICONS: Record<string, React.ReactNode> = {
  identity: <CircleUser size={16} />, account: <CircleUser size={16} />, profile: <CircleUser size={16} />,
  about: <FileText size={16} />, details: <FileText size={16} />, notes: <FileText size={16} />,
  style: <Palette size={16} />, look: <Palette size={16} />, theme: <Palette size={16} />,
  delivery: <MapPin size={16} />, address: <MapPin size={16} />,
  shipping: <Truck size={16} />, fulfilment: <Package size={16} />, fulfillment: <Package size={16} />,
  payment: <CreditCard size={16} />, billing: <CreditCard size={16} />,
  review: <ClipboardCheck size={16} />, confirm: <ShieldCheck size={16} />, security: <ShieldCheck size={16} />,
  collection: <Layers size={16} />, supply: <Coins size={16} />, links: <Link2 size={16} />,
};
const stepIcon = (name: string): React.ReactNode => STEP_ICONS[name.trim().toLowerCase()] ?? <Sparkles size={16} />;

/** A field's value as a person would read it: linked ids become the linked records' names. */
const shown = (f: FieldDecl, v: string): string => {
  if (!v) return '';
  if (f.control === 'link' || f.control === 'links') {
    const opts = optionsOf(f.kind ?? '');
    return v.split(',').filter(Boolean).map((id) => opts.find((o) => o.value === id)?.label ?? id).join(' · ');
  }
  return v;
};
/** A short, readable summary of the values chosen on a step, shown as the rail hint once it is behind you. */
const hintFor = (fields: FieldDecl[], vals: Record<string, string>): string | undefined => {
  const parts = fields.map((f) => shown(f, (vals[f.id] ?? '').trim())).filter(Boolean);
  if (!parts.length) return undefined;
  const line = parts.join(' · ');
  return line.length > 40 ? line.slice(0, 39) + '…' : line;
};

/**
 * Every form in the app is this one component: the kind declares the fields, their controls and their steps
 * (data/kinds.json); the caller supplies the action. It renders through the library's {@link StepForm}, so a
 * multi-step kind gets the full-screen rail (step icons, the active one lit, a check on the ones done, the chosen
 * value as a hint) and a one-step kind renders flat. Drop it in an expandable Drawer for an edit sheet that fills
 * the window. Add a kind to kinds.json, not a form here.
 */
export const KindForm: React.FC<{
  kind: string; initial?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabel: string; cancelLabel?: string; onCancel?: () => void; busy?: boolean;
  /** Title shown at the top of the rail. */
  title?: string; sub?: string;
  /** A panel pinned under the rail (a cart summary, a total). */
  aside?: React.ReactNode;
  /** Extra content shown above the buttons on the last step (a review line, a total). */
  review?: React.ReactNode;
  /** Keep the form in the host's height, fields scrolling. Default true. */
  fill?: boolean;
}> = ({ kind, initial = {}, onSubmit, submitLabel, cancelLabel, onCancel, busy, title, sub, aside, review, fill }) => {
  const flds = editableFields(kind);
  const names = stepsOf(kind);
  const stepCount = Math.max(1, names.length, ...flds.map((f) => f.step ?? 1));
  const [at, setAt] = React.useState(0);
  /** Start values: what the record already holds, else a radio's first option, else empty. */
  const seed = () => Object.fromEntries(flds.map((f) => { const v = initial[f.id]; return [f.id, v != null && v !== '' ? String(v) : f.control === 'radio' && f.options?.length ? f.options[0] : '']; }));
  const [vals, setVals] = React.useState<Record<string, string>>(seed);
  React.useEffect(() => { setVals(seed()); setAt(0); }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    const out: Record<string, unknown> = {};
    for (const f of flds) {
      const v = (vals[f.id] ?? '').trim();
      out[f.id] = f.control === 'links' ? v.split(',').filter(Boolean) : f.control === 'number' ? (v === '' ? '' : Number(v)) : v;
    }
    void onSubmit(out);
  };

  const steps: StepFormStep[] = Array.from({ length: stepCount }, (_, i) => {
    const here = flds.filter((f) => (f.step ?? 1) === i + 1);
    const name = names[i] ?? t('coStepOf', { i: i + 1, n: stepCount });
    const fieldOf = (f: FieldDecl) => ({
      id: f.id, label: label(f.label), full: f.control === 'textarea' || f.control === 'link' || f.control === 'links',
      control: <FieldControl field={f} value={vals[f.id] ?? ''} onChange={(v) => setVals((x) => ({ ...x, [f.id]: v }))} />,
    });
    const groups = [...new Set(here.map((f) => f.group ?? ''))];
    const sections: StepFormSection[] | undefined = here.some((f) => f.group)
      ? groups.map((g) => ({ id: g || 'more', title: g || undefined, fields: here.filter((f) => (f.group ?? '') === g).map(fieldOf) }))
      : undefined;
    return {
      id: String(i), label: name, icon: stepIcon(name), hint: hintFor(here, vals),
      ...(sections ? { sections } : { fields: here.map(fieldOf) }),
    };
  });

  return (
    <StepForm
      steps={steps} activeIndex={at} onStepChange={setAt}
      onSubmit={submit} submitLabel={submitLabel}
      nextLabel={t('coNext')} backLabel={t('coBack')} cancelLabel={cancelLabel ?? t('cancel')} onCancel={onCancel}
      busy={busy} title={title} sub={sub} aside={aside} review={review} fill={fill}
    />
  );
};
