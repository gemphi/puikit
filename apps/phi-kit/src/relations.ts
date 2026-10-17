/**
 * Relations: the shared relations index for every Phiace app.
 *
 * A link type (`RelSpec`) says that rows of kind `from` carry `field` pointing at kind `to`, with a name read from the
 * row (`out`, e.g. a club's "Founder") and a name read from the target (`in`, e.g. the person's "Clubs founded").
 * `indexRelations` walks the rows once and answers, for any record, what it points at and what points at it,
 * grouped by name, plus the schema (every link type with its link count) and the values that resolve to nothing.
 *
 * Apps with typed kinds pass their own specs (Phiegg); apps on the global items+kinds model derive them from the
 * data (`specsFromDB`, Phidata). Either way the index and its answers have one shape.
 */
import { isRef, kindLabel, plural, type DB } from './kinds';

export type Ref = { kind: string; id: string };
export type RelSpec = { from: string; field: string; to: string; out?: string; in?: string };
export type RelSource = { kind: string; rows: unknown[] };
/** One relation of a record: its name, which way it reads and the records on the other end. */
export type RelGroup = { rel: string; dir: 'out' | 'in'; kind: string; refs: Ref[] };
/** One link type with its counts. `unresolved` values point at nothing of kind `to`. */
export type SchemaRow = { id: string; from: string; field: string; to: string; out: string; in: string; links: number; unresolved: number };
export type Unresolved = { from: Ref; field: string; value: string; to: string };
export type Ranked = { ref: Ref; out: number; in: number; total: number };

export type RelationIndex = {
  schema: SchemaRow[];
  unresolved: Unresolved[];
  /** Links that resolve. */
  links: number;
  relationsOf: (r: Ref) => RelGroup[];
  degreeOf: (r: Ref) => number;
  /** Every record with links, most linked first. */
  ranked: () => Ranked[];
  /** The links of one type, as pairs. */
  linksOf: (specId: string) => { from: Ref; to: Ref }[];
};

export const refKey = (r: Ref) => r.kind + ':' + r.id;
export const parseKey = (k: string): Ref => { const i = k.indexOf(':'); return { kind: k.slice(0, i), id: k.slice(i + 1) }; };
export const specId = (s: { from: string; field: string; to: string }) => s.from + '.' + s.field + '>' + s.to;

const cap = (w: string) => (w ? w[0].toUpperCase() + w.slice(1) : w);
/** founderId → Founder, clubIds → Clubs, hostAgentId → Host agent. */
export const outName = (field: string) => {
  const w = cap(field.replace(/Ids?$/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim());
  return /Ids$/.test(field) ? plural(w) : w;
};

/**
 * Names both ways for the usual fields, keyed `kind.field`. Apps add their own; the default is the field read
 * forward (`outName`) and the source kind read back (`kindLabel`).
 */
export const REL_NAMES: Record<string, [string, string]> = {
  'club.founderId': ['Founder', 'Clubs founded'], 'club.hostId': ['Host', 'Clubs'], 'club.worldIds': ['Worlds', 'Club'],
  'world.clubId': ['Club', 'Worlds'], 'world.creatorId': ['Creator', 'Worlds created'], 'world.hostId': ['Host', 'Worlds'],
  'user.clubIds': ['Clubs', 'Members'], 'user.hostIds': ['Hosts', 'Members'],
  'person.clubIds': ['Clubs', 'Members'], 'person.hostIds': ['Hosts', 'Members'],
  'host.clubId': ['Club', 'Host'], 'host.ownerId': ['Owner', 'Hosts owned'],
  'nest.hostId': ['Host', 'Nests'], 'nest.parentId': ['Inside', 'Nested'], 'nest.worldId': ['World', 'Nests'], 'nest.cityId': ['City', 'Nests'],
  'shot.authorId': ['By', 'Shots'], 'post.authorId': ['By', 'Shots'], 'moment.userId': ['By', 'Moments'],
  'conversation.userIds': ['People', 'Conversations'], 'application.mentorIds': ['Mentors', 'Mentoring'],
  'theme.lookId': ['Look', 'Themes'], 'theme.byId': ['Designer', 'Themes set'],
  'look.storeId': ['Store', 'Looks'], 'look.collectionId': ['Collection', 'Looks'], 'collection.lookIds': ['Looks', 'Collections'],
  'club.nestId': ['Collection', 'Clubs'], 'look.nestId': ['Collection', 'Looks'], 'piece.nestId': ['Collection', 'Pieces'],
};

/** Fill in names: the app's, then REL_NAMES, then the defaults; read-back names that would collide name their field. */
export function nameSpecs(specs: RelSpec[], names: Record<string, [string, string]> = REL_NAMES): Required<RelSpec>[] {
  const pairs = new Map<string, number>();
  for (const s of specs) pairs.set(s.from + '>' + s.to, (pairs.get(s.from + '>' + s.to) ?? 0) + 1);
  return specs.map((s) => {
    const n = names[s.from + '.' + s.field];
    const back = pairs.get(s.from + '>' + s.to)! > 1 ? kindLabel(s.from) + ' · ' + outName(s.field).toLowerCase() : kindLabel(s.from);
    return { ...s, out: s.out ?? n?.[0] ?? outName(s.field), in: s.in ?? n?.[1] ?? back };
  });
}

/**
 * Link types from data on the global items+kinds model: every ref field of every kind, pointing at the kind most of
 * its values resolve to. A field none of whose values resolve is kept with `to: ''`, so it shows as unresolved.
 */
export function specsFromDB(db: DB): RelSpec[] {
  const seen = new Map<string, Map<string, number>>();
  for (const it of db.items) {
    for (const [f, v] of Object.entries(it.attrs)) {
      if (!isRef(f)) continue;
      const k = it.kind + '.' + f; let m = seen.get(k); if (!m) seen.set(k, (m = new Map()));
      for (const t of Array.isArray(v) ? v : [v]) {
        if (typeof t !== 'string' || !t) continue;
        const to = db.byId[t]?.kind ?? ''; m.set(to, (m.get(to) ?? 0) + 1);
      }
    }
  }
  const out: RelSpec[] = [];
  for (const [k, m] of seen) {
    if (!m.size) continue;
    const [from, field] = k.split('.');
    const best = [...m.entries()].filter(([to]) => to).sort((a, b) => b[1] - a[1])[0];
    out.push({ from, field, to: best ? best[0] : '' });
  }
  return out;
}

/** The rows of a DB, by kind, for `indexRelations`. */
export const sourcesFromDB = (db: DB): RelSource[] => {
  const by = new Map<string, unknown[]>();
  for (const it of db.items) { let r = by.get(it.kind); if (!r) by.set(it.kind, (r = [])); r.push({ id: it.id, ...it.attrs }); }
  return [...by.entries()].map(([kind, rows]) => ({ kind, rows }));
};

type Row = Record<string, unknown>;
type Bucket = { dir: 'out' | 'in'; kind: string; set: Set<string> };

/**
 * Index the links of `specs` over `sources`. A value counts when a row of kind `to` has that id; when no source of
 * kind `to` is given the value is taken on trust (the app links to records it keeps elsewhere).
 */
export function indexRelations(sources: RelSource[], specs: RelSpec[], names?: Record<string, [string, string]>): RelationIndex {
  const rows = new Map<string, Row[]>(), ids = new Map<string, Set<string>>();
  for (const s of sources) {
    const rs = (s.rows as Row[]).filter((r) => r && typeof r.id === 'string');
    rows.set(s.kind, [...(rows.get(s.kind) ?? []), ...rs]);
    const set = ids.get(s.kind) ?? new Set<string>(); rs.forEach((r) => set.add(r.id as string)); ids.set(s.kind, set);
  }
  const ix = new Map<string, Map<string, Bucket>>();
  const deg = new Map<string, { out: number; in: number }>();
  const pairs = new Map<string, { from: Ref; to: Ref }[]>();
  const add = (a: string, rel: string, dir: 'out' | 'in', kind: string, b: string) => {
    let m = ix.get(a); if (!m) ix.set(a, (m = new Map()));
    let g = m.get(rel); if (!g) m.set(rel, (g = { dir, kind, set: new Set() }));
    if (a !== b && !g.set.has(b)) { g.set.add(b); const d = deg.get(a) ?? { out: 0, in: 0 }; d[dir]++; deg.set(a, d); }
  };
  const schema: SchemaRow[] = [], unresolved: Unresolved[] = [];
  let links = 0;
  for (const sp of nameSpecs(specs, names)) {
    const known = sp.to ? ids.get(sp.to) : new Set<string>();
    const row: SchemaRow = { id: specId(sp), from: sp.from, field: sp.field, to: sp.to, out: sp.out, in: sp.in, links: 0, unresolved: 0 };
    const ps: { from: Ref; to: Ref }[] = [];
    for (const r of rows.get(sp.from) ?? []) {
      const v = r[sp.field];
      for (const t of Array.isArray(v) ? v : [v]) {
        if (typeof t !== 'string' || t === '') continue;
        const from: Ref = { kind: sp.from, id: r.id as string };
        if (known && !known.has(t)) { row.unresolved++; unresolved.push({ from, field: sp.field, value: t, to: sp.to }); continue; }
        const to: Ref = { kind: sp.to, id: t };
        const a = refKey(from), b = refKey(to);
        if (a === b) continue;
        add(a, sp.out, 'out', sp.to, b); add(b, sp.in, 'in', sp.from, a);
        row.links++; links++; ps.push({ from, to });
      }
    }
    pairs.set(row.id, ps); schema.push(row);
  }
  const relationsOf = (r: Ref): RelGroup[] => {
    const m = ix.get(refKey(r)); if (!m) return [];
    return [...m.entries()].map(([rel, g]) => ({ rel, dir: g.dir, kind: g.kind, refs: [...g.set].map(parseKey) }))
      .filter((g) => g.refs.length)
      .sort((a, b) => a.refs.length - b.refs.length || a.rel.localeCompare(b.rel));
  };
  const degreeOf = (r: Ref) => { const d = deg.get(refKey(r)); return d ? d.out + d.in : 0; };
  let rankedCache: Ranked[] | null = null;
  const ranked = () => rankedCache ?? (rankedCache = [...deg.entries()].map(([k, d]) => ({ ref: parseKey(k), out: d.out, in: d.in, total: d.out + d.in })).sort((a, b) => b.total - a.total || a.ref.id.localeCompare(b.ref.id)));
  return { schema, unresolved, links, relationsOf, degreeOf, ranked, linksOf: (id) => pairs.get(id) ?? [] };
}

/** The index for a DB on the items+kinds model, link types derived from its own fields. */
export const relationsOfDB = (db: DB, names?: Record<string, [string, string]>) => indexRelations(sourcesFromDB(db), specsFromDB(db), names);
