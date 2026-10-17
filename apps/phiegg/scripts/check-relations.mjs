#!/usr/bin/env node
// Verify every relation in data/*.json: each *Id / *Ids field must point at a record that exists, of the kind the
// field names. Prints one line per field (links, dangling) and exits 1 if anything dangles.
//   node scripts/check-relations.mjs        (npm run data:check)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const core = read('core.json'), hosts = read('hosts.json'), agents = read('agents.json'), shows = read('shows.json'), series = read('series.json');
const econ = read('economy.json'), events = read('events.json'), stores = read('stores.json'), ls = read('ls.json'), club = read('club.json');
const roles = read('roles.json'), casts = read('casts.json'), sales = read('sales.json'), places = read('places.json'), feed = read('feed.json');
const messages = read('messages.json'), stories = read('stories.json'), P = read('pools.json');
import { readdirSync, existsSync } from 'node:fs';
const RIDE = existsSync(join(DATA, 'ride.json')) ? read('ride.json') : { list: [] }; const JEWEL = existsSync(join(DATA, 'jewel.json')) ? read('jewel.json') : { list: [] };
const A = existsSync(join(DATA, 'assets.json')) ? read('assets.json') : { eggs: [], sums: [], profiles: [] };
const PROD = join(DATA, 'productions'); const prods = existsSync(PROD) ? Object.assign({}, ...readdirSync(PROD).filter((f) => f.endsWith('.json')).map((f) => read(join('productions', f)))) : {};
// Production roles and episodes as records, so their links are checked like any other.
const prodRoles = Object.entries(prods).flatMap(([sid, p]) => p.roles.map((r, i) => ({ id: `${sid}:r${i}`, seriesId: sid, personId: r.personId, hostId: r.hostId ?? undefined, lookIds: r.lookIds, roleTypeId: r.roleTypeId ?? undefined })));
const prodEps = Object.entries(prods).flatMap(([sid, p]) => p.seasons.flatMap((se) => se.episodes.map((e) => ({ id: `${sid}:${se.n}:${e.n}`, seriesId: sid, directorId: e.directorId, writerIds: e.writerIds, guestIds: e.guestIds, lookId: e.shop.lookId, poolId: e.shop.poolId ?? undefined }))));

// The kinds: every id-bearing collection, as in the phi-kit items+kinds model.
const kinds = {
  person: [...core.users, ...agents.agents], club: core.clubs, world: core.worlds, city: core.worlds.flatMap((w) => w.cities),
  host: hosts.hosts, nest: [...hosts.nests, ...read('collections.json').collections], show: shows.shows, pose: shows.poses, series: series.series, story: stories.stories,
  quest: econ.quests, coin: econ.coins, event: events.events, store: [...stores.stores, { id: 'ls' }, ls.store], look: [...stores.stores.flatMap((s) => s.looks), ...ls.looks],
  pool: [...stores.stores.flatMap((s) => s.pools), ...ls.pools, ...P.pools], lot: P.lots, poolQuest: P.quests, metric: P.metrics, liquidity: econ.liquidity, piece: club.pieces, role: roles.types, roleCategory: roles.categories,
  egg: A.eggs, sum: A.sums, profilePft: A.profiles, ride: RIDE.list, jewel: JEWEL.list, productionRole: prodRoles, episode: prodEps,
  cast: casts.casts, sale: sales.sales, shot: feed.shots, post: agents.posts, room: messages.voiceRooms, conversation: messages.conversations,
};
const ids = Object.fromEntries(Object.entries(kinds).map(([k, rows]) => [k, new Set(rows.map((r) => r.id))]));
const anyKind = (id) => Object.keys(ids).find((k) => ids[k].has(id));

// field → kind it must point at
const FIELD = {
  founderId: 'person', ownerId: 'person', creatorId: 'person', authorId: 'person', userId: 'person', hostAgentId: 'person', fromId: 'person', toId: 'person', createdBy: 'person', speakerIds: 'person', userIds: 'person', mentorIds: 'person',
  clubId: 'club', clubIds: 'club', sponsorClubId: 'club', worldId: 'world', worldIds: 'world', cityId: 'city', venueCityId: 'city',
  hostId: 'host', hostIds: 'host', nestId: 'nest', personId: 'person', directorId: 'person', writerIds: 'person', guestIds: 'person', producerId: 'person', holderId: 'person', holderHostId: 'host', lookId: 'look', eggIds: 'egg', sumIds: 'sum', profileIds: 'profilePft', inputs: 'egg', seriesIds: 'series', parentId: 'nest', showId: 'show', poseId: 'pose', poseIds: 'pose', seriesId: 'series', storyId: 'story',
  questIds: 'quest', lookIds: 'look', storeId: 'store', poolId: 'pool', teamIds: 'host', memberIds: 'person', partyIds: 'event', lotIds: 'lot', liquidityId: 'liquidity', coinIds: 'coin', metricIds: 'metric', eventId: 'event', eventIds: 'event', roleTypeId: 'role', categoryId: 'roleCategory', shotId: 'shot',
};
const SKIP = new Set(['tokenId', 'campaignId', 'trackId', 'questId', 'conversationId', 'itemId', 'itemIds']);
const stats = {}; let bad = 0; const examples = [];
const check = (kind, row) => {
  for (const [f, v] of Object.entries(row)) {
    if (!/(Id|Ids)$/.test(f) || SKIP.has(f)) continue;
    const to = FIELD[f]; if (!to) { (stats[`${kind}.${f}`] ||= { n: 0, bad: 0, unknown: true }); continue; }
    for (const t of (Array.isArray(v) ? v : [v])) {
      if (t == null || t === '') continue;
      const s = (stats[`${kind}.${f} → ${to}`] ||= { n: 0, bad: 0 }); s.n++;
      if (!ids[to].has(t)) { s.bad++; bad++; if (examples.length < 12) examples.push(`${kind} ${row.id}.${f} = ${t} (${anyKind(t) ?? 'missing'})`); }
    }
  }
};
for (const [k, rows] of Object.entries(kinds)) for (const r of rows) if (r && typeof r === 'object') check(k, r);
for (const s of shows.shows) for (const l of s.looks) check('showLook', l);
// pool quests point at their pool's quest hub; lot units are looks (store pools) or show looks (show drops)
for (const p of P.pools) { const st = (stats['pool.questId → poolQuest'] ||= { n: 0, bad: 0 }); st.n++; if (!ids.poolQuest.has(p.questId)) { st.bad++; bad++; } }
const showLooks = new Set([...shows.shows.flatMap((s) => s.looks.map((l) => l.id)), ...(read('beauty.json').lines ?? []).flatMap((l) => l.shades.map((x) => x.id))]);
for (const l of P.lots) for (const it of l.itemIds) { const st = (stats['lot.itemIds → look|showLook'] ||= { n: 0, bad: 0 }); st.n++; if (!ids.look.has(it) && !showLooks.has(it)) { st.bad++; bad++; if (examples.length < 12) examples.push(`lot ${l.id} item ${it}`); } }
for (const c of casts.casts) for (const m of c.chat) check('castChat', m);
for (const s of sales.sales) { const k = s.itemKind; const st = (stats[`sale.itemId → ${k}`] ||= { n: 0, bad: 0 }); st.n++; if (!ids[k]?.has(s.itemId)) { st.bad++; bad++; } }
for (const [cid, c] of Object.entries(places.cities)) { const st = (stats['placeCity.worldId → world'] ||= { n: 0, bad: 0 }); st.n++; if (!ids.world.has(c.worldId)) { st.bad++; bad++; } }
for (const ds of Object.values(places.districts)) for (const d of ds) for (const p of d.places) check('place', p);

const width = Math.max(...Object.keys(stats).map((k) => k.length));
for (const [k, s] of Object.entries(stats).sort()) console.log(`${k.padEnd(width)}  ${s.unknown ? 'unchecked' : String(s.n).padStart(6) + ' links' + (s.bad ? `  ${s.bad} dangling` : '')}`);
console.log(`\n${Object.values(kinds).reduce((n, r) => n + r.length, 0)} items in ${Object.keys(kinds).length} kinds · ${Object.values(stats).reduce((n, s) => n + s.n, 0)} links · ${bad} dangling`);
if (examples.length) console.log('e.g.\n  ' + examples.join('\n  '));
process.exit(bad ? 1 : 0);
