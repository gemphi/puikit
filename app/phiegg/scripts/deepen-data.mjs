// Fills the thin levels of Phiegg's data so every list → detail → sub-detail has content.
// Deterministic (seeded) and idempotent: generated records use ids starting with "g_", and a
// second run adds nothing. Hand-written records are never changed.
//
//   node apps/phiegg/scripts/deepen-data.mjs
//
// Writes (src/data): places.json (new: districts + places per city), stores.json (new: a store
// per club), and extends club.json (pieces), hosts.json (nest messages), feed.json (moments,
// shots), threads.json (comment threads per post), series.json (episode synopses).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'src', 'data');
const load = (f) => JSON.parse(readFileSync(join(dir, f + '.json'), 'utf8'));
// Keep each file's existing layout (minified or 2-space) so diffs stay readable.
const save = (f, v) => {
  const path = join(dir, f + '.json'); const prev = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const pretty = /\n\s+"/.test(prev.slice(0, 400));
  writeFileSync(path, JSON.stringify(v, null, pretty ? 2 : undefined) + (prev.endsWith('\n') ? '\n' : ''));
};

// ── seeded helpers ──
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) || 1;
const rngOf = (seed) => { let x = (hash(String(seed)) % 2147483646) + 1; return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const some = (r, a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(r() * c.length), 1)[0]); return o; };
const TONES = ['accent', 'sage', 'neutral', 'ink'];

const core = load('core'), club = load('club'), hosts = load('hosts'), feed = load('feed'), threads = load('threads'),
  series = load('series'), agents = load('agents'), ls = load('ls');
const users = core.users, people = [...users.map((u) => u.id), ...agents.agents.map((a) => a.id)];
const membersOf = (clubId) => { const m = users.filter((u) => (u.clubIds || []).includes(clubId)).map((u) => u.id); return m.length ? m : users.slice(0, 12).map((u) => u.id); };
const agentsOf = (clubId) => agents.agents.filter((a) => (a.clubIds || []).includes(clubId)).map((a) => a.id);
const stats = {};
const bump = (k, n = 1) => (stats[k] = (stats[k] || 0) + n);

// ── 1. Worlds → cities → districts → places ──
const DISTRICT_A = ['Pearl', 'Velvet', 'Lantern', 'Saffron', 'Ivory', 'Cobalt', 'Moth', 'Silk', 'Amber', 'Tide', 'Ember', 'Lace', 'Juniper', 'Quartz', 'Linen', 'Plum'];
const DISTRICT_B = ['Quarter', 'Row', 'Arcade', 'Steps', 'Yards', 'Terrace', 'Wharf', 'Gardens', 'Mews', 'Circus', 'Heights', 'Market'];
const VIBES = ['After-dark runway lanes', 'Ateliers behind glass', 'Street-level fittings', 'Quiet galleries and tea', 'Drops every Friday', 'Rooftops and stages', 'Vintage arcades', 'Avatar tailors and fitters', 'Club houses and lounges', 'Night markets'];
const KINDS = {
  fashion: ['boutique', 'atelier', 'runway', 'fitting', 'gallery', 'cafe'], film: ['cinema', 'studio', 'screening', 'cafe', 'gallery', 'boutique'],
  fiction: ['library', 'theatre', 'studio', 'cafe', 'gallery', 'market'], stage: ['theatre', 'runway', 'club', 'studio', 'cafe', 'boutique'],
};
const PLACE_A = ['Maison', 'House', 'Studio', 'Salon', 'Atelier', 'Hall', 'Room', 'Loft', 'Cellar', 'Pavilion', 'Window', 'Gate'];
const PLACE_B = ['Nacre', 'Iris', 'Vesper', 'Opaline', 'Marlow', 'Seren', 'Calla', 'Rune', 'Wren', 'Ondine', 'Halcyon', 'Mistral', 'Sable', 'Aurel', 'Fable', 'Lumen'];
const DESC = {
  boutique: 'Small-run pieces from the club, tried on your avatar before you buy.', atelier: 'Tailors cut and fit PFT looks here; book a slot for a fitting.',
  runway: 'Weekly walks; front-row seats go to holders first.', fitting: 'Drop-in fittings for avatar and street versions of a look.',
  gallery: 'Rotating walls of looks, poses and campaign stills.', cafe: 'Where residents meet between shows. Open late.',
  cinema: 'Screens the club’s series and films; premieres on Saturdays.', studio: 'Production space for shoots, films and campaigns.',
  screening: 'A small room for first cuts and members-only previews.', library: 'Scripts, lookbooks and the club’s archive, open to members.',
  theatre: 'Live stages with agents and members on the same bill.', market: 'Stalls for drops, swaps and second-hand PFTs.', club: 'A members’ lounge with a door policy set by the host.',
};
const places = existsSync(join(dir, 'places.json')) ? load('places') : { cities: {}, districts: {} };
for (const w of core.worlds) for (const c of w.cities) {
  if (places.districts[c.id]) continue;
  const r = rngOf('city:' + c.id); const kinds = KINDS[c.brandKind] || KINDS.fashion; const n = int(r, 3, 4);
  places.cities[c.id] = { worldId: w.id, tone: pick(r, TONES), desc: `${c.name}: ${c.vibe.toLowerCase()} in ${w.name}. ${n} districts, ${c.population.toLocaleString('en-US')} residents.` };
  places.districts[c.id] = Array.from({ length: n }, (_, d) => {
    bump('districts');
    return {
      id: `g_${c.id}_d${d + 1}`, name: pick(r, DISTRICT_A) + ' ' + pick(r, DISTRICT_B), vibe: pick(r, VIBES), tone: pick(r, TONES),
      places: Array.from({ length: int(r, 4, 6) }, (_, p) => {
        const kind = pick(r, kinds); bump('places');
        return {
          id: `g_${c.id}_d${d + 1}_p${p + 1}`, name: pick(r, PLACE_A) + ' ' + pick(r, PLACE_B), kind, clubId: r() < 0.7 ? w.clubId : pick(r, core.clubs).id,
          tone: pick(r, TONES), hours: pick(r, ['10:00–19:00', '12:00–22:00', '18:00–02:00', 'Open all day', 'Saturdays only', 'By appointment']),
          visitors: int(r, 8, 640), rating: Math.round((3.6 + r() * 1.4) * 10) / 10, desc: DESC[kind],
        };
      }),
    };
  });
}
save('places', places);

// ── 2. Club pieces: 12 per club ──
const PIECE_A = ['Nacre', 'Tide', 'Iris', 'Autumn', 'Quay', 'Velour', 'Opal', 'Moth', 'Swan', 'Lynx', 'Cobalt', 'Saffron', 'Ivory', 'Lace', 'Rose', 'Ember'];
const PIECE_B = ['Muse', 'Walker', 'Veil', 'Night', 'Bloom', 'Echo', 'Drift', 'Crown', 'Thread', 'Glass', 'Hour', 'Signal'];
const TRAITS = ['Coat', 'Heels', 'Visor', 'Scarf', 'Gloves', 'Bodice', 'Train', 'Collar', 'Cape', 'Boots'];
for (const c of core.clubs) {
  const have = club.pieces.filter((p) => p.clubId === c.id).length; const r = rngOf('pieces:' + c.id); const mem = membersOf(c.id);
  for (let i = have; i < 12; i++) {
    bump('pieces');
    club.pieces.push({
      id: `g_${c.id}_pc${i + 1}`, tokenId: '#' + String(int(r, 1, 9999)).padStart(4, '0'), name: pick(r, PIECE_A) + ' ' + pick(r, PIECE_B), tone: pick(r, TONES),
      trait: pick(r, TRAITS) + ': ' + pick(r, PIECE_A), clubId: c.id, creatorId: pick(r, mem), ...(r() < 0.06 ? { ownerId: core.currentUserId } : {}),
    });
  }
}
save('club', club);

// ── 3. A store per club (Lora's Spark in ls.json stays the flagship) ──
const COLOURS = [['Indigo', '#2b2a9c'], ['Rose', '#d9688a'], ['Sage', '#7a8a5e'], ['Ink', '#2a2522'], ['Saffron', '#e0a030'], ['Pearl', '#e8e0d0'], ['Cobalt', '#2f55c4'], ['Ember', '#c0502b'], ['Moss', '#5c7040'], ['Plum', '#6a3a6a'], ['Sand', '#cdb48c'], ['Teal', '#2f8a86']];
const GARMENTS = ['Bias-cut slip', 'Cropped jacket', 'Pleated skirt', 'Sheer sleeves', 'Waist sash', 'Wide trousers', 'Corset bodice', 'Long coat', 'Cape collar', 'Knit vest', 'Ruffled hem', 'Silk gloves', 'Platform boots', 'Visor', 'Tiered train'];
const RARITY = [['Common', 250, 6000, 14000], ['Rare', 100, 15000, 40000], ['Epic', 25, 45000, 90000], ['Legendary', 5, 120000, 260000]];
const SEASONS = ['Resort 2026', 'SS26', 'AW26', 'Pre-fall 2026', 'Capsule 01', 'Runway 02'];
const flagshipClub = ls.store.clubId || 'c_opal';
const stores = existsSync(join(dir, 'stores.json')) ? load('stores') : { stores: [] };
for (const c of core.clubs) {
  if (c.id === flagshipClub || stores.stores.some((s) => s.clubId === c.id)) continue;
  const r = rngOf('store:' + c.id); bump('stores');
  const cols = Array.from({ length: 2 }, (_, k) => ({
    id: `g_${c.id}_col${k + 1}`, name: pick(r, PIECE_A) + ' ' + pick(r, ['Edit', 'Capsule', 'Line', 'Story', 'Series']), season: pick(r, SEASONS),
    desc: `${c.name}’s ${pick(r, ['quiet', 'after-dark', 'street', 'ceremonial', 'travel'])} looks, cut for avatar and street.`, lookIds: [],
  }));
  const looks = [];
  cols.forEach((col, k) => {
    for (let i = 0; i < 6; i++) {
      const [rar, edition, lo, hi] = RARITY[Math.min(3, Math.floor(r() * r() * 4.2))]; const [colour, hex] = pick(r, COLOURS);
      const usd = Math.round((lo + r() * (hi - lo)) / 50) * 50; const minted = int(r, Math.floor(edition / 5), edition);
      const id = `g_${c.id}_lk${k + 1}${i + 1}`; col.lookIds.push(id); bump('looks');
      looks.push({
        id, n: String(k * 6 + i + 1).padStart(2, '0'), poolId: col.id, storeId: 'g_st_' + c.id, name: colour + ' ' + pick(r, PIECE_B), colour, hex, tone: pick(r, TONES),
        garments: some(r, GARMENTS, int(r, 3, 4)), rarity: rar, edition, minted, owners: Math.max(1, minted - int(r, 0, 4)), usd,
        floor: Math.round((usd * (0.85 + r() * 0.1)) / 50) * 50, change7d: Math.round((r() * 30 - 10) * 10) / 10, views: {},
      });
    }
  });
  stores.stores.push({ id: 'g_st_' + c.id, clubId: c.id, code: c.ticker, name: c.name + ' Store', tagline: c.tagline, pools: cols, looks });
}
save('stores', stores);

// ── 4. Messages in every nest ──
const LINES = {
  channel: ['Morning, everyone. What are you wearing in-world today?', 'The new drop is in the boutique window now.', 'Who is going to Saturday’s walk?', 'Pinned the dress code for tonight.', 'Fitting slots open at 18:00.', 'Welcome to the new members this week.', 'Anyone swapping a Rare for an Epic?', 'Agents are taking styling requests in here until midnight.'],
  world: ['Gates open at 20:00 for the opening walk.', 'The east boulevard has new facades.', 'Map updated: three new boutiques on the quay.', 'Visitors are up, the plaza is full.', 'Reporting a broken portal near the arcade.', 'Who is hosting the night market this week?'],
  city: ['New stall going up in the market district.', 'Residents meeting at the café at 19:00.', 'Who runs the gallery on the corner?', 'The district needs a night-time quest.', 'Street lights switched to runway mode.'],
  quest: ['Quest is live, find the seven shells.', 'Hint: check the fountain at dusk.', 'Leaderboard updated, top three get a fitting credit.', 'Finished it in 40 minutes!', 'Rewards pay out at the end of the round.'],
  voice: ['Room is open, come say hi.', 'Recording tonight for the club podcast.', 'Next speaker after the break.', 'Mic check, can everyone hear?', 'Who wants to go next?'],
  stage: ['Doors at 21:00, show at 21:30.', 'Front row is reserved for holders.', 'Backstage call for the walkers.', 'Encore with the agents at the end.', 'Stream link pinned above.'],
  gallery: ['Added six new stills from the campaign.', 'This wall is all Look 07 variations.', 'Vote for the poster of the season.', 'Who shot the rooftop series?', 'New frames from the walk are up.'],
  category: ['Use this space to organise the rooms below.', 'New sub-nests added for the season.', 'Moderators: please pin the rules.', 'Archive older threads here.'],
};
const hostById = Object.fromEntries(hosts.hosts.map((h) => [h.id, h]));
for (const n of hosts.nests) {
  if (hosts.messages[n.id]?.length) continue;
  const r = rngOf('nest:' + n.id); const h = hostById[n.hostId]; const pool = [...membersOf(h?.clubId), ...agentsOf(h?.clubId)]; const lines = LINES[n.kind] || LINES.channel;
  let hh = int(r, 8, 20), mm = int(r, 0, 59);
  hosts.messages[n.id] = some(r, lines, int(r, 4, Math.min(7, lines.length))).map((text, i) => {
    mm += int(r, 2, 40); hh += Math.floor(mm / 60); mm %= 60; bump('nestMessages');
    return { id: `g_${n.id}_m${i + 1}`, authorId: pick(r, pool), at: String(hh % 24).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), text };
  });
}
save('hosts', hosts);

// ── 5. Moments + shots: the 40 most-followed users get a moment; every user has ≥ 3 shots ──
const LABELS = ['Live', 'Fitting', 'Backstage', 'Runway', 'Street', 'Studio', 'Night out', 'New drop'];
const SHOT_T = ['Fitting room, take two', 'Golden hour on the quay', 'Backstage before the walk', 'Street version of the look', 'Avatar vs. real fit', 'Campaign still', 'Mirror check', 'Night market find'];
const CAPS = ['Wore it out for the first time tonight.', 'The avatar fit is closer than I expected.', 'Front row, finally.', 'Swapped my Rare for this, no regrets.', 'Agent styled it, I just walked.', 'Same look, two worlds.', 'Tailor took it in at the waist. Perfect.', 'Saturday walk, Look 07 energy.'];
const haveMoment = new Set(feed.moments.map((m) => m.userId));
const mr = rngOf('moments');
const moreMoments = feed.moments.some((m) => String(m.id).startsWith('g_')) ? [] : users.filter((x) => !haveMoment.has(x.id)).sort((a, b) => b.followers - a.followers).slice(0, 40);
for (const u of moreMoments) {
  feed.moments.push({ id: 'g_m_' + u.id, userId: u.id, label: pick(mr, LABELS), ...(mr() < 0.25 ? { live: true } : {}) }); bump('moments');
}
const shotsBy = {}; feed.shots.forEach((s) => (shotsBy[s.authorId] = (shotsBy[s.authorId] || 0) + 1));
for (const u of users) {
  const r = rngOf('shots:' + u.id);
  for (let i = shotsBy[u.id] || 0; i < 3; i++) {
    const clubId = (u.clubIds || [])[0] ?? null; const w = core.worlds.find((x) => x.clubId === clubId); bump('shots');
    feed.shots.push({
      id: `g_s_${u.id}_${i + 1}`, authorId: u.id, clubId, worldId: w?.id ?? null,
      media: { kind: pick(r, ['image', 'look', 'image', 'reel']), tone: pick(r, TONES), ratio: pick(r, ['4/5', '1/1', '3/4']), title: pick(r, SHOT_T) },
      caption: pick(r, CAPS), likes: int(r, 40, 9000), comments: int(r, 2, 120), reshares: int(r, 0, 300),
      createdAt: new Date(Date.UTC(2026, 8, int(r, 1, 30), int(r, 6, 23))).toISOString(), tags: some(r, ['couture', 'avatar', 'runway', 'street', 'PFT', 'fitting', 'drop'], 2),
      lookItems: some(r, GARMENTS, int(r, 2, 3)),
    });
  }
}
save('feed', feed);

// ── 6. Comment threads on every post and shot ──
const ROOT = ['This is the one I keep rewatching.', 'The shoulders do all the work here.', 'Need this in the Rare edition.', 'Is the avatar version out yet?', 'The colour on this is unreal.', 'Who did the fitting?', 'Saving this for Saturday.', 'Front row was worth it for this alone.', 'The sash makes the whole look.'];
const REPLY = ['Agreed.', 'Same, completely.', 'It drops Friday, I think.', 'The agent styled it, apparently.', 'Ask in the host channel.', 'Ha, I went with the opposite.', 'Seconded, the hem too.', 'You can try it on in the fitting room.'];
const targets = new Set(threads.comments.map((c) => c.targetId));
const allPosts = [...feed.shots.map((s) => s.id), ...agents.posts.map((p) => p.id)];
let threaded = 0;
for (const id of allPosts) {
  if (targets.has(id)) continue;
  const r = rngOf('thread:' + id);
  for (let k = 0; k < int(r, 2, 4); k++) {
    const rootId = `g_tc_${id}_${k}`; bump('comments');
    threads.comments.push({ id: rootId, targetId: id, parentId: null, depth: 0, authorId: pick(r, people), text: pick(r, ROOT), likes: int(r, 1, 600), at: int(r, 1, 23) + 'h' });
    let parent = rootId;
    for (let d = 1, n = int(r, 0, 3); d <= n; d++) {
      const rid = `${rootId}_${d}`; bump('comments');
      threads.comments.push({ id: rid, targetId: id, parentId: parent, depth: d, authorId: pick(r, people), text: pick(r, REPLY), likes: int(r, 0, 120), at: int(r, 1, 23) + 'h' });
      parent = rid;
    }
  }
  threaded++;
}
save('threads', threads);

// ── 7. Episode synopses ──
const BEATS = ['The pilot: a club opens its doors and nobody comes.', 'A drop goes wrong on the night of the walk.', 'An agent starts dressing the residents in secret.', 'Two houses fight over the same runway slot.', 'The finale: everyone walks, nobody wins.', 'A stranger arrives with a look nobody can place.', 'The fitting room becomes a confessional.'];
for (const s of series.series) {
  const r = rngOf('ep:' + s.id);
  for (const e of s.episodes) if (!e.synopsis) { e.synopsis = s.kind === 'film' ? s.synopsis : pick(r, BEATS); bump('episodeSynopses'); }
}
save('series', series);

console.log('phiegg data deepened:', stats, '· threads added for', threaded, 'posts');
