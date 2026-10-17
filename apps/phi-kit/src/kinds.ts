/**
 * Items + kinds, the one data model behind every Phiace app (the prototype's model; Phidata browses it, Phiegg's
 * relations index reads it, Phiora serves it).
 *
 *   Item  { id, kind, name, attrs }   one record of any kind (person, club, world, host, cast, look, sale…)
 *   Edge  { from, field, to }         every *Id / *Ids field that resolves to another item
 *   Kind  { id, label, count, fields } a summary per kind
 *
 * Ids are global: one id names one item across every app, so a link written in one app resolves in all of them.
 * Point a loader at Phiora (GET /tree) instead of the bundled JSON and nothing else changes, the shapes match.
 */
export type Item = { id: string; kind: string; name: string; attrs: Record<string, unknown> };
export type Edge = { from: string; field: string; to: string };
export type Kind = { id: string; label: string; count: number; fields: string[] };
export type DB = { items: Item[]; byId: Record<string, Item>; kinds: Kind[]; edges: Edge[] };
/** Rows of one kind, from wherever they live. */
export type Source = { kind: string; rows: unknown[] };

/** A plain plural: city → cities, series → series, look → looks. */
export const plural = (w: string) => /person$/i.test(w) ? w.slice(0, -6) + (w.slice(-6, -5) === 'P' ? 'People' : 'people') : /(s|x|ch|sh)$/i.test(w) ? (/series$/i.test(w) ? w : w + 'es') : /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + 'ies' : w + 's';
/** worldCard → World cards, city → Cities. */
export const kindLabel = (kind: string) => { const w = kind.replace(/([A-Z])/g, ' $1').toLowerCase(); return plural(w[0].toUpperCase() + w.slice(1)); };
const clip = (v: unknown) => (typeof v === 'string' && v ? (v.length > 60 ? v.slice(0, 59) + '…' : v) : undefined);
/** A record's name: its name, title, label or handle, else its media title or caption, else its id. */
export const nameOf = (x: Record<string, unknown>) => String(x.name ?? x.title ?? x.label ?? x.handle ?? x.symbol ?? clip((x.media as { title?: unknown } | undefined)?.title) ?? clip(x.caption) ?? x.id);
export const isRef = (field: string) => /Id$|Ids$/.test(field) && field !== 'tokenId';

/** Flatten sources into items (first id wins), edges (refs that resolve) and kind summaries. */
export function buildDB(sources: Source[]): DB {
  const items: Item[] = [], byId: Record<string, Item> = {};
  for (const { kind, rows } of sources) {
    for (const row of rows as Record<string, unknown>[]) {
      if (!row || typeof row.id !== 'string' || byId[row.id]) continue;
      const { id, ...attrs } = row as { id: string } & Record<string, unknown>;
      const it: Item = { id, kind, name: nameOf(row), attrs };
      items.push(it); byId[id] = it;
    }
  }
  const edges: Edge[] = [];
  for (const it of items) {
    for (const [f, v] of Object.entries(it.attrs)) {
      if (!isRef(f)) continue;
      for (const to of Array.isArray(v) ? v : [v]) if (typeof to === 'string' && byId[to] && to !== it.id) edges.push({ from: it.id, field: f, to });
    }
  }
  const kmap: Record<string, Kind> = {};
  for (const it of items) {
    const k = kmap[it.kind] || (kmap[it.kind] = { id: it.kind, label: kindLabel(it.kind), count: 0, fields: [] });
    k.count++;
    const fs = new Set(k.fields); Object.keys(it.attrs).forEach((f) => fs.add(f)); k.fields = [...fs];
  }
  return { items, byId, kinds: Object.values(kmap).sort((a, b) => b.count - a.count), edges };
}

export const outgoing = (db: DB, id: string) => db.edges.filter((e) => e.from === id);
export const incoming = (db: DB, id: string) => db.edges.filter((e) => e.to === id);
