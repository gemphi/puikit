#!/usr/bin/env node
// Hosts as roles, casts and sales, seeded and idempotent (re-running gives the same files).
//   node scripts/hosts-casts.mjs
// A host is a child of a profile (hosts[].ownerId): one of 64 role types in 16 categories, each with its genres and
// the behaviours that role plays. A cast is where hosts feature together, a show, a play or film, with its looks,
// quests, plays, stats and live chat. Sales are the OpenSea-style activity (mint, list, offer, sale, transfer) on
// pieces and looks, priced in USD.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const write = (f, v) => writeFileSync(join(DATA, f), JSON.stringify(v));
let seed = 0x5eed; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const some = (xs, n) => { const c = [...xs]; const out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return out; };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// 16 categories × 4 role types = 64. Behaviours are what the role does when it plays in a cast.
const CATS = [
  ['Screen', ['drama', 'comedy', 'noir', 'sci-fi'], [['Actor', ['Takes a lead or supporting part', 'Rehearses scenes with co-stars', 'Improvises with the audience', 'Wears a look on camera']], ['Director', ['Blocks every scene', 'Casts hosts into roles', 'Calls cut and retakes', 'Cuts the trailer']], ['Stunt double', ['Performs the risky beats', 'Choreographs fights', 'Tests sets before a show']], ['Voice artist', ['Voices characters and agents', 'Narrates the trailer', 'Dubs scenes live']]]],
  ['Music', ['pop', 'house', 'jazz', 'afrobeats'], [['Musician', ['Plays live sets', 'Releases tracks to holders', 'Scores runway walks']], ['DJ', ['Mixes the after-party', 'Takes requests in chat', 'Drops exclusive edits']], ['Producer', ['Builds beats for shows', 'Collaborates on drops', 'Masters the soundtrack']], ['Singer', ['Performs the opening number', 'Duets with agents', 'Hosts listening rooms']]]],
  ['Art', ['digital', 'street', 'abstract', 'portrait'], [['Painter', ['Paints live on stream', 'Mints canvases as pieces', 'Customises looks']], ['Sculptor', ['Builds 3D props', 'Sculpts world landmarks', 'Prints limited figures']], ['Photographer', ['Shoots runway looks', 'Curates galleries', 'Retouches campaign shots']], ['Illustrator', ['Draws character sheets', 'Designs club emblems', 'Sketches looks to order']]]],
  ['Fashion', ['couture', 'streetwear', 'avant-garde', 'heritage'], [['Designer', ['Designs collections', 'Fits looks on models', 'Opens the show']], ['Stylist', ['Styles looks for hosts', 'Builds outfits from the store', 'Runs fitting rooms']], ['Model', ['Walks the runway', 'Poses for campaigns', 'Wears looks in worlds']], ['Tailor', ['Alters looks to fit', 'Hand-finishes pieces', 'Teaches pattern classes']]]],
  ['Business', ['luxury', 'tech', 'real estate', 'media'], [['Tycoon', ['Funds shows and worlds', 'Buys the floor', 'Sponsors quests']], ['Investor', ['Backs Phipad clubs', 'Stakes in pools', 'Mentors founders']], ['Founder', ['Launches a club', 'Hires hosts', 'Pitches on stage']], ['Broker', ['Matches buyers and sellers', 'Makes offers on pieces', 'Runs auctions']]]],
  ['Sport', ['football', 'racing', 'boxing', 'tennis'], [['Athlete', ['Competes in league rounds', 'Wears kit drops', 'Signs pieces for fans']], ['Coach', ['Trains club teams', 'Plans quest strategy', 'Reviews match tape']], ['Referee', ['Judges matches', 'Settles disputes', 'Calls the result']], ['Scout', ['Spots new talent', 'Reports on rivals', 'Recommends signings']]]],
  ['Games', ['strategy', 'arcade', 'rpg', 'battle'], [['Gamer', ['Plays quests live', 'Sets leaderboard scores', 'Teams up in raids']], ['Guild leader', ['Organises raids', 'Splits rewards', 'Recruits members']], ['Speedrunner', ['Races quests for records', 'Finds shortcuts', 'Streams attempts']], ['Streamer', ['Streams worlds live', 'Reads chat on air', 'Hosts watch parties']]]],
  ['Media', ['news', 'talk', 'culture', 'tech'], [['Presenter', ['Hosts shows on stage', 'Interviews guests', 'Reads the line-up']], ['Journalist', ['Reports on drops', 'Breaks club news', 'Fact-checks rumours']], ['Podcaster', ['Records voice rooms', 'Invites guests', 'Publishes episodes']], ['Critic', ['Reviews shows and looks', 'Rates series', 'Writes the season roundup']]]],
  ['Literature', ['fiction', 'poetry', 'myth', 'memoir'], [['Author', ['Writes club lore', 'Publishes serials', 'Signs editions']], ['Poet', ['Performs readings', 'Writes runway verses', 'Hosts open mics']], ['Editor', ['Edits scripts', 'Curates anthologies', 'Polishes captions']], ['Screenwriter', ['Writes episodes', 'Plots series arcs', 'Rewrites scenes on set']]]],
  ['Performance', ['dance', 'circus', 'stand-up', 'cabaret'], [['Dancer', ['Dances the opening', 'Choreographs walks', 'Teaches routines']], ['Comedian', ['Warms up the crowd', 'Roasts the guests', 'Hosts the after-show']], ['Magician', ['Performs illusions', 'Reveals drops', 'Hides quest clues']], ['Acrobat', ['Performs aerial acts', 'Opens world festivals', 'Trains stunt teams']]]],
  ['Food', ['fine dining', 'street food', 'pastry', 'mixology'], [['Chef', ['Cooks the tasting menu', 'Hosts supper clubs', 'Names dishes after looks']], ['Sommelier', ['Pairs wines with shows', 'Leads tastings', 'Curates the cellar']], ['Mixologist', ['Mixes signature drinks', 'Runs the bar', 'Invents club cocktails']], ['Baker', ['Bakes for premieres', 'Runs pop-up stalls', 'Teaches masterclasses']]]],
  ['Architecture', ['modern', 'baroque', 'brutalist', 'organic'], [['Architect', ['Designs world districts', 'Builds venues', 'Plans city blocks']], ['Interior designer', ['Furnishes stores', 'Styles stages', 'Designs fitting rooms']], ['Urbanist', ['Plans transit', 'Zones districts', 'Hosts town halls']], ['Landscaper', ['Grows gardens', 'Shapes parks', 'Lights the boulevards']]]],
  ['Science', ['physics', 'biotech', 'space', 'AI'], [['Inventor', ['Builds gadgets for quests', 'Patents ideas', 'Demos prototypes']], ['Researcher', ['Runs experiments', 'Publishes findings', 'Answers questions live']], ['Engineer', ['Builds world systems', 'Fixes breakdowns', 'Optimises shows']], ['Astronomer', ['Hosts star nights', 'Maps the skies', 'Names new worlds']]]],
  ['Wellness', ['movement', 'mindfulness', 'nutrition', 'beauty'], [['Trainer', ['Runs workouts', 'Coaches athletes', 'Sets fitness quests']], ['Yogi', ['Leads sessions', 'Hosts retreats', 'Guides breathing']], ['Nutritionist', ['Plans menus', 'Advises athletes', 'Reviews dishes']], ['Beauty artist', ['Does runway make-up', 'Teaches looks', 'Launches palettes']]]],
  ['Civic', ['governance', 'diplomacy', 'heritage', 'activism'], [['Mayor', ['Runs a city', 'Opens events', 'Votes on proposals']], ['Diplomat', ['Brokers club alliances', 'Hosts summits', 'Settles disputes']], ['Curator', ['Curates museum wings', 'Restores heritage pieces', 'Guides tours']], ['Activist', ['Leads campaigns', 'Rallies members', 'Raises funds']]]],
  ['Mystic', ['folklore', 'cosmic', 'gothic', 'fable'], [['Oracle', ['Reads fortunes', 'Predicts drops', 'Gives quest hints']], ['Alchemist', ['Brews potions', 'Transmutes pieces', 'Crafts rare items']], ['Storyteller', ['Tells legends', 'Narrates worlds', 'Hosts fireside chats']], ['Bard', ['Sings ballads', 'Chronicles battles', 'Entertains taverns']]]],
];
const roles = { categories: [], types: [] };
for (const [cat, genres, types] of CATS) {
  const cid = 'rc_' + slug(cat);
  roles.categories.push({ id: cid, name: cat, genres });
  for (const [name, behaviours] of types) roles.types.push({ id: 'rt_' + slug(name), name, categoryId: cid, genres, behaviours });
}
if (roles.types.length !== 64 || roles.categories.length !== 16) throw new Error('need 16 categories × 4 types');

const hosts = read('hosts.json');
const core = read('core.json'); const shows = read('shows.json'); const series = read('series.json'); const econ = read('economy.json');
const agents = read('agents.json'); const club = read('club.json'); const stores = read('stores.json'); const ls = read('ls.json');
const people = [...core.users.map((u) => u.id), ...agents.agents.map((a) => a.id)];

// Every host gets one of the 64 role types (one each, 64 hosts), a genre from its category and the role's behaviours.
hosts.hosts.forEach((h, i) => { const t = roles.types[i % 64]; h.roleTypeId = t.id; h.genre = t.genres[i % t.genres.length]; h.behaviours = t.behaviours; });

const hostByClub = Object.fromEntries(hosts.hosts.filter((h) => h.clubId).map((h) => [h.clubId, h.id]));
const lsClub = ls.store.clubId ?? 'c_opal';
const looksByClub = {};
for (const s of stores.stores) looksByClub[s.clubId] = s.looks.map((l) => l.id);
looksByClub[lsClub] = [...(looksByClub[lsClub] ?? []), ...ls.looks.map((l) => l.id)];
const questsByWorld = {};
for (const q of econ.quests) (questsByWorld[q.worldId] ||= []).push(q.id);
const hostIds = hosts.hosts.map((h) => h.id);

const lines = ['Places, everyone.', 'That look is unreal.', 'Who styled the second walk?', 'Live in 5.', 'The quest clue is in the finale.', 'Encore!', 'Holders get the after-party link.', 'Swap seats for the next scene.'];
const castOf = (id, title, kind, clubId, worldId, extra) => {
  const lead = hostByClub[clubId];
  const hs = [...new Set([lead, ...some(hostIds, 2 + Math.floor(rnd() * 3))].filter(Boolean))];
  return {
    id, title, kind, clubId, worldId, hostIds: hs,
    lookIds: some(looksByClub[clubId] ?? [], 3), questIds: some(questsByWorld[worldId] ?? [], 2),
    plays: Math.floor(200 + rnd() * 48000), live: rnd() < 0.3,
    stats: { views: Math.floor(1000 + rnd() * 250000), likes: Math.floor(100 + rnd() * 40000), chats: Math.floor(10 + rnd() * 9000), tipsUsd: Math.floor(rnd() * 25000) },
    chat: Array.from({ length: 6 }, (_, k) => ({ id: id + '_m' + k, authorId: pick(people), text: pick(lines), at: `${19 + Math.floor(k / 3)}:${String((k * 7) % 60).padStart(2, '0')}` })),
    ...extra,
  };
};
const casts = [
  ...shows.shows.map((s) => castOf('cast_' + s.id, s.title, 'show', s.clubId, s.worldId, { showId: s.id, hostAgentId: s.hostAgentId })),
  ...series.series.map((x) => castOf('cast_' + x.id, x.title, x.kind === 'film' ? 'film' : 'play', x.clubId, x.worldId, { seriesId: x.id })),
];

// Sales: mint → (offer) → sale / transfer → (list) on pieces and looks.
const day = 864e5; const now = Date.parse('2026-10-11T00:00:00Z');
const sales = [];
const items = [
  ...club.pieces.map((p) => ({ kind: 'piece', id: p.id, by: p.creatorId, base: 80 + rnd() * 900 })),
  ...[...stores.stores.flatMap((s) => s.looks), ...ls.looks].map((l) => ({ kind: 'look', id: l.id, by: null, base: l.usd ?? 120 })),
];
for (const it of some(items, 520)) {
  let owner = it.by ?? pick(people); let t = now - Math.floor((30 + rnd() * 330) * day); let price = it.base;
  sales.push({ id: 'sl' + sales.length, event: 'mint', itemKind: it.kind, itemId: it.id, toId: owner, priceUsd: Math.round(price), at: new Date(t).toISOString() });
  const hops = 1 + Math.floor(rnd() * 3);
  for (let h = 0; h < hops; h++) {
    t += Math.floor((2 + rnd() * 40) * day); if (t > now) break;
    price = Math.max(10, price * (0.8 + rnd() * 0.7));
    const buyer = pick(people.filter((p) => p !== owner));
    if (rnd() < 0.25) sales.push({ id: 'sl' + sales.length, event: 'offer', itemKind: it.kind, itemId: it.id, fromId: buyer, toId: owner, priceUsd: Math.round(price * 0.9), at: new Date(t - day).toISOString() });
    sales.push({ id: 'sl' + sales.length, event: rnd() < 0.85 ? 'sale' : 'transfer', itemKind: it.kind, itemId: it.id, fromId: owner, toId: buyer, priceUsd: Math.round(price), at: new Date(t).toISOString() });
    owner = buyer;
  }
  if (rnd() < 0.3) sales.push({ id: 'sl' + sales.length, event: 'list', itemKind: it.kind, itemId: it.id, fromId: owner, priceUsd: Math.round(price * 1.2), at: new Date(Math.min(now, t + 3 * day)).toISOString() });
}
sales.sort((a, b) => b.at.localeCompare(a.at));

write('roles.json', roles); write('casts.json', { casts }); write('sales.json', { sales }); write('hosts.json', hosts);
console.log(`roles: ${roles.categories.length} categories, ${roles.types.length} types · hosts with roles: ${hosts.hosts.length} · casts: ${casts.length} · sales events: ${sales.length}`);
