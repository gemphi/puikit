/**
 * The id rules of Phiora's one database, for the client side: every record's id is md5 of `kind:originalId`
 * (`treeId`), every record has a `slug` (the full name with underscores), and every reference field follows.
 * Exactly what the server's seed does (apps/phiora-server/src/tree.mjs), so an app that normalizes its bundled
 * data with these functions speaks the database's ids without fetching anything.
 */
import { md5 } from './md5';

export type IdMap = Record<string, string>;

/** The database id of a record seeded from the files: md5 of `kind:originalId`. */
export const treeId = (kind: string, originalId: string) => md5(kind + ':' + originalId);

/** The full name with underscores: "Maison Opal" → maison_opal. */
export const slugify = (name: string) => String(name).trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const REF_EXTRA = new Set(['createdBy', 'inputs']);
export const isRefField = (k: string) => /(Id|Ids)$/.test(k) || REF_EXTRA.has(k);
const nameOf = (r: Record<string, unknown>) => { const n = r.name ?? r.title ?? r.label ?? r.handle ?? r.symbol; return typeof n === 'string' && n.trim() ? n : null; };

/** One manifest entry of tree.json, and its rows from the parsed files (the server's rowsOf, for the client). */
export type TreeEntry = { kind: string; file: string; list?: string; each?: string; parent?: string; one?: string; map?: boolean; prefix?: string; set?: Record<string, unknown>; omit?: string[]; keepIds?: boolean };
export function rowsOf(e: TreeEntry, files: Record<string, any>): Record<string, unknown>[] {
  const f = files[e.file] ?? {};
  if (e.map) return Object.entries(f).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v)).map(([name, v]) => ({ id: (e.prefix ?? '') + name, name, ...(v as object), ...(e.set ?? {}) }));
  if (e.one) return f[e.one] && typeof f[e.one] === 'object' ? [f[e.one]] : [];
  const list: any[] = Array.isArray(f[e.list ?? '']) ? f[e.list ?? ''] : [];
  if (!e.each) return list;
  return list.flatMap((r) => (Array.isArray(r?.[e.each!]) ? r[e.each!] : []));
}

/** originalId → md5 id for every manifest row. */
export function buildIdMap(entries: TreeEntry[], files: Record<string, any>): IdMap {
  const map: IdMap = {};
  for (const e of entries) { if (e.keepIds) continue; for (const r of rowsOf(e, files)) { const id = (r as { id?: unknown }).id; if (typeof id === 'string' && id && !map[id]) map[id] = treeId(e.kind, id); } }
  return map;
}

/** md5 id → originalId, for the seams still keyed by the old names (thread shards, role indexes, file names). */
export const reverseOf = (map: IdMap): IdMap => Object.fromEntries(Object.entries(map).map(([a, b]) => [b, a]));

/**
 * Rewrite a value tree in place: a mapped `id` becomes its md5 (and the record gets its slug), every reference
 * field — nested ones included — follows the map, everything else stays.
 */
export function remapDeep(v: unknown, map: IdMap, seen = new Set<object>()): void {
  if (!v || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  if (Array.isArray(v)) { for (const x of v) remapDeep(x, map, seen); return; }
  const o = v as Record<string, unknown>;
  if (typeof o.id === 'string' && map[o.id]) {
    const name = nameOf(o);
    if (o.slug === undefined) o.slug = name ? slugify(name) : undefined;
    o.id = map[o.id];
  }
  for (const [k, x] of Object.entries(o)) {
    if (isRefField(k)) {
      if (typeof x === 'string' && map[x]) o[k] = map[x];
      else if (Array.isArray(x)) o[k] = x.map((y) => (typeof y === 'string' && map[y] ? map[y] : (remapDeep(y, map, seen), y)));
      else remapDeep(x, map, seen);
    } else remapDeep(x, map, seen);
  }
}

/** A table keyed by ids ({ [oldId]: value }) rekeyed to md5 ids; unknown keys stay. */
export const mapKeys = <T,>(table: Record<string, T>, map: IdMap): Record<string, T> =>
  Object.fromEntries(Object.entries(table).map(([k, val]) => [map[k] ?? k, val]));
