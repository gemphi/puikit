#!/usr/bin/env node
// The one gate on what goes into this repository, the same before a commit (the pre-commit hook) and on a pull
// request (CI). It reads the list of added or changed files and refuses:
//   - pictures, video, audio, archives and other binaries (they live on disk and in the media store, never in git)
//   - any file over the size limit (1 MB; data files, JSON, up to 8 MB)
//   - files that hold secrets: .env files, private keys, .pem, and text that looks like a key or token
//   - JSON that does not parse
//   - a code file over 300 lines (data files, JSON and Markdown are exempt): split it
//
//   node scripts/check-commit.mjs                  the files staged for the next commit
//   node scripts/check-commit.mjs --base <ref>     the files a branch adds or changes against <ref> (pull requests)
//
// Exit 1 lists every file refused and why; exit 0 says how many were checked.
import { execFileSync } from 'node:child_process';

const MAX_BYTES = 1024 * 1024; // one file
const MAX_DATA_BYTES = 8 * 1024 * 1024; // one data file (JSON)
const MAX_LINES = 300; // one code file
const CODE = /\.(m?[jt]sx?|cjs|py|rs|scss|css|sh|ps1|go|java|kt|swift|c|cc|cpp|h|hpp|cs|vue|svelte|astro|html)$/i;
const BINARY = /\.(webp|png|jpe?g|gif|avif|bmp|tiff?|ico|psd|heic|mp4|mov|webm|mkv|avi|mp3|wav|ogg|flac|zip|7z|rar|tar|gz|tgz|blend|blend1|fbx|glb|gltf|obj|exr|hdr|pdf|exe|dll|so|dylib|woff2?|ttf|otf)$/i;
const SECRET_FILE = /(^|\/)(\.env(\..*)?|.*\.pem|id_(rsa|ed25519|ecdsa)|.*\.key|.*\.p12|.*\.pfx)$/i;
const SECRET_TEXT = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,                       // AWS access key id
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,             // GitHub token
  /\bsk-(ant-)?[A-Za-z0-9_-]{32,}\b/,           // API keys
  /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/,           // Slack token
];
// Allowed although they match a rule above: example env files carry no values.
const ALLOW = /(^|\/)\.env\.example$/i;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
const at = process.argv.indexOf('--base');
const base = at > 0 ? process.argv[at + 1] : null;
const files = (base
  ? git('diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`)
  : git('diff', '--cached', '--name-only', '--diff-filter=AM')).split('\n').filter(Boolean);
// What is checked is what goes in: the staged copy before a commit, the branch's copy on a pull request.
const blob = (f) => (base ? execFileSync('git', ['show', `HEAD:${f}`], { maxBuffer: 1 << 28 }) : execFileSync('git', ['show', `:${f}`], { maxBuffer: 1 << 28 }));

const refused = [];
for (const f of files) {
  if (ALLOW.test(f)) continue;
  if (BINARY.test(f)) { refused.push([f, 'a picture or other binary: keep it on disk and in the media store, not in git']); continue; }
  if (SECRET_FILE.test(f)) { refused.push([f, 'a file that holds secrets']); continue; }
  const body = blob(f);
  const limit = f.endsWith('.json') ? MAX_DATA_BYTES : MAX_BYTES;
  if (body.length > limit) { refused.push([f, `${(body.length / 1048576).toFixed(1)} MB, over the ${limit / 1048576} MB limit`]); continue; }
  if (body.includes(0)) { refused.push([f, 'binary content']); continue; }
  const text = body.toString('utf8');
  const hit = SECRET_TEXT.find((r) => r.test(text));
  if (hit) { refused.push([f, `text that looks like a secret (${hit.source.slice(0, 32)}...)`]); continue; }
  if (CODE.test(f)) { const n = text.split('\n').length - (text.endsWith('\n') ? 1 : 0); if (n > MAX_LINES) { refused.push([f, `${n} lines of code, over the ${MAX_LINES}-line limit: split it (data belongs in a data file)`]); continue; } }
  if (f.endsWith('.json')) { try { JSON.parse(text); } catch (e) { refused.push([f, `JSON does not parse: ${e.message}`]); } }
}

if (refused.length) {
  console.error(`\ncheck-commit: ${refused.length} of ${files.length} file(s) refused\n`);
  for (const [f, why] of refused) console.error(`  ${f}\n    ${why}`);
  console.error(base ? '' : '\nUnstage them (git restore --staged <file>), or fix them, and commit again.\n');
  process.exit(1);
}
console.log(`check-commit: ${files.length} file(s) checked, none refused`);
