// Apps compose puijs; they never render raw HTML elements (the single base element is puijs `Box`).
// Scans apps/<app>/src/**/*.tsx for lowercase JSX tags and exits 1 on any hit. SVG drawing tags are allowed.
//
//   node scripts/check-app-markup.mjs                 # every app under apps/
//   node scripts/check-app-markup.mjs phiegg phi-kit  # just these
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', 'apps');
const SVG = new Set(['svg', 'path', 'g', 'defs', 'mask', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'use', 'symbol', 'title', 'text', 'tspan', 'pattern', 'filter', 'feGaussianBlur', 'feOffset', 'feBlend', 'foreignObject', 'marker']);
// TypeScript type positions that look like tags (useState<string>, x as <typeof y>).
const TS = new Set(['string', 'number', 'boolean', 'any', 'unknown', 'never', 'void', 'typeof', 'keyof', 'readonly', 'null', 'undefined', 'object']);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? (f === 'node_modules' ? [] : walk(p)) : /\.(tsx|jsx)$/.test(f) && !/\.(test|stories)\./.test(f) ? [p] : []; });

const apps = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(root).filter((a) => existsSync(join(root, a, 'src')));
let total = 0;
for (const app of apps) {
  const hits = [];
  for (const f of walk(join(root, app, 'src'))) {
    const lines = strip(readFileSync(f, 'utf8')).split('\n');
    lines.forEach((l, i) => { for (const m of l.matchAll(/(?<![\w$.)\]])<([a-z][a-zA-Z0-9]*)(?=[\s>/])/g)) if (!SVG.has(m[1]) && !TS.has(m[1])) hits.push(`${relative(root, f)}:${i + 1} <${m[1]}>`); });
  }
  total += hits.length;
  console.log(`${hits.length ? '✗' : '✓'} ${app}${hits.length ? ' — ' + hits.length + ' raw element(s)' : ''}`);
  if (hits.length && process.argv.slice(2).length) hits.forEach((h) => console.log('   ' + h));
}
process.exit(total ? 1 : 0);
