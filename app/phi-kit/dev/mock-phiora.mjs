// Stand-in for the Phiora API so the apps can run against VITE_PHI_API before the real server is up.
// Implements the contract in ../src/api.ts. Zero dependencies.
//
//   node apps/phi-kit/dev/mock-phiora.mjs            # http://localhost:4300
//   VITE_PHI_API=http://localhost:4300 npm run dev   # in any app folder (PowerShell: $env:VITE_PHI_API="http://localhost:4300"; npm run dev)
//
// Optional: PHI_MODEL_URL (OpenAI-compatible base, e.g. http://localhost:11434/v1), PHI_MODEL (default "llama3.1"),
// PHI_MODEL_KEY — POST /chat is then forwarded to {PHI_MODEL_URL}/chat/completions; otherwise it answers with a canned line.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const apps = join(here, '..', '..');
const PORT = Number(process.env.PORT || 4300);
const DB = join(here, '.mock-phiora-state.json');
const state = existsSync(DB) ? JSON.parse(readFileSync(DB, 'utf8')) : {};
const save = () => writeFileSync(DB, JSON.stringify(state, null, 1));

const body = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => { try { ok(s ? JSON.parse(s) : undefined); } catch { ok(undefined); } }); });
const send = (req, res, code, data) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(data === undefined ? '' : JSON.stringify(data));
};

async function model(app, persona, messages) {
  const url = process.env.PHI_MODEL_URL;
  if (!url) return { text: `(${persona || app} via mock Phiora) Got it: "${messages.at(-1)?.text ?? ''}". Set PHI_MODEL_URL for real replies.` };
  const r = await fetch(url.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(process.env.PHI_MODEL_KEY ? { Authorization: 'Bearer ' + process.env.PHI_MODEL_KEY } : {}) },
    body: JSON.stringify({ model: process.env.PHI_MODEL || 'llama3.1', messages: [
      { role: 'system', content: `You are ${persona || 'the assistant'} in the ${app || 'Phiace'} app. Stay in persona; answer briefly.` },
      ...messages.map((m) => ({ role: m.role, content: m.text })),
    ] }),
  });
  const j = await r.json();
  return { text: j.choices?.[0]?.message?.content ?? '' };
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return send(req, res, 204);
  let m;
  if ((m = pathname.match(/^\/apps\/([\w-]+)$/)) && req.method === 'GET') {
    const f = join(apps, m[1], 'public', 'data', m[1] + '.json');
    return existsSync(f) ? send(req, res, 200, JSON.parse(readFileSync(f, 'utf8'))) : send(req, res, 404, { error: 'no app ' + m[1] });
  }
  if ((m = pathname.match(/^\/state\/([\w.-]+)$/))) {
    if (req.method === 'GET') return m[1] in state ? send(req, res, 200, state[m[1]]) : send(req, res, 404, { error: 'unset' });
    if (req.method === 'PUT') { state[m[1]] = await body(req); save(); return send(req, res, 204); }
  }
  if (pathname === '/chat' && req.method === 'POST') {
    const b = (await body(req)) || {};
    try { return send(req, res, 200, await model(b.app, b.persona, b.messages || [])); } catch (e) { return send(req, res, 502, { error: String(e) }); }
  }
  send(req, res, 404, { error: 'not found' });
}).listen(PORT, () => console.log('mock Phiora on http://localhost:' + PORT));
