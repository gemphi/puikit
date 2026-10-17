// Postgres backend for the Phiora store: the single production database (PHI_STORE=postgres, or DATABASE_URL /
// PHI_PG_URL set). Same interface as the sqlite and json backends, but every method is async — the server awaits
// them all, so the sync backends keep working unchanged. Needs the `pg` package (npm install).
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { sha, cleanSources, groupRows, countKinds, MAX_CHANGES } from './store.mjs';

const doc = (d) => (typeof d === 'string' ? JSON.parse(d) : d);

export function postgresStore(url) {
  let Pool;
  try { ({ Pool } = createRequire(import.meta.url)('pg')); }
  catch { throw new Error('Postgres needs the pg package: npm install in apps/phiora-server.'); }
  const pool = new Pool({ connectionString: url, max: 10 });
  const q = (text, params = []) => pool.query(text, params);
  const one = async (text, params) => (await q(text, params)).rows[0];

  const ready = (async () => {
    // Props are queryable SQL: doc is JSONB (SELECT doc->>'name' …). An older text column converts in place.
    await q(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at BIGINT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, user_id TEXT NOT NULL, at BIGINT NOT NULL, created BIGINT, ua TEXT NOT NULL DEFAULT '');
      CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
      CREATE TABLE IF NOT EXISTS handles (handle TEXT PRIMARY KEY, user_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS emails (email TEXT PRIMARY KEY, user_id TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS emails_user ON emails(user_id);
      CREATE TABLE IF NOT EXISTS tokens (key TEXT PRIMARY KEY, kind TEXT NOT NULL, user_id TEXT NOT NULL, data TEXT, expires BIGINT NOT NULL);
      CREATE TABLE IF NOT EXISTS globals (name TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at BIGINT NOT NULL);
      CREATE TABLE IF NOT EXISTS items (kind TEXT NOT NULL, id TEXT NOT NULL, slug TEXT, ord BIGINT NOT NULL, doc JSONB NOT NULL,
        origin TEXT NOT NULL DEFAULT 'file', edited BOOLEAN NOT NULL DEFAULT FALSE, deleted BOOLEAN NOT NULL DEFAULT FALSE,
        owner TEXT, updated_at BIGINT, updated_by TEXT, PRIMARY KEY (kind, id));
      CREATE INDEX IF NOT EXISTS items_ord ON items(ord);
      CREATE TABLE IF NOT EXISTS item_meta (one_row BOOLEAN PRIMARY KEY DEFAULT TRUE, kinds TEXT NOT NULL, items BIGINT NOT NULL, stamp TEXT, loaded_at BIGINT NOT NULL);
      CREATE TABLE IF NOT EXISTS item_changes (seq BIGSERIAL PRIMARY KEY, kind TEXT NOT NULL, id TEXT NOT NULL,
        action TEXT NOT NULL, fields TEXT, by_id TEXT, by_handle TEXT, at BIGINT NOT NULL);
      CREATE INDEX IF NOT EXISTS item_changes_item ON item_changes(kind, id, seq);
    `);
    const t = await q("SELECT data_type FROM information_schema.columns WHERE table_name='items' AND column_name='doc'");
    if (t.rows[0] && t.rows[0].data_type !== 'jsonb') await q('ALTER TABLE items ALTER COLUMN doc TYPE JSONB USING doc::jsonb');
  })();

  const tx = async (f) => {
    const c = await pool.connect();
    try { await c.query('BEGIN'); const r = await f((text, params = []) => c.query(text, params)); await c.query('COMMIT'); return r; }
    catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; }
    finally { c.release(); }
  };
  const num = (v) => (v == null ? null : Number(v));

  const metaOf = (r) => (r ? { items: Number(r.items), kinds: JSON.parse(r.kinds), stamp: r.stamp, loadedAt: num(r.loaded_at) } : null);
  const recount = async (run, order) => {
    const rows = (await run('SELECT kind, COUNT(*) AS n FROM items WHERE NOT deleted GROUP BY kind')).rows;
    const m = new Map(order.map((k) => [k, 0])); for (const r of rows) m.set(r.kind, Number(r.n));
    const kinds = [...m.entries()].map(([kind, count]) => ({ kind, count }));
    return { kinds, items: kinds.reduce((a, k) => a + k.count, 0) };
  };
  const logChange = (run, kind, id, c) =>
    run('INSERT INTO item_changes (kind, id, action, fields, by_id, by_handle, at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [kind, id, c.action, c.fields ? JSON.stringify(c.fields) : null, c.byId ?? null, c.byHandle ?? null, Date.now()]);
  const orderOf = async (run) => JSON.parse((await run('SELECT kinds FROM item_meta')).rows[0]?.kinds ?? '[]').map((k) => k.kind);
  const saveMeta = async (run, order, stamp, loadedAt) => {
    const c = await recount(run, order);
    const cur = (await run('SELECT stamp, loaded_at FROM item_meta')).rows[0];
    await run(`INSERT INTO item_meta (one_row, kinds, items, stamp, loaded_at) VALUES (TRUE,$1,$2,$3,$4)
      ON CONFLICT (one_row) DO UPDATE SET kinds=$1, items=$2, stamp=$3, loaded_at=$4`,
      [JSON.stringify(c.kinds), c.items, stamp ?? cur?.stamp ?? null, loadedAt ?? num(cur?.loaded_at) ?? Date.now()]);
    return c;
  };

  const api = {
    kind: 'postgres',
    global: async (name) => { await ready; const r = await one('SELECT doc FROM globals WHERE name=$1', [name]); return r ? JSON.parse(r.doc) : undefined; },
    saveGlobal: async (name, v) => { await ready; await q('INSERT INTO globals (name, doc, updated_at) VALUES ($1,$2,$3) ON CONFLICT (name) DO UPDATE SET doc=$2, updated_at=$3', [name, JSON.stringify(v), Date.now()]); return v; },
    user: async (id) => { await ready; const r = await one('SELECT doc FROM users WHERE id=$1', [id]); return r ? JSON.parse(r.doc) : null; },
    saveUser: async (u) => { await ready; await q('INSERT INTO users (id, doc, updated_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET doc=$2, updated_at=$3', [u.id, JSON.stringify(u), Date.now()]); return u; },
    createUser: (fields) => api.saveUser({ docs: {}, createdAt: Date.now(), ...fields }),
    deleteUser: async (id) => { await ready; await tx(async (run) => { for (const t of ['users', 'handles', 'emails', 'tokens', 'sessions']) await run(`DELETE FROM ${t} WHERE ${t === 'users' ? 'id' : 'user_id'}=$1`, [id]); }); },
    session: async (sid) => { await ready; const r = await one('SELECT user_id, at, created, ua FROM sessions WHERE sid=$1', [sid]); return r ? { userId: r.user_id, at: num(r.at), created: num(r.created), ua: r.ua } : undefined; },
    newSession: async (userId, ua = '') => { await ready; const sid = randomBytes(24).toString('base64url'); const now = Date.now(); await q('INSERT INTO sessions (sid, user_id, at, created, ua) VALUES ($1,$2,$3,$3,$4)', [sid, userId, now, ua.slice(0, 200)]); return sid; },
    setSessionUser: async (sid, userId, ua) => { await ready; const now = Date.now(); await q(`INSERT INTO sessions (sid, user_id, at, created, ua) VALUES ($1,$2,$3,$3,COALESCE($4,''))
      ON CONFLICT (sid) DO UPDATE SET user_id=$2, at=$3, created=$3, ua=COALESCE($4, sessions.ua)`, [sid, userId, now, ua == null ? null : ua.slice(0, 200)]); },
    touchSession: async (sid, ua = '') => { await ready; await q("UPDATE sessions SET at=$1, ua=CASE WHEN $2='' THEN ua ELSE $2 END WHERE sid=$3", [Date.now(), ua.slice(0, 200), sid]); },
    userSessions: async (userId) => { await ready; return (await q('SELECT sid, at, COALESCE(created, at) AS created, ua FROM sessions WHERE user_id=$1 ORDER BY at DESC', [userId])).rows.map((r) => ({ sid: r.sid, at: num(r.at), created: num(r.created), ua: r.ua })); },
    sweepSessions: async (idleBefore) => { await ready; const a = (await q('DELETE FROM sessions WHERE at < $1', [idleBefore])).rowCount; const b = (await q("DELETE FROM users WHERE id LIKE 'guest\\_%' ESCAPE '\\' AND updated_at < $1 AND id NOT IN (SELECT user_id FROM sessions)", [idleBefore])).rowCount; return a + b; },
    dropSession: async (sid) => { await ready; await q('DELETE FROM sessions WHERE sid=$1', [sid]); },
    dropUserSessions: async (userId, keep) => { await ready; await q('DELETE FROM sessions WHERE user_id=$1 AND sid IS DISTINCT FROM $2', [userId, keep ?? null]); },
    handleOwner: async (handle) => { await ready; return (await one('SELECT user_id FROM handles WHERE handle=$1', [handle]))?.user_id; },
    claimHandle: async (handle, userId) => { await ready; await q('INSERT INTO handles (handle, user_id) VALUES ($1,$2) ON CONFLICT (handle) DO UPDATE SET user_id=$2', [handle, userId]); },
    emailOwner: async (email) => { await ready; return (await one('SELECT user_id FROM emails WHERE email=$1', [email]))?.user_id; },
    claimEmail: async (email, userId) => { await ready; await tx(async (run) => { await run('DELETE FROM emails WHERE user_id=$1', [userId]); if (email) await run('INSERT INTO emails (email, user_id) VALUES ($1,$2)', [email, userId]); }); },
    putToken: async (kindName, token, userId, data, ttlMs) => { await ready; await q('DELETE FROM tokens WHERE expires < $1', [Date.now()]); await q('INSERT INTO tokens (key, kind, user_id, data, expires) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (key) DO UPDATE SET data=$4, expires=$5', [kindName + ':' + sha(token), kindName, userId, data == null ? null : JSON.stringify(data), Date.now() + ttlMs]); },
    takeToken: async (kindName, token) => { await ready; return tx(async (run) => { await run('DELETE FROM tokens WHERE expires < $1', [Date.now()]); const key = kindName + ':' + sha(token); const r = (await run('DELETE FROM tokens WHERE key=$1 RETURNING user_id, data, expires', [key])).rows[0]; return r ? { userId: r.user_id, data: r.data == null ? null : JSON.parse(r.data), expires: num(r.expires) } : null; }); },
    dropTokens: async (kindName, userId) => { await ready; await q('DELETE FROM tokens WHERE kind=$1 AND user_id=$2', [kindName, userId]); },

    putItems: async (sources, stamp) => {
      await ready; const c = cleanSources(sources);
      return tx(async (run) => {
        const prevOrder = await orderOf(run);
        await run("DELETE FROM items WHERE origin='file' AND NOT edited");
        const base = Number((await run('SELECT COALESCE(MAX(ord), -1) + 1 AS n FROM items')).rows[0].n);
        for (let i = 0; i < c.rows.length; i++) {
          const [k, r] = c.rows[i];
          await run("INSERT INTO items (kind, id, slug, ord, doc, origin) VALUES ($1,$2,$3,$4,$5,'file') ON CONFLICT (kind, id) DO NOTHING", [k, r.id, r.slug ?? null, base + i, JSON.stringify(r)]);
        }
        const order = [...c.kinds, ...prevOrder.filter((k) => !c.kinds.includes(k))];
        const counts = await saveMeta(run, order, stamp ?? null, Date.now());
        const kept = Number((await run("SELECT COUNT(*) AS n FROM items WHERE origin<>'file' OR edited")).rows[0].n);
        return { items: counts.items, kinds: counts.kinds, skipped: c.skipped, kept };
      });
    },
    itemSources: async () => {
      await ready; const m = metaOf(await one('SELECT * FROM item_meta')); if (!m) return null;
      const rows = (await q('SELECT kind, doc FROM items WHERE NOT deleted ORDER BY ord')).rows.map((r) => [r.kind, doc(r.doc)]);
      return { sources: groupRows(m.kinds.map((k) => k.kind), rows), loadedAt: m.loadedAt };
    },
    itemsOf: async (kinds) => { await ready;
      const out = Object.fromEntries(kinds.map((k) => [k, []]));
      for (const r of (await q('SELECT kind, doc FROM items WHERE kind = ANY($1) AND NOT deleted ORDER BY ord', [kinds])).rows) out[r.kind].push(doc(r.doc));
      return out;
    },
    itemStamp: async () => { await ready; return (await one('SELECT stamp FROM item_meta'))?.stamp ?? null; },
    itemInfo: async () => { await ready; return metaOf(await one('SELECT * FROM item_meta')); },
    getItem: async (kind, id) => { await ready; const r = await one('SELECT doc, origin, edited, owner, updated_at, updated_by FROM items WHERE kind=$1 AND id=$2 AND NOT deleted', [kind, id]); return r ? { doc: doc(r.doc), origin: r.origin, edited: r.edited, owner: r.owner ?? null, updatedAt: num(r.updated_at), updatedBy: r.updated_by ?? null } : null; },
    saveItem: async (kind, id, doc, m, change) => { await ready; await tx(async (run) => {
      const now = Date.now();
      const had = (await run('SELECT 1 FROM items WHERE kind=$1 AND id=$2', [kind, id])).rows[0];
      if (had) await run('UPDATE items SET doc=$1, slug=$2, edited=TRUE, deleted=FALSE, updated_at=$3, updated_by=$4 WHERE kind=$5 AND id=$6', [JSON.stringify(doc), doc.slug ?? null, now, m.by ?? null, kind, id]);
      else { const ord = Number((await run('SELECT COALESCE(MAX(ord), -1) + 1 AS n FROM items')).rows[0].n);
        await run('INSERT INTO items (kind, id, slug, ord, doc, origin, edited, owner, updated_at, updated_by) VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7,$8,$9)', [kind, id, doc.slug ?? null, ord, JSON.stringify(doc), m.origin ?? 'api', m.owner ?? null, now, m.by ?? null]); }
      await logChange(run, kind, id, change);
      const order = await orderOf(run); if (!order.includes(kind)) order.push(kind);
      await saveMeta(run, order);
    }); },
    removeItem: async (kind, id, m, change) => { await ready; await tx(async (run) => {
      const r = (await run('SELECT origin FROM items WHERE kind=$1 AND id=$2', [kind, id])).rows[0]; if (!r) return;
      if (r.origin === 'file') await run('UPDATE items SET deleted=TRUE, edited=TRUE, updated_at=$1, updated_by=$2 WHERE kind=$3 AND id=$4', [Date.now(), m.by ?? null, kind, id]);
      else await run('DELETE FROM items WHERE kind=$1 AND id=$2', [kind, id]);
      await logChange(run, kind, id, change);
      await saveMeta(run, await orderOf(run));
    }); },
    itemChanges: async ({ kind, id, n = 50 } = {}) => { await ready;
      const r = await q(`SELECT seq, kind, id, action, fields, by_id, by_handle, at FROM item_changes
        WHERE ($1::text IS NULL OR kind=$1) AND ($2::text IS NULL OR id=$2) ORDER BY seq DESC LIMIT $3`, [kind ?? null, id ?? null, Math.min(n, MAX_CHANGES)]);
      return r.rows.map((c) => ({ seq: Number(c.seq), kind: c.kind, id: c.id, action: c.action, fields: c.fields ? JSON.parse(c.fields) : null, byId: c.by_id, byHandle: c.by_handle, at: num(c.at) }));
    },
    close: () => pool.end(),
  };
  return api;
}
