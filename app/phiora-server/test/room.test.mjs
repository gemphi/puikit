// Rooms shared by their people (room.mjs, host.mjs, bond.mjs): two accounts read each other in a room, a direct
// room is one room for both, an invite one makes works for another, roles and rights hold on the server, and no
// unsigned /tree read ever serves a message.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhiora } from '../src/server.mjs';

const ORIGIN = 'http://localhost:3118';
let root, base, phiora;
const put = (dir, file, v) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, file), JSON.stringify(v)); };

before(async () => {
  root = mkdtempSync(join(tmpdir(), 'phiora-room-'));
  const shop = join(root, 'shop'); const data = join(root, 'apps', 'club', 'public', 'data');
  put(shop, 'core.json', { users: [] });
  put(data, 'club.json', { app: 'club', people: 'data/people.json', host: 'data/host.json', joined: ['h_one'],
    nav: [{ id: 'direct', label: 'Direct', items: [{ id: 'lora', label: 'Lora' }] }, { id: 'home', label: 'Home', items: [{ id: 'home-text', label: 'Text', head: true, items: [{ id: 'lobby', label: 'lobby' }, { id: 'stage', label: 'stage' }] }] }] });
  put(data, 'people.json', { me: 'you', role: 'data/role.json', member: [{ id: 'you', name: 'You' }, { id: 'lora', name: 'Lora' }],
    room: { lora: { label: 'Lora', with: 'lora', message: [] }, lobby: { label: 'lobby', space: 'Home', message: [{ id: 'a01', by: 'lora', text: 'Hello' }] }, stage: { label: 'stage', space: 'Home', message: [] }, deck: { label: 'deck', space: 'One', message: [] }, yard: { label: 'yard', space: 'Two', message: [] } } });
  put(data, 'host.json', { template: [], host: [{ id: 'h_one', label: 'One', items: [{ id: 'deck', label: 'deck' }] }, { id: 'h_two', label: 'Two', items: [{ id: 'yard', label: 'yard' }] }] });
  put(data, 'role.json', { everyone: 'everyone', invite: 'invite',
    default: [{ id: 'everyone', label: 'Everyone', can: ['see', 'write', 'call', 'pin'] }, { id: 'mod', label: 'Moderators', can: ['see', 'write', 'call', 'pin', 'invite', 'manage'] }],
    space: { Home: { owner: 'lora', role: [{ id: 'everyone', label: 'Everyone', can: ['see', 'write', 'call'] }, { id: 'host', label: 'Hosts', can: ['see', 'write', 'call', 'pin', 'invite', 'manage'] }], give: { lora: ['host'] }, room: { stage: { write: ['host'] } } } } });
  phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_SEED: '0' }, dataDir: join(root, 'data'), appsDir: join(root, 'apps'), shopDataDir: shop, itemsDir: join(root, 'none') });
  await new Promise((ok) => phiora.server.listen(0, ok));
  base = 'http://localhost:' + phiora.server.address().port;
  await people();
});
after(() => { phiora.server.close(); try { rmSync(root, { recursive: true, force: true }); } catch { /* the database file may still be open on Windows */ } });

/** A browser: keeps its session cookie, sends Origin. */
const client = (ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36') => {
  let cookie = '';
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { origin: ORIGIN, 'user-agent': ua, ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    const text = await r.text(); return { status: r.status, body: text ? JSON.parse(text) : undefined };
  };
  return { get: (p) => call('GET', p), post: (p, b) => call('POST', p, b ?? {}), put: (p, b) => call('PUT', p, b), patch: (p, b) => call('PATCH', p, b), del: (p) => call('DELETE', p) };
};
/** An account, signed in. */
const account = async (handle, ua) => {
  const c = client(ua); const r = await c.post('/auth/register', { handle, name: handle[0].toUpperCase() + handle.slice(1), password: 'correct-horse' });
  assert.equal(r.status, 200); c.id = r.body.id; return c;
};
let ana, ben, cai;
const people = async () => { ana = await account('ana'); ben = await account('ben'); cai = await account('cai', 'Phiogy (Windows)'); };

test('two accounts read each other in a room, and a page that asks again hears only what changed', async () => {
  const first = await ben.get('/room/club/lobby');
  assert.equal(first.body.kind, 'host'); assert.deepEqual(first.body.can, ['see', 'write', 'call']);
  const sent = await ana.post('/room/club/lobby', { ref: 'm1', text: 'Morning all' });
  assert.equal(sent.status, 201); assert.equal(sent.body.message.by, ana.id);
  const again = await ben.get('/room/club/lobby?seen=' + first.body.stamp);
  assert.equal(again.body.same, undefined);
  assert.deepEqual(again.body.message.map((x) => x.text), ['Morning all']);
  assert.equal(again.body.people.find((p) => p.id === ana.id).name, 'Ana');
  assert.equal((await ben.get('/room/club/lobby?seen=' + again.body.stamp)).body.same, true);
  // The same id again is the same message; a reply names the one it answers.
  assert.equal((await ana.post('/room/club/lobby', { ref: 'm1', text: 'Morning all' })).status, 201);
  await ben.post('/room/club/lobby', { ref: 'm2', text: 'Hi Ana', reply: 'm1' });
  const both = (await ana.get('/room/club/lobby')).body.message;
  assert.deepEqual(both.map((x) => [x.id, x.reply ?? null]), [['m1', null], ['m2', 'm1']]);
});

test('marks, pins and votes are shared; rights hold on the server', async () => {
  await ben.post('/room/club/lobby/mark', { message: 'm1', icon: 'heart', on: true });
  await ben.post('/room/club/lobby/mark', { message: 'a01', icon: 'heart', on: true });
  const seen = (await ana.get('/room/club/lobby')).body.mark;
  assert.deepEqual(seen.m1.mark.heart, { n: 1, mine: false }); assert.deepEqual(seen.a01.mark.heart, { n: 1, mine: false });
  assert.equal((await ben.get('/room/club/lobby')).body.mark.m1.mark.heart.mine, true);
  // Everyone in Home writes and calls but does not pin; only hosts write in stage.
  assert.equal((await ana.post('/room/club/lobby/pin', { message: 'm1', on: true })).status, 403);
  assert.equal((await ana.post('/room/club/stage', { ref: 's1', text: 'Can I?' })).status, 403);
  await ana.post('/room/club/lobby', { ref: 'p1', poll: { question: 'Tea?', answer: ['Yes', 'No'] } });
  await ana.post('/room/club/lobby/vote', { message: 'p1', pick: [0] }); await ben.post('/room/club/lobby/vote', { message: 'p1', pick: [0] });
  const vote = (await cai.get('/room/club/lobby')).body.mark.p1.vote;
  assert.deepEqual(vote, { count: [2], mine: [] });
  assert.equal((await ana.post('/room/club/lobby', { ref: 'p2', poll: { question: 'Tea?', answer: ['Yes'] } })).status, 400);
});

test('no unsigned read serves a message: /tree, its rows, a record, the change log', async () => {
  const anyone = client();
  const tree = (await anyone.get('/tree')).body;
  assert.ok(!tree.sources.some((s) => ['message', 'mark', 'direct', 'hostState', 'invite', 'bond', 'follow'].includes(s.kind)));
  assert.deepEqual((await anyone.get('/tree?kind=message')).body.sources, []);
  assert.equal((await anyone.get('/tree/rows?kind=message')).status, 404);
  assert.equal((await anyone.get('/tree/item/message/whatever')).status, 404);
  assert.ok(!(await anyone.get('/tree/change?n=200')).body.changes.some((c) => c.kind === 'message'));
  assert.deepEqual((await anyone.get('/tree/change?kind=message')).body.changes, []);
  // Nor through the plain record routes, signed in or not, and a guest reads nothing in a room.
  assert.equal((await ana.post('/tree/item', { kind: 'message', fields: { room: 'club/lobby', text: 'sneak' } })).status, 403);
  // The public kinds the data files seed under like names (a host's card, a voice room) are served as before.
  assert.equal((await ana.post('/tree/item', { kind: 'host', fields: { name: 'A public card' } })).status, 201);
  assert.ok((await anyone.get('/tree?kind=host')).body.sources.some((s) => s.kind === 'host' && s.rows.some((r) => r.name === 'A public card')));
  const guest = await anyone.get('/room/club/lobby');
  assert.deepEqual(guest.body.message, []); assert.deepEqual(guest.body.can, []);
  assert.equal((await anyone.post('/room/club/lobby', { ref: 'g1', text: 'hi' })).status, 401);
});

test('a direct room between two accounts is one room, and only theirs', async () => {
  const a = (await ana.post('/direct/club', { with: ben.id })).body; const b = (await ben.post('/direct/club', { with: ana.id })).body;
  assert.equal(a.room, b.room); assert.equal(a.with.handle, 'ben');
  await ana.post('/room/club/' + a.room, { ref: 'd1', text: 'Just us' });
  assert.deepEqual((await ben.get('/room/club/' + a.room)).body.message.map((x) => x.text), ['Just us']);
  const other = (await cai.get('/room/club/' + a.room)).body;
  assert.deepEqual(other.message, []); assert.deepEqual(other.can, []);
  assert.equal((await cai.post('/room/club/' + a.room, { ref: 'x', text: 'me too' })).status, 403);
  assert.deepEqual((await ben.get('/direct/club')).body.direct.map((x) => [x.room, x.with.id]), [[a.room, ana.id]]);
  assert.deepEqual((await cai.get('/direct/club')).body.direct, []);
  // A conversation with a person of the files is nobody else's: each reads only what they wrote there.
  await ana.post('/room/club/lora', { ref: 'l1', text: 'Dear Lora' });
  assert.deepEqual((await ben.get('/room/club/lora')).body.message, []);
  assert.deepEqual((await ana.get('/room/club/lora')).body.message.map((x) => x.text), ['Dear Lora']);
});

test('hosts of the catalogue are joined and left; the app\'s own hold everyone', async () => {
  assert.ok((await ana.get('/room/club/deck')).body.can.includes('write'));
  assert.deepEqual((await ana.get('/room/club/yard')).body.can, []);
  await ana.patch('/host/club/h_one', { join: false }); await ana.patch('/host/club/h_two', { join: true });
  assert.deepEqual((await ana.get('/room/club/deck')).body.can, []);
  assert.ok((await ana.get('/room/club/yard')).body.can.includes('see'));
  assert.deepEqual((await ana.get('/host/club')).body, { in: ['h_two'], out: ['h_one'], made: [] });
  await ana.patch('/host/club/h_one', { join: true });
  assert.ok((await ana.get('/room/club/deck')).body.can.includes('see'));
});

test('a host one makes is theirs; an invite they make works for another account', async () => {
  const group = { id: 'mclub', label: 'Book club', icon: 'users', items: [{ id: 'mclub-h0', label: 'Text', head: true, items: [{ id: 'mclub-0', label: 'general' }] }] };
  assert.equal((await ana.post('/host/club', { group, room: { 'mclub-0': { label: 'general' } } })).status, 201);
  assert.equal((await ben.post('/host/club', { group, room: { 'mclub-0': { label: 'general' } } })).status, 409);
  await ana.post('/room/club/mclub-0', { ref: 'b1', text: 'Chapter one tonight' });
  assert.deepEqual((await ben.get('/room/club/mclub-0')).body.message, []);
  assert.equal((await ben.patch('/host/club/mclub', { join: true })).status, 403);
  assert.equal((await ben.post('/host/club/mclub/invite', {})).status, 403);
  const inv = (await ana.post('/host/club/mclub/invite', { code: 'read-with-us', minutes: 0, uses: 1 })).body.invite;
  assert.equal(inv.code, 'read-with-us');
  assert.equal((await ana.post('/host/club/mclub/invite', { code: 'read-with-us' })).status, 409);
  const seen = (await ben.get('/invite/club/read-with-us')).body;
  assert.equal(seen.state, 'ok'); assert.equal(seen.host.label, 'Book club'); assert.equal(seen.inside, false);
  const joined = (await ben.post('/invite/club/read-with-us')).body;
  assert.equal(joined.host.first, 'mclub-0');
  assert.deepEqual((await ben.get('/room/club/mclub-0')).body.message.map((x) => x.text), ['Chapter one tonight']);
  assert.deepEqual((await ben.get('/host/club')).body.made.map((x) => x.id), ['mclub']);
  // One use only; a code nobody made; a host whose invites are paused.
  assert.equal((await cai.get('/invite/club/read-with-us')).body.state, 'over');
  assert.equal((await cai.post('/invite/club/read-with-us')).status, 409);
  assert.equal((await cai.get('/invite/club/nobody-made-it')).body.state, 'unknown');
  const more = (await ana.post('/host/club/mclub/invite', { minutes: 60, uses: 0 })).body.invite;
  await ana.patch('/host/club/mclub', { paused: true });
  assert.equal((await cai.get('/invite/club/' + more.code)).body.state, 'stopped');
  await ana.patch('/host/club/mclub', { paused: false });
  assert.equal((await cai.post('/invite/club/' + more.code)).status, 200);
  assert.equal((await ben.get('/host/club/mclub')).body.invite.length, 0);
  assert.equal((await ana.get('/host/club/mclub')).body.invite.length, 2);
});

test('roles given, rights set and the host handed on are the same for everyone', async () => {
  assert.equal((await ben.patch('/host/club/mclub', { give: { who: cai.id, role: 'mod', on: true } })).status, 403);
  await ana.patch('/host/club/mclub', { give: { who: ben.id, role: 'mod', on: true } });
  const asBen = (await ben.get('/host/club/mclub')).body.host;
  assert.ok(asBen.can.host.includes('manage')); assert.deepEqual(asBen.rule.give[ben.id], ['mod']);
  await ben.patch('/host/club/mclub', { allow: { room: 'mclub-0', verb: 'write', role: 'everyone', on: false } });
  assert.equal((await cai.post('/room/club/mclub-0', { ref: 'c1', text: 'hello?' })).status, 403);
  assert.ok((await ben.post('/room/club/mclub-0', { ref: 'b2', text: 'Mods only for now' })).status === 201);
  assert.equal((await ben.patch('/host/club/mclub', { owner: ben.id })).status, 403);
  await ana.patch('/host/club/mclub', { owner: ben.id });
  assert.equal((await ana.patch('/host/club/mclub', { owner: ana.id })).status, 403);
  assert.equal((await cai.get('/host/club/mclub')).body.host.rule.owner, ben.id);
  assert.equal((await ben.patch('/host/club/mclub', { join: false })).status, 409);
});

test('friend requests between accounts reach the other side', async () => {
  assert.equal((await ana.put('/bond/club/' + ben.id, { to: 'sent' })).body.stand, 'sent');
  assert.deepEqual((await ben.get('/bond/club')).body.bond.map((x) => [x.id, x.stand]), [[ana.id, 'asked']]);
  assert.equal((await ben.put('/bond/club/' + ana.id, { to: 'sent' })).status, 409);
  assert.equal((await ben.put('/bond/club/' + ana.id, { to: 'with' })).body.stand, 'with');
  assert.deepEqual((await ana.get('/bond/club')).body.bond.map((x) => x.stand), ['with']);
  assert.deepEqual((await cai.get('/bond/club')).body.bond, []);
  assert.equal((await ana.put('/bond/club/nobody', { to: 'sent' })).status, 400);
  assert.deepEqual((await cai.get('/people/club?find=@ana')).body.person.map((x) => x.id), [ana.id]);
});

test('a status shows to others; unseen shows as off', async () => {
  await ana.put('/state/me-status', { shown: 'busy', words: 'At the bench' });
  await ana.get('/room/club/lobby');
  const p = (await ben.get('/room/club/lobby')).body.people.find((x) => x.id === ana.id);
  assert.equal(p.presence, 'busy'); assert.equal(p.state, 'At the bench');
  await ana.put('/state/me-status', { shown: 'unseen' });
  assert.equal((await ben.get('/people/club?id=' + ana.id)).body.person[0].presence, 'off');
});

test('the signed-in browsers list names Phiogy for Windows', async () => {
  const r = await cai.get('/auth/session');
  assert.equal(r.status, 200); assert.equal(r.body[0].browser, 'Phiogy for Windows');
});
