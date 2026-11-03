import { apiGet } from './api';

/** A kind's declaration, as a record of kind kindSpec (seeded from phiegg/src/data/kinds.json): its fields and what
    they are, the title template, and the actions a record of the kind can start. Loaded once from Phiora and cached. */
export type FieldSpec = { id: string; label?: string; control?: string; kind?: string; options?: string[]; facet?: boolean; table?: boolean; format?: string; group?: string };
/** A declared related section: records of `kind` that point back at this record through `field`, under `label`.
    Same shape as an automatic referrer, so a kind can override/order/name its sheet sections in data. */
export type SectionSpec = { label: string; kind: string; field: string };
export type KindSpec = { name: string; label?: string; title?: string; fields?: FieldSpec[]; actions?: { label: string; create: string; link: string }[]; siblingsBy?: string; sections?: SectionSpec[] };

let cache: Promise<Record<string, KindSpec>> | null = null;
export function kindSpecs(): Promise<Record<string, KindSpec>> {
  if (!cache) cache = apiGet<{ rows: (KindSpec & { app?: string })[] }>('/tree/rows?kind=kindSpec&n=300')
    .then((r) => Object.fromEntries((r?.rows ?? []).map((s) => [s.name, s])))
    .catch(() => ({}));
  return cache;
}

/** The kinds whose records point at `kind` through a link field, so a record can list what refers to it (a pool's
    rounds, a round's orders). Returns [{ kind, field, label }]. */
export function referrers(specs: Record<string, KindSpec>, kind: string): { kind: string; field: string; label: string }[] {
  const out: { kind: string; field: string; label: string }[] = [];
  for (const spec of Object.values(specs)) for (const f of (Array.isArray(spec.fields) ? spec.fields : [])) if (f.control === 'link' && f.kind === kind) out.push({ kind: spec.name, field: f.id, label: plural(spec.label ?? spec.name) });
  return out;
}

const plural = (s: string) => (/s$/.test(s) ? s : s + 's');
