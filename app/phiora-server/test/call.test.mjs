import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhiora } from '../src/server.mjs';

const ORIGIN = 'http://localhost:3118';
let root, base, phiora;

before(async () => {
  root = mkdtempSync(join(tmpdir(), 'phiora-call-'));
  const shop = join(root, 'shop'); mkdirSync(shop); mkdirSync(join(root, 'apps'));
  writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [] }));
  phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_SEED: '0', PHI_STORE: 'json', PHI_CALL_ICE: '[{"urls":"stun:stun.test:3478"}]' }, dataDir: join(root, 'data'), appsDir: join(root, 'apps'), shopDataDir: shop });
  await new Promise((ok) => phiora.server.listen(0, ok));
  base = 'http://localhost:' + phiora.server.address().port;
});
after(() => { phiora.calls.close(); phiora.server.close(); rmSync(root, { recursive: true, force: true }); });

/** A page: its own session cookie, a peer id, the room's line (events read one at a time) and posts to the room. */
const page = async (peer, room = 'demo/lobby') => {
  const stop = new AbortController();
  const r = await fetch(base + '/call/' + room + '?peer=' + peer, { headers: { origin: ORIGIN }, signal: stop.signal });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  const reader = r.body?.getReader(); const text = new TextDecoder(); let buf = '';
  const next = async () => {
    for (;;) {
      const at = buf.indexOf('\n\n');
      if (at >= 0) { const raw = buf.slice(0, at); buf = buf.slice(at + 2); if (raw.startsWith('data: ')) return JSON.parse(raw.slice(6)); continue; }
      const { value, done } = await reader.read(); if (done) return undefined;
      buf += text.decode(value, { stream: true });
    }
  };
  const post = async (body, as = cookie) => {
    const p = await fetch(base + '/call/' + room, { method: 'POST', headers: { origin: ORIGIN, cookie: as, 'content-type': 'application/json' }, body: JSON.stringify({ peer, ...body }) });
    return { status: p.status, body: await p.json() };
  };
  return { status: r.status, type: r.headers.get('content-type'), cookie, next, post, close: () => stop.abort() };
};

test('two pages in a room find each other and trade signals', async () => {
  const a = await page('peer-aaaaaaaa'); const b = await page('peer-bbbbbbbb');
  assert.equal(a.status, 200); assert.match(a.type, /text\/event-stream/);
  assert.deepEqual(await a.next(), { roster: [], ice: [{ urls: 'stun:stun.test:3478' }] });
  assert.deepEqual((await b.next()).roster, []);

  // A starts a call: B, who has only the room open, hears of it (the incoming call).
  assert.equal((await a.post({ join: true })).status, 200);
  const calling = [{ peer: 'peer-aaaaaaaa', name: 'Guest', handle: null }];
  assert.deepEqual(await a.next(), { roster: calling }); assert.deepEqual(await b.next(), { roster: calling });

  // A signal to someone who has not joined goes nowhere; once both are in, it arrives, in the order sent.
  await a.post({ send: [{ to: 'peer-bbbbbbbb', signal: { lost: true } }] });
  await b.post({ join: true });
  assert.equal((await a.next()).roster.length, 2); assert.equal((await b.next()).roster.length, 2);
  await a.post({ send: [{ to: 'peer-bbbbbbbb', signal: { description: { type: 'offer', sdp: 'v=0' } } }, { to: 'peer-bbbbbbbb', signal: { candidate: { candidate: 'c1' } } }] });
  assert.deepEqual(await b.next(), { from: 'peer-aaaaaaaa', signal: { description: { type: 'offer', sdp: 'v=0' } } });
  assert.deepEqual(await b.next(), { from: 'peer-aaaaaaaa', signal: { candidate: { candidate: 'c1' } } });

  // B's page goes away: A's roster no longer holds them.
  b.close();
  assert.deepEqual(await a.next(), { roster: calling });
  await a.post({ join: false });
  assert.deepEqual(await a.next(), { roster: [] });
  a.close();
});

test('a peer belongs to whoever opened its line', async () => {
  const a = await page('peer-cccccccc', 'demo/den'); const other = await page('peer-dddddddd', 'demo/den');
  await a.next(); await other.next();
  assert.equal((await a.post({ join: true }, other.cookie)).status, 403);
  assert.equal((await other.post({ peer: 'peer-eeeeeeee', join: true })).status, 403);
  assert.equal((await page('short', 'demo/den')).status, 400);
  const taken = await fetch(base + '/call/demo/den?peer=peer-cccccccc', { headers: { origin: ORIGIN, cookie: other.cookie } });
  assert.equal(taken.status, 403); await taken.text();
  a.close(); other.close();
});

test('a call holds eight', async () => {
  const pages = [];
  for (let i = 0; i < 9; i++) { const p = await page('peer-full-' + i + 'xxx', 'demo/hall'); pages.push(p); }
  const got = []; for (const p of pages) got.push((await p.post({ join: true })).status);
  assert.deepEqual(got, [200, 200, 200, 200, 200, 200, 200, 200, 409]);
  pages.forEach((p) => p.close());
});
