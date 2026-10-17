// Storage for Phiora. One interface, three backends:
//  - postgres (production: PHI_STORE=postgres, or DATABASE_URL / PHI_PG_URL set): the single shared database (pgstore.mjs).
//  - sqlite   (default locally, Node ≥ 22.5): one file `phiora.db`, WAL, transactions where it matters.
//  - json     (fallback, or PHI_STORE=json): one JSON document per user + small index files, atomic tmp-file writes.
// The postgres backend is async, so the server awaits every store call; the local backends stay synchronous.
// A user is stored as one JSON document either way (docs, wallet, history, owned, account fields), so the server
// code is the same on both. Starting on sqlite with an existing JSON data dir imports it once.
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';

import { postgresStore } from './pgstore.mjs';

export const sha = (s) => createHash('sha256').update(String(s)).digest('hex');
const loadSqlite = () => { try { return process.getBuiltinModule?.('node:sqlite') ?? null; } catch { return null; } };

/**
 * Items: every record of every kind, once, in the one database. The data files seed them (`putItems` replaces the
 * rows that came from files and were never edited); the API creates, edits and deletes single records (`saveItem`,
 * `removeItem`), each change written to the change log. A file record that is deleted stays as a tombstone so the
 * next seed does not bring it back. Rows need a string id; the first row with an id in its kind wins.
 */
export const cleanSources = (sources) => {
  const kinds = [], seen = new Map(); let skipped = 0; const rows = [];
  for (const { kind, rows: rs } of sources) {
    if (!seen.has(kind)) { seen.set(kind, new Set()); kinds.push(kind); }
    const ids = seen.get(kind);
    for (const r of rs ?? []) { if (!r || typeof r.id !== 'string' || !r.id || ids.has(r.id)) { skipped++; continue; } ids.add(r.id); rows.push([kind, r]); }
  }
  return { kinds, rows, skipped };
};
export const groupRows = (kinds, rows) => { const by = new Map(kinds.map((k) => [k, []])); for (const [k, r] of rows) (by.get(k) ?? by.set(k, []).get(k)).push(r); return [...by.entries()].map(([kind, rs]) => ({ kind, rows: rs })); };
/** Kind counts in the stored kind order, new kinds last. */
export const countKinds = (order, entries) => {
  const n = new Map(order.map((k) => [k, 0]));
  for (const e of entries) n.set(e.kind, (n.get(e.kind) ?? 0) + 1);
  return [...n.entries()].map(([kind, count]) => ({ kind, count }));
};
export const MAX_CHANGES = 5000;

/** kind: 'postgres' | 'sqlite' | 'json' | undefined (auto: postgres when pgUrl is set, else sqlite when available). */
export function createStore(dir, kind, pgUrl) {
  return withItemsOf(openStore(dir, kind, pgUrl));
}
function openStore(dir, kind, pgUrl) {
  if (kind === 'postgres' || (pgUrl && !kind)) {
    if (!pgUrl) throw new Error('PHI_STORE=postgres needs DATABASE_URL (or PHI_PG_URL).');
    return postgresStore(pgUrl);
  }
  mkdirSync(dir, { recursive: true });
  const sqlite = kind === 'json' ? null : loadSqlite();
  if (kind === 'sqlite' && !sqlite) throw new Error('PHI_STORE=sqlite needs Node ≥ 22.5 (node:sqlite).');
  return sqlite ? sqliteStore(dir, sqlite) : jsonStore(dir);
}
/** `itemsOf(kinds)` → { kind: rows } for a few kinds; postgres answers it with one query, the local stores filter. */
function withItemsOf(store) {
  if (!store.itemsOf) store.itemsOf = async (kinds) => {
    const all = (await store.itemSources())?.sources ?? [];
    return Object.fromEntries(kinds.map((k) => [k, all.find((s) => s.kind === k)?.rows ?? []]));
  };
  return store;
}

/* ------------------------------------------------------------------ JSON files */
function jsonStore(dir) {
  mkdirSync(join(dir, 'users'), { recursive: true });
  const usersDir = join(dir, 'users');
  const read = (f, d) => (existsSync(join(dir, f)) ? JSON.parse(readFileSync(join(dir, f), 'utf8')) : d);
  const atomic = (file, value) => { const tmp = file + '.' + randomBytes(4).toString('hex') + '.tmp'; writeFileSync(tmp, JSON.stringify(value)); renameSync(tmp, file); };
  const save = (f, v) => atomic(join(dir, f), v);
  const userFile = (id) => join(usersDir, id.replace(/[^\w.-]/g, '_') + '.json');
  const cache = new Map();
  const sessions = read('sessions.json', {}); const handles = read('handles.json', {}); const emails = read('emails.json', {}); const tokens = read('tokens.json', {});
  const sweep = () => { const now = Date.now(); for (const [k, t] of Object.entries(tokens)) if (t.expires < now) delete tokens[k]; };

  const user = (id) => {
    if (cache.has(id)) return cache.get(id);
    const f = userFile(id); const u = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
    if (u) cache.set(id, u); return u;
  };
  const saveUser = (u) => { cache.set(u.id, u); atomic(userFile(u.id), u); return u; };
  // Shared documents that belong to no one user (item themes from designers, …).
  mkdirSync(join(dir, 'globals'), { recursive: true });
  const globalFile = (name) => join(dir, 'globals', name.replace(/[^\w.-]/g, '_') + '.json');
  const globals = new Map();
  const global = (name) => { if (globals.has(name)) return globals.get(name); const f = globalFile(name); const v = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : undefined; globals.set(name, v); return v; };
  const saveGlobal = (name, v) => { globals.set(name, v); atomic(globalFile(name), v); return v; };
  // Items: one document ({ order, entries }), its meta and the change log, all globals.
  const entriesOf = () => global('items') ?? { order: [], entries: [] };
  const liveOf = (es) => es.filter((e) => !e.deleted);
  const writeSet = (d, extra = {}) => {
    saveGlobal('items', d);
    const info = { ...(global('items.meta') ?? {}), ...extra, items: liveOf(d.entries).length, kinds: countKinds(d.order, liveOf(d.entries)) };
    saveGlobal('items.meta', info);
    return info;
  };
  const logChange = (c) => saveGlobal('items.changes', [{ seq: (global('items.changes')?.[0]?.seq ?? 0) + 1, ...c }, ...(global('items.changes') ?? [])].slice(0, MAX_CHANGES));
  const items = {
    putItems: (sources, stamp) => {
      const c = cleanSources(sources); const old = entriesOf();
      const kept = old.entries.filter((e) => e.origin !== 'file' || e.edited);
      const keys = new Set(kept.map((e) => e.kind + ' ' + e.id));
      const fresh = c.rows.filter(([k, r]) => !keys.has(k + ' ' + r.id)).map(([kind, doc]) => ({ kind, id: doc.id, doc, origin: 'file', edited: false, deleted: false }));
      const order = [...c.kinds, ...old.order.filter((k) => !c.kinds.includes(k))];
      const info = writeSet({ order, entries: [...fresh, ...kept] }, { stamp, loadedAt: Date.now() });
      return { items: info.items, kinds: info.kinds, skipped: c.skipped, kept: kept.length };
    },
    itemSources: () => { if (!global('items.meta')) return null; const d = entriesOf(); return { sources: groupRows(d.order, liveOf(d.entries).map((e) => [e.kind, e.doc])), loadedAt: global('items.meta')?.loadedAt ?? null }; },
    itemStamp: () => global('items.meta')?.stamp ?? null,
    itemInfo: () => global('items.meta') ?? null,
    getItem: (kind, id) => { const e = entriesOf().entries.find((x) => x.kind === kind && x.id === id && !x.deleted); return e ? { doc: e.doc, origin: e.origin, edited: !!e.edited, owner: e.owner ?? null, updatedAt: e.updatedAt ?? null, updatedBy: e.updatedBy ?? null } : null; },
    saveItem: (kind, id, doc, m, change) => {
      const d = entriesOf(); const i = d.entries.findIndex((x) => x.kind === kind && x.id === id);
      const prev = i >= 0 ? d.entries[i] : null;
      const e = { kind, id, doc, origin: prev?.origin ?? m.origin ?? 'api', edited: prev ? true : m.origin !== 'file', deleted: false, owner: prev?.owner ?? m.owner ?? null, updatedAt: Date.now(), updatedBy: m.by ?? null };
      if (i >= 0) d.entries[i] = e; else d.entries.push(e);
      if (!d.order.includes(kind)) d.order.push(kind);
      writeSet(d); logChange({ kind, id, at: e.updatedAt, ...change });
    },
    removeItem: (kind, id, m, change) => {
      const d = entriesOf(); const i = d.entries.findIndex((x) => x.kind === kind && x.id === id); if (i < 0) return;
      if (d.entries[i].origin === 'file') d.entries[i] = { ...d.entries[i], deleted: true, edited: true, updatedAt: Date.now(), updatedBy: m.by ?? null };
      else d.entries.splice(i, 1);
      writeSet(d); logChange({ kind, id, at: Date.now(), ...change });
    },
    itemChanges: ({ kind, id, n = 50 } = {}) => (global('items.changes') ?? []).filter((c) => (!kind || c.kind === kind) && (!id || c.id === id)).slice(0, n),
  };
  return {
    kind: 'json',
    global, saveGlobal, ...items,
    user, saveUser,
    createUser: (fields) => saveUser({ docs: {}, createdAt: Date.now(), ...fields }),
    session: (sid) => sessions[sid],
    newSession: (userId, ua = '') => { const sid = randomBytes(24).toString('base64url'); const now = Date.now(); sessions[sid] = { userId, at: now, created: now, ua: ua.slice(0, 200) }; save('sessions.json', sessions); return sid; },
    setSessionUser: (sid, userId, ua) => { const now = Date.now(); sessions[sid] = { userId, at: now, created: now, ua: (ua ?? sessions[sid]?.ua ?? '').slice(0, 200) }; save('sessions.json', sessions); },
    touchSession: (sid, ua) => { const x = sessions[sid]; if (x) { x.at = Date.now(); if (ua) x.ua = ua.slice(0, 200); save('sessions.json', sessions); } },
    userSessions: (userId) => Object.entries(sessions).filter(([, x]) => x.userId === userId).map(([sid, x]) => ({ sid, at: x.at, created: x.created ?? x.at, ua: x.ua ?? '' })),
    sweepSessions: (idleBefore) => { let n = 0; for (const [sid, x] of Object.entries(sessions)) if (x.at < idleBefore) { delete sessions[sid]; n++; } if (n) save('sessions.json', sessions); return n; },
    deleteUser: (id) => {
      cache.delete(id); try { renameSync(userFile(id), userFile(id) + '.deleted-' + Date.now()); } catch { /* already gone */ }
      for (const [h, uid] of Object.entries(handles)) if (uid === id) delete handles[h];
      for (const [e, uid] of Object.entries(emails)) if (uid === id) delete emails[e];
      for (const [k, t] of Object.entries(tokens)) if (t.userId === id) delete tokens[k];
      for (const [sid, x] of Object.entries(sessions)) if (x.userId === id) delete sessions[sid];
      save('handles.json', handles); save('emails.json', emails); save('tokens.json', tokens); save('sessions.json', sessions);
    },
    dropSession: (sid) => { delete sessions[sid]; save('sessions.json', sessions); },
    dropUserSessions: (userId, keep) => { for (const [sid, s] of Object.entries(sessions)) if (s.userId === userId && sid !== keep) delete sessions[sid]; save('sessions.json', sessions); },
    handleOwner: (handle) => handles[handle],
    claimHandle: (handle, userId) => { handles[handle] = userId; save('handles.json', handles); },
    emailOwner: (email) => emails[email],
    claimEmail: (email, userId) => { for (const [e, id] of Object.entries(emails)) if (id === userId) delete emails[e]; if (email) emails[email] = userId; save('emails.json', emails); },
    /** One-time tokens (verify, reset): stored hashed, expire on their own. */
    putToken: (kindName, token, userId, data, ttlMs) => { sweep(); tokens[kindName + ':' + sha(token)] = { userId, data: data ?? null, expires: Date.now() + ttlMs }; save('tokens.json', tokens); },
    takeToken: (kindName, token) => { sweep(); const k = kindName + ':' + sha(token); const t = tokens[k]; if (!t) return null; delete tokens[k]; save('tokens.json', tokens); return t; },
    dropTokens: (kindName, userId) => { for (const [k, t] of Object.entries(tokens)) if (k.startsWith(kindName + ':') && t.userId === userId) delete tokens[k]; save('tokens.json', tokens); },
    close: () => {},
  };
}

/* ------------------------------------------------------------------ SQLite */
function sqliteStore(dir, { DatabaseSync }) {
  const file = join(dir, 'phiora.db'); const fresh = !existsSync(file);
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, user_id TEXT NOT NULL, at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS handles (handle TEXT PRIMARY KEY, user_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS emails (email TEXT PRIMARY KEY, user_id TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS emails_user ON emails(user_id);
    CREATE TABLE IF NOT EXISTS tokens (key TEXT PRIMARY KEY, kind TEXT NOT NULL, user_id TEXT NOT NULL, data TEXT, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE IF NOT EXISTS globals (name TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at INTEGER NOT NULL);
  `);
  // One database: the old per-dataset items tables (rounds 40–41) are dropped and reseeded into the single set.
  const hasDataset = (t) => { try { return db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === 'dataset'); } catch { return false; } };
  const noSlug = (() => { try { const cols2 = db.prepare('PRAGMA table_info(items)').all(); return cols2.length > 0 && !cols2.some((c) => c.name === 'slug'); } catch { return false; } })();
  if (hasDataset('items') || hasDataset('item_changes') || noSlug) db.exec('DROP TABLE IF EXISTS items; DROP TABLE IF EXISTS item_changes; DROP TABLE IF EXISTS item_datasets; DROP TABLE IF EXISTS item_meta;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS item_meta (only INTEGER PRIMARY KEY CHECK (only = 1), kinds TEXT NOT NULL, items INTEGER NOT NULL, stamp TEXT, loaded_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS items (kind TEXT NOT NULL, id TEXT NOT NULL, slug TEXT, ord INTEGER NOT NULL, doc TEXT NOT NULL,
      origin TEXT NOT NULL DEFAULT 'file', edited INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0,
      owner TEXT, updated_at INTEGER, updated_by TEXT, PRIMARY KEY (kind, id));
    CREATE INDEX IF NOT EXISTS items_ord ON items(ord);
    CREATE TABLE IF NOT EXISTS item_changes (seq INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, id TEXT NOT NULL,
      action TEXT NOT NULL, fields TEXT, by_id TEXT, by_handle TEXT, at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS item_changes_item ON item_changes(kind, id, seq);
  `);
  // v2: sessions remember when they started and on which browser.
  const cols = db.prepare('PRAGMA table_info(sessions)').all().map((c) => c.name);
  if (!cols.includes('created')) db.exec('ALTER TABLE sessions ADD COLUMN created INTEGER');
  if (!cols.includes('ua')) db.exec("ALTER TABLE sessions ADD COLUMN ua TEXT NOT NULL DEFAULT ''");
  const q = {
    getUser: db.prepare('SELECT doc FROM users WHERE id = ?'),
    putUser: db.prepare('INSERT INTO users (id, doc, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET doc = excluded.doc, updated_at = excluded.updated_at'),
    getSession: db.prepare('SELECT user_id AS userId, at, created, ua FROM sessions WHERE sid = ?'),
    putSession: db.prepare('INSERT INTO sessions (sid, user_id, at, created, ua) VALUES (?, ?, ?, ?, ?) ON CONFLICT(sid) DO UPDATE SET user_id = excluded.user_id, at = excluded.at, created = excluded.created, ua = excluded.ua'),
    touchSession: db.prepare("UPDATE sessions SET at = ?, ua = CASE WHEN ? = '' THEN ua ELSE ? END WHERE sid = ?"),
    userSessions: db.prepare('SELECT sid, at, COALESCE(created, at) AS created, ua FROM sessions WHERE user_id = ? ORDER BY at DESC'),
    sweepSessions: db.prepare('DELETE FROM sessions WHERE at < ?'),
    sweepGuests: db.prepare("DELETE FROM users WHERE id LIKE 'guest\\_%' ESCAPE '\\' AND updated_at < ? AND id NOT IN (SELECT user_id FROM sessions)"),
    delUser: db.prepare('DELETE FROM users WHERE id = ?'),
    delUserHandles: db.prepare('DELETE FROM handles WHERE user_id = ?'),
    delAllUserTokens: db.prepare('DELETE FROM tokens WHERE user_id = ?'),
    delAllUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
    delSession: db.prepare('DELETE FROM sessions WHERE sid = ?'),
    delUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ? AND sid IS NOT ?'),
    getHandle: db.prepare('SELECT user_id AS id FROM handles WHERE handle = ?'),
    putHandle: db.prepare('INSERT INTO handles (handle, user_id) VALUES (?, ?) ON CONFLICT(handle) DO UPDATE SET user_id = excluded.user_id'),
    getEmail: db.prepare('SELECT user_id AS id FROM emails WHERE email = ?'),
    delUserEmails: db.prepare('DELETE FROM emails WHERE user_id = ?'),
    putEmail: db.prepare('INSERT INTO emails (email, user_id) VALUES (?, ?)'),
    putToken: db.prepare('INSERT INTO tokens (key, kind, user_id, data, expires) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, expires = excluded.expires'),
    getToken: db.prepare('SELECT user_id AS userId, data, expires FROM tokens WHERE key = ?'),
    delToken: db.prepare('DELETE FROM tokens WHERE key = ?'),
    delUserTokens: db.prepare('DELETE FROM tokens WHERE kind = ? AND user_id = ?'),
    sweep: db.prepare('DELETE FROM tokens WHERE expires < ?'),
  };
  const tx = (f) => { db.exec('BEGIN IMMEDIATE'); try { const r = f(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  const cache = new Map();

  const user = (id) => {
    if (cache.has(id)) return cache.get(id);
    const row = q.getUser.get(id); const u = row ? JSON.parse(row.doc) : null;
    if (u) cache.set(id, u); return u;
  };
  const saveUser = (u) => { cache.set(u.id, u); q.putUser.run(u.id, JSON.stringify(u), Date.now()); return u; };

  // One-time import of an existing JSON data dir (users/*.json, sessions.json, handles.json, emails.json).
  if (fresh && existsSync(join(dir, 'users'))) {
    const rd = (f, d) => (existsSync(join(dir, f)) ? JSON.parse(readFileSync(join(dir, f), 'utf8')) : d);
    tx(() => {
      let n = 0;
      for (const f of readdirSync(join(dir, 'users')).filter((x) => x.endsWith('.json'))) {
        const u = JSON.parse(readFileSync(join(dir, 'users', f), 'utf8')); if (u?.id) { q.putUser.run(u.id, JSON.stringify(u), Date.now()); n++; }
      }
      for (const [sid, s] of Object.entries(rd('sessions.json', {}))) q.putSession.run(sid, s.userId, s.at ?? Date.now(), s.created ?? s.at ?? Date.now(), s.ua ?? '');
      for (const [h, id] of Object.entries(rd('handles.json', {}))) q.putHandle.run(h, id);
      for (const [e, id] of Object.entries(rd('emails.json', {}))) q.putEmail.run(e, id);
      db.prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('imported_json', ?)").run(String(n));
    });
  }

  // Items in the single set. Reads are cached in memory until something changes.
  const iq = {
    delFile: db.prepare("DELETE FROM items WHERE origin = 'file' AND edited = 0"),
    putFile: db.prepare("INSERT INTO items (kind, id, slug, ord, doc, origin) VALUES (?, ?, ?, ?, ?, 'file') ON CONFLICT(kind, id) DO NOTHING"),
    kept: db.prepare("SELECT COUNT(*) AS n FROM items WHERE origin <> 'file' OR edited = 1"),
    all: db.prepare('SELECT kind, doc FROM items WHERE deleted = 0 ORDER BY ord'),
    counts: db.prepare('SELECT kind, COUNT(*) AS n FROM items WHERE deleted = 0 GROUP BY kind'),
    one: db.prepare('SELECT doc, origin, edited, owner, updated_at AS updatedAt, updated_by AS updatedBy FROM items WHERE kind = ? AND id = ? AND deleted = 0'),
    any: db.prepare('SELECT origin FROM items WHERE kind = ? AND id = ?'),
    maxOrd: db.prepare('SELECT COALESCE(MAX(ord), -1) + 1 AS n FROM items'),
    insert: db.prepare('INSERT INTO items (kind, id, slug, ord, doc, origin, edited, owner, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)'),
    update: db.prepare('UPDATE items SET doc = ?, slug = ?, edited = 1, deleted = 0, updated_at = ?, updated_by = ? WHERE kind = ? AND id = ?'),
    tomb: db.prepare('UPDATE items SET deleted = 1, edited = 1, updated_at = ?, updated_by = ? WHERE kind = ? AND id = ?'),
    drop: db.prepare('DELETE FROM items WHERE kind = ? AND id = ?'),
    log: db.prepare('INSERT INTO item_changes (kind, id, action, fields, by_id, by_handle, at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    changes: db.prepare(`SELECT seq, kind, id, action, fields, by_id AS byId, by_handle AS byHandle, at FROM item_changes
      WHERE (?1 IS NULL OR kind = ?1) AND (?2 IS NULL OR id = ?2) ORDER BY seq DESC LIMIT ?3`),
    putMeta: db.prepare('INSERT INTO item_meta (only, kinds, items, stamp, loaded_at) VALUES (1, ?, ?, ?, ?) ON CONFLICT(only) DO UPDATE SET kinds = excluded.kinds, items = excluded.items, stamp = excluded.stamp, loaded_at = excluded.loaded_at'),
    getMeta: db.prepare('SELECT kinds, items, stamp, loaded_at AS loadedAt FROM item_meta'),
  };
  const metaOf = (r) => (r ? { items: r.items, kinds: JSON.parse(r.kinds), stamp: r.stamp, loadedAt: r.loadedAt } : null);
  /** Kind counts in the stored kind order (new kinds last), written back to the meta row. */
  const saveMeta = (order, stamp = null, loadedAt = null) => {
    const n = new Map(order.map((k) => [k, 0])); for (const r of iq.counts.all()) n.set(r.kind, r.n);
    const kinds = [...n.entries()].map(([kind, count]) => ({ kind, count }));
    const total = kinds.reduce((a, k) => a + k.count, 0);
    const cur = iq.getMeta.get();
    iq.putMeta.run(JSON.stringify(kinds), total, stamp ?? cur?.stamp ?? null, loadedAt ?? cur?.loadedAt ?? Date.now());
    return { kinds, items: total };
  };
  const orderNow = () => (metaOf(iq.getMeta.get())?.kinds ?? []).map((k) => k.kind);
  let itemCache = null;
  const logChange = (kind, id, c) => iq.log.run(kind, id, c.action, c.fields ? JSON.stringify(c.fields) : null, c.byId ?? null, c.byHandle ?? null, Date.now());
  const items = {
    putItems: (sources, stamp) => {
      const c = cleanSources(sources); let out;
      tx(() => {
        const prev = orderNow();
        iq.delFile.run();
        const base = iq.maxOrd.get().n;
        c.rows.forEach(([k, r], i) => iq.putFile.run(k, r.id, r.slug ?? null, base + i, JSON.stringify(r)));
        const counts = saveMeta([...c.kinds, ...prev.filter((k) => !c.kinds.includes(k))], stamp ?? null, Date.now());
        out = { items: counts.items, kinds: counts.kinds, skipped: c.skipped, kept: iq.kept.get().n };
      });
      itemCache = null;
      return out;
    },
    itemSources: () => {
      if (itemCache) return itemCache;
      const m = metaOf(iq.getMeta.get()); if (!m) return null;
      return (itemCache = { sources: groupRows(m.kinds.map((k) => k.kind), iq.all.all().map((r) => [r.kind, JSON.parse(r.doc)])), loadedAt: m.loadedAt });
    },
    itemStamp: () => iq.getMeta.get()?.stamp ?? null,
    itemInfo: () => metaOf(iq.getMeta.get()),
    getItem: (kind, id) => { const r = iq.one.get(kind, id); return r ? { doc: JSON.parse(r.doc), origin: r.origin, edited: !!r.edited, owner: r.owner ?? null, updatedAt: r.updatedAt ?? null, updatedBy: r.updatedBy ?? null } : null; },
    saveItem: (kind, id, doc, m, change) => tx(() => {
      const now = Date.now();
      if (iq.any.get(kind, id)) iq.update.run(JSON.stringify(doc), doc.slug ?? null, now, m.by ?? null, kind, id);
      else iq.insert.run(kind, id, doc.slug ?? null, iq.maxOrd.get().n, JSON.stringify(doc), m.origin ?? 'api', m.owner ?? null, now, m.by ?? null);
      logChange(kind, id, change);
      const order = orderNow(); if (!order.includes(kind)) order.push(kind);
      saveMeta(order);
      itemCache = null;
    }),
    removeItem: (kind, id, m, change) => tx(() => {
      const r = iq.any.get(kind, id); if (!r) return;
      if (r.origin === 'file') iq.tomb.run(Date.now(), m.by ?? null, kind, id); else iq.drop.run(kind, id);
      logChange(kind, id, change);
      saveMeta(orderNow());
      itemCache = null;
    }),
    itemChanges: ({ kind, id, n = 50 } = {}) => iq.changes.all(kind ?? null, id ?? null, n).map((c) => ({ ...c, fields: c.fields ? JSON.parse(c.fields) : null })),
  };

  const getGlobal = db.prepare('SELECT doc FROM globals WHERE name = ?');
  const putGlobal = db.prepare('INSERT INTO globals (name, doc, updated_at) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET doc = excluded.doc, updated_at = excluded.updated_at');
  return {
    kind: 'sqlite', ...items,
    global: (name) => { const r = getGlobal.get(name); return r ? JSON.parse(r.doc) : undefined; },
    saveGlobal: (name, v) => { putGlobal.run(name, JSON.stringify(v), Date.now()); return v; },
    user, saveUser,
    createUser: (fields) => saveUser({ docs: {}, createdAt: Date.now(), ...fields }),
    session: (sid) => q.getSession.get(sid) ?? undefined,
    newSession: (userId, ua = '') => { const sid = randomBytes(24).toString('base64url'); const now = Date.now(); q.putSession.run(sid, userId, now, now, ua.slice(0, 200)); return sid; },
    setSessionUser: (sid, userId, ua) => { const now = Date.now(); q.putSession.run(sid, userId, now, now, (ua ?? q.getSession.get(sid)?.ua ?? '').slice(0, 200)); },
    touchSession: (sid, ua = '') => { const v = ua.slice(0, 200); q.touchSession.run(Date.now(), v, v, sid); },
    userSessions: (userId) => q.userSessions.all(userId),
    /** Drops sessions idle since `idleBefore`, then guest users nobody can reach any more. */
    sweepSessions: (idleBefore) => { const n = Number(q.sweepSessions.run(idleBefore).changes); const g = Number(q.sweepGuests.run(idleBefore).changes); for (const id of [...cache.keys()]) if (id.startsWith('guest_') && !q.getUser.get(id)) cache.delete(id); return n + g; },
    deleteUser: (id) => tx(() => { cache.delete(id); q.delUser.run(id); q.delUserHandles.run(id); q.delUserEmails.run(id); q.delAllUserTokens.run(id); q.delAllUserSessions.run(id); }),
    dropSession: (sid) => { q.delSession.run(sid); },
    dropUserSessions: (userId, keep) => { q.delUserSessions.run(userId, keep ?? null); },
    handleOwner: (handle) => q.getHandle.get(handle)?.id,
    claimHandle: (handle, userId) => { q.putHandle.run(handle, userId); },
    emailOwner: (email) => q.getEmail.get(email)?.id,
    claimEmail: (email, userId) => tx(() => { q.delUserEmails.run(userId); if (email) q.putEmail.run(email, userId); }),
    putToken: (kindName, token, userId, data, ttlMs) => { q.sweep.run(Date.now()); q.putToken.run(kindName + ':' + sha(token), kindName, userId, data == null ? null : JSON.stringify(data), Date.now() + ttlMs); },
    takeToken: (kindName, token) => tx(() => {
      q.sweep.run(Date.now()); const key = kindName + ':' + sha(token); const t = q.getToken.get(key); if (!t) return null;
      q.delToken.run(key); return { userId: t.userId, data: t.data == null ? null : JSON.parse(t.data), expires: t.expires };
    }),
    dropTokens: (kindName, userId) => { q.delUserTokens.run(kindName, userId); },
    close: () => db.close(),
  };
}
