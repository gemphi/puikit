// A page of one kind's records, for the pulls the apps show (a menu's top five pools, a home grid of quests):
//   GET /tree/rows?kind=pool&n=8&sort=supply&dir=desc&where=status:live,category:art&join=worldId
// → { kind, total, rows }. `where` keeps rows whose field equals the value (as text); `sort` orders by a field
// (numbers compare as numbers, "$4.2M" and "76/100" by their leading number); `join` adds, for each named reference
// field, the record it points at as { id, name, image } under the field's name without Id (worldId → world).
const num = (v) => { if (typeof v === 'number') return v; const m = String(v ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); if (!m) return NaN; const x = Number(m[0]); const u = String(v).match(/\d\s*([kKmMbB])\b/)?.[1]?.toLowerCase(); return x * (u === 'k' ? 1e3 : u === 'm' ? 1e6 : u === 'b' ? 1e9 : 1); };
const cmp = (a, b) => { const na = num(a), nb = num(b); return !Number.isNaN(na) && !Number.isNaN(nb) ? na - nb : String(a ?? '').localeCompare(String(b ?? '')); };
/** The kind a reference field points at: worldId → world, sponsorClubId → club. */
export const refKind = (field) => { const m = field.match(/([A-Z]?[a-z]+)Id$/); return m ? m[1].toLowerCase() : null; };

export async function rowsOf(store, params) {
  const kind = params.get('kind'); if (!kind) return null;
  const n = Math.min(500, Math.max(1, Number(params.get('n')) || 8));
  const where = (params.get('where') || '').split(',').map((x) => x.split(':')).filter((x) => x.length === 2 && x[0]);
  const joins = (params.get('join') || '').split(',').map((x) => x.trim()).filter((f) => refKind(f));
  const kinds = [kind, ...new Set(joins.map(refKind))];
  const got = await store.itemsOf(kinds);
  let rows = (got[kind] ?? []).filter((r) => where.every(([f, v]) => String(r[f] ?? '') === v));
  const total = rows.length;
  const sort = params.get('sort');
  if (sort) { const dir = params.get('dir') === 'asc' ? 1 : -1; rows = [...rows].sort((a, b) => dir * cmp(a[sort], b[sort])); }
  rows = rows.slice(0, n);
  if (joins.length) {
    const index = new Map(); for (const k of new Set(joins.map(refKind))) for (const r of got[k] ?? []) index.set(k + ':' + r.id, r);
    rows = rows.map((r) => { const o = { ...r }; for (const f of joins) { const t = index.get(refKind(f) + ':' + r[f]); if (t) o[f.replace(/Id$/, '')] = { id: t.id, name: t.name ?? t.title, image: t.image ?? null }; } return o; });
  }
  return { kind, total, rows };
}
