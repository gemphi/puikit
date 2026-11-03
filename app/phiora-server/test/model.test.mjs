import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modelFromEnv } from '../src/model.mjs';

const capture = (reply) => { const calls = []; const f = async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); return new Response(JSON.stringify(reply), { status: 200 }); }; return { calls, f }; };

test('no model configured → canned reply, no network', async () => {
  const { calls, f } = capture({});
  const m = modelFromEnv({}, f);
  assert.equal(m.configured, false);
  const r = await m.reply({ messages: [{ role: 'user', text: 'hello' }] });
  assert.equal(r.offline, true); assert.match(r.text, /hello/); assert.equal(calls.length, 0);
});

test('anthropic provider: Messages API shape, key header, leading assistant turns dropped', async () => {
  const { calls, f } = capture({ content: [{ type: 'text', text: 'Try the sash.' }] });
  const m = modelFromEnv({ ANTHROPIC_API_KEY: 'k', PHI_MODEL: 'claude-test' }, f);
  assert.equal(m.provider, 'anthropic');
  const r = await m.reply({ app: 'phiegg', persona: 'Ponte', messages: [{ role: 'assistant', text: 'Hi Noor' }, { role: 'user', text: 'Outfit?' }] });
  assert.equal(r.text, 'Try the sash.');
  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[0].init.headers['x-api-key'], 'k');
  assert.equal(calls[0].body.model, 'claude-test');
  assert.match(calls[0].body.system, /Ponte/);
  assert.deepEqual(calls[0].body.messages, [{ role: 'user', content: 'Outfit?' }]);
});

test('openai-compatible provider: bearer key optional, history capped at 20 turns', async () => {
  const { calls, f } = capture({ choices: [{ message: { content: 'ok' } }] });
  const m = modelFromEnv({ PHI_MODEL_URL: 'http://localhost:11434/v1/', PHI_MODEL_KEY: 's' }, f);
  const msgs = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: 'm' + i }));
  await m.reply({ messages: msgs });
  assert.equal(calls[0].url, 'http://localhost:11434/v1/chat/completions');
  assert.equal(calls[0].init.headers.authorization, 'Bearer s');
  assert.equal(calls[0].body.messages.length, 21); // system + 20
});

test('model errors surface as exceptions (server turns them into 502)', async () => {
  const m = modelFromEnv({ PHI_MODEL_URL: 'http://x/v1' }, async () => new Response('nope', { status: 500 }));
  await assert.rejects(() => m.reply({ messages: [{ role: 'user', text: 'hi' }] }), /model 500/);
});
