#!/usr/bin/env node
// Bird designs to choose from (site.json brand.birdSet): each design is one body, kept in place in the 0-100 box of the
// bird-alone files, facing right, with parts added (filled, the body's ink) or cut (holes and grooves, through a mask).
// Each design is written alone, and on a squarish tile shaded like the header pin in every colour pair, and a sheet
// (index.html) shows them all side by side, big and at header size.
//   node scripts/logo-bird-set.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const B = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'site.json'), 'utf8')).brand.birdSet;
const OUT = join(ROOT, 'public', B.out);
mkdirSync(join(OUT, 'tile'), { recursive: true });

const bodyPath = (b) => readFileSync(join(ROOT, 'public', b.file), 'utf8').match(/ d="([^"]+)"/)[1];
const mirror = (b) => (b.mirror ? ' transform="matrix(-1 0 0 1 100 0)"' : '');

// One design as SVG markup in the 0-100 box, in one ink; `id` keeps its mask apart from other drawings on a page.
function bird(design, ink, id) {
  const body = B.bodies[design.body];
  const parts = design.parts.map((p) => B.parts[p]);
  const adds = parts.filter((p) => p.add).map((p) => `<path d="${p.add}"/>`).join('');
  const cuts = parts.filter((p) => p.cut).map((p) => `<path d="${p.cut}" fill="#000"/>`).join('')
    + parts.filter((p) => p.groove).map((p) => `<path d="${p.groove}" fill="none" stroke="#000" stroke-width="${p.width}" stroke-linecap="round"/>`).join('');
  const shape = `<path${mirror(body)} d="${bodyPath(body)}"/>${adds}`;
  if (!cuts) return `<g fill="${ink}">${shape}</g>`;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#000"/><g fill="#fff">${shape}</g>${cuts}</mask>`
    + `<rect width="100" height="100" fill="${ink}" mask="url(#${id})"/>`;
}

// The left edge of the tile a little lighter than the right, like the pin's shade.
const lift = (hex, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k) + 255 * k).toString(16).padStart(2, '0')).join('');
function tile(design, c) {
  const T = B.tile, pad = T.pad * 100, s = 100 - 2 * pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="phiegg bird">`
    + `<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${lift(c.tile, T.lift)}"/><stop offset="1" stop-color="${c.tile}"/></linearGradient></defs>`
    + `<rect width="100" height="100" rx="${(T.radius * 100).toFixed(2)}" fill="url(#g)"/>`
    + `<g transform="translate(${pad.toFixed(2)} ${pad.toFixed(2)}) scale(${(s / 100).toFixed(4)})">${bird(design, c.ink, 'm')}</g></svg>\n`;
}

const rows = [];
for (const d of B.designs) {
  writeFileSync(join(OUT, `${d.name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="phiegg bird">${bird(d, B.ink, 'm')}</svg>\n`);
  const cells = B.colours.map((c) => {
    const f = `tile/${d.name}-${c.name}.svg`;
    writeFileSync(join(OUT, f), tile(d, c));
    return f;
  });
  rows.push({ d, cells });
  console.log('wrote', d.name, '+', cells.length, 'tiles');
}

const S = B.sheet, n = B.designs.length;
const img = (f, px) => `<img src="${f}" width="${px}" height="${px}" alt="">`;
writeFileSync(join(OUT, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Phiegg birds</title><style>
body{margin:0;padding:24px 16px;background:${S.back};font:15px/1.4 system-ui,sans-serif;color:#222}
h1{font-weight:300;font-size:22px;margin:0 0 4px}p{margin:0 0 20px;color:#555}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(${S.big * 2 + 40}px,1fr));gap:20px}
.card{background:#fff8;border-radius:12px;padding:14px}.card h2{font-weight:400;font-size:15px;margin:0 0 10px}
.tiles{display:grid;grid-template-columns:repeat(2,${S.big}px);gap:10px}.small{display:flex;gap:8px;margin-top:10px;align-items:center}
.n{display:inline-block;width:1.6em;height:1.6em;line-height:1.6em;text-align:center;border-radius:50%;background:#222;color:#fff;font-size:13px;margin-right:6px}
img{display:block}</style></head><body>
<h1>Phiegg birds - ${n} to choose from</h1><p>One body kept in place, wing, eye and crest changed. Each on the header's square, in ${B.colours.map((c) => c.name).join(', ')}; the small row is header size.</p>
<div class="grid">${rows.map(({ d, cells }, i) => `<div class="card"><h2><span class="n">${i + 1}</span>${d.name}</h2>
<div class="tiles">${cells.map((f) => img(f, S.big)).join('')}</div>
<div class="small">${cells.map((f) => img(f, S.small)).join('')}</div></div>`).join('\n')}</div></body></html>
`);
console.log('wrote', B.out + '/index.html');
