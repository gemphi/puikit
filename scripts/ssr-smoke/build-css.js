const sass = require('./work/node_modules/sass');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORK = path.join(__dirname, 'work');
const PUI = path.join(WORK, 'pui/src');
const APP = path.join(WORK, 'app/src');
const PHLICK = path.join(WORK, 'phlick');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.scss') && !e.name.startsWith('_')) out.push(p);
  }
  return out;
}

const opts = { silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls'] };
const pieces = [];
const classMap = {};   // scss path (relative to work/) -> { local: scoped }
let ok = 0, bad = 0;

/** Globals: emitted verbatim, no scoping. */
for (const entry of [path.join(PUI, 'tokens/tokens.scss'), path.join(PUI, 'styles/core.scss')]) {
  try {
    pieces.push(`/* GLOBAL ${path.relative(PUI, entry)} */\n${sass.compile(entry, { ...opts, loadPaths: [path.dirname(entry), PUI] }).css}`);
    ok++;
  } catch (e) { bad++; console.log('  FAILED', entry, String(e.message).split('\n')[0].slice(0, 90)); }
}

/**
 * CSS Modules: vite hashes class names per file so `.card` in Card and `.card`
 * in ProductItem never collide. Reproduce that here, otherwise concatenating
 * every module into one sheet makes later rules silently overwrite earlier
 * ones — which looks exactly like a broken layout.
 */
for (const f of [...walk(PUI), ...walk(APP), ...walk(PHLICK)]) {
  if (f.endsWith('tokens/tokens.scss') || f.endsWith('styles/core.scss')) continue;
  const rel = path.relative(WORK, f);
  const isModule = f.endsWith('.module.scss');
  try {
    let css = sass.compile(f, { ...opts, loadPaths: [path.dirname(f), PUI] }).css;
    // sass emits `@charset "UTF-8";` when a comment carries a non-ASCII
    // character. It is a statement, not a prelude, but the brace-chunker saw
    // `@charset ...; .firstSelector` as one @-chunk and skipped it — so each
    // such file shipped its FIRST selector unhashed, silently unstyled.
    css = css.replace(/@charset[^;]*;/g, '');
    if (isModule) {
      const tag = 'm' + crypto.createHash('sha1').update(rel).digest('hex').slice(0, 6);
      const locals = new Set();

      // Rewrite class names in SELECTOR text only. Matching on the character
      // before the dot could never see a class that directly follows another
      // (`.sidebar.flush`), so compound rules were emitted half-hashed and
      // silently never matched — which looks exactly like a fix that did not
      // take. Splitting on braces isolates the selectors, where every `.name`
      // is a class by definition.
      const CLASS = /\.(-?[_a-zA-Z][\w-]*)/g;
      const scopeSelectors = (text, collectOnly) =>
        text.replace(/(^|[{}])([^{}]*)(?=\{)/g, (whole, lead, sel) => {
          // Skip at-rule preludes (@media, @supports): no classes to scope.
          if (/^\s*@/.test(sel)) return whole;
          const out = sel.replace(CLASS, (m, n) => {
            locals.add(n);
            return collectOnly ? m : '.' + (map[n] || n);
          });
          return lead + out;
        });

      const map = {};
      scopeSelectors(css, true);
      for (const n of locals) map[n] = `${tag}_${n}`;
      css = scopeSelectors(css, false);

      classMap[rel] = map;
    }
    pieces.push(`/* ${rel} */\n${css}`);
    ok++;
  } catch (e) { bad++; console.log('  FAILED', rel, String(e.message).split('\n')[0].slice(0, 90)); }
}

fs.writeFileSync(path.join(__dirname, 'bundle.css'), pieces.join('\n\n'));
fs.writeFileSync(path.join(__dirname, 'classmap.json'), JSON.stringify(classMap, null, 0));
console.log(`compiled ${ok} stylesheets (${bad} failed); ${Object.keys(classMap).length} scoped modules -> bundle.css ${(fs.statSync('bundle.css').size/1024).toFixed(0)}KB`);
