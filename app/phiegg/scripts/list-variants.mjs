#!/usr/bin/env node
// Every list in the app and the kind it is (puikit Rows `variant`), so the variations across all lists are known and
// each one can be set on purpose:
//   mosaic  the main lists of a page: mixed sizes on bank-card cells
//   thumbs  small even thumbnails: side columns, related media, angles, swatches
//   even    cards all one size
//   slider  one sideways row
// A list that does not say is worked out the way Rows works it out (minItemWidth under 12rem: thumbs; else mosaic).
// ListView lists go through Rows too (components/Phiegg/Views.tsx).
//   node scripts/list-variants.mjs [--json out.json]
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx$/.test(f)) files.push(p); } };
walk(SRC);

const rem = (v) => { const m = /^([\d.]+)(rem|px)$/.exec(v ?? ''); return m ? (m[2] === 'px' ? +m[1] / 16 : +m[1]) : undefined; };
const prop = (tag, name) => { const m = new RegExp(`\\b${name}=(?:"([^"]*)"|\\{([^}]*)\\})`).exec(tag); return m ? (m[1] ?? m[2]) : undefined; };
const rows = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/<(Rows|ListView|RelationList|ViewGrid)\b([^>]*)>/g)) {
    const [, comp, tag] = m;
    const line = text.slice(0, m.index).split('\n').length;
    const slider = /\bslider\b(?!=\{\s*\()/.test(tag) && comp !== 'ListView';
    const asked = prop(tag, 'variant')?.replace(/['"]/g, '');
    const min = prop(tag, 'minItemWidth')?.replace(/['"]/g, '');
    const kind = comp === 'RelationList' ? 'cards (related)' : slider ? 'slider' : asked ?? (prop(tag, 'mosaic') === 'false' ? 'even' : rem(min) !== undefined && rem(min) < 12 ? 'thumbs' : 'mosaic');
    rows.push({ file: relative(ROOT, f).replace(/\\/g, '/'), line, comp, kind, how: asked ? 'set' : 'worked out', cols: prop(tag, 'cols'), min });
  }
}
const by = {};
for (const r of rows) by[r.kind] = (by[r.kind] ?? 0) + 1;
console.log('Lists by kind:', Object.entries(by).map(([k, n]) => `${k} ${n}`).join(' · '), '·', rows.length, 'in all\n');
for (const r of rows.sort((a, b) => a.kind.localeCompare(b.kind) || a.file.localeCompare(b.file))) {
  console.log(r.kind.padEnd(16), r.how.padEnd(11), `${r.comp}`.padEnd(13), `${r.file}:${r.line}`, r.cols ? `cols ${r.cols}` : '', r.min ? `min ${r.min}` : '');
}
const out = process.argv.indexOf('--json');
if (out > 0) writeFileSync(process.argv[out + 1], JSON.stringify(rows, null, 1) + '\n');
