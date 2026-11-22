// Phiora in front of the one call line (Phiogy's, in Rust): the pages ask Phiora as before, Phiora passes each ask on
// and says who the page belongs to. Needs the built program (`phikit/target/main-ui/debug/phiogy.exe`, or the path in
// PHIOGY); without it these cases are skipped, and `call.test.mjs` still covers Phiora's own rooms.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPhiora } from '../src/server.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const program = resolve(process.env.PHIOGY || join(here, '../../../../phikit/target/main-ui/debug/phiogy.exe'));
const skip = existsSync(program) ? false : 'the Phiogy program is not built';
const ORIGIN = 'http://localhost:3118';
const KEY = 'a-word-for-the-test';
let root, base, phiora, line;

before(async () => {
  if (skip) return;
  // The line on a port the system chooses; it says where it listens on its first line.
  line = spawn(program, ['--line', '--port', '0'], { env: { ...process.env, PHI_CALL_KEY: KEY, PHI_CALL_ICE: '[{"urls":"stun:stun.test:3478"}]' }, stdio: ['ignore', 'pipe', 'inherit'] });
  const port = await new Promise((ok, no) => { let said = ''; line.stdout.on('data', (piece) => { said += piece; const found = said.match(/:(\d+)\s/); if (found) ok(found[1]); }); line.on('exit', () => no(new Error('the line did not open'))); });
  root = mkdtempSync(join(tmpdir(), 'phiora-line-'));
  const shop = join(root, 'shop'); mkdirSync(shop); mkdirSync(join(root, 'apps'));
  writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [] }));
  phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_SEED: '0', PHI_STORE: 'json', PHI_CALL_LINE: 'http://localhost:' + port, PHI_CALL_KEY: KEY }, dataDir: join(root, 'data'), appsDir: join(root, 'apps'), shopDataDir: shop });
  await new Promise((ok) => phiora.server.listen(0, ok));
  base = 'http://localhost:' + phiora.server.address().port;
});
after(() => { if (skip) return; phiora.calls.close(); phiora.server.close(); line.kill(); rmSync(root, { recursive: true, force: true }); });

/** A page: its own Phiora session, a peer id, the room's line (events read one at a time) and posts to the room. */
const page = async (peer, room, cookie) => {
  // A visitor is known to Phiora by its cookie before it opens a line, as a page that has loaded is.
  const mine = cookie ?? ((await fetch(base + '/me', { headers: { origin: ORIGIN } })).headers.get('set-cookie') || '').split(';')[0];
  const stop = new AbortController();
  const r = await fetch(base + '/call/' + room + '?peer=' + peer, { headers: { origin: ORIGIN, cookie: mine }, signal: stop.signal });
  const reader = r.body?.getReader(); const text = new TextDecoder(); let buf = '';
  const next = async () => {
    for (;;) {
      const at = buf.indexOf('\n\n');
      if (at >= 0) { const raw = buf.slice(0, at); buf = buf.slice(at + 2); if (raw.startsWith('data: ')) return JSON.parse(raw.slice(6)); continue; }
      const { value, done } = await reader.read(); if (done) return undefined;
      buf += text.decode(value, { stream: true });
    }
  };
  const post = async (body, as = mine) => {
    const p = await fetch(base + '/call/' + room, { method: 'POST', headers: { origin: ORIGIN, cookie: as, 'content-type': 'application/json' }, body: JSON.stringify({ peer, ...body }) });
    return { status: p.status, body: await p.json() };
  };
  return { status: r.status, type: r.headers.get('content-type'), lineCookie: r.headers.get('set-cookie'), cookie: mine, next, post, close: () => stop.abort() };
};

test('through Phiora, two pages find each other on the Rust line and trade signals', { skip }, async () => {
  const a = await page('peer-aaaaaaaa', 'demo/lobby'); const b = await page('peer-bbbbbbbb', 'demo/lobby');
  assert.equal(a.status, 200); assert.match(a.type, /text\/event-stream/);
  // The line's own cookie never reaches the page: Phiora's session is the only one.
  assert.equal(a.lineCookie, null);
  assert.deepEqual(await a.next(), { roster: [], ice: [{ urls: 'stun:stun.test:3478' }] });
  assert.deepEqual((await b.next()).roster, []);
  assert.equal((await a.post({ join: true })).status, 200);
  const calling = (await a.next()).roster;
  assert.equal(calling.length, 1); assert.equal(calling[0].peer, 'peer-aaaaaaaa'); assert.equal(typeof calling[0].name, 'string');
  assert.deepEqual((await b.next()).roster, calling);
  await b.post({ join: true });
  assert.equal((await a.next()).roster.length, 2); assert.equal((await b.next()).roster.length, 2);
  await a.post({ send: [{ to: 'peer-bbbbbbbb', signal: { description: { type: 'offer', sdp: 'v=0' } } }, { to: 'peer-bbbbbbbb', signal: { candidate: { candidate: 'c1' } } }] });
  assert.deepEqual(await b.next(), { from: 'peer-aaaaaaaa', signal: { description: { type: 'offer', sdp: 'v=0' } } });
  assert.deepEqual(await b.next(), { from: 'peer-aaaaaaaa', signal: { candidate: { candidate: 'c1' } } });
  // B's page goes away: the Rust line hears at once, and A's roster no longer holds them.
  b.close();
  assert.deepEqual((await a.next()).roster, calling);
  a.close();
});

test('through Phiora, a peer belongs to whoever Phiora says opened its line', { skip }, async () => {
  const a = await page('peer-cccccccc', 'demo/den'); const other = await page('peer-dddddddd', 'demo/den');
  await a.next(); await other.next();
  // Another visitor may not speak for A's page; A's own second page may.
  assert.equal((await a.post({ join: true }, other.cookie)).status, 403);
  const second = await page('peer-eeeeeeee', 'demo/den', a.cookie); await second.next();
  assert.equal((await second.post({ peer: 'peer-cccccccc', join: true })).status, 200);
  a.close(); other.close(); second.close();
});

test('with the line gone, Phiora says so', { skip }, async () => {
  line.kill(); await new Promise((ok) => line.on('exit', ok));
  const r = await fetch(base + '/call/demo/gone?peer=peer-ffffffff', { headers: { origin: ORIGIN } });
  assert.equal(r.status, 502); assert.equal((await r.json()).error, 'no_line');
});
