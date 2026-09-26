/**
 * A ~200-line CommonJS -> browser bundler.
 *
 * There is no npm registry reachable from this container, so esbuild/vite are
 * unavailable. tsc already emits CommonJS into work/out; this walks that
 * require graph (plus the React packages it pulls from node_modules), wraps
 * every module in a function, and emits one IIFE with a mini `require`.
 *
 * That is enough to run the *real* apps in Chromium: effects run, async
 * adapters resolve, state updates, overlays mount into document.body. Static
 * SSR snapshots can never show any of that.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'work/out');
const WORK = path.join(ROOT, 'work');
const NM = path.join(WORK, 'node_modules');
const STUBS = path.join(ROOT, 'stubs');
const CLASSMAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'classmap.json'), 'utf8'));

const ALIASES = [
  ['@pui/components', path.join(OUT, 'pui/src/components')],
  ['@pui/shop', path.join(OUT, 'pui/src/components/shop')],
  ['@pui/social', path.join(OUT, 'pui/src/components/social')],
  ['@pui/store', path.join(OUT, 'pui/src/store')],
  ['@pui/types', path.join(OUT, 'pui/src/types')],
  ['@pui/providers', path.join(OUT, 'pui/src/providers')],
  ['@pui/hooks', path.join(OUT, 'pui/src/hooks')],
  ['@pui/api', path.join(OUT, 'pui/src/api')],
];

const STYLE = Symbol('style');
const isStyle = (r) => /\.(scss|css)$/.test(r);

function resolve(request, fromFile) {
  if (isStyle(request)) return STYLE;
  if (request === 'lucide-react') return path.join(STUBS, 'lucide-react.browser.js');
  if (request.startsWith('@pui/')) {
    for (const [alias, target] of ALIASES) {
      if (request === alias) return req(target, fromFile);
      if (request.startsWith(alias + '/')) return req(target + request.slice(alias.length), fromFile);
    }
    return req(path.join(OUT, 'pui/src', request.slice(5)), fromFile);
  }
  return req(request, fromFile);
}

function req(request, fromFile) {
  return Module._resolveFilename(request, {
    id: fromFile, filename: fromFile,
    paths: Module._nodeModulePaths(path.dirname(fromFile)).concat([NM]),
  });
}

/** Class map for one stylesheet, keyed by its path relative to work/out. */
function styleModuleFor(request, fromFile) {
  const abs = path.resolve(path.dirname(fromFile), request);
  const rel = path.relative(OUT, abs).replace(/\\/g, '/');
  return CLASSMAP[rel] || CLASSMAP[rel.replace(/^pui\//, '')] || {};
}

const modules = new Map();          // absolute path -> { id, code }
let nextId = 0;
const REQUIRE_RE = /\brequire\(\s*(['"])((?:(?!\1).)+)\1\s*\)/g;

function add(file) {
  if (modules.has(file)) return modules.get(file).id;
  const entry = { id: nextId++, code: '' };
  modules.set(file, entry);

  let src;
  if (file.endsWith('.json')) {
    src = 'module.exports = ' + fs.readFileSync(file, 'utf8') + ';';
  } else {
    src = fs.readFileSync(file, 'utf8');
  }

  // `import.meta.glob` / `import.meta.env` are Vite build-time features. Vite
  // supplies them for real; here they become an empty glob and a stub env so
  // the module still loads. Nothing under test depends on either.
  src = src
    .replace(/import\.meta\.glob\s*(?:<[^>]*>)?\s*\(/g, '__glob(')
    .replace(/import\.meta\.env/g, '__importMetaEnv')
    .replace(/import\.meta/g, '({ env: __importMetaEnv })');

  const deps = {};
  src = src.replace(REQUIRE_RE, (m, q, request) => {
    if (isStyle(request)) {
      const key = '__style_' + Object.keys(deps).length;
      deps[key] = { style: styleModuleFor(request, file) };
      return `__styles(${JSON.stringify(deps[key].style)})`;
    }
    let target;
    try {
      target = resolve(request, file);
    } catch (e) {
      // Optional / node-only requires that the browser build never reaches.
      return `__missing(${JSON.stringify(request)})`;
    }
    if (target === STYLE) return `__styles({})`;
    return `__req(${add(target)})`;
  });

  entry.code = src;
  return entry.id;
}

function build(entryFile, globalName) {
  modules.clear();
  nextId = 0;
  const rootId = add(entryFile);
  const defs = [];
  for (const [file, m] of modules) {
    defs.push(
      `/* ${path.relative(ROOT, file)} */\n` +
      `__defs[${m.id}] = function (module, exports, __req, __styles, __missing) {\n${m.code}\n};`
    );
  }
  return `(function () {
"use strict";
var process = { env: { NODE_ENV: "production" }, browser: true, nextTick: function (f) { Promise.resolve().then(f); } };
var __importMetaEnv = { DEV: false, PROD: true, MODE: "production", BASE_URL: "/", SSR: false };
function __glob() { return {}; }
var __defs = [], __cache = [];
function __styles(map) {
  return new Proxy({}, { get: function (t, p) {
    if (p === "__esModule") return true;
    if (typeof p !== "string") return undefined;
    if (p === "default") return __styles(map);
    return map[p] || p;
  } });
}
function __missing(name) { return new Proxy({}, { get: function () { return undefined; } }); }
function __req(id) {
  if (__cache[id]) return __cache[id].exports;
  var m = __cache[id] = { exports: {} };
  __defs[id](m, m.exports, __req, __styles, __missing);
  return m.exports;
}
${defs.join('\n')}
window[${JSON.stringify(globalName)}] = __req(${rootId});
})();`;
}

module.exports = { build, OUT };

if (require.main === module) {
  const targets = [
    ['app/src/main.js', 'ChanelApp', 'chanel.js'],
    ['book/src/main.js', 'BookApp', 'book.js'],
    ['phlick/src/main.js', 'PhlickApp', 'phlick.js'],
  ];
  fs.mkdirSync(path.join(ROOT, 'live'), { recursive: true });
  for (const [rel, name, out] of targets) {
    const code = build(path.join(OUT, rel), name);
    fs.writeFileSync(path.join(ROOT, 'live', out), code);
    console.log(out.padEnd(12), (code.length / 1024).toFixed(0) + 'KB', modules.size + ' modules');
  }
}
