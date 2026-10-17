// Traverse old-apps-js: schemas (config/schema.json) become kind declarations; mock datasets (TS transpiled with
// the repo's TypeScript, then evaluated with stubbed imports) become records. One bundle out.
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require2 = createRequire(import.meta.url);
const ts = require2(process.env.TS_PATH);

const ROOT = process.argv[2]; const OUT = process.argv[3];
const apps = readdirSync(ROOT).filter((d) => { try { return statSync(join(ROOT, d)).isDirectory(); } catch { return false; } });
const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const clean = (s) => s.replace(/[^A-Za-z0-9]/g, '');
const kindOf = (app, entity) => /^(Gem|Phi)/.test(entity) ? lcFirst(clean(entity)) : lcFirst(clean(app) + entity);

const specs = []; const records = {};
const seen = new Map(); // kind -> Set of identities, so re-exports (ALL_USERS vs MOCK_USERS) do not duplicate
const add = (kind, rows) => {
  if (!rows?.length) return;
  const set = seen.get(kind) ?? seen.set(kind, new Set()).get(kind);
  const list = (records[kind] ??= []);
  for (const r of rows) { const key = r.id != null ? 'i' + r.id : JSON.stringify(r); if (set.has(key)) continue; set.add(key); list.push(r); }
};

for (const app of apps) {
  const p = join(ROOT, app, 'config', 'schema.json'); if (!existsSync(p)) continue;
  try { const sch = JSON.parse(readFileSync(p, 'utf8'));
    for (const [entity, d] of Object.entries(sch))
      specs.push({ id: app + '.' + entity, app, entity, name: kindOf(app, entity), module: d.module, label: d.label ?? entity, icon: d.icon, accent: d.accent, fields: d.columns ?? d.schema?.fields ?? {} });
  } catch (e) { console.error('schema fail', app, String(e).slice(0, 80)); }
}

const MAP = {
  'gempad:LAUNCHES': 'gemLaunch', 'gempad:TIERS': 'gemTier', 'gempad:PAST_LAUNCHES': 'gemGraduate',
  'gemsum:FEATURED_PROJECTS': 'gemProject', 'gemsum:FUNDING_TRACKS': 'gemFunding', 'gemsum:PROCESS_STEPS': 'gemLaunchpad',
  'phibar:getPosts': 'phiFeed', 'phibar:getReels': 'phiReel', 'phibar:getShows': 'phiShow', 'phibar:getMessages': 'phiChat', 'phibar:getNotifications': 'phiNotification', 'phibar:getComments': 'phibarComment',
};
const nameOf = (app, exp) => {
  const hit = MAP[app + ':' + exp]; if (hit) return hit;
  let n = exp.replace(/^(MOCK_|ALL_|get)/i, '').toLowerCase().replace(/_/g, ' ').trim().replace(/\s+(.)/g, (m, c) => c.toUpperCase());
  if (n.endsWith('ies')) n = n.slice(0, -3) + 'y'; else if (n.length > 3 && n.endsWith('s') && !n.endsWith('ss')) n = n.slice(0, -1);
  return kindOf(app, n.charAt(0).toUpperCase() + n.slice(1));
};
const identityMod = () => new Proxy(function (x) { return x; }, { get: () => (x) => x, apply: (t, th, a) => a[0] });
const modCache = new Map();
const evalMock = (file) => {
  if (modCache.has(file)) return modCache.get(file);
  const src = readFileSync(file, 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  const dir = file.slice(0, file.lastIndexOf('/'));
  const req = (spec) => { // sibling mock modules resolve for real, everything else is a stub
    const alias = spec.match(/^@(\w+)\/(.*)$/);
    const local = spec.startsWith('.') ? join(dir, spec) : alias ? join(ROOT, alias[1], alias[2]) : null;
    if (local) { for (const c of [local + '.ts', local + '/index.ts', local]) if (existsSync(c) && statSync(c).isFile()) { try { return evalMock(c); } catch { break; } } }
    return identityMod();
  };
  const ctx = { module, exports: module.exports, require: req, console: { log: () => {}, warn: () => {}, error: () => {} } };
  vm.createContext(ctx);
  vm.runInContext(js, ctx, { timeout: 5000 });
  modCache.set(file, module.exports);
  return module.exports;
};
const harvest = (app, file) => {
  let out; try { out = evalMock(file); } catch (e) { console.error('mock fail', app, basename(file), String(e).slice(0, 110)); return; }
  for (const [exp, v] of Object.entries(out)) {
    if (/^(generate|pad\d|get\w*Img|default)$/i.test(exp) || /^generate/i.test(exp)) continue;
    let rows = v;
    if (typeof v === 'function') { try { rows = v(); } catch (e) { console.error('call fail', app, exp, String(e).slice(0, 90)); continue; } }
    if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== 'object') continue;
    try { rows = JSON.parse(JSON.stringify(rows)); } catch { continue; }
    rows = rows.filter((r) => r && typeof r === 'object' && !Array.isArray(r));
    if (rows.length) add(nameOf(app, exp), rows);
  }
};
for (const app of apps) {
  const d = join(ROOT, app, 'lib/mocks'); if (!existsSync(d)) continue;
  for (const f of readdirSync(d)) if (f.endsWith('.ts')) harvest(app, join(d, f));
}
harvest('phibar', join(ROOT, 'phibar/lib/services/mockData.ts'));

// 3) Module fixtures (Symfony-style app/<module>/fixture.ts): gempad, gemsum and phihub carry their content here.
const singular = (n) => n.endsWith('ies') ? n.slice(0, -3) + 'y' : n.length > 3 && n.endsWith('s') && !n.endsWith('ss') ? n.slice(0, -1) : n;
for (const app of ['gempad', 'gemsum', 'phihub', 'phinet', 'phiace']) {
  const appDir = join(ROOT, app, 'app'); if (!existsSync(appDir)) continue;
  for (const mod of readdirSync(appDir)) {
    const fx = join(appDir, mod, 'fixture.ts'); if (!existsSync(fx)) continue;
    let out; try { out = evalMock(fx); } catch (e) { console.error('fixture fail', app, mod, String(e).slice(0, 90)); continue; }
    // the default export (or the first exported array; create* functions are called)
    let rows = out.default;
    if (!Array.isArray(rows)) for (const v of Object.values(out)) { const r = typeof v === 'function' ? (() => { try { return v(); } catch { return null; } })() : v; if (Array.isArray(r) && r.length && typeof r[0] === 'object') { rows = r; break; } }
    if (!Array.isArray(rows) || !rows.length) continue;
    try { rows = JSON.parse(JSON.stringify(rows)); } catch { continue; }
    const spec = specs.find((x) => x.app === app && x.module === mod);
    const kind = spec ? spec.name : kindOf(app, singular(mod).replace(/^./, (c) => c.toUpperCase()));
    add(kind, rows.filter((r) => r && typeof r === 'object' && !Array.isArray(r)));
    console.error('fixture', app, mod, '->', kind, rows.length);
  }
}

const artDir = join(ROOT, 'gembar/lib/mocks/articles');
if (existsSync(artDir)) for (const f of readdirSync(artDir)) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  try { const rows = JSON.parse(readFileSync(join(artDir, f), 'utf8'));
    const list = Array.isArray(rows) ? rows : rows.articles ?? [];
    add('gembarArticle', list.map((r) => ({ ...r, category: f.replace('.json', '') })));
  } catch (e) { console.error('article fail', f, String(e).slice(0, 80)); }
}
const declared = new Set(specs.map((s) => s.name));
for (const [kind, rows] of Object.entries(records)) {
  if (declared.has(kind)) continue;
  const fields = {};
  for (const r of rows.slice(0, 20)) for (const [k, v] of Object.entries(r)) if (!(k in fields))
    fields[k] = { type: Array.isArray(v) ? 'array' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v === 'object' && v ? 'object' : typeof v };
  specs.push({ id: 'inferred.' + kind, app: kind.replace(/[A-Z].*$/, ''), entity: kind, name: kind, label: kind, fields, inferred: true });
}
const counts = Object.fromEntries(Object.entries(records).map(([k, v]) => [k, v.length]));
writeFileSync(OUT, JSON.stringify({ specs, records }));
console.log('kinds declared:', specs.filter((s) => !s.inferred).length, '· inferred:', specs.filter((s) => s.inferred).length);
console.log('record kinds:', Object.keys(records).length, '· records:', Object.values(records).reduce((a, v) => a + v.length, 0));
console.log(JSON.stringify(counts));
