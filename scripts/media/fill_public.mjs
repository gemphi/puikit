// Put every picture of an app's public/ folder in media/phi-media under its key, so the bucket and the CDN hold all the
// app shows. The keys are the app's own (app/phiegg/src/data/media-key.json); a file already there and the same is left.
//   node scripts/media/fill_public.mjs            copy what is missing or changed
//   node scripts/media/fill_public.mjs --check    only say what would be copied
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const from = path.join(root, 'app/phiegg/public');
const to = path.join(root, 'media/phi-media');
const check = process.argv.includes('--check');
const rules = JSON.parse(fs.readFileSync(path.join(root, 'app/phiegg/src/data/media-key.json'), 'utf8')).rule
  .map((r) => ({ from: new RegExp(r.from), to: r.to }));
const keyOf = (p) => { const rule = rules.find((r) => r.from.test(p)); return rule ? p.replace(rule.from, rule.to) : p; };
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) e.isDirectory() ? walk(path.join(dir, e.name), out) : out.push(path.join(dir, e.name));
  return out;
};
const same = (a, b) => fs.existsSync(b) && fs.statSync(a).size === fs.statSync(b).size && fs.readFileSync(a).equals(fs.readFileSync(b));

let copied = 0, kept = 0;
for (const file of walk(from)) {
  const key = keyOf(path.relative(from, file).split(path.sep).join('/'));
  const dest = path.join(to, key);
  if (same(file, dest)) { kept++; continue; }
  copied++;
  if (check) { if (copied <= 10) console.log('would copy', key); continue; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}
console.log(`${check ? 'would copy' : 'copied'} ${copied}, already there ${kept}`);
