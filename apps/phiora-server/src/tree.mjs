// The items tree: every record of every kind, once, in Phiora's one database, seeded from the data files by their
// manifest (tree.json in the data folder), plus Phiora's own live records (designer themes). Clients build the
// items+kinds model and the relations index from it with phi-kit (kinds.ts, relations.ts) — Phiora is the source,
// every product system reads it from here.
//   GET /tree           → { at, loadedAt, live, sources: [{ kind, rows, live? }] }
//   GET /tree?kind=a,b  → only those kinds
//   GET /tree/info      → { items, kinds: [{ kind, count }], loadedAt }
// Manifest entries: { kind, file, list } an array in the file; + { each, parent } an array inside every row, with
// the row's id written to `parent`; { one } a single object; { map, prefix, set } an object keyed by name, a row per
// entry (id prefix + name, `set` props added); { omit: [fields] } fields left out of every row.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { appSources, appStamp } from './apps.mjs';

/** Rows of one manifest entry from the parsed files. */
export function rowsOf(src, files) {
  const f = files[src.file] ?? {};
  let rows;
  // { map: true } reads a file that is one object keyed by name (kinds.json): a row per entry, id = prefix + name.
  if (src.map) rows = Object.entries(f).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v)).map(([name, v]) => ({ id: (src.prefix ?? '') + name, name, ...v, ...(src.set ?? {}) }));
  else if (src.one) rows = f[src.one] && typeof f[src.one] === 'object' ? [f[src.one]] : [];
  else {
    const list = Array.isArray(f[src.list]) ? f[src.list] : [];
    rows = !src.each ? list : list.flatMap((r) => (Array.isArray(r?.[src.each]) ? r[src.each].map((c) => ({ ...c, [src.parent || 'parentId']: r.id })) : []));
  }
  if (src.omit?.length) rows = rows.map((r) => { const o = { ...r }; for (const k of src.omit) delete o[k]; return o; });
  return rows;
}

const manifestOf = (dir) => { const man = join(dir, 'tree.json'); return existsSync(man) ? JSON.parse(readFileSync(man, 'utf8')) : null; };

/** A fingerprint of the manifest and its files (sizes and change times), to know when a seed would bring anything new. */
export function stampOf(dir) {
  const man = manifestOf(dir); if (!man) return null;
  const files = ['tree', ...new Set(man.sources.map((s) => s.file))];
  return files.map((f) => { const p = join(dir, f + '.json'); if (!existsSync(p)) return f + ':-'; const s = statSync(p); return f + ':' + s.size + ':' + Math.round(s.mtimeMs); }).join('|');
}

/** Read the data files by their manifest into { kind, rows } sources. */
export function loadFiles(dir) {
  const man = manifestOf(dir); if (!man) return [];
  const names = [...new Set(man.sources.map((s) => s.file))];
  const files = Object.fromEntries(names.map((f) => { const p = join(dir, f + '.json'); return [f, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}]; }));
  return man.sources.map((s) => ({ kind: s.kind, rows: rowsOf(s, files), keepIds: !!s.keepIds }));
}

/**
 * Seed the database from the data files: skipped when the files are unchanged (`force` loads anyway; `onlyMissing`
 * loads only when the database has nothing yet — production). Records created, edited or deleted through the API
 * are kept either way. Returns { loaded, items, kinds, skipped?, kept? } (or { missing: true } with no manifest).
 */
export async function seedItems(store, dir, { force = false, onlyMissing = false, appsDir = null } = {}) {
  const fileStamp = stampOf(dir);
  // The apps' menus and pages seed alongside (apps.mjs); a changed app file reseeds like a changed data file.
  const apps = appsDir ? appStamp(appsDir) : '';
  if (!fileStamp && !apps) return { loaded: false, missing: true };
  const stamp = [fileStamp, apps].filter(Boolean).join('|');
  const info = await store.itemInfo();
  const hasApps = !apps || !!info?.kinds?.some((k) => k.kind === 'app' && k.count > 0);
  if (!force && ((await store.itemStamp()) === stamp || (onlyMissing && info && hasApps))) return { loaded: false, ...info };
  const { sources, idmap } = normalizeSources([...enrichSources(loadFiles(dir)), ...(appsDir ? appSources(appsDir) : [])]);
  const r = await store.putItems(sources, stamp);
  await store.saveGlobal('items.idmap', idmap);
  return { loaded: true, ...r };
}

/* ---------------------------------------------------------------- enrich: the PFT ontology as props */

/**
 * Relations are props and nothing else, so missing directions are written in as props before normalization:
 * every PFT names the pool it sells and quests through (egg/sum/profilePft.poolId, inverted from the pool's
 * eggIds/sumIds/profileIds; looks carry poolId already), and a club names the pool that funds it (club.poolId,
 * from pool.clubId). In the ontology, nests are the collections a club breaks out of and pools are the pools of
 * quests — the ways of making the next hatch; nest membership (club.nestId, PFT.nestId) is not derivable from
 * today's files (nests link hosts, worlds and cities) and waits on authored data. Coins are ordinary items of
 * kind coin. Runs on original ids; the reference remap then follows.
 */
export function enrichSources(sources) {
  const byKind = Object.fromEntries(sources.map((s) => [s.kind, s.rows ?? []]));
  const index = (kind) => new Map((byKind[kind] ?? []).map((r) => [r.id, r]));
  const clubs = index('club'), eggs = index('egg'), sums = index('sum'), profiles = index('profilePft');
  for (const pool of byKind.pool ?? []) {
    if (pool.clubId) { const c = clubs.get(pool.clubId); if (c && !c.poolId) c.poolId = pool.id; }
    for (const [ids, map] of [[pool.eggIds, eggs], [pool.sumIds, sums], [pool.profileIds, profiles]])
      for (const id of ids ?? []) { const it = map.get(id); if (it && !it.poolId) it.poolId = pool.id; }
  }
  return sources;
}

/* ---------------------------------------------------------------- normalize: md5 ids and slugs */

export const md5 = (s) => createHash('md5').update(String(s)).digest('hex');
/** The full name with underscores: "Maison Opal" → maison_opal. */
export const slugify = (name) => String(name).trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const nameOf = (r) => { const n = r.name ?? r.title ?? r.label ?? r.handle ?? r.symbol; return typeof n === 'string' && n.trim() ? n : null; };
/** Fields that point at other records: anything ending Id / Ids, plus these. */
const REF_EXTRA = new Set(['createdBy', 'inputs']);
const isRefField = (k) => /(Id|Ids)$/.test(k) || REF_EXTRA.has(k);

/** Remap every ref value through the id map, deeply (members[].userId, chat[].userId, …); unknown values stay. */
function remapRefs(v, idmap, key = '') {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' && isRefField(key) ? (idmap[x] ?? x) : remapRefs(x, idmap, key)));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' && isRefField(k) ? (idmap[x] ?? x) : remapRefs(x, idmap, k)]));
  return v;
}

/**
 * Every record gets an md5 id (stable: md5 of kind:originalId, so reseeds agree) and a `slug` (the full name with
 * underscores; nameless records get kind_<id start>); every reference follows. Returns the sources and the id map.
 */
export function normalizeSources(sources) {
  const idmap = {};
  for (const { kind, rows, keepIds } of sources) { if (keepIds) continue; for (const r of rows ?? []) if (r && typeof r.id === 'string' && r.id) idmap[r.id] ??= md5(kind + ':' + r.id); }
  const out = sources.map(({ kind, rows, keepIds }) => ({
    kind,
    rows: (rows ?? []).map((r) => {
      if (!r || typeof r.id !== 'string' || !r.id) return r;
      if (keepIds) return { ...remapRefs(r, idmap) }; // code-level ids (metrics) stay; their references still follow
      const id = idmap[r.id];
      const { id: _old, slug, ...rest } = r;
      const name = nameOf(r);
      return { id, slug: slug ?? (name ? slugify(name) : kind + '_' + id.slice(0, 8)), ...remapRefs(rest, idmap) };
    }),
  }));
  return { sources: out, idmap };
}

/** Designer themes as items: one per themed look, linking the look and the designer. */
export function themeRows(all, catalog, idmap = {}) {
  return Object.entries(all ?? {}).map(([lookId, t]) => {
    const name = (catalog?.looks?.get(lookId)?.name ?? lookId) + ' theme';
    return { id: 'theme:' + (idmap[lookId] ?? lookId), slug: slugify(name), name, lookId: idmap[lookId] ?? lookId, byId: idmap[t.by] ?? t.by,
      kinds: (t.kinds ?? []).join(', '), mood: t.mood ?? null, story: t.story ?? null, setAt: new Date(t.at).toISOString() };
  });
}

/** The tree: the stored sources, then the live ones; `kinds` keeps only those kinds. */
export function treeOf(stored, live, kinds) {
  const all = [...stored.sources, ...live.map((s) => ({ ...s, live: true }))];
  const sources = kinds?.length ? all.filter((s) => kinds.includes(s.kind)) : all;
  return { at: new Date().toISOString(), loadedAt: stored.loadedAt ? new Date(stored.loadedAt).toISOString() : null, live: live.map((s) => s.kind), sources };
}
