import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../src/store.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'phiora-store-'));

for (const kind of ['json', 'sqlite']) {
  test(`${kind}: users, sessions, handles, emails and one-time tokens`, () => {
    const dir = tmp();
    try {
      let s = createStore(dir, kind); assert.equal(s.kind, kind);
      const u = s.createUser({ id: 'u1', name: 'Ada', docs: { follow: { a: 1 } } });
      u.wallet = { usd: 5 }; s.saveUser(u);
      const sid = s.newSession('u1'); const sid2 = s.newSession('u1');
      s.claimHandle('ada', 'u1'); s.claimEmail('ada@x.io', 'u1'); s.claimEmail('ada2@x.io', 'u1');
      s.putToken('reset', 'tok', 'u1', { email: 'ada2@x.io' }, 60_000);
      s.putToken('verify', 'old', 'u1', null, -1);
      s.close();
      s = createStore(dir, kind); // reopen: everything persisted
      assert.deepEqual(s.user('u1').docs, { follow: { a: 1 } }); assert.equal(s.user('u1').wallet.usd, 5);
      assert.equal(s.session(sid).userId, 'u1');
      assert.equal(s.handleOwner('ada'), 'u1');
      assert.equal(s.emailOwner('ada@x.io'), undefined, 'changing the email releases the old one');
      assert.equal(s.emailOwner('ada2@x.io'), 'u1');
      assert.equal(s.takeToken('verify', 'old'), null, 'expired tokens are gone');
      assert.deepEqual(s.takeToken('reset', 'tok').data, { email: 'ada2@x.io' });
      assert.equal(s.takeToken('reset', 'tok'), null, 'tokens work once');
      s.dropUserSessions('u1', sid);
      assert.ok(s.session(sid)); assert.equal(s.session(sid2), undefined);
      s.dropSession(sid); assert.equal(s.session(sid), undefined);
      assert.equal(s.user('nobody'), null);
      s.close();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('sqlite imports an existing JSON data dir once', () => {
  const dir = tmp();
  try {
    const j = createStore(dir, 'json');
    j.createUser({ id: 'u_old', name: 'Old', guest: false, handle: 'old' }); const sid = j.newSession('u_old'); j.claimHandle('old', 'u_old'); j.claimEmail('old@x.io', 'u_old');
    const s = createStore(dir, 'sqlite');
    assert.ok(existsSync(join(dir, 'phiora.db')));
    assert.equal(s.user('u_old').name, 'Old'); assert.equal(s.session(sid).userId, 'u_old');
    assert.equal(s.handleOwner('old'), 'u_old'); assert.equal(s.emailOwner('old@x.io'), 'u_old');
    s.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const kind of ['json', 'sqlite']) {
  test(`${kind}: session metadata, sweep and delete`, async () => {
    const dir = tmp();
    try {
      const s = createStore(dir, kind);
      s.createUser({ id: 'u1', name: 'A' }); s.createUser({ id: 'guest_old', guest: true, name: 'Guest' });
      const a = s.newSession('u1', 'UA-1'); const g = s.newSession('guest_old');
      assert.equal(s.userSessions('u1')[0].ua, 'UA-1'); assert.ok(s.userSessions('u1')[0].created);
      s.touchSession(a, 'UA-2'); assert.equal(s.session(a).ua, 'UA-2');
      await new Promise((ok) => setTimeout(ok, 15));
      s.touchSession(a);
      const cut = Date.now() - 5;
      s.sweepSessions(cut);
      assert.ok(s.session(a)); assert.equal(s.session(g), undefined);
      if (kind === 'sqlite') assert.equal(s.user('guest_old'), null, 'unreachable guests are removed');
      s.claimHandle('a', 'u1'); s.claimEmail('a@x.io', 'u1'); s.putToken('reset', 't', 'u1', null, 60_000);
      s.deleteUser('u1');
      assert.equal(s.user('u1'), null); assert.equal(s.handleOwner('a'), undefined); assert.equal(s.emailOwner('a@x.io'), undefined);
      assert.equal(s.takeToken('reset', 't'), null); assert.equal(s.session(a), undefined);
      s.close();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
