#!/usr/bin/env node
// Draw an SVG to a transparent square PNG with headless Chrome, so the pixels are what a browser shows.
//   node scripts/raster.mjs in.svg out.png 4096 [--chrome path]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , src, out, sizeArg] = process.argv;
const size = Number(sizeArg ?? 4096);
const i = process.argv.indexOf('--chrome');
const CHROME = i > 0 ? process.argv[i + 1] : 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir = mkdtempSync(join(tmpdir(), 'raster-'));
const PORT = 9393, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--hide-scrollbars', `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
try {
  let page;
  for (let k = 0; k < 60 && !page; k++) { await sleep(300); try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((x) => x.type === 'page'); } catch {} }
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const wait = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  const html = join(dir, 'page.html');
  writeFileSync(html, `<html><body style="margin:0;background:transparent"><img src="${pathToFileURL(resolve(src)).href}" width="${size}" height="${size}" style="display:block"/></body></html>`);
  await send('Page.navigate', { url: pathToFileURL(html).href }); await sleep(900);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } });
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  ws.close();
} finally { chrome.kill(); }
