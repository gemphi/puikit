#!/usr/bin/env node
// Celebrity culture, all fictional, seeded and idempotent (ids start with `cb_`; re-running replaces them).
//   node scripts/brands.mjs && node scripts/hosts-casts.mjs && node scripts/celebs.mjs && node scripts/pools.mjs
// • Calder Brothers Pictures: 128 films from the 1940s to the 1960s (noir, westerns, musicals, melodrama…) with
//   casts from a roster of fictional golden-age stars, Mara Lune, the studio's screen siren, among them.
// • 32 dramas: the Venus Girls reality drama and its spin-offs, fashion, music and beauty dramas, with episodes.
// • Stars' statements (fictional quotes) and gossip shots from the Venus Girls cast, invented people, invented feuds.
// • Fashion casts with cast names (models on each show), concerts for the Supernova singers, beauty lines of 64
//   shades (data/beauty.json, turned into pools by pools.mjs), and stats for every star, singer and model.
// No real people: every name, title, quote and storyline here is invented.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const write = (f, v) => writeFileSync(join(DATA, f), JSON.stringify(v));
let seed = 0xc0ffee; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const int = (a, b) => Math.floor(a + rnd() * (b - a));
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const some = (xs, n) => { const c = [...xs]; const o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return o; };
const pad = (n, w = 3) => String(n).padStart(w, '0');
const strip = (list, pre) => list.filter((x) => !String(x.id).startsWith(pre));

const core = read('core.json'), series = read('series.json'), stories = read('stories.json'), feed = read('feed.json');
const casts = read('casts.json'), events = read('events.json'), hosts = read('hosts.json');
const club = (id) => core.clubs.find((c) => c.id === id);
const need = ['c_calder', 'c_venus', 'c_halomodels', 'c_nova', 'c_velvetlip'];
for (const id of need) if (!club(id)) { console.error('run scripts/brands.mjs first (missing ' + id + ')'); process.exit(1); }

// ── Golden-age roster: twelve more fictional stars on the Calder lot ──────────────────────────────────────────
const ROSTER = [
  ['cb_u_clement', 'Clement Ward', 'clement.ward', 'Romantic lead of the Calder war dramas; one raised eyebrow, a thousand tickets.'],
  ['cb_u_hazel', 'Hazel Quinn', 'hazel.quinn', 'Song-and-dance star of the Stage Nine musicals; tap shoes on, always.'],
  ['cb_u_selma', 'Selma Raye', 'selma.raye', 'The noir femme fatale who never lost a close-up.'],
  ['cb_u_felix', 'Felix Hartley', 'felix.hartley', 'Screwball charm in a perfect suit; the studio’s best double-take.'],
  ['cb_u_odette', 'Odette Marsh', 'odette.marsh', 'Melodrama’s great weeper; three handkerchiefs per picture.'],
  ['cb_u_jimmy', 'Jimmy Brandt', 'jimmy.brandt', 'Boy-next-door turned western sheriff.'],
  ['cb_u_lenore', 'Lenore Sterling', 'lenore.sterling', 'Wartime pin-up turned sharp-eyed producer.'],
  ['cb_u_wes', 'Wes Shore', 'wes.shore', 'Method actor of the 1950s; mumbled his way to the top.'],
  ['cb_u_penny', 'Penny Lark', 'penny.lark', 'Sunny comedies, sunnier songs.'],
  ['cb_u_hal', 'Hal Denton', 'hal.denton', 'Square jaw, soft heart, many Technicolor melodramas.'],
  ['cb_u_celia', 'Celia Kerr', 'celia.kerr', 'Icy elegance in the thrillers; retired to run a vineyard on Frontier Street.'],
  ['cb_u_nico', 'Nico Brennan', 'nico.brennan', 'Leather jacket, motorbike, the lot’s original rebel.'],
];
const stars = ['u_maralune', 'u_rockford', 'u_vivienne', 'u_tully', ...ROSTER.map((r) => r[0])];
core.users = strip(core.users, 'cb_u_');
for (const [id, name, handle, bio] of ROSTER) core.users.push({ id, handle, name, tone: pick(['ink', 'accent', 'neutral', 'sage']), bio, verified: true, wallet: `0x${handle.slice(0, 4)}…${int(10, 99)}`,
  followers: int(40000, 900000), following: int(10, 300), clubIds: ['c_calder'], badges: ['Golden-age star'], hostIds: ['h_calder'], postCount: int(40, 800), putCount: int(1, 40) });

// ── 128 films, 1940s–1960s ─────────────────────────────────────────────────────────────────────────────────────
const GENRES = [
  ['Film Noir', '1940s', ['Shadows over', 'The Long Rain on', 'Murder at', 'Last Call at', 'Night Train to', 'The Glass Door of'], ['Dock Street', 'the Blue Hotel', 'Pier Eleven', 'the Velvet Key', 'Harbour Lane', 'the Copper Room']],
  ['Western', '1950s', ['The Last Ride to', 'Showdown at', 'Ride Out of', 'The Sheriff of', 'Dust over', 'Wagons to'], ['Frontier Street', 'Copper Canyon', 'Red Mesa', 'Lantern Pass', 'Silver Creek', 'Dry Gulch']],
  ['Frontier Musical', '1950s', ['Sing Me Down', 'Gold Rush on', 'Moonlight on', 'Dance Across', 'The Belle of', 'Raft Song of'], ['the Calder River', 'Canyon Town', 'the Saloon Stage', 'Paradise Falls', 'the White Rapids', 'Calder Creek']],
  ['Screwball Comedy', '1940s', ['Mischief at', 'Trouble with', 'The Heiress of', 'Two Fiancés and', 'Upside Down at', 'Wrong Number at'], ['the Penthouse', 'Tuesday', 'the Ritz-Calder', 'a Leopard', 'Pemberton Hall', 'the Switchboard']],
  ['Melodrama', '1950s', ['The Gardener of', 'Letters to', 'The Tears of', 'A Summer for', 'Beneath', 'The Widow of'], ['Larkspur Lane', 'Elena', 'Autumn', 'Ivy Hollow', 'the Willow', 'Maple Court']],
  ['War Drama', '1940s', ['Wings over', 'The Sands of', 'Convoy to', 'Letters from', 'Bridge at', 'Night Watch on'], ['the Coast', 'Halden Bay', 'Tomorrow', 'the North Sea', 'the Front', 'Dawn']],
  ['Costume Epic', '1950s', ['Kings of', 'The Crown of', 'Chariots of', 'Daughters of', 'The Silver', 'Empress of'], ['the Desert', 'Gold', 'Fire', 'the Nile Road', 'Chalice', 'Seven Hills']],
  ['Thriller', '1950s', ['The Window on', 'Vertigo at', 'The Stranger in', 'Bell Tower of', 'The Second Key to', 'Midnight at'], ['Larch Street', 'the Lighthouse', 'Carriage Nine', 'St Calder', 'Room 12', 'the Observatory']],
  ['Teen Rebel', '1950s', ['Curfew on', 'Hot Rods of', 'Jukebox', 'The Wild Ones of', 'Drive-In', 'Varsity'], ['Main Street', 'Saturday', 'Elm Heights', 'the Strip', 'Summer', 'Riverside']],
  ['Sci-fi B-movie', '1950s', ['It Came from', 'Invasion of the', 'The Night of the', 'Attack of the', 'Return of the', 'Beware the'], ['Beyond Orbit', 'Pod People', 'Glowing Moon', '50-Foot Starlet', 'Planet Calder', 'Saucer Men']],
  ['Romantic Comedy', '1960s', ['Party Line for', 'Breakfast in', 'Penthouse for', 'Kiss and Tell on', 'Two on', 'Sunday in'], ['Two', 'the Village', 'Fifth Avenue', 'the Riviera', 'a Seesaw', 'Monaco']],
  ['Spy Caper', '1960s', ['The Man from', 'Our Woman in', 'Thunder over', 'The Calder Code', 'Jewels of', 'Double Cross at'], ['Lisbon', 'Monaco', 'Istanbul', 'Zero', 'the Orient Line', 'the Grand Casino']],
];
// Real titles are never reproduced: anything that matches one is redrawn.
const REAL = new Set(['Rear Window', 'Dial M for Murder', 'Strangers on a Train', 'Pillow Talk', 'Lover Come Back', 'Send Me No Flowers', 'Written on the Wind', 'All That Heaven Allows']);
const SYN = {
  'Film Noir': (t) => `A tired detective takes one last case and finds that everyone in ${t} is lying to him, especially her.`,
  'Western': (t) => `A drifter rides into ${t}, where the sheriff is crooked, the saloon is loud and the train arrives at noon.`,
  'Frontier Musical': (t) => `A saloon singer, a widower and a runaway boy sing their way down ${t} with gold, outlaws and rapids behind them.`,
  'Screwball Comedy': (t) => `An heiress and a reporter trade insults, a leopard and two fiancés before ${t} is over.`,
  'Melodrama': (t) => `A widow falls for her gardener and the whole town has an opinion about ${t}.`,
  'War Drama': (t) => `Four soldiers and one nurse hold the line and write letters home in ${t}.`,
  'Costume Epic': (t) => `Thousands of extras, one chariot race and a queen's quarrel over ${t}.`,
  'Thriller': (t) => `A photographer with a broken leg is sure he saw something terrible from his window in ${t}.`,
  'Teen Rebel': (t) => `A new kid in town, a red jacket, a drag race and a curfew nobody keeps in ${t}.`,
  'Sci-fi B-movie': (t) => `Scientists, a small town and something very large from ${t}. Rubber suits included.`,
  'Romantic Comedy': (t) => `Two rivals share a party line, a building and eventually a breakfast in ${t}.`,
  'Spy Caper': (t) => `A suave agent, a jewel, a double-cross and a very fast car through ${t}.`,
};
const eraFor = (g, i) => (i % 3 === 0 ? '1940s' : i % 3 === 1 ? '1950s' : '1960s');
const filmClubs = ['c_calder', 'c_calder', 'c_calder', 'c_venus', 'c_halomodels', 'c_nova', 'c_velvetlip', 'c_deer', 'c_ombre', 'c_ponte'].filter(club);
series.series = strip(series.series, 'cb_'); stories.stories = strip(stories.stories, 'cb_');
const usedTitles = new Set(series.series.map((x) => x.title));
for (let i = 0; i < 128; i++) {
  const [genre, , heads, tails] = GENRES[i % GENRES.length];
  let title; do { title = `${pick(heads)} ${pick(tails)}`; } while (usedTitles.has(title) || REAL.has(title)); usedTitles.add(title);
  const cid = filmClubs[i % filmClubs.length]; const c = club(cid); const era = eraFor(genre, i + Math.floor(i / GENRES.length));
  const id = `cb_film_${pad(i + 1)}`, st = `cb_st_${pad(i + 1)}`; const runtime = int(78, 168); const syn = SYN[genre](title.split(' ').slice(-2).join(' '));
  const cast = some(stars, 3); const year = Number(era.slice(0, 4)) + int(0, 10);
  series.series.push({ id, kind: 'film', title, clubId: cid, hostId: c.hostId, worldId: c.worldIds[0], tone: c.tone, synopsis: syn, cast, runtime,
    rating: +(3.2 + rnd() * 1.7).toFixed(1), views: int(20000, 2400000), episodes: [{ n: 1, title, tone: c.tone, runtime, synopsis: syn }], genre, era, storyId: st,
    year, studio: cid === 'c_calder' ? 'Calder Brothers Pictures' : c.name, boxOfficeUsd: int(400000, 48000000), awards: int(0, 7), restored: rnd() < 0.4 });
  stories.stories.push({ id: st, n: pad(i + 1), seriesId: id, genre, era, kind: 'film', title, logline: syn, story: `${syn} Released ${year}; ${runtime} minutes in glorious ${year >= 1953 ? 'Technicolor' : 'black and white'}.`, clubId: cid, worldId: c.worldIds[0] });
}
// the studio's own siren picture, kept on purpose
const siren = series.series.find((x) => x.title === 'The River That Never Turns Back'); if (siren) { siren.cast = ['u_maralune', 'u_rockford', 'u_tully']; siren.era = '1950s'; }

// ── 32 dramas ─────────────────────────────────────────────────────────────────────────────────────────────────
const DRAMAS = [
  ['The Venus Girls', 'c_venus', 'Reality Drama', 'Five sisters, one momager, a beauty empire and a feud every week, all on camera.', ['u_lora', 'u_kiki', 'u_dahlia', 'u_bri', 'u_sablev', 'u_rhea']],
  ['Venus Girls: Reunion', 'c_venus', 'Reality Drama', 'The sisters on one sofa, one host and every receipt from the season.', ['u_lora', 'u_sablev', 'u_rhea']],
  ['Chatty Whims', 'c_venus', 'Reality Drama', 'Lora Venus talks to the camera about everything, and everyone.', ['u_lora', 'u_kiki']],
  ['Glow Up', 'c_venus', 'Beauty Drama', 'Kiki Venus launches three lipsticks in three weeks and sells out all of them.', ['u_kiki', 'u_noemi', 'u_rosa']],
  ['Sister Act Two-Faced', 'c_venus', 'Celebrity Satire', 'A parody of the Venus feud, played by the Venus sisters themselves.', ['u_dahlia', 'u_bri', 'u_sablev']],
  ['The Board', 'c_halomodels', 'Fashion Drama', 'A season inside a model house: castings, bookings, rivalries and one perfect walk.', ['u_zuri', 'u_anya', 'u_kaim', 'u_halo']],
  ['Go-See', 'c_halomodels', 'Fashion Drama', 'Twelve new faces, one casting director, one contract.', ['u_ines2', 'u_halo', 'u_zuri']],
  ['Runway Royals', 'c_halomodels', 'Fashion Drama', 'The top board competes to open the Venus Reunion Runway.', ['u_zuri', 'u_anya', 'u_dahlia']],
  ['Supernova Live', 'c_nova', 'Music Drama', 'Four singers, one tour, every runway on the calendar.', ['u_lyra', 'u_jett', 'u_soleil', 'u_mika']],
  ['Encore', 'c_nova', 'Music Drama', 'A girl group splits on stage and reunites at the Neon Dome.', ['u_lyra', 'u_mika']],
  ['Velvet Hour', 'c_nova', 'Music Drama', 'Soleil Amara records a soul album in one night in the Cloud Booths.', ['u_soleil', 'u_jett']],
  ['Shade Lab', 'c_velvetlip', 'Beauty Drama', 'A beauty brand races to mix sixty-four shades before the Venus Girls launch.', ['u_velvet', 'u_rosa', 'u_noemi']],
  ['Backlot', 'c_calder', 'Golden-Age Drama', 'The four Calder brothers fight over one studio, one star and one Friday release.', ['u_calder', 'u_tully', 'u_maralune']],
  ['Commissary Row', 'c_calder', 'Golden-Age Drama', 'Lunch at the studio commissary, where every contract is signed and every rumour starts.', ['u_vivienne', 'cb_u_selma', 'cb_u_felix']],
  ['The Siren Years', 'c_calder', 'Golden-Age Drama', 'Mara Lune’s rise from a diner in Frontier Street to the biggest name on the lot.', ['u_maralune', 'u_tully', 'cb_u_wes']],
  ['Technicolor Dreams', 'c_calder', 'Golden-Age Drama', 'A costume designer dresses every star of the 1950s and keeps every secret.', ['cb_u_hazel', 'cb_u_penny', 'cb_u_hal']],
];
const SPINS = ['After Dark', 'Paris', 'Miami Nights', 'The Wedding', 'Back to the Hills', 'Season Finale', 'The Comeback', 'Family Business', 'Behind the Lens', 'Fashion Week', 'The Feud', 'Summer House', 'Confessions', 'On Tour', 'Gala Night', 'New Money'];
while (DRAMAS.length < 32) { const base = DRAMAS[DRAMAS.length % 16]; DRAMAS.push([`${base[0]}: ${SPINS[DRAMAS.length - 16]}`, base[1], base[2], `${base[3]} This time: ${SPINS[DRAMAS.length - 16].toLowerCase()}.`, base[4]]); }
const EP = ['The Arrival', 'Who Said It First', 'The Group Chat', 'Red Carpet', 'Sister Summit', 'The Confessional', 'Launch Night', 'Receipts', 'The Apology Tour', 'Paparazzi', 'The Seating Chart', 'Closing Look', 'Afterparty', 'The Contract', 'Finale', 'Reunion'];
DRAMAS.forEach(([title, cid, genre, synopsis, cast], i) => {
  const c = club(cid); const id = `cb_drama_${pad(i + 1)}`, st = `cb_dst_${pad(i + 1)}`; const n = int(6, 17);
  // a house already has a pilot with this title (brands.mjs): grow it into the full season instead of a twin
  const twin = series.series.find((x) => x.title === title && !String(x.id).startsWith('cb_'));
  if (twin) { twin.kind = 'series'; twin.cast = [...new Set([...cast, ...twin.cast])].filter((u) => core.users.some((x) => x.id === u)); twin.genre = genre; twin.views = Math.max(twin.views, int(200000, 9000000));
    twin.episodes = EP.slice(0, n).map((e, k) => ({ n: k + 1, title: e, tone: c.tone, runtime: int(38, 62), synopsis: `${title}, episode ${k + 1}: ${e.toLowerCase()}.` })); return; }
  series.series.push({ id, kind: 'series', title, clubId: cid, hostId: c.hostId, worldId: c.worldIds[0], tone: c.tone, synopsis, cast: cast.filter((u) => core.users.some((x) => x.id === u)), runtime: int(38, 62),
    rating: +(3.6 + rnd() * 1.3).toFixed(1), views: int(200000, 9000000), genre, era: '2020s', storyId: st,
    episodes: EP.slice(0, n).map((e, k) => ({ n: k + 1, title: e, tone: c.tone, runtime: int(38, 62), synopsis: `${title}, episode ${k + 1}: ${e.toLowerCase()}.` })) });
  stories.stories.push({ id: st, n: pad(200 + i), seriesId: id, genre, era: '2020s', kind: 'series', title, logline: synopsis, story: synopsis, clubId: cid, worldId: c.worldIds[0] });
});
for (const g of [['Frontier Musical', '1950s', 'Wagons, rivers and a song at every campfire'], ['Film Noir', '1940s', 'Rain, neon and nobody telling the truth'], ['Reality Drama', '2020s', 'Cameras everywhere, feuds on schedule'], ['Fashion Drama', '2020s', 'Castings, bookings and the perfect walk'], ['Music Drama', '2020s', 'Tours, studios and encores'], ['Beauty Drama', '2020s', 'Shades, launches and sell-outs'], ['Golden-Age Drama', '1940s–1960s', 'The studio years, behind the camera']])
  if (!stories.genres.some((x) => x.name === g[0])) stories.genres.push({ name: g[0], era: g[1], blurb: g[2] });

// ── Statements and gossip (fictional people, fictional quotes) ────────────────────────────────────────────────
const SIREN = [
  'I don’t mind being a dream, as long as I get to write the ending.', 'The camera never lies, it just edits.', 'A diamond is a fine thing; a good contract is finer.',
  'Give me a raft, a river and a good song, I’ll find my way downstream.', 'I learned to walk in heels on a moving train. Everything since is easy.',
  'Every close-up is a conversation. I just say more with my eyes.', 'Fame is a lovely house with no curtains.', 'The studio owns my contract, not my laugh.',
  'I wear the dress; the dress doesn’t wear me.', 'They called me a blonde. I called my agent.', 'A picture a year keeps the critics guessing.', 'Make it Technicolor or don’t make it at all.',
];
const GOSSIP = [
  ['u_lora', 'I said what I said in the confessional and I will say it again at the reunion. 💅', 'Confessional, take three'],
  ['u_sablev', 'Season two started because someone wore MY look to MY launch. Not naming names (it was Kiki).', 'The look'],
  ['u_kiki', 'Sold out Ruby Hour in 11 minutes. Sorry to the 40,000 people in the queue. Restock Friday.', 'Ruby Hour sold out'],
  ['u_dahlia', 'I walked away from the dinner, not the family. There is a difference and it is a very good dessert.', 'Walked out of dinner'],
  ['u_bri', 'My fragrance launched from my bedroom and now it’s in every counter in Venus Hills. Bedroom CEO.', 'Bedroom CEO'],
  ['u_rhea', 'Five daughters, five careers, one group chat that never sleeps. Momager tip: mute nothing.', 'Momager tip'],
  ['u_lora', 'Chatty Whims episode 4: I talk about the seating chart for forty minutes. Worth it.', 'The seating chart'],
  ['u_sablev', 'The reunion couch is not big enough for both of our egos. We’ll need a second couch.', 'Second couch'],
  ['u_kiki', 'Swapped my old gloss for Dahlia’s jacket. The pool paid me the difference. Sisterhood is a market.', 'Sister swap'],
  ['u_lyra', 'Opened the Venus Reunion Runway with my new single and nobody fought for four whole minutes.', 'Four minutes of peace'],
  ['u_zuri', 'Walked for all five Venus sisters in one night. Five fittings, five feuds, one perfect walk.', 'Five fittings'],
  ['u_noemi', 'Did make-up for the reunion. Sixty-four shades, zero tears (on camera).', 'Sixty-four shades'],
];
feed.shots = strip(feed.shots, 'cb_');
const now = Date.parse('2026-10-12T00:00:00Z');
SIREN.forEach((q, i) => feed.shots.push({ id: `cb_shot_siren_${pad(i + 1, 2)}`, authorId: 'u_maralune', clubId: 'c_calder', worldId: club('c_calder').worldIds[0],
  media: { kind: 'image', tone: pick(['ink', 'accent', 'neutral']), ratio: '4/5', title: `“${q}”` }, caption: `${q}, Mara Lune, on the Calder lot`, likes: int(9000, 240000), comments: int(100, 9000), reshares: int(200, 30000),
  createdAt: new Date(now - int(1, 900) * 36e5).toISOString(), tags: ['#MaraLune', '#CalderBrothers', '#GoldenAge'], lookItems: [] }));
GOSSIP.forEach(([who, text, title], i) => feed.shots.push({ id: `cb_shot_gossip_${pad(i + 1, 2)}`, authorId: who, clubId: 'c_venus', worldId: club('c_venus').worldIds[0],
  media: { kind: 'image', tone: pick(['accent', 'ink', 'sage']), ratio: '4/5', title }, caption: text, likes: int(20000, 900000), comments: int(2000, 90000), reshares: int(1000, 120000),
  createdAt: new Date(now - int(1, 400) * 36e5).toISOString(), tags: ['#VenusGirls', '#ChattyWhims', '#Reunion'], lookItems: [] }));
feed.moments = strip(feed.moments, 'cb_');
['u_lora', 'u_kiki', 'u_maralune', 'u_lyra', 'u_zuri', 'u_sablev'].forEach((u, i) => feed.moments.push({ id: `cb_m_${i + 1}`, userId: u, label: core.users.find((x) => x.id === u)?.handle ?? u, live: i < 3 }));

// ── Fashion casts with cast names, concerts, star stats ──────────────────────────────────────────────────────
const MODELS = ['u_zuri', 'u_anya', 'u_kaim', 'u_ines2', 'u_dahlia', 'u_mira', 'u_tavi', 'u_lune', 'u_hart', 'u_finch', 'u_juno'].filter((u) => core.users.some((x) => x.id === u));
casts.casts = strip(casts.casts, 'cb_');
const houses = core.clubs.filter((c) => ['c_ombre', 'c_deer', 'c_ponte', 'c_venus', 'c_halomodels', 'c_velvetlip', 'c_nova', 'c_opal', 'c_swan'].includes(c.id));
houses.forEach((c, i) => {
  const hs = hosts.hosts.filter((h) => h.clubId === c.id || h.clubId === 'c_halomodels').map((h) => h.id).slice(0, 3);
  const memberIds = some(MODELS, 5); const castNames = memberIds.map((u) => core.users.find((x) => x.id === u)?.name);
  casts.casts.push({ id: `cb_cast_${c.id}`, title: `${c.name}: fashion cast`, kind: 'show', clubId: c.id, worldId: c.worldIds[0], hostIds: hs.length ? hs : [c.hostId], lookIds: [], questIds: [],
    memberIds, castNames, plays: int(4000, 90000), live: i % 3 === 0, stats: { views: int(40000, 900000), likes: int(2000, 90000), chats: int(500, 20000), tipsUsd: int(400, 30000) },
    chat: memberIds.slice(0, 3).map((u, k) => ({ id: `cb_cast_${c.id}_m${k}`, authorId: u, text: ['Walking third tonight.', 'Who has my shoes?', 'Music cue in five.'][k], at: `20:0${k}` })) });
});
const SINGERS = { u_lyra: ['Runway Pop', 'Opening Look'], u_jett: ['Couture House', 'Sample the Silk'], u_soleil: ['Velvet Soul', 'Sequins at Midnight'], u_mika: ['Starlight R&B', 'Glow Back'] };
events.events = strip(events.events, 'cb_');
Object.entries(SINGERS).forEach(([u, [genre, track]], i) => events.events.push({ id: `cb_ev_concert_${i + 1}`, kind: 'party', title: `${core.users.find((x) => x.id === u)?.name} live: ${track}`, genre,
  clubId: 'c_nova', worldId: club('c_nova').worldIds[0], startsAt: new Date(now + (i + 2) * 3 * 864e5 + 20 * 36e5).toISOString(), rsvps: int(2000, 40000) }));
for (const u of core.users) {
  if (stars.includes(u.id)) u.celebStats = { kind: 'star', films: series.series.filter((x) => x.kind === 'film' && x.cast.includes(u.id)).length, fans: u.followers, rating: +(3.8 + rnd()).toFixed(1), awards: int(0, 9) };
  else if (SINGERS[u.id]) u.celebStats = { kind: 'singer', genre: SINGERS[u.id][0], topTrack: SINGERS[u.id][1], streams: int(5e6, 9e8), monthlyListeners: int(1e5, 4e7), tours: int(1, 9) };
  else if (MODELS.includes(u.id)) u.celebStats = { kind: 'model', shows: int(8, 60), covers: int(0, 24), campaigns: int(1, 18), board: 'Halo Models' };
  else if (['u_lora', 'u_kiki', 'u_bri', 'u_sablev', 'u_rhea'].includes(u.id)) u.celebStats = { kind: 'reality', episodes: int(20, 140), feuds: int(3, 40), sellOuts: int(1, 30), fans: u.followers };
}

// ── Beauty lines: 64 shades each (pools.mjs turns every line into a 64-unit drop pool) ───────────────────────
const hsl2hex = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l); const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0'); return '#' + f(0) + f(8) + f(4); };
const SHADE_WORDS = ['Ruby', 'Rose', 'Coral', 'Berry', 'Plum', 'Nude', 'Mocha', 'Cherry', 'Peach', 'Orchid', 'Wine', 'Copper', 'Blush', 'Fig', 'Brick', 'Petal'];
const SHADE_TAIL = ['Hour', 'Kiss', 'Velvet', 'Satin'];
const LINES = [['velvetlip_lip', 'c_velvetlip', 'Velvet Lip Lipsticks', 'lipstick', 350, 70, 42], ['velvetlip_gloss', 'c_velvetlip', 'Gloss Pier Glosses', 'gloss', 340, 80, 58],
  ['velvetlip_blush', 'c_velvetlip', 'Blush Garden Blushes', 'blush', 10, 60, 66], ['venus_glow', 'c_venus', 'Glow by Kiki Venus', 'lipstick', 330, 75, 48]];
const beauty = { lines: LINES.map(([id, clubId, name, kind, hue, sat, light]) => ({ id: 'cb_line_' + id, clubId, name, kind,
  shades: Array.from({ length: 64 }, (_, i) => ({ id: `cb_shade_${id}_${pad(i + 1, 2)}`, name: `${SHADE_WORDS[i % 16]} ${SHADE_TAIL[Math.floor(i / 16)]}`, hex: hsl2hex((hue + ((i * 7) % 44) - 22 + 360) % 360, sat - (i % 8) * 3, light - (i % 16) * 1.5) })) })) };
write('beauty.json', beauty);

write('core.json', core); write('series.json', series); write('stories.json', stories); write('feed.json', feed); write('casts.json', casts); write('events.json', events);
console.log(`celebs: ${series.series.filter((x) => x.id.startsWith('cb_film_')).length} films · ${series.series.filter((x) => x.id.startsWith('cb_drama_')).length} dramas · ${SIREN.length} statements · ${GOSSIP.length} gossip shots · ${casts.casts.filter((x) => x.id.startsWith('cb_')).length} fashion casts · ${Object.keys(SINGERS).length} concerts · ${beauty.lines.length} beauty lines × 64 shades`);
