#!/usr/bin/env node
// Run the whole platform locally for testing: Phiora (the API+DB) plus every app's dev server, one command.
//   node dev-all.mjs             start Phiora + all apps that have source here
//   node dev-all.mjs phisum …    start Phiora + only the named apps
//   node dev-all.mjs --python …  use the Postgres Phiora in phiadk/phiora instead (start it first: make up, make seed)
// Phiora comes up on :4300 with a local sqlite/json store (no Postgres needed) and auto-seeds the bundled data.
// Each app comes up on its own port (from registry.json) with VITE_PHI_API=http://localhost:4300, so it reads live
// data from Phiora; cross-app links open http://localhost:<that app's port>/ — so with every app running, the app
// switcher jumps between them. Ctrl+C stops everything.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(here, 'phi-kit', 'src', 'registry.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const python = process.argv.includes('--python');
const PHI_API = python ? 'http://localhost:8000/api/v1' : 'http://localhost:4300';

const buildable = registry.filter((a) => existsSync(join(here, a.key, 'package.json')) && existsSync(join(here, a.key, 'vite.config.ts')));
const want = process.argv.slice(2).filter((a) => a !== '--python');
// Config apps all run inside the one host (app/phi, :3100); apps with their own code keep their own server.
const chosen = want.length ? buildable.filter((a) => want.includes(a.key)) : buildable;
const apps = chosen.filter((a) => !a.config);
const hosted = chosen.some((a) => a.config);

const children = [];
const run = (name, cwd, args, env) => {
  // Install deps the first time (node_modules missing), then start.
  if (!existsSync(join(cwd, 'node_modules'))) {
    console.log(`[${name}] installing deps …`);
    const r = spawnSync(npm, ['install', '--no-audit', '--no-fund'], { cwd, stdio: 'inherit', shell: true });
    if (r.status !== 0) { console.error(`[${name}] npm install failed`); process.exit(1); }
  }
  const p = spawn(npm, args, { cwd, env: { ...process.env, ...env }, shell: true });
  const tag = (line) => line.split('\n').filter(Boolean).forEach((l) => process.stdout.write(`[${name}] ${l}\n`));
  p.stdout.on('data', (d) => tag(d.toString()));
  p.stderr.on('data', (d) => tag(d.toString()));
  p.on('exit', (c) => console.log(`[${name}] exited (${c})`));
  children.push(p);
};

console.log('Starting ' + (python ? 'apps against ' + PHI_API + ': ' : 'Phiora on :4300 and ') + apps.length + ' app(s): ' + apps.map((a) => `${a.key}:${a.port}`).join(', '));
if (!python) run('phiora', join(here, 'phiora-server'), ['start'], { PHI_SEED: process.env.PHI_SEED ?? '' });
// Give Phiora a moment to bind before the apps start calling it.
setTimeout(() => {
  if (hosted) run('phi', join(here, 'phi'), ['run', 'dev'], { VITE_PHI_API: PHI_API });
  for (const a of apps) run(a.key, join(here, a.key), ['run', 'dev'], { VITE_PHI_API: PHI_API });
  setTimeout(() => {
    console.log('\n— Open http://localhost:' + (apps.find((a) => a.key === 'phiegg')?.port ?? apps[0]?.port) + '/  (then use the app switcher to hop between apps)');
    console.log('— Phiora: http://localhost:4300/health · Ctrl+C stops everything\n');
  }, 2500);
}, 1500);

const stop = () => { for (const p of children) { try { p.kill(); } catch {} } process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
