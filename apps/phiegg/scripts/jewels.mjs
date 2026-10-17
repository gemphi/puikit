#!/usr/bin/env node
// Maison Once jewellery and watches, seeded and idempotent. Run after brands and before world-images.py, which draws
// every piece into public/jewels/sheet-00.webp (8 x 4 cells of 256 x 256, `index` on each piece).
//   node scripts/jewels.mjs
// Every piece is made once (edition of one), is a PFT with a set theme (metal and stone colours), and sells from the
// street of Once City it belongs to. Writes src/data/jewel.json: { sheet, cols, rows, cell, list: [...] }.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
let seed = 0x0dce; const rnd = () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
const int = (a, b) => Math.floor(a + rnd() * (b - a));
const core = read('core.json'); const w = core.worlds.find((x) => x.id === 'w_once'); const club = core.clubs.find((c) => c.id === 'c_once');
if (!w || !club) { console.log('jewels: Once City not found, run brands first'); process.exit(0); }
const city = (name) => w.cities.find((c) => c.name === name)?.id ?? w.cities[0].id;
const people = core.users.filter((u) => u.clubIds?.includes('c_once'));

const METAL = { 'Yellow gold': '#d4a72c', 'Rose gold': '#d89a84', 'White gold': '#d9dde2', Platinum: '#c8ccd2', Silver: '#b8bcc4' };
const STONE = { Diamond: '#eef6ff', Sapphire: '#1f4fbf', Ruby: '#b3122e', Emerald: '#127a4a', Pearl: '#f2ece0', Opal: '#9fd6d2', Moonstone: '#c9d6ec', Onyx: '#1d1b1b', Amethyst: '#7b3fb0', Citrine: '#e7a21b' };
const PLAN = [
  ['ring', 'Carat Court', ['Once Solitaire', 'Midnight Halo Ring', 'Snow on the Roof Ring', 'Marchbank Signet', 'Carat Court Cluster', 'Gideon Band', 'Greer Eternity Ring', 'Tower Toi et Moi']],
  ['necklace', 'Carat Court', ['Chime Pendant', 'Velvet Box Riviere', 'Midnight Arcade Lariat', 'Old Song Locket', 'Snowfall Collar', 'Candle Light Drop']],
  ['earrings', 'Pearl Passage', ['Pearl Passage Drops', 'Michael Ear Drops', 'Moon Hoop Pair', 'Starlit Studs']],
  ['bracelet', 'Pearl Passage', ['Pearl Rope Bracelet', 'Clockwork Cuff', 'Rain Under the Window Tennis', 'Galosh Bangle']],
  ['watch', 'Clockwork Quarter', ['Once Tourbillon', 'Midnight Chime Repeater', 'Clockwork Quarter Automatic', 'Tower Moonphase', 'Carat Court Dress Watch', 'Snow Dial Chronograph', 'Pearl Dial Petite', 'Winter Dance Calendar', 'Velvet Night GMT', 'Once Pocket Watch']],
];
const MOVE = ['Automatic', 'Hand-wound', 'Tourbillon', 'Minute repeater', 'Quartz'];
const COMPLI = ['Moon phase', 'Chronograph', 'Perpetual calendar', 'Second time zone', 'Small seconds', 'Minute repeater'];
const STRAP = ['Alligator leather', 'Gold bracelet', 'Satin', 'Steel mesh', 'Pearl strand'];
const list = []; let index = 0;
for (const [piece, street, names] of PLAN) names.forEach((name, k) => {
  const n = index++; const metals = Object.keys(METAL), stones = Object.keys(STONE);
  const metal = metals[(n * 3) % metals.length]; const stone = piece === 'earrings' && /Pearl/.test(name) ? 'Pearl' : stones[(n * 7 + k) % stones.length];
  const watch = piece === 'watch'; const sold = n % 3 === 0;
  list.push({
    id: `jewel_once_${piece}_${String(k + 1).padStart(2, '0')}`, type: 'pft', kind: watch ? 'watch' : 'jewel', piece, index: n, name, make: club.name, clubId: club.id, worldId: w.id, cityId: city(street),
    holderId: sold && people.length ? people[n % people.length].id : null, metal, metalHex: METAL[metal], stone: watch ? (n % 2 ? stone : null) : stone, stoneHex: STONE[stone],
    hex: watch ? METAL[metal] : STONE[stone], carats: watch ? (n % 2 ? +(0.2 + rnd()).toFixed(2) : 0) : +(0.3 + rnd() * 4).toFixed(2),
    ...(watch ? { movement: MOVE[n % MOVE.length], complication: COMPLI[n % COMPLI.length], caseMm: int(28, 44), waterM: [30, 50, 100, 300][n % 4], strap: STRAP[n % STRAP.length], powerHours: int(38, 120) } : {}),
    hoursToMake: int(watch ? 300 : 40, watch ? 2400 : 400), edition: 1, minted: sold ? 1 : 0, priceUsd: int(watch ? 18 : 4, watch ? 900 : 260) * 1000, change7d: +(rnd() * 12 - 3).toFixed(1),
    theme: { kinds: [watch ? 'Heritage' : 'Regal', ['Celestial', 'Noir', 'Couture', 'Minimal'][n % 4]], mood: ['Snow at midnight', 'Candle light', 'Winter dance', 'The chime'][n % 4],
      story: `${name}: made once in the ${street} of Once City, ${watch ? `${MOVE[n % MOVE.length].toLowerCase()} in ${metal.toLowerCase()}` : `${stone.toLowerCase()} set in ${metal.toLowerCase()}`}.`,
      colours: [watch ? METAL[metal] : STONE[stone], METAL[metal] === (watch ? METAL[metal] : STONE[stone]) ? STONE[stone] : METAL[metal]], by: club.founderId, source: 'designer' },
  });
});
writeFileSync(join(DATA, 'jewel.json'), JSON.stringify({ sheet: 'jewels/sheet-00.webp', cols: 8, rows: 4, cell: [256, 256], list }));
console.log(`jewels: ${list.length} pieces made once (${list.filter((x) => x.kind === 'watch').length} watches) in Once City`);
