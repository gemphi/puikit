#!/usr/bin/env node
// Every coin is also a round, real-looking coin, one SVG each in public/coins/<symbol>.svg (its shared key is
// assets/coins/<symbol>.svg, data/media-key.json, so every app and the CDN read the same file). Concerns are apart:
//   scripts/coins/glyph/<symbol>.svg   the platform coins' glyphs, drawn by hand in currentColor (OGY ring O, $UM dollar S, $EGG pound E)
//   scripts/coins/platform.json        the platform coins' records and the metal each is struck in
//   scripts/coins/metal.mjs            colours: a metal from a hue, a club coin's metal from its tone and symbol
//   scripts/coins/strike.mjs           drawing: a glyph raised in the wordmark's 3D on a round metal disc
//   this file                          data: writes the SVGs, and `image` and `card` on every coin in data/economy.json
// A club coin's glyph is its symbol in letters. A rerun changes nothing.
//   node scripts/coin-art.mjs                                                  (npm run data:coins)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clubMetal, metal } from './coins/metal.mjs';
import { coinSvg, lettersGlyph, readGlyph } from './coins/strike.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COINS = join(ROOT, 'scripts', 'coins');
const OUT = join(ROOT, 'public', 'coins');
const FILE = join(ROOT, 'src', 'data', 'economy.json');
const { _, ...PLATFORM } = JSON.parse(readFileSync(join(COINS, 'platform.json'), 'utf8'));
mkdirSync(OUT, { recursive: true });
const text = readFileSync(FILE, 'utf8'); const doc = JSON.parse(text);
let added = 0;
// A platform coin with a metal is struck from its own glyph and added where it is missing.
for (const [symbol, p] of Object.entries(PLATFORM)) {
  if (!p.metal || doc.coins.some((c) => c.symbol === symbol)) continue;
  const { metal: _m, ...row } = p; doc.coins.unshift({ symbol, ...row }); added++;
}
for (const c of doc.coins) {
  const p = PLATFORM[c.symbol];
  const m = p?.metal ? metal(...p.metal) : clubMetal(c);
  const glyph = p?.metal ? readGlyph(join(COINS, 'glyph'), c.symbol) : lettersGlyph(c.symbol);
  writeFileSync(join(OUT, `${c.symbol}.svg`), coinSvg(c.symbol, glyph, m));
  if (p?.platform) c.platform = true;
  c.image = `coins/${c.symbol}.svg`; c.card = m.card;
}
const pretty = /\n\s+"/.test(text.slice(0, 400));
writeFileSync(FILE, JSON.stringify(doc, null, pretty ? 2 : undefined) + (text.endsWith('\n') ? '\n' : ''));
console.log(`coin art: ${doc.coins.length} coins drawn into public/coins, ${added} added, each with its image and card`);
