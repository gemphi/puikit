// Pools: the centre of PFTs (profile fungible tokens).
//
//   node scripts/pools.mjs          (idempotent, safe to re-run after brands.mjs / deepen-data.mjs)
//
// 1. Renames OpenSea-style "collections" to POOLS everywhere in the store data: stores[].collections → pools,
//    looks[].collectionId → poolId (ls.json and stores.json), and the word in user-facing copy.
// 2. Builds data/pools.json:
//      pools  , every store pool, plus one drop pool per fashion show (an upcoming show is both a drop and a pool quest)
//      lots   , what is for sale besides single looks: packs (4–7 looks, priced unit by unit, high → low) and drops
//                (a show's 64 looks, or a club drop's run), each with a supply and a sold counter
//      quests , one pool quest per pool: its pool of metrics, its sub-quests (one per stat + the club's quests) and
//                its participating coins
//      metrics, the stat catalogue (OpenSea-style metrics, called stats here); every stat links to a quest
// 3. Links liquidity: economy.pools (PHI/OPAL pairs) becomes economy.liquidity, each pair tied to its club's pool.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const write = (f, d) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(d, null, 2) + '\n');
const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const r01 = (...p) => (fnv(p.join('·')) % 100000) / 100000;
const between = (lo, hi, ...p) => Math.round(lo + (hi - lo) * r01(...p));

const stores = read('stores.json'), ls = read('ls.json'), economy = read('economy.json'), shows = read('shows.json');
const events = read('events.json'), core = read('core.json');

// ── 1. collections → pools ───────────────────────────────────────────────────────────────────────────────────
const renameStore = (s) => {
  if (s.collections && !s.pools) { s.pools = s.collections; delete s.collections; }
  for (const l of s.looks ?? []) if (l.collectionId !== undefined) { l.poolId = l.collectionId; delete l.collectionId; }
};
renameStore(ls); stores.stores.forEach(renameStore);

const lsStore = { id: 'ls', clubId: ls.store.clubId ?? 'c_opal', name: ls.store.name, pools: ls.pools, looks: ls.looks };
const allStores = [lsStore, ...stores.stores];
const clubOf = (id) => core.clubs.find((c) => c.id === id);
const coinOfClub = (id) => economy.coins.find((c) => c.clubId === id);

// ── metrics: the stat catalogue ──────────────────────────────────────────────────────────────────────────────
const metrics = [
  ['floor', 'Floor price', 'price', 'usd', 'Lowest live unit price in the pool'],
  ['topOffer', 'Top offer', 'price', 'usd', 'Best standing offer on any unit'],
  ['ladderHigh', 'Top of the ladder', 'price', 'usd', 'Dearest unit right now'],
  ['ladderTotal', 'Pool value (moving)', 'price', 'usd', 'Sum of every unit’s moving price, always transitory'],
  ['avgSale', 'Average sale', 'price', 'usd', 'Mean of all sales'],
  ['marketCap', 'Market cap', 'price', 'usd', 'Floor × supply'],
  ['vol24h', 'Volume 24h', 'volume', 'usd', 'USD traded in the last day'],
  ['vol7d', 'Volume 7d', 'volume', 'usd', 'USD traded in the last week'],
  ['vol30d', 'Volume 30d', 'volume', 'usd', 'USD traded in the last month'],
  ['volAll', 'Total volume', 'volume', 'usd', 'USD traded since mint'],
  ['sales24h', 'Sales 24h', 'volume', 'count', 'Units sold in the last day'],
  ['sales7d', 'Sales 7d', 'volume', 'count', 'Units sold in the last week'],
  ['swaps24h', 'Swaps 24h', 'volume', 'count', 'Fungible swaps into or out of the pool'],
  ['swapPaid24h', 'Differences paid 24h', 'volume', 'usd', 'What the pool paid out sponsoring swaps'],
  ['change24h', 'Change 24h', 'momentum', 'pct', 'Floor move over a day'],
  ['change7d', 'Change 7d', 'momentum', 'pct', 'Floor move over a week'],
  ['sold', 'Sold', 'supply', 'ratio', 'Editions sold of the supply'],
  ['remaining', 'Remaining', 'supply', 'count', 'Editions still on sale'],
  ['supply', 'Supply', 'supply', 'count', 'Editions across every lot'],
  ['listedPct', 'Listed', 'supply', 'pct', 'Share of held units listed for sale'],
  ['owners', 'Owners', 'holders', 'count', 'Profiles holding at least one unit'],
  ['uniquePct', 'Unique owners', 'holders', 'pct', 'Owners ÷ supply'],
  ['whales', 'Whales', 'holders', 'count', 'Owners with five units or more'],
  ['newOwners7d', 'New owners 7d', 'holders', 'count', 'First-time holders this week'],
  ['solos', 'Solo items', 'lots', 'count', 'Looks sold one by one'],
  ['packs', 'Packs', 'lots', 'count', 'Sets of 4–7 looks'],
  ['drops', 'Drops', 'lots', 'count', 'Runs of up to 64 units'],
  ['royalty', 'Creator royalty', 'lots', 'pct', 'Share of every resale paid to the creator'],
  ['tvl', 'Liquidity', 'liquidity', 'usd', 'USD staked behind the pool’s pair'],
  ['apr', 'Staking APR', 'liquidity', 'pct', 'Yield on staked liquidity'],
  ['stakers', 'Stakers', 'liquidity', 'count', 'Profiles staking the pair'],
  ['reserve', 'Sponsor reserve', 'liquidity', 'usd', 'What the pool can pay out to sponsor swaps'],
  ['entrants', 'Quest entrants', 'quests', 'count', 'Profiles in the pool quest'],
  ['questsLive', 'Live quests', 'quests', 'count', 'Stat quests still open'],
  ['coinPrice', 'Pool coin', 'coins', 'usd', 'Price of the pool’s club coin'],
  ['coinHolders', 'Coin holders', 'coins', 'count', 'Holders of the pool’s club coin'],
].map(([id, label, group, format, hint]) => ({ id, label, group, format, hint }));

const PFT_SECTIONS = [
  { h: 'Utility, not speculation', body: 'Phiegg is moving away from speculative NFTs. A Profile Fungible Token (PFT) is a utility token on your Phiace profile: it opens doors, carries a membership, buys a seat at a show or a ride at a party, and counts toward what your community decides next. Its value is what it lets you do.' },
  { h: 'Fungible means exchangeable', body: 'Any PFT can be exchanged for any other. Hold a $2,000 handbag and want a $300 jeans skirt? Swap them. The pool you take the skirt from pays you the $1,700 difference, the market maker sponsors the deal.' },
  { h: 'Pools are the centre', body: 'Every PFT lives in a pool: a store line, a club drop, a fashion show or a club of utility PFTs. The Onyx Hitch Hikers Club (OHHC), Bold Pups (BPUP) and Epic Pods AC (EPAC) are pools of 10,000 PFTs each. A pool quotes every unit, sponsors swaps out of it and keeps a reserve to pay the differences.', list: ['Solo: one item, one unit', 'Pack: 4–7 items, each priced on its own, high to low; the pack costs the sum', 'Drop: up to 64 units sold as editions, 3,009 / 3,999 sold', 'Every world is a pool party, linked to its pool'] },
  { h: 'Prices move', body: 'A unit’s price is found, not fixed. Each lot has a shelf of 64 values; every 30 seconds the pricing function uses the unit’s index to pick one and glides to it. A pack or drop total is the sum of moving prices, so it is always transitory.' },
  { h: 'Barter until the limit', body: 'Swaps settle the difference in USD. Differences paid to you count toward a withdraw limit over a rolling week. Barter freely until you reach it; after that, only fair swaps, close in value, or where you pay, go through until the week rolls.', list: ['Give dearer, receive the difference from the pool', 'Give cheaper, pay the difference from your wallet', 'Within 5 % is an even swap: nothing moves', 'Withdraw limit: $2,500 a week'] },
  { h: 'EGG funds the teams', body: 'EGG is the main token. It distributes funds, and direction, to qualifying teams. Every pool runs an application of 8 steps and 16 questions; the club’s hosts join it as the team automatically, and its stats show how far it has come.', list: ['Each stat is a quest: lift it and the pool pays out', 'Each pool quest holds its stats, its quests and the coins taking part', 'Qualifying teams receive EGG to build, host and grow'] },
  { h: 'Everyone is welcome', body: 'You are all welcome to apply. Bring a team, a world and a party, open a pool, and enjoy the fun with your community.' },
  { h: 'Quick answers', body: '', list: ['Is a PFT an investment? No, it is a utility you use.', 'Is every PFT swappable? Yes, any PFT for any other.', 'Who pays the difference? The pool you take from.', 'Can I cash out? Up to the weekly withdraw limit.', 'How do teams get funded? Apply; qualifying teams receive EGG.'] },
];

// ── 2. pools, lots, quests ───────────────────────────────────────────────────────────────────────────────────
const pools = [], lots = [], quests = [];

// Every pool quest is an application: 8 steps (each owns a set of the pool's stats) and 16 questions.
const APPLICATION = {
  steps: [
    { id: 'apply', n: 1, title: 'Apply', groups: ['quests'], hint: 'Open the application and the pool quest.' },
    { id: 'team', n: 2, title: 'Team', groups: ['holders'], hint: 'Hosts join automatically as the team.' },
    { id: 'world', n: 3, title: 'World & party', groups: ['supply'], hint: 'Link the world; throw the pool party.' },
    { id: 'lots', n: 4, title: 'Lots', groups: ['lots'], hint: 'Solo looks, packs of 4–7 and drops.' },
    { id: 'price', n: 5, title: 'Price', groups: ['price'], hint: 'Set the shelf; prices move from it.' },
    { id: 'trade', n: 6, title: 'Trade & swap', groups: ['volume'], hint: 'Sales and sponsored swaps.' },
    { id: 'grow', n: 7, title: 'Momentum & liquidity', groups: ['momentum', 'liquidity'], hint: 'Change, staking and reserve.' },
    { id: 'fund', n: 8, title: 'Fund with EGG', groups: ['coins'], hint: 'EGG funds and steers qualifying teams.' },
  ],
  questions: [
    { id: 'q1', step: 'apply', kind: 'text', text: 'What is {pool} for, in one sentence?' },
    { id: 'q2', step: 'apply', kind: 'choice', text: 'Which utility does a {pool} PFT carry first?', options: ['Access', 'Membership', 'Ride / pass', 'Voting', 'Discounts'] },
    { id: 'q3', step: 'team', kind: 'text', text: 'Who leads {pool}, and what has the team shipped before?' },
    { id: 'q4', step: 'team', kind: 'number', text: 'How many hosts and members are on the team?' },
    { id: 'q5', step: 'world', kind: 'text', text: 'Which world is the pool party, and what happens there?' },
    { id: 'q6', step: 'world', kind: 'choice', text: 'Genre of the first pool party?', options: ['House', 'Jazz', 'Pop', 'Drama', 'Sci-fi'] },
    { id: 'q7', step: 'lots', kind: 'number', text: 'How many PFTs in the pool, and how many per drop?' },
    { id: 'q8', step: 'lots', kind: 'choice', text: 'How will you sell: solo, packs of 4–7, or drops?', options: ['Solo', 'Packs', 'Drops', 'All three'] },
    { id: 'q9', step: 'price', kind: 'number', text: 'Centre of the price band, in USD?' },
    { id: 'q10', step: 'price', kind: 'number', text: 'How wide may prices move (± %)?' },
    { id: 'q11', step: 'trade', kind: 'text', text: 'Which pools will you swap with, and who sponsors the difference?' },
    { id: 'q12', step: 'trade', kind: 'number', text: 'Reserve set aside to pay swap differences (USD)?' },
    { id: 'q13', step: 'grow', kind: 'text', text: 'Which three stats will you move this season?' },
    { id: 'q14', step: 'grow', kind: 'text', text: 'What quests will the community play?' },
    { id: 'q15', step: 'fund', kind: 'number', text: 'How much EGG are you asking for, and for what?' },
    { id: 'q16', step: 'fund', kind: 'text', text: 'How will the community share in what {pool} earns?' },
  ],
};
const DAY = 864e5, NOW = Date.parse('2026-10-12T00:00:00Z');
const iso = (t) => new Date(t).toISOString();

const addQuest = (pool, kind, endsAt, extraQuestIds = []) => {
  const club = clubOf(pool.clubId); const coin = coinOfClub(pool.clubId);
  const others = economy.coins.filter((c) => c.clubId !== pool.clubId);
  const coinIds = [coin?.id, others[between(0, others.length - 1, pool.id, 'c1')]?.id, others[between(0, others.length - 1, pool.id, 'c2')]?.id]
    .filter((x, i, a) => x && a.indexOf(x) === i);
  const clubQuests = economy.quests.filter((q) => q.sponsorClubId === pool.clubId).map((q) => q.id);
  const q = {
    id: 'pq_' + pool.id, poolId: pool.id, kind, clubId: pool.clubId, worldId: pool.worldId,
    title: kind === 'show' ? `${pool.name}: walk, drop and pool` : kind === 'drop' ? `${pool.name}: drop quest` : `${pool.name}: pool quest`,
    rewardCoin: coin?.symbol ?? 'EGG', reward: between(400, 6000, pool.id, 'reward'),
    entrants: between(120, 9000, pool.id, 'entrants'), endsAt,
    metricIds: metrics.map((m) => m.id), questIds: [...clubQuests, ...extraQuestIds], coinIds,
    sponsorClubId: club?.id ?? pool.clubId,
    // where the application stands: steps done (0–8) and questions answered (0–16)
    stepsDone: between(1, 7, pool.id, 'steps'), answered: between(4, 16, pool.id, 'answered'),
  };
  quests.push(q); pool.questId = q.id; pool.coinIds = coinIds;
};

const packSize = (id, n) => Math.min(n, 4 + (fnv(id) % 4));
for (const s of allStores) {
  const club = clubOf(s.clubId);
  for (const p of s.pools ?? []) {
    const pool = { id: p.id, name: p.name, kind: 'collection', storeId: s.id, clubId: s.clubId, worldId: club?.worldIds?.[0], season: p.season, desc: p.desc, lookIds: p.lookIds, lotIds: [] };
    const looks = p.lookIds.map((id) => s.looks.find((l) => l.id === id)).filter(Boolean);
    // packs: 4–7 looks, one or two per pool
    for (let k = 0; k < (looks.length >= 8 ? 2 : looks.length >= 4 ? 1 : 0); k++) {
      const n = packSize(p.id + k, looks.length); const set = looks.slice(k * 2, k * 2 + n).length >= 4 ? looks.slice(k * 2, k * 2 + n) : looks.slice(0, n);
      const supply = between(40, 400, p.id, 'pack', k);
      const lot = { id: `pack_${p.id}_${k + 1}`, kind: 'pack', poolId: p.id, title: `${p.name} · ${n}-look pack`, itemIds: set.map((l) => l.id),
        anchors: set.map((l) => l.usd), supply, sold0: Math.round(supply * (0.2 + 0.5 * r01(p.id, 'ps', k))), sellRate: +(0.2 + r01(p.id, 'pr', k)).toFixed(2),
        opensAt: iso(NOW - between(2, 40, p.id, 'po', k) * DAY), base: Math.round(set.reduce((a, l) => a + l.usd, 0) / set.length), spread: 0.14, shelf: 64, seed: `pack:${p.id}:${k}` };
      lots.push(lot); pool.lotIds.push(lot.id);
    }
    pools.push(pool);
  }
}
// club drops (events of kind "drop") land in the club's first pool as a drop of that store's looks
for (const e of events.events.filter((x) => x.kind === 'drop')) {
  const pool = pools.find((p) => p.clubId === e.clubId && p.kind === 'collection'); if (!pool) continue;
  const s = allStores.find((x) => x.id === pool.storeId); const looks = s.looks.slice(0, 64);
  const supply = [999, 1999, 2999, 3999, 4999][between(0, 4, e.id, 'sup')];
  const lot = { id: 'drop_' + e.id, kind: 'drop', poolId: pool.id, title: e.title, eventId: e.id, itemIds: looks.map((l) => l.id), anchors: looks.map((l) => l.usd),
    supply, sold0: Math.round(supply * (0.55 + 0.2 * r01(e.id, 'ds'))), sellRate: +(1 + 4 * r01(e.id, 'dr')).toFixed(2), opensAt: e.startsAt,
    base: Math.round(looks.reduce((a, l) => a + l.usd, 0) / Math.max(1, looks.length)), spread: 0.3, shelf: 64, seed: 'drop:' + e.id };
  lots.push(lot); pool.lotIds.push(lot.id); pool.kind = 'drop'; pool.eventIds = [...(pool.eventIds ?? []), e.id];
}
// every fashion show is a drop pool: its 64 looks are the 64 units, priced off the club's floor
for (const sh of shows.shows) {
  const club = clubOf(sh.clubId); const floorUsd = Math.round((club?.floor ?? 1) * 2400);
  const pool = { id: 'pool_' + sh.id, name: sh.title, kind: 'show', showId: sh.id, clubId: sh.clubId, worldId: sh.worldId, season: sh.season,
    desc: `${sh.title} walks ${sh.looks.length} looks; each look is a unit of the show drop.`, lookIds: [], lotIds: [] };
  const supply = [1999, 2999, 3999, 4999, 6399][between(0, 4, sh.id, 'sup')];
  const opens = Math.max(NOW - 20 * DAY, Date.parse(sh.date));
  const lot = { id: 'drop_' + sh.id, kind: 'drop', poolId: pool.id, title: sh.title + ' drop', showId: sh.id, itemIds: sh.looks.map((l) => l.id),
    supply, sold0: Math.round(supply * (0.5 + 0.25 * r01(sh.id, 'ds'))), sellRate: +(1 + 5 * r01(sh.id, 'dr')).toFixed(2), opensAt: iso(opens),
    base: Math.max(60, Math.round(floorUsd / 16)), spread: 0.4, shelf: 64, seed: 'show:' + sh.id };
  lots.push(lot); pool.lotIds.push(lot.id); pools.push(pool);
}
// utility PFT pools: a club with pftSupply (OHHC, Bold Pups, Epic Pods AC…) is one pool of that many PFTs , 
// a 64-unit drop of its looks sold as `pftSupply` editions
for (const c of core.clubs.filter((x) => x.pftSupply)) {
  const s = allStores.find((x) => x.clubId === c.id); if (!s) continue;
  const looks = Array.from({ length: 64 }, (_, i) => s.looks[i % s.looks.length]);
  const pool = { id: 'pool_pft_' + c.id, name: c.name + ' PFTs', kind: 'pft', storeId: s.id, clubId: c.id, worldId: c.worldIds?.[0], season: 'Genesis',
    desc: `${c.pftSupply.toLocaleString('en-US')} utility PFTs: membership, access and a say in ${c.name}. Funded and steered with EGG.`, lookIds: [], lotIds: [] };
  const lot = { id: 'drop_pft_' + c.id, kind: 'drop', poolId: pool.id, title: `${c.name} · ${c.pftSupply.toLocaleString('en-US')} PFTs`, itemIds: looks.map((l) => l.id), anchors: looks.map((l) => Math.round(l.usd / 40)),
    supply: c.pftSupply, sold0: Math.round(c.pftSupply * (0.55 + 0.3 * r01(c.id, 'pft'))), sellRate: +(4 + 8 * r01(c.id, 'pftr')).toFixed(2), opensAt: iso(NOW - 12 * DAY),
    base: 120, spread: 0.45, shelf: 64, seed: 'pft:' + c.id };
  lots.push(lot); pool.lotIds.push(lot.id); pools.push(pool);
}

// beauty lines (data/beauty.json from celebs.mjs): each line is a drop pool of 64 shades, the shades are the units
// and their colours are the pool's colours
if (fs.existsSync(path.join(DIR, 'beauty.json'))) for (const line of read('beauty.json').lines) {
  const c = clubOf(line.clubId); if (!c) continue;
  const pool = { id: 'pool_' + line.id.replace(/^cb_line_/, ''), name: line.name, kind: 'drop', clubId: c.id, worldId: c.worldIds?.[0], season: '64 shades',
    desc: `${line.name}: 64 ${line.kind} shades, each a PFT you can wear, swap or trade.`, lookIds: [], lotIds: [], fixedColors: line.shades.filter((_, i) => i % 16 === 0).map((x) => x.hex) };
  const supply = 6400;
  const lot = { id: 'drop_' + line.id, kind: 'drop', poolId: pool.id, title: `${line.name} · 64 shades`, itemIds: line.shades.map((x) => x.id),
    supply, sold0: 0, sellRate: 0, opensAt: iso(NOW - between(3, 30, line.id, 'open') * DAY), base: 32, spread: 0.35, shelf: 64, seed: 'beauty:' + line.id };
  lots.push(lot); pool.lotIds.push(lot.id); pools.push(pool);
}

// pool quests; the per-stat quests are derived in the app (id "mq_<poolId>_<metricId>"), one per stat
for (const p of pools) {
  const show = p.showId && shows.shows.find((x) => x.id === p.showId);
  const ev = p.eventIds?.[0] && events.events.find((x) => x.id === p.eventIds[0]);
  const ends = show ? iso(Math.max(NOW + 3 * DAY, Date.parse(show.date) + 30 * DAY)) : ev ? iso(Date.parse(ev.startsAt) + 14 * DAY) : iso(NOW + between(5, 60, p.id, 'end') * DAY);
  addQuest(p, p.kind === 'show' ? 'show' : p.kind === 'drop' ? 'drop' : p.kind === 'pft' ? 'pft' : 'pool', ends);
}


// ── Teams, worlds and parties ────────────────────────────────────────────────────────────────────────────────
// Every host of the club is a team member of its pools and of each pool's application (and so are the people who
// own those hosts). A world is a pool party: each world links to one pool, the club's utility PFT pool, else its
// show drop, else the club's first store pool, and throws a pool party (an event with a genre).
const hostsData = read('hosts.json'); const roles = read('roles.json');
const genres = [...new Set(roles.categories.flatMap((c) => c.genres))];
for (const p of pools) {
  const hs = hostsData.hosts.filter((h) => h.clubId === p.clubId);
  p.teamIds = hs.map((h) => h.id); p.memberIds = [...new Set(hs.map((h) => h.ownerId).filter(Boolean))];
  const q = quests.find((x) => x.id === p.questId); if (q) { q.teamIds = p.teamIds; q.memberIds = p.memberIds; }
}
events.events = events.events.filter((e) => !e.id.startsWith('party_'));
for (const w of core.worlds) {
  const own = pools.filter((p) => p.clubId === w.clubId);
  const pool = own.find((p) => p.kind === 'pft') ?? pools.find((p) => p.kind === 'show' && p.worldId === w.id) ?? own.find((p) => p.worldId === w.id) ?? own[0];
  if (!pool) continue;
  w.poolId = pool.id; pool.worldIds = [...new Set([...(pool.worldIds ?? []), w.id])];
  let party = events.events.find((e) => e.kind === 'party' && e.worldId === w.id);
  if (!party) {
    party = { id: 'party_' + w.id, kind: 'party', title: `${w.name} pool party`, clubId: w.clubId, worldId: w.id, cityId: w.cities?.[0]?.id,
      startsAt: iso(NOW + between(1, 40, w.id, 'party') * DAY + 20 * 36e5), rsvps: between(120, 6000, w.id, 'rsvp') };
    events.events.push(party);
  }
  party.poolId = pool.id; party.genre = genres[between(0, genres.length - 1, w.id, 'genre')];
  pool.partyIds = [...new Set([...(pool.partyIds ?? []), party.id])];
}
write('events.json', events); write('core.json', core);

// ── Colours are part of the PFT: every card without an image takes the colours of the looks it carries ─────────
const paletteOf = (clubId) => [...new Set(allStores.filter((s) => s.clubId === clubId).flatMap((s) => s.looks.map((l) => l.hex)).filter(Boolean))];
for (const c of core.clubs) c.colors = paletteOf(c.id).slice(0, 4);
for (const w of core.worlds) w.colors = core.clubs.find((c) => c.id === w.clubId)?.colors ?? [];
for (const sh of shows.shows) { const pal = paletteOf(sh.clubId); if (pal.length) sh.looks.forEach((l, i) => { l.hex = pal[(i * 5) % pal.length]; }); }
for (const p of pools) {
  if (p.fixedColors) { p.colors = p.fixedColors; delete p.fixedColors; continue; }
  const hx = p.kind === 'show' ? shows.shows.find((x) => x.id === p.showId)?.looks.map((l) => l.hex) ?? [] : p.lookIds.map((id) => allStores.flatMap((s) => s.looks).find((l) => l.id === id)?.hex);
  p.colors = [...new Set(hx.filter(Boolean))].slice(0, 4); if (!p.colors.length) p.colors = paletteOf(p.clubId).slice(0, 4);
}

// ── Post colours come from the item: a post about a red dress is a red post ───────────────────────────────────
// A colour word in the post (red, ruby, cobalt, emerald…) picks a look of that colour family, from the club's
// store first, else from any store, and the post carries that look and its hex. No colour word: a look is picked
// at random (seeded) from the club's store. The hex and the look are written into the data (media.hex / lookId,
// slides[].hex / lookId) so the app paints the same colour every time.
const FAMILY_WORDS = {
  red: ['red', 'ruby', 'crimson', 'scarlet', 'ember', 'cherry', 'wine', 'garnet', 'carmine', 'blood'],
  pink: ['pink', 'rose', 'blush', 'fuchsia', 'magenta', 'flamingo', 'bubblegum', 'barbie'],
  orange: ['orange', 'coral', 'copper', 'amber', 'saffron', 'apricot', 'peach', 'tangerine', 'terracotta', 'sunset'],
  yellow: ['yellow', 'gold', 'golden', 'honey', 'lemon', 'mustard', 'sun', 'canary', 'topaz'],
  green: ['green', 'emerald', 'sage', 'jade', 'olive', 'mint', 'verdigris', 'lime', 'forest', 'meadow'],
  blue: ['blue', 'cobalt', 'indigo', 'sapphire', 'navy', 'azure', 'cornflower', 'sky', 'denim', 'ocean', 'teal', 'turquoise'],
  purple: ['purple', 'violet', 'plum', 'lilac', 'lavender', 'orchid', 'amethyst', 'nebula'],
  black: ['black', 'onyx', 'noir', 'midnight', 'ink', 'obsidian', 'shadow', 'jet', 'sable'],
  white: ['white', 'ivory', 'pearl', 'cream', 'snow', 'porcelain', 'opal', 'silver', 'chiffon'],
  brown: ['brown', 'mocha', 'cocoa', 'tan', 'camel', 'chestnut', 'tweed', 'bronze'],
};
const hexFamily = (hex) => {
  const n = parseInt(String(hex).slice(1), 16); if (Number.isNaN(n)) return undefined;
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (l < 0.16) return 'black'; if (l > 0.88 && d < 0.12) return 'white'; if (d < 0.08) return l < 0.5 ? 'black' : 'white';
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
  if (h < 12 || h >= 345) return l > 0.7 ? 'pink' : 'red';
  if (h < 40) return l < 0.35 ? 'brown' : 'orange'; if (h < 68) return 'yellow'; if (h < 170) return 'green';
  if (h < 255) return 'blue'; if (h < 300) return 'purple'; return 'pink';
};
const familyOfText = (t) => { const s = ' ' + String(t).toLowerCase().replace(/[^a-z]+/g, ' ') + ' '; for (const [fam, ws] of Object.entries(FAMILY_WORDS)) if (ws.some((w) => s.includes(' ' + w + ' ') || s.includes(' ' + w + 's '))) return fam; return undefined; };
const FAMILY_HEX = { red: '#c0182c', pink: '#e0569a', orange: '#e87a2c', yellow: '#e3b21c', green: '#2e9a55', blue: '#2f6fd0', purple: '#7a4cc2', black: '#24211f', white: '#efe9df', brown: '#7a5134' };
const ALL_LOOKS = allStores.flatMap((s) => s.looks.map((l) => ({ ...l, clubId: s.clubId }))).filter((l) => l.hex);
const lookForPost = (seedKey, clubId, text) => {
  const fam = familyOfText(text);
  const own = ALL_LOOKS.filter((l) => l.clubId === clubId);
  const pool = fam ? (own.filter((l) => hexFamily(l.hex) === fam).length ? own.filter((l) => hexFamily(l.hex) === fam) : ALL_LOOKS.filter((l) => hexFamily(l.hex) === fam)) : [];
  const from = pool.length ? pool : own.length ? own : ALL_LOOKS;
  const l = from[fnv(seedKey) % from.length];
  if (!l) return undefined;
  // the colour word wins: with no look of that colour anywhere, the post still wears the family colour
  return fam && !pool.length ? { lookId: l.id, hex: FAMILY_HEX[fam], family: fam } : { lookId: l.id, hex: l.hex, family: hexFamily(l.hex) };
};

const feedData = read('feed.json');
for (const sh of feedData.shots) {
  const hit = lookForPost(sh.id, sh.clubId, [sh.media.title, sh.caption, ...(sh.lookItems ?? []), ...(sh.tags ?? [])].join(' '));
  if (hit) { sh.media.hex = hit.hex; sh.media.lookId = hit.lookId; sh.media.family = hit.family; }
}
write('feed.json', feedData); write('shows.json', shows); write('core.json', core);

// ── 3. liquidity pairs belong to a pool ──────────────────────────────────────────────────────────────────────
if (economy.pools && !economy.liquidity) { economy.liquidity = economy.pools; delete economy.pools; }
for (const lq of economy.liquidity) {
  const coin = economy.coins.find((c) => c.symbol === lq.pair[1]);
  const pool = coin && (pools.find((p) => p.clubId === coin.clubId && p.kind === 'pft') ?? pools.find((p) => p.clubId === coin.clubId && p.kind !== 'show'));
  if (pool) { lq.poolId = pool.id; pool.liquidityId ??= lq.id; }
}

// ── copy: "collection" → "pool" in user-facing strings (keys untouched) ────────────────────────────────────────
const words = [[/\bCollections\b/g, 'Pools'], [/\bcollections\b/g, 'pools'], [/\bCollection\b/g, 'Pool'], [/\bcollection\b/g, 'pool'],
  [/Profile Function Token/g, 'Profile Fungible Token']];
const reword = (x) => typeof x === 'string' ? words.reduce((s, [a, b]) => s.replace(a, b), x)
  : Array.isArray(x) ? x.map(reword) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, /(^id$|Id$|Ids$|^md$|^slug$|image|^src$|^path$|^kind$|^tab$|^source$|^href$)/.test(k) ? v : reword(v)])) : x;
const copyFiles = ['core.json', 'feed.json', 'agents.json', 'campaigns.json', 'hosts.json', 'stories.json', 'papers.json', 'series.json', 'phipad.json', 'landing.json', 'roles.json', 'club.json'];
for (const f of copyFiles) write(f, reword(read(f)));

// PFTs 101 now says what fungible means here.
const papers = read('papers.json');
const fix = (x) => { if (Array.isArray(x)) x.forEach(fix); else if (x && typeof x === 'object') { if (x.id === 'pfts-101') { x.sections = PFT_SECTIONS; x.sub = 'Utility PFTs, pools, swaps and EGG in five minutes'; x.version = 'v2.0 · Oct 2026'; } Object.values(x).forEach(fix); } };
fix(papers); write('papers.json', papers);

write('stores.json', reword(stores)); write('ls.json', reword(ls)); write('economy.json', economy);
// Pace every lot so that today it stands between 55 % and 92 % sold and keeps selling from here.
for (const l of lots) {
  const hours = Math.max(24, (NOW - Date.parse(l.opensAt)) / 36e5);
  const target = Math.round(l.supply * (0.55 + 0.37 * r01(l.id, 'pace'))); l.sold0 = Math.round(target * (0.35 + 0.3 * r01(l.id, 'start')));
  l.sellRate = +((target - l.sold0) / hours).toFixed(3);
}
fs.writeFileSync(path.join(DIR, 'pools.json'), JSON.stringify({ metrics, application: APPLICATION, pools: reword(pools), lots: reword(lots), quests: reword(quests) }) + '\n');

// ── Feed and stories: every show drop is announced by its host agent, and each host keeps a "Drops" story ──────
const agentsData = read('agents.json');
agentsData.posts = agentsData.posts.filter((p) => !p.id.startsWith('ap_drop_'));
const byHost = {};
for (const p of pools.filter((x) => x.kind === 'show')) {
  const sh = shows.shows.find((x) => x.id === p.showId); const lot = lots.find((l) => l.showId === sh.id); const club = clubOf(sh.clubId);
  if (!agentsData.agents.some((a) => a.id === sh.hostAgentId)) continue;
  const at = iso(NOW - between(1, 96, sh.id, 'post') * 36e5);
  agentsData.posts.push({ id: 'ap_drop_' + sh.id, authorId: sh.hostAgentId, kind: 'look', clubId: sh.clubId, worldId: sh.worldId,
    caption: `${sh.title} is a drop and a pool quest: ${sh.looks.length} looks, ${lot.supply.toLocaleString('en-US')} editions, prices that move. Swap anything you hold for a look.`,
    likes: between(800, 40000, sh.id, 'likes'), createdAt: at,
    comments: [
      { id: `dc_${sh.id}_1`, authorId: core.users[between(0, core.users.length - 1, sh.id, 'cu1')].id, text: `Swapped my old tote for look ${between(1, 64, sh.id, 'lk')}, the pool paid the difference.`, likes: between(3, 400, sh.id, 'cl1'), at: between(1, 9, sh.id, 'ca1') + 'h' },
      { id: `dc_${sh.id}_2`, authorId: core.users[between(0, core.users.length - 1, sh.id, 'cu2')].id, text: `${(lot.supply - lot.sold0).toLocaleString('en-US')} editions left when I checked. Prices keep moving.`, likes: between(3, 400, sh.id, 'cl2'), at: between(1, 9, sh.id, 'ca2') + 'h' },
    ], tags: ['#' + (club?.ticker ?? 'EGG'), '#' + sh.season, '#Drop', '#PFT', '#Pools'],
    slides: [{ title: `${sh.title} drop`, tone: sh.tone, hex: sh.looks[0]?.hex, caption: `${lot.supply.toLocaleString('en-US')} editions · ${sh.looks.length} units` },
      ...sh.looks.slice(0, 4).map((l) => ({ title: l.title, tone: l.tone, hex: l.hex, caption: l.pieces.join(' · ') }))] });
  (byHost[sh.hostAgentId] ||= []).push({ title: `${sh.title} drop`, tone: sh.tone, caption: `${lot.supply.toLocaleString('en-US')} editions · the pool pays swap differences` });
}
for (const a of agentsData.agents) {
  a.highlights = (a.highlights ?? []).filter((h) => h.id !== 'drops');
  if (byHost[a.id]) a.highlights.unshift({ id: 'drops', label: 'Drops', tone: byHost[a.id][0].tone, frames: byHost[a.id].slice(0, 6) });
}
for (const p of agentsData.posts) p.slides.forEach((sl, i) => {
  // the cover follows the whole post's words; every other slide follows its own
  const hit = lookForPost(p.id + ':' + i, p.clubId, i === 0 ? [sl.title, sl.caption, p.caption, ...(p.tags ?? [])].join(' ') : [sl.title, sl.caption].join(' '));
  if (hit) { sl.hex = hit.hex; sl.lookId = hit.lookId; sl.family = hit.family; }
});
write('agents.json', agentsData);
console.log(`pools ${pools.length} (${pools.filter((p) => p.kind === 'show').length} show drops, ${pools.filter((p) => p.kind === 'drop').length} club drops) · lots ${lots.length} (${lots.filter((l) => l.kind === 'pack').length} packs, ${lots.filter((l) => l.kind === 'drop').length} drops) · pool quests ${quests.length} · stats ${metrics.length} per pool → ${metrics.length * pools.length} stat quests`);
