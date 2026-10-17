// The old apps' sample rows came with placeholder text ("App 1", "Description 1", "Version 1"). This dresses them
// in fictional Phiace content so every app's pulls read as a real catalog. `dress(kind, doc)` is pure (the feed can
// call it); run as a script it rewrites the rows already in the database, in place, without touching the change log.
//   DATABASE_URL=postgres://... node scripts/fictional.mjs


const pick = (list, i) => list[((i % list.length) + list.length) % list.length];
const B = {
  phihubApp: [['Hall Builder', 'Lay out a club hall with rooms you drag into place.'], ['Ride Desk', 'Sell and book rides between worlds.'], ['Look Locker', 'Keep your looks and swap them across worlds.'], ['Treasury View', 'Every inflow and payout of your club on one page.'], ['Quiz Night', 'Live quizzes for club events, scored on the spot.'], ['Event Wall', 'A wall of every event your clubs host.'], ['Gate Pass', 'Sell entry to a world in EGG at the door.'], ['Fitting Room', 'Try a look on any portrait before you buy.']],
  phihubAgent: [['Floor Watcher', 'Watches a pool and bids inside your floor and ceiling.'], ['Quest Scorer', 'Reads each entry and drafts a score with notes.'], ['Drop Herald', 'Tells your club when a drop opens and who is in.'], ['Treasury Keeper', 'Keeps the club books and flags spends over a limit.'], ['Door Greeter', 'Welcomes guests at the gate and sells the looks they see.'], ['Style Scout', 'Finds looks that match what you wear most.'], ['Ride Router', 'Plans the cheapest ride between two worlds.'], ['Vote Reader', 'Reads a proposal and explains it in three lines.']],
  phihubSkill: ['Price a pool', 'Score an entry', 'Book a ride', 'Fit a look', 'Draft an application', 'Read a proposal', 'Plan an event', 'Summarise a thread'],
  phihubRepo: [['club-hall-kit', 'A club hall, a treasury and a quest board in one starter.'], ['night-market-street', 'A market street that opens after dark.'], ['quest-pack-two', 'Thirty quest templates, from hunts to style battles.'], ['ferry-routes', 'Ferry routes linking six worlds.'], ['runway-lights', 'Light rigs for runway nights.'], ['looks-sdk', 'Render, fit and price looks from code.'], ['treasury-ledger', 'A ledger every club treasurer can read.'], ['world-starter', 'Terrain, sky and a first city to build on.']],
  phihubPool: [['Builders pool', 'Funds the teams that build halls and streets.'], ['Hall makers pool', 'Pays for club halls members vote in.'], ['Quest writers pool', 'Rewards the best quest templates each month.'], ['Ride owners pool', 'Backs new ride routes between worlds.'], ['Look designers pool', 'Pays designers a share of every look sale.'], ['Host tools pool', 'Funds tools hosts ask for most.'], ['World makers pool', 'Backs new worlds through their first season.'], ['Agent crafters pool', 'Rewards agents members keep running.']],
  phihubService: ['Phiora API', 'Look renderer', 'Ride router', 'Quest scorer', 'Price feed', 'Mail relay', 'Search index', 'Agent runner'],
  phihubCategory: ['Worlds', 'Clubs', 'Quests', 'Rides', 'Looks', 'Agents', 'Treasury', 'Events'],
  phihubTier: ['Free', 'Builder', 'Club', 'Studio', 'Maison', 'Network', 'Enterprise', 'Founding'],
  phiaceTab: ['Opalia market', 'Bold Pups pool', 'Runway tonight', 'Cohort 7 application', 'Ferry timetable', 'Satin Swans hall', 'Quest board', 'Treasury report'],
  phiaceHistory: ['Bijou night market', 'Look 07 fitting', 'Brocade runway hall', 'Aurum harbour rides', 'Phipad launch list', 'Cashmere Peaks lodge', 'Velvet Pack notes', 'Phidao proposal 12'],
  phiaceSession: ['Saturday runway prep', 'Cohort 7 application', 'Club treasury review', 'Night market build', 'Look shopping', 'Quest scoring', 'Ride planning', 'Phidao reading'],
  phiaceBookmark: ['Opalia city map', 'Bold Pups floor', 'Runway calendar', 'Quest rules', 'Ferry routes', 'Look 07 sheet', 'Club charter', 'SUM rewards table'],
  phiaceExtension: ['Look fitter', 'Price lens', 'Quest timer', 'Ride planner', 'Club notes', 'Wallet guard', 'Translate', 'Calm reader'],
  phiacePreference: [['theme', 'Organic, dark at night'], ['language', 'English'], ['voice', 'Warm'], ['memory', 'Keep club memory'], ['digest', 'Daily at 8:00'], ['currency', 'USD'], ['privacy', 'Share with clubs only'], ['notifications', 'Drops and quests']],
};
const FOLDERS = ['Clubs', 'Worlds', 'Pools', 'Reading'];
const AUTHORS = ['Noor Hale', 'Inès Valcourt', 'Kai Moreau', 'Zara Okafor', 'Theo Lind', 'Mina Sato', 'Luca Valcourt', 'Sofia Novak'];
const LICENSES = ['MIT', 'Apache-2.0', 'MPL-2.0', 'BSD-3-Clause'];
const LANGS = ['TypeScript', 'Rust', 'Go', 'Python'];
const COLORS = ['#7c5cff', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#a855f7'];
const ACTIONS = ['installed Hall Builder', 'ran Quest Scorer', 'forked night-market-street', 'published Ride Desk 1.4', 'joined Builders pool', 'starred looks-sdk', 'reviewed Gate Pass', 'updated Treasury View'];
const slugOf = (p) => 'phiace://' + String(p).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const numOf = (doc) => Number(String(doc.srcId ?? doc.id ?? '').match(/(\d+)\s*$/)?.[1] ?? 1) - 1;
const PLACE = /^(App|Agent|Skill|Repo|Pool|Service|Description|Version|Author|License|Language|Url|Title|Folder|Key|Value|Color|Time|Action|Label|Session|Extension|Layer|Name) \d+$/;

/** A copy of the row with its placeholder text replaced; rows without placeholders come back unchanged. */
export function dress(kind, doc) {
  if (!Object.values(doc).some((v) => typeof v === 'string' && PLACE.test(v))) return doc;
  const i = numOf(doc); const d = { ...doc }; const b = B[kind];
  const entry = b ? pick(b, i) : null; const [nm, desc] = Array.isArray(entry) ? entry : [entry, null];
  if (nm) { if ('name' in d) d.name = nm; if ('title' in d) d.title = nm; if ('label' in d) d.label = nm; if ('key' in d && kind !== 'phiacePreference') d.key = nm.toLowerCase().replace(/\s+/g, '-'); }
  if (kind === 'phiacePreference' && entry) { d.key = entry[0]; d.value = entry[1]; }
  if (desc && 'desc' in d) d.desc = desc;
  for (const [k, v] of Object.entries(d)) {
    if (typeof v !== 'string' || !PLACE.test(v)) continue;
    const [, word] = v.match(PLACE);
    d[k] = word === 'Version' ? `1.${i + 2}.0` : word === 'Author' ? pick(AUTHORS, i) : word === 'License' ? pick(LICENSES, i) : word === 'Language' ? pick(LANGS, i)
      : word === 'Url' ? slugOf(d.title ?? d.name ?? kind + ' ' + (i + 1)) : word === 'Folder' ? pick(FOLDERS, i) : word === 'Color' ? pick(COLORS, i)
      : word === 'Time' ? `${(i + 1) * 7}m ago` : word === 'Action' ? pick(ACTIONS, i) : word === 'Agent' ? pick(B.phihubAgent, i)[0]
      : word === 'Description' ? '' : word === 'Layer' ? v : nm ?? v.replace(/ \d+$/, '') + ' ' + (i + 1);
  }
  return d;
}

const slugify = (name) => String(name).trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
if (import.meta.url === 'file://' + process.argv[1]) {
  const pg = (await import('pg')).default;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL }); await client.connect();
  const { rows } = await client.query("SELECT kind, id, doc FROM items WHERE kind LIKE 'phihub%' OR kind LIKE 'phiace%'");
  let n = 0;
  for (const r of rows) {
    const doc = typeof r.doc === 'string' ? JSON.parse(r.doc) : r.doc; const next = dress(r.kind, doc);
    if (next === doc) continue;
    const named = next.name ?? next.title ?? next.label; next.slug = named ? slugify(named) : next.slug;
    await client.query('UPDATE items SET doc=$1, slug=$2, updated_at=$3 WHERE kind=$4 AND id=$5', [JSON.stringify(next), next.slug, Date.now(), r.kind, r.id]); n++;
  }
  console.log('dressed', n, 'of', rows.length, 'rows'); await client.end();
}
