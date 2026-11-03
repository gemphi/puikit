import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { delegationSecret, signDelegation, verifyDelegation } from '../src/delegation.mjs';

const SECRET = 'a-shared-secret-for-tests';
test('signs a standard HS256 JWT that verifies and expires', () => {
  const now = Date.UTC(2026, 9, 12);
  const { token, claims } = signDelegation({ aud: 'phient', sub: 'u1' }, SECRET, { ttlMs: 60_000, now });
  const [h, p, s] = token.split('.');
  assert.equal(createHmac('sha256', SECRET).update(h + '.' + p).digest('base64url'), s);
  assert.deepEqual(verifyDelegation(token, SECRET, { audience: 'phient', now }), claims);
  assert.throws(() => verifyDelegation(token, SECRET, { now: now + 61_000 }), /expired/);
  assert.throws(() => verifyDelegation(token, 'another-secret-entirely', { now }), /signature/);
  assert.throws(() => verifyDelegation('nope', SECRET), /Not a delegation/);
});
test('the secret comes from PHI_DELEGATION_SECRET, or a random one per process', () => {
  assert.deepEqual(delegationSecret({ PHI_DELEGATION_SECRET: SECRET }), { secret: SECRET, ephemeral: false });
  assert.equal(delegationSecret({}).ephemeral, true);
});
