#!/usr/bin/env node
// Rides, seeded and idempotent (replaces fleet.mjs). Run after brands and before world-images.py, which draws every
// ride into public/rides/sheet-NN.webp (8 x 8 cells of 320 x 200; `sheet` and `index` on each ride).
//   node scripts/rides.mjs
// Kinds: car (flying car), cab (robo cab), van (robo van), jetski, saucer (flying saucer), fun (a fun ride).
// Modes: sale (a PFT you buy), fun (a ticket per ride), hire (a fare per trip). Every ride has a set theme (designer
// kinds, mood, story and two colours), so opening one dresses the page in it. All names are fictional.
// Writes src/data/ride.json: { sheets, cols, rows, cell, list: [...] } (singular names).
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
let seed = 0xca75; const rnd = () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
const int = (a, b) => Math.floor(a + rnd() * (b - a)); const pick = (a) => a[Math.floor(rnd() * a.length)];
const core = read('core.json');

const BODY = ['#c2185b', '#e64a19', '#f9a825', '#2e7d32', '#00838f', '#1565c0', '#4527a0', '#6a1b9a', '#ad1457', '#37474f', '#d7ccc8', '#eceff1', '#212121', '#8d6e63', '#b71c1c', '#00695c', '#ff7043', '#5c6bc0', '#26a69a', '#ffb300'];
const GLOW = ['#00e5ff', '#ff4081', '#76ff03', '#ffd740', '#e040fb', '#18ffff', '#ff6e40', '#b388ff'];
const THEME_KINDS = ['Futurist', 'Pop', 'Couture', 'Celestial', 'Noir', 'Regal', 'Sport', 'Minimal', 'Maximal', 'Retro', 'Ocean', 'Playful'];
const MOODS = ['Night parade', 'Golden hour', 'Rush of wind', 'Quiet glide', 'Red carpet arrival', 'First flight', 'Spray and sun', 'Moonlit lake'];
const LIFT = { car: ['Ion lift', 'Quad rotor', 'Mag wing', 'Glide sail', 'Vector jets'], cab: ['Ion lift', 'Quad rotor'], van: ['Mag wing', 'Quad rotor', 'Ion lift'], jetski: ['Jet pump', 'Hydrofoil'], saucer: ['Anti-gravity', 'Ion ring'], fun: ['Electric drive', 'Mag track', 'Hydraulic arm'] };
const BODIES = { car: ['coupe', 'saloon', 'roadster', 'pod', 'limousine', 'cab'], cab: ['cab'], van: ['van'], jetski: ['jetski'], saucer: ['saucer'], fun: ['wheel', 'coaster', 'carousel', 'swing', 'drop', 'bumper', 'wave'] };
const MODE = { car: () => 'sale', cab: () => 'hire', van: () => 'hire', jetski: (k) => (k % 2 ? 'fun' : 'sale'), saucer: (k) => (k % 3 === 0 ? 'fun' : 'sale'), fun: () => 'fun' };

// [worldId, clubId, kind, names]: the first 64 (flying cars) keep their ids, indices and colours from round 28.
const PLAN = [
  ['w_wondrous', 'c_wondrous', 'car', ['Aurelia Skycoupe', 'Nimbus GT', 'Halo Roadster', 'Comet Cabrio', 'Stratos Saloon', 'Zephyr Hover', 'Lumen Glide', 'Vega Runabout', 'Parade Landau', 'Cirrus Coupe', 'Orbit Spyder', 'Aero Limousine', 'Contrail Racer', 'Cloud Terrace Tourer', 'Skylane Shooting Brake', 'Gala Gullwing', 'Mirage Speedster', 'Seraph Saloon']],
  ['w_wondrous', 'c_skylane', 'car', ['Pad Nine Valet', 'Rooftop Cabriolet', 'Members Glide', 'Dress Code Coupe', 'Pool Night Hover', 'Weekly Roadster']],
  ['w_wondrous', 'c_hoverhouse', 'car', ['Crew Hauler', 'Thruster Bike', 'Night Courier', 'Charge Runner', 'Goggle Pod', 'Wind Cut Racer']],
  ['w_verbum', 'c_verbum', 'car', ['Serif Coupe', 'Italic Glide', 'Lexicon Saloon', 'Sonnet Roadster', 'Haiku Pod', 'Stanza GT', 'Quill Racer', 'Epigram Cabrio', 'Verse Tourer', 'Prologue Limousine', 'Ode Speedster', 'Fable Hover', 'Couplet Coupe', 'Epilogue Landau']],
  ['w_verbum', 'c_inkwell', 'car', ['First Edition Tourer', 'Bookmark Glide', 'Spine Coupe', 'Lending Hover', 'Library Cab', 'Overdue Roadster']],
  ['w_verbum', 'c_syntax', 'car', ['Comma Cab', 'Semicolon Saloon', 'Full Stop Coupe', 'Apostrophe Pod', 'Parenthesis GT', 'Run-on Racer']],
  ['w_naimia', 'c_naimroyal', 'car', ['Royal Skycarriage', 'Saffron Landau', 'Stag Gondola', 'Midsummer Float', 'White Deer Phaeton', 'Ember Coach', 'Palace Hill Barouche', 'Show Grounds Shuttle']],
  // Round 29: robo cabs, robo vans, jetskis, flying saucers and fun rides (sheet 1).
  ['w_verbum', 'c_syntax', 'cab', ['Comma Robo Cab', 'Full Stop Robo Cab', 'Ellipsis Robo Cab', 'Dash Robo Cab']],
  ['w_chatty', 'c_chatty', 'cab', ['Babble Robo Cab', 'Echo Robo Cab', 'Murmur Robo Cab']],
  ['w_skim', 'c_skim', 'cab', ['Canal Robo Cab', 'Spray Robo Cab', 'Wake Robo Cab']],
  ['w_loraland', 'c_loraland', 'cab', ['Ribbon Robo Cab', 'Spark Robo Cab']],
  ['w_wondrous', 'c_wondrous', 'cab', ['Skylane Robo Cab', 'Cloud Robo Cab']],
  ['w_loraland', 'c_loraland', 'van', ['Spark Robo Van', 'Tutu Robo Van', 'Ribbon Robo Van', 'Summer Show Robo Van']],
  ['w_once', 'c_once', 'van', ['Velvet Box Robo Van', 'Carat Robo Van', 'Clockwork Robo Van', 'Pearl Robo Van']],
  ['w_wondrous', 'c_hoverhouse', 'van', ['Crew Robo Van', 'Night Courier Robo Van']],
  ['w_skim', 'c_skim', 'jetski', ['Wake Park Jetski', 'Canal Mile Jetski', 'Dock Nine Jetski', 'Spray Street Jetski', 'Skim Cup Racer', 'Glass Water Jetski', 'Far Shore Jetski', 'Board Club Jetski']],
  ['w_loon', 'c_loon', 'jetski', ['Moonwater Jetski', 'Loon Call Jetski', 'Pine Lantern Jetski', 'Black Lake Jetski', 'Boathouse Jetski', 'Midnight Pier Jetski']],
  ['w_loon', 'c_loon', 'saucer', ['Saucer Night One', 'Moon Drinker', 'Lake Light Saucer', 'Loon Song Saucer', 'Silver Pine Saucer', 'Field Lander', 'Lantern Disc']],
  ['w_wand', 'c_wand', 'saucer', ['Star Tower Saucer', 'Wandwright Disc', 'Mirror Saucer', 'Spell Square Saucer', 'Wings of Wax Saucer']],
  ['w_chatty', 'c_chatty', 'saucer', ['Talkback Saucer', 'Echo Disc']],
  ['w_bozo', 'c_bozo', 'fun', ['Big Top Sky Wheel', 'Pratfall Coaster', 'Bozo Carousel', 'Juggler Swing Chairs', 'Pie Drop Tower', 'Clown Bumper Pods', 'Ringmaster Coaster', 'Night Bazaar Wheel']],
  ['w_loraland', 'c_loraland', 'fun', ['Tutu Carousel', 'Summer Lawn Swing Chairs']],
  ['w_skim', 'c_skim', 'fun', ['Wake Wave Ride', 'Canal Drop Tower']],
];

const worldOf = (id) => core.worlds.find((w) => w.id === id);
const list = []; let index = 0; const counters = {};
for (const [wid, clubId, kind, names] of PLAN) {
  const w = worldOf(wid); const club = core.clubs.find((c) => c.id === clubId); if (!w || !club) { console.warn('rides: skip', wid, clubId); continue; }
  const people = core.users.filter((u) => u.clubIds?.includes(clubId));
  names.forEach((name, k) => {
    const n = index++; const hex = BODY[(n * 7) % BODY.length], glow = GLOW[(n * 5 + (n >> 3)) % GLOW.length];
    counters[clubId + kind] = (counters[clubId + kind] ?? 0) + 1; const c = counters[clubId + kind];
    const id = kind === 'car' ? `car_${clubId.slice(2)}_${String(c).padStart(2, '0')}` : `ride_${kind}_${clubId.slice(2)}_${String(c).padStart(2, '0')}`;
    const body = kind === 'fun' ? (/Wheel/.test(name) ? 'wheel' : /Coaster/.test(name) ? 'coaster' : /Carousel/.test(name) ? 'carousel' : /Swing/.test(name) ? 'swing' : /Drop/.test(name) ? 'drop' : /Bumper/.test(name) ? 'bumper' : 'wave')
      : kind === 'car' ? BODIES.car[n % 6] : BODIES[kind][0];
    const mode = MODE[kind](k); const city = w.cities[(k + n) % w.cities.length];
    const kinds = [THEME_KINDS[n % THEME_KINDS.length], THEME_KINDS[(n + 3) % THEME_KINDS.length]];
    const seats = { car: [1, 2, 2, 4, 4, 6][n % 6], cab: 4, van: 2, jetski: [1, 2, 3][n % 3], saucer: [2, 4, 6, 8][n % 4], fun: [12, 16, 24, 32, 48][n % 5] }[kind];
    list.push({
      id, type: 'pft', kind, mode, sheet: Math.floor(n / 64), index: n % 64, name, make: club.name, clubId, worldId: wid, cityId: city.id,
      holderId: people.length ? people[(k + n) % people.length].id : club.founderId,
      hex, glow, year: 2030 + (n % 4), body, seats, lift: pick(LIFT[kind]),
      rangeKm: kind === 'fun' ? 0 : int(kind === 'jetski' ? 60 : 300, kind === 'saucer' ? 9000 : kind === 'jetski' ? 240 : 1800),
      topKmh: kind === 'fun' ? int(20, 110) : int(kind === 'jetski' ? 70 : 180, kind === 'saucer' ? 2400 : kind === 'jetski' ? 140 : 680),
      lane: kind === 'jetski' ? `${city.name} waterway` : kind === 'fun' ? `${city.name} fair` : `Skylane ${1 + (n % 9)}`,
      ...(kind === 'van' ? { cargoM3: int(4, 18) } : {}), ...(kind === 'fun' ? { minutes: int(3, 12), thrill: 1 + (n % 5) } : {}),
      edition: [500, 250, 100, 25, 5][n % 5], minted: int(3, 90), owners: int(2, 60), change7d: +(rnd() * 24 - 8).toFixed(1),
      priceUsd: mode === 'sale' ? int(kind === 'jetski' ? 4 : 12, kind === 'saucer' ? 900 : 480) * 1000 : 0,
      ticketUsd: mode === 'fun' ? int(4, 40) : mode === 'hire' ? int(6, 60) : 0, ridesToday: mode === 'sale' ? 0 : int(40, 4000),
      theme: { kinds, mood: MOODS[n % MOODS.length], story: `${name}: ${club.tagline.replace(/\.$/, '')}, ${mode === 'sale' ? 'built for' : mode === 'hire' ? 'running in' : 'turning in'} ${city.name}, ${w.name}.`, colours: [hex, glow], by: club.founderId, source: 'designer' },
    });
  });
}
const sheets = Math.ceil(list.length / 64);
writeFileSync(join(DATA, 'ride.json'), JSON.stringify({ sheets: Array.from({ length: sheets }, (_, i) => `rides/sheet-${String(i).padStart(2, '0')}.webp`), cols: 8, rows: 8, cell: [320, 200], list }));
if (existsSync(join(DATA, 'fleet.json'))) { try { unlinkSync(join(DATA, 'fleet.json')); } catch { /* deletes may be off; ride.json supersedes it */ } }
const by = (k) => list.filter((r) => r.kind === k).length;
console.log(`rides: ${list.length} (${['car', 'cab', 'van', 'jetski', 'saucer', 'fun'].map((k) => by(k) + ' ' + k).join(', ')}) on ${sheets} sheets`);
