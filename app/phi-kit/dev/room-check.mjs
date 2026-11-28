// The kit's rooms shared between people (src/room.ts; Phiora's room.mjs, host.mjs), seen in two real browsers, for
// any app with rooms: a Phiora of its own (in this process, an empty database in a temporary folder, the app files of
// this checkout), the app on it (Vite, from app/phi), and two headless Chromes, each its own browser with its own
// account. Ana writes in a room of a host and Ben's page shows it; the two meet in one direct room; Ana's invite lets
// Ben into the host she made; an unsigned /tree read holds no message. The words it looks for are the kit's own
// (src/words.json, talk.json); the room is the app's first room of a host, unless one is named. Pictures of Ben's page
// go to the folder given (default: a temporary one). Everything stops at the end.
//
//   node app/phi-kit/dev/room-check.mjs [--app phiogy] [--room lobby] [picture folder]
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APPS = join(HERE, '..', '..');
const json = (...path) => JSON.parse(readFileSync(join(...path), 'utf8'));
// What it is asked: the app, the room, and the folder for pictures.
const given = process.argv.slice(2);
const arg = (name) => { const at = given.indexOf(name); return at >= 0 ? given.splice(at, 2)[1] : undefined; };
const APP = arg('--app') ?? 'phiogy'; const named = arg('--room');
const OUT = given[0] ?? mkdtempSync(join(tmpdir(), 'room-check-shot-'));
// The kit's words, and the app's files: its people (the rooms, and the role file naming the invite page).
const words = json(HERE, '..', 'src', 'words.json'); const talk = json(HERE, '..', 'src', 'talk.json');
const data = json(APPS, APP, 'public', 'data', APP + '.json');
const people = json(APPS, APP, 'public', data.people);
const INVITE = (people.role ? json(APPS, APP, 'public', people.role) : {}).invite ?? 'invite';
const ROOM = named ?? Object.entries(people.room).find(([, r]) => r.space && !r.with && r.kind !== 'voice')?.[0];
const BOX = words.room.write.split('{')[0].trim();
const FIND = words.direct.find;
const JOIN = (host) => talk.invite.join.replace('{host}', host);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const steps = []; const step = (name, ok, more = '') => { steps.push([name, ok]); console.log((ok ? 'pass ' : 'FAIL ') + name + (more ? ' - ' + more : '')); };

// Phiora, on a port of its own, with nothing in it but what this check writes.
process.env.PHI_QUIET = '1';
const { createPhiora } = await import(pathToFileURL(join(APPS, 'phiora-server', 'src', 'server.mjs')).href);
const phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_SEED: '0' }, dataDir: mkdtempSync(join(tmpdir(), 'room-check-db-')), appsDir: APPS });
await new Promise((ok) => phiora.server.listen(0, ok));
const API = 'http://localhost:' + phiora.server.address().port;

// The app on it.
process.env.VITE_PHI_API = API;
const vite = await import(pathToFileURL(join(APPS, 'phi', 'node_modules', 'vite', 'dist', 'node', 'index.js')).href);
const web = await vite.createServer({ root: join(APPS, 'phi'), configFile: join(APPS, 'phi', 'vite.config.ts'), server: { port: 0, host: 'localhost' }, logLevel: 'error' });
await web.listen();
const WEB = 'http://localhost:' + web.httpServer.address().port + '/' + APP + '/';

/** A headless Chrome of its own (its own cookies), driven over its debugging port. */
const browser = async (port) => {
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'room-check-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let page; for (let k = 0; k < 60 && !page; k++) { await sleep(300); try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); } catch { /* not up yet */ } }
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const wait = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const run = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const b = {
    run, send, close: () => { ws.close(); chrome.kill(); },
    go: async (place) => { await send('Page.navigate', { url: WEB + place }); await sleep(1500); },
    api: (method, path, body) => run(`fetch(${JSON.stringify(API + path)}, { method: ${JSON.stringify(method)}, credentials: 'include', headers: { 'content-type': 'application/json' }, body: ${body === undefined ? 'undefined' : JSON.stringify(JSON.stringify(body))} }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))`),
    /** Wait until the page's words hold that, up to some seconds; how long it took, or null. */
    sees: async (words, seconds = 10) => { const t = Date.now(); for (let k = 0; k < seconds * 4; k++) { if (await run(`document.body.innerText.includes(${JSON.stringify(words)})`)) return Date.now() - t; await sleep(250); } return null; },
    /** Write in the room's box once the page has drawn it (up to ten seconds). */
    write: async (words) => {
      let at = null;
      for (let k = 0; k < 40 && !at; k++) { at = await run(`(() => { const e = [...document.querySelectorAll('input, textarea')].find((x) => (x.getAttribute('aria-label') || x.placeholder || '').startsWith(${JSON.stringify(BOX)})); if (!e) return null; e.focus(); return true; })()`); if (!at) await sleep(250); }
      if (!at) return false;
      await send('Input.insertText', { text: words });
      for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: type === 'keyDown' ? '\r' : undefined });
      return true;
    },
    shot: async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')); },
    click: async (words) => run(`(() => { const e = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === ${JSON.stringify(words)}); if (!e) return false; e.click(); return true; })()`),
  };
  return b;
};

let ana, ben;
try {
  [ana, ben] = await Promise.all([browser(9431), browser(9432)]);
  await ana.go(ROOM); await ben.go(ROOM);
  const a = await ana.api('POST', '/auth/register', { handle: 'ana.check', name: 'Ana Check', password: 'correct-horse' });
  const b = await ben.api('POST', '/auth/register', { handle: 'ben.check', name: 'Ben Check', password: 'correct-horse' });
  step('two accounts, one in each browser', a.status === 200 && b.status === 200 && a.body.id !== b.body.id);
  await ana.go(ROOM); await ben.go(ROOM);

  // A room of a host: what Ana writes in her page shows in Ben's within a few seconds.
  console.log('the app: ' + APP + ', the room: ' + ROOM);
  const said = 'Morning from Ana ' + Date.now();
  step('Ana writes in ' + ROOM + ' from its box', await ana.write(said));
  const took = await ben.sees(said, 10);
  step('Ben\'s page shows it', took !== null, took === null ? 'not within 10 s' : 'after ' + (took / 1000).toFixed(1) + ' s');
  await ben.shot(ROOM + '-ben');
  const back = 'Hello Ana, from Ben ' + Date.now(); await ben.write(back);
  step('and Ana\'s shows Ben\'s answer', (await ana.sees(back, 10)) !== null);

  // One direct room for the two.
  const roomA = (await ana.api('POST', '/direct/' + APP, { with: b.body.id })).body.room;
  const roomB = (await ben.api('POST', '/direct/' + APP, { with: a.body.id })).body.room;
  step('a direct room between them is one room', !!roomA && roomA === roomB, roomA);
  await ana.go(roomA); await ben.go(roomB);
  const quiet = 'Just between us ' + Date.now(); await ana.write(quiet);
  step('Ben reads what Ana wrote there', (await ben.sees(quiet, 10)) !== null);
  // The menu's direct list (the group with the way to find anyone) is read again every half minute
  // (limit.json `room.list`); the room open in the page is one of its entries then, so the shell shows that group.
  const inList = `(() => { let box = [...document.querySelectorAll('button, a')].find((e) => e.innerText?.includes(${JSON.stringify(FIND)}) && e.getBoundingClientRect().width > 0);
    for (let k = 0; k < 4 && box; k++) box = box.parentElement; return !!box && box.innerText.includes('Ana Check'); })()`;
  let listed = false;
  for (let k = 0; k < 80 && !listed; k++) { listed = await ben.run(inList); if (!listed) await sleep(500); }
  if (!listed && process.env.ROOM_CHECK_DEBUG) console.log(JSON.stringify(await ben.api('GET', '/direct/' + APP)), await ben.run(`document.body.innerText.slice(0, 600)`));
  step('and Ana stands in Ben\'s direct list', listed);
  await ben.shot('direct-ben');

  // A host Ana makes, and her invite, which works for Ben.
  const group = { id: 'mcheck', label: 'Check Club', icon: 'users', items: [{ id: 'mcheck-h0', label: 'Text', head: true, items: [{ id: 'mcheck-0', label: 'general', icon: 'hash' }] }] };
  await ana.api('POST', '/host/' + APP, { group, room: { 'mcheck-0': { label: 'general' } } });
  await ana.go('mcheck-0'); const club = 'Welcome to the club ' + Date.now(); await ana.write(club);
  const code = (await ana.api('POST', '/host/' + APP + '/mcheck/invite', { minutes: 60, uses: 1 })).body?.invite?.code;
  step('Ana makes an invite to her host', !!code, code);
  await ben.go(INVITE + '/' + code);
  step('Ben\'s page shows the invite', (await ben.sees(JOIN('Check Club'), 10)) !== null);
  await ben.shot('invite-ben');
  await ben.click(JOIN('Check Club'));
  step('Ben joins and reads the host\'s room', (await ben.sees(club, 10)) !== null);
  await ben.shot('club-ben');

  // Nobody signed in reads any of it.
  const tree = await (await fetch(API + '/tree')).json();
  const kinds = tree.sources.map((s) => s.kind);
  const room = await (await fetch(API + '/room/' + APP + '/' + ROOM)).json();
  step('an unsigned /tree read holds no message', !kinds.includes('message') && !kinds.includes('direct') && room.message.length === 0, 'kinds: ' + (kinds.join(', ') || 'none'));
} catch (e) {
  step('the check ran', false, String(e?.stack ?? e));
} finally {
  ana?.close(); ben?.close(); await web.close(); phiora.server.close();
  console.log('pictures: ' + OUT);
  const failed = steps.filter(([, ok]) => !ok).length; console.log(failed ? failed + ' failed' : 'all ' + steps.length + ' passed');
  process.exit(failed ? 1 : 0);
}
