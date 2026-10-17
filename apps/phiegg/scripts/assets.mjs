#!/usr/bin/env node
// The three item types in a pool, seeded and idempotent. Run after pools.mjs (it links them into pools.json).
//   PFT  profile fungible tokens: the looks (store items); a profile wears, swaps and sells them.
//   EGG  what hosts earn: gate passes (gate takings), earnings shares (a cut of a host's earnings) and land
//        (plots in the host's world, sold to builders and shops).
//   SUM  investment machines: a SUM holds EGG items and plays the EGG summation for you: it collects their
//        yield, compounds it back into the pool and settles swap differences, by a strategy you can read.
// Storylines tie them together: a title's roles are people, people play through hosts (their PFT roles), hosts earn
// EGG, and the title's club pool holds the looks worn on screen (PFT) and the SUM that compounds the club's EGG.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const keep = (f, v) => { const prev = readFileSync(join(DATA, f), 'utf8'); const pretty = /\n\s+"/.test(prev.slice(0, 400)); writeFileSync(join(DATA, f), JSON.stringify(v, null, pretty ? 2 : undefined) + (prev.endsWith('\n') ? '\n' : '')); };
const hash = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7) || 1;
const between = (a, b, ...seed) => a + (hash(seed.join(':')) % (b - a + 1));

const core = read('core.json'); const hosts = read('hosts.json'); const pools = read('pools.json'); const series = read('series.json');
const roleIndex = existsSync(join(DATA, 'roleIndex.json')) ? read('roleIndex.json') : {};
const EGG_USD = 0.25; // USD per EGG, the phi-kit wallet rate
const worldOf = (id) => core.worlds.find((w) => w.id === id);
const clubPool = (clubId) => pools.pools.find((p) => p.clubId === clubId && p.kind !== 'pft') ?? pools.pools.find((p) => p.clubId === clubId);
const titlesOf = (personId) => [...new Set((roleIndex[personId] ?? []).map(([sid]) => sid))];

const eggs = []; const sums = [];
for (const h of hosts.hosts) {
  const club = core.clubs.find((c) => c.id === h.clubId); const world = worldOf(club?.worldIds?.[0]); const pool = clubPool(h.clubId);
  const owner = h.ownerId ?? club?.founderId; const seriesIds = titlesOf(owner).slice(0, 6);
  const common = { hostId: h.id, ownerId: owner ?? null, clubId: h.clubId, worldId: world?.id ?? null, poolId: pool?.id ?? null, seriesIds };
  const gate = between(40, 400, h.id, 'gate'); const share = between(800, 9000, h.id, 'share'); const land = between(2000, 40000, h.id, 'land');
  eggs.push({ id: `egg_${h.id}_gate`, type: 'egg', kind: 'gate', name: `Gate pass · ${h.name}`, ...common, priceEgg: gate, priceUsd: Math.round(gate * EGG_USD * 100) / 100,
    supply: between(500, 5000, h.id, 'gs'), sold: between(100, 480, h.id, 'gsd'), yieldDay: Math.round(gate * 0.004 * 100) / 100,
    desc: `Entry to every night ${h.name} hosts; the pass earns a share of the gate takings.` });
  eggs.push({ id: `egg_${h.id}_earn`, type: 'egg', kind: 'earnings', name: `Earnings share · ${h.name}`, ...common, priceEgg: share, priceUsd: Math.round(share * EGG_USD * 100) / 100,
    supply: 100, sold: between(10, 95, h.id, 'es'), sharePct: 0.5, yieldDay: Math.round(share * 0.0011 * 100) / 100,
    desc: `0.5% of what ${h.name} earns: casts, tips, sponsored quests and gate takings, paid in EGG.` });
  const city = world?.cities?.[hash(h.id) % Math.max(1, world.cities.length)];
  eggs.push({ id: `egg_${h.id}_land`, type: 'egg', kind: 'land', name: `Land · ${city?.name ?? world?.name ?? 'Plot'} ${between(1, 64, h.id, 'plot')}`, ...common, cityId: city?.id ?? null,
    priceEgg: land, priceUsd: Math.round(land * EGG_USD * 100) / 100, supply: 1, sold: hash(h.id + 'ls') % 3 === 0 ? 1 : 0, sizeM2: between(80, 1200, h.id, 'm2'), yieldDay: Math.round(land * 0.0006 * 100) / 100,
    desc: `A plot in ${city?.name ?? 'the world'} beside ${h.name}'s venue: build a shop, rent it or sell it on.` });
}
const STRATS = ['Compound gate takings back into the pool every night', 'Hold earnings shares, sell gate passes at the top of the ladder', 'Buy land on show weeks, rent it to the club', 'Balance EGG against the pool coin, settle swap differences first'];
for (const p of pools.pools) {
  const inputs = eggs.filter((e) => e.clubId === p.clubId).map((e) => e.id);
  const tvl = inputs.reduce((a, id) => a + (eggs.find((e) => e.id === id)?.priceEgg ?? 0), 0) * between(2, 9, p.id, 'tvl');
  sums.push({ id: `sum_${p.id}`, type: 'sum', name: `${p.name} SUM`, poolId: p.id, clubId: p.clubId, inputs, strategy: STRATS[hash(p.id) % STRATS.length],
    apy: between(4, 24, p.id, 'apy') + between(0, 9, p.id, 'apyd') / 10, tvlEgg: tvl, minEgg: between(50, 500, p.id, 'min'), holders: between(12, 900, p.id, 'h'), rebalance: ['hourly', 'nightly', 'weekly'][hash(p.id) % 3],
    rules: ['Never sells a PFT you wear', 'Pays swap differences before compounding', 'Stops at your withdraw limit'], seriesIds: series.series.filter((s) => s.poolId === p.id).map((s) => s.id).slice(0, 8) });
  p.eggIds = inputs; p.sumIds = [`sum_${p.id}`];
}
// PFT profiles: the beta portraits (public/portraits, src/data/portraits.json) are Bold Pups PFTs, numbered as in the
// art (BPSC #7001 …). They are dealt to every profile and host exactly as the app deals them (lib/portraits.ts), so the
// portrait a person wears is the profile PFT they hold.
const portraits = existsSync(join(DATA, 'portraits.json')) ? read('portraits.json').portraits : [];
const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const agents = read('agents.json');
const owners = [...core.users.map((u) => u.id), ...agents.agents.map((a) => a.id), ...hosts.hosts.map((h) => h.id)].sort((a, b) => fnv(a) - fnv(b));
const holder = new Map(); owners.forEach((id, i) => { if (i < portraits.length) holder.set(portraits[i].id, id); });
const bpPool = pools.pools.find((p) => p.id === 'pool_pft_c_bp'); const hostIds = new Set(hosts.hosts.map((h) => h.id));
const profiles = portraits.map((p) => ({ id: 'pft_' + p.id.replace('-', '_'), type: 'pft', kind: 'profile', tokenId: p.id, n: p.n, name: `${p.set?.startsWith('Chic') ? 'Chic & Famous' : 'Bold Pup'} #${p.n}`, set: p.set ?? 'Bold Pups Space Club', clubId: 'c_bp', poolId: bpPool?.id ?? null,
  ...(hostIds.has(holder.get(p.id)) ? { holderId: null, holderHostId: holder.get(p.id) } : { holderId: holder.get(p.id) ?? null }), bg: p.bg, outfit: p.outfit, sheet: p.sheet, index: p.index,
  priceUsd: 180 + (fnv(p.id) % 2400), traits: { background: p.bg, outfit: p.outfit, collection: p.set ?? 'Bold Pups Space Club', edition: p.n >= 9001 ? '9001 to 10000' : '7001 to 9000' } }));
if (bpPool) bpPool.profileIds = profiles.map((x) => x.id);
writeFileSync(join(DATA, 'assets.json'), JSON.stringify({ eggUsd: EGG_USD, eggs, sums, profiles }));
keep('pools.json', pools);
console.log(`assets: ${eggs.length} EGG items (gate, earnings, land) · ${sums.length} SUM machines · ${profiles.length} PFT profiles (Bold Pups) · linked into ${pools.pools.length} pools`);
