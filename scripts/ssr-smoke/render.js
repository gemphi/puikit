// Resolve @pui/* aliases and the stubs at runtime, then server-render pages.
const path = require('path');
const Module = require('module');
const OUT = path.join(__dirname, 'work/out');
const STUBS = path.join(__dirname, 'stubs');

const ALIASES = [
  ['@pui/components', path.join(OUT, 'pui/src/components')],
  ['@pui/shop',       path.join(OUT, 'pui/src/components/shop')],
  ['@pui/store',      path.join(OUT, 'pui/src/store')],
  ['@pui/types',      path.join(OUT, 'pui/src/types')],
  ['@pui/providers',  path.join(OUT, 'pui/src/providers')],
  ['@pui/hooks',      path.join(OUT, 'pui/src/hooks')],
  ['@pui/api',        path.join(OUT, 'pui/src/api')],
];

// Per-file CSS-module class maps, mirroring what vite's hashing produces.
const CLASSMAP = (() => {
  try { return require('./classmap.json'); } catch { return {}; }
})();
const WORK = path.join(__dirname, 'work');
const styleCache = new Map();

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (/\.(scss|css)$/.test(request) && parent) {
    // The compiled JS lives under work/out/...; the scss key is under work/...
    const fromOut = path.resolve(path.dirname(parent.filename), request);
    const rel = path.relative(path.join(WORK, 'out'), fromOut);
    if (styleCache.has(rel)) return styleCache.get(rel);
    const map = CLASSMAP[rel] || {};
    const proxy = new Proxy({}, {
      get: (t, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return proxy;
        if (typeof prop !== 'string') return undefined;
        return map[prop] || prop;   // unknown keys fall back to the raw name
      },
    });
    styleCache.set(rel, proxy);
    return proxy;
  }
  return origLoad.apply(this, arguments);
};

const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'lucide-react') return path.join(STUBS, 'lucide-react.js');
  if (/\.(scss|css)$/.test(request)) return path.join(STUBS, 'style.js');
  for (const [alias, target] of ALIASES) {
    if (request === alias) return orig.call(this, target, ...rest);
    if (request.startsWith(alias + '/')) return orig.call(this, target + request.slice(alias.length), ...rest);
  }
  if (request.startsWith('@pui/')) return orig.call(this, path.join(OUT, 'pui/src', request.slice(5)), ...rest);
  return orig.call(this, request, ...rest);
};

// jsdom-free DOM shims: PuiProvider touches document/localStorage on mount.
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
global.__prefStore = store;

module.exports = { OUT, STUBS };

// The router reads window.location.hash on mount.
if (typeof global.window === 'undefined') {
  global.window = {
    location: { hash: '#/', pathname: '/', assign() {} },
    addEventListener() {}, removeEventListener() {},
    scrollTo() {}, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    localStorage: global.localStorage,
  };
}
if (typeof global.document === 'undefined') {
  const el = { setAttribute() {}, removeAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, style: { setProperty() {}, removeProperty() {} } };
  global.document = { documentElement: el, body: el, createElement: () => el, head: el, addEventListener() {}, removeEventListener() {} };
}
