#!/usr/bin/env node
// The Phiegg bird for merchandise: every item in site.json brand.merch.items, in every colour of brand.merch.colours,
// as an SVG (the drawing's ink swapped for the colour) and as a transparent square PNG brand.merch.png pixels wide,
// into public/<brand.merch.out>. The PNGs are drawn by headless Chrome, so they match what a browser shows.
// With a set's name (node scripts/logo-merch.mjs media), the same for site.json brand.<name>: brand.media's items are
// every file scripts/logo-media.py wrote (its frames and token signs).
//   node scripts/logo-merch.mjs [merch|media] [--chrome "C:/Program Files/Google/Chrome/Application/chrome.exe"]
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SET = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'merch';
const M = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'site.json'), 'utf8')).brand[SET];
if (!M.items) M.items = Object.fromEntries([...Object.keys(M.frame ?? {}), ...Object.keys(M.token?.sign ?? {}), 'pound']
  .map((n) => [n, `${M.out}/${n}.svg`]));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const CHROME = arg('--chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const OUT = join(ROOT, 'public', M.out);
mkdirSync(OUT, { recursive: true });

// The SVGs: the ink (fills and strokes) in each colour.
const made = [];
for (const [name, src] of Object.entries(M.items)) {
  const svg = readFileSync(join(ROOT, 'public', src), 'utf8');
  for (const [colour, hex] of Object.entries(M.colours)) {
    const file = join(OUT, SET === 'merch' ? `${name}-${colour}.svg` : colour, SET === 'merch' ? '' : `${name}.svg`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, svg.split(M.ink).join(hex));
    made.push(file);
  }
}

// The PNGs: one Chrome, each SVG on a transparent page the PNG's size.
const PORT = 9391, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'merch-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let page;
for (let i = 0; i < 60 && !page; i++) { await sleep(300); try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((x) => x.type === 'page'); } catch {} }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const wait = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await send('Emulation.setDeviceMetricsOverride', { width: M.png, height: M.png, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
try {
  for (const file of made) {
    const html = join(dirname(file), '.page.html');
    writeFileSync(html, `<html><body style="margin:0;background:transparent"><img src="${pathToFileURL(file).href}" width="${M.png}" height="${M.png}" style="display:block"/></body></html>`);
    await send('Page.navigate', { url: pathToFileURL(html).href }); await sleep(700);
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: M.png, height: M.png, scale: 1 } });
    writeFileSync(file.replace(/\.svg$/, '.png'), Buffer.from(shot.result.data, 'base64'));
    console.log('wrote', file.replace(ROOT, '').replace(/\\/g, '/'), '+ .png');
  }
} finally { ws.close(); chrome.kill(); }
