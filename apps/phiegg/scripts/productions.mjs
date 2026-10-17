#!/usr/bin/env node
// Productions: every film, series and play gets a full production, seeded and idempotent. Run after celebs, before items.
//   • Series: 7 seasons of 5 to 13 episodes (synopsis, director, writers, guest roles, the looks worn on screen).
//   • Films: one feature with scenes; plays: acts.
//   • A cast of 16 to 64 roles: character, part (lead … extra), arc, traits, actionable behaviours (from the role type of
//     the person's host), the host the person plays through (hosts are the profile's PFT roles) and the wardrobe looks.
//   • Themes: motifs, moods, setting, conflict, stakes, and a shoppable moment per episode (a look in the club's pool).
// Writes src/data/productions/NN.json (16 shards, loaded per title) and a light summary on each series.json record,
// plus src/data/roleIndex.json (person → roles) for profiles. Everything is fictional.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const keep = (f, v) => { const prev = readFileSync(join(DATA, f), 'utf8'); const pretty = /\n\s+"/.test(prev.slice(0, 400)); writeFileSync(join(DATA, f), JSON.stringify(v, null, pretty ? 2 : undefined) + (prev.endsWith('\n') ? '\n' : '')); };
const hash = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7) || 1;
const rngOf = (seed) => { let x = (hash(seed) % 2147483646) + 1; return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646; };
const int = (r, a, b) => a + Math.floor(r() * (b - a + 1)); const pick = (r, a) => a[Math.floor(r() * a.length)];
const some = (r, a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(r() * c.length), 1)[0]); return o; };

const series = read('series.json'); const core = read('core.json'); const hosts = read('hosts.json'); const roles = read('roles.json');
const agents = read('agents.json'); const stores = read('stores.json'); const ls = read('ls.json'); const pools = read('pools.json');
const people = [...core.users.map((u) => u.id), ...agents.agents.map((a) => a.id)];
const hostsOf = new Map(); for (const h of hosts.hosts) { const k = h.ownerId; if (k) hostsOf.set(k, [...(hostsOf.get(k) ?? []), h]); }
const userHosts = (pid) => { const u = core.users.find((x) => x.id === pid); return [...(u?.hostIds ?? []).map((id) => hosts.hosts.find((h) => h.id === id)).filter(Boolean), ...(hostsOf.get(pid) ?? [])]; };
const typeOf = new Map(roles.types.map((t) => [t.id, t]));
const looksOf = (clubId) => { const st = stores.stores.find((s) => s.clubId === clubId); return (st?.looks ?? (clubId === 'c_opal' ? ls.looks : [])).filter((l) => l.views?.FRONT).map((l) => l.id); };
const anyLooks = stores.stores.flatMap((s) => s.looks).filter((l) => l.views?.FRONT).map((l) => l.id);
const poolOfClub = (clubId) => pools.pools.find((p) => p.clubId === clubId && p.kind !== 'pft')?.id ?? null;

const FIRST = ['Ada', 'Bastien', 'Celeste', 'Dorian', 'Elodie', 'Fenwick', 'Greta', 'Hollis', 'Ivo', 'Juno', 'Kit', 'Lorelei', 'Mabel', 'Nico', 'Odette', 'Percival', 'Quilla', 'Rafe', 'Sabine', 'Tobias', 'Ursa', 'Valentin', 'Wren', 'Xavi', 'Yvette', 'Zeno', 'Ambrose', 'Bijou', 'Cosima', 'Desmond', 'Estelle', 'Florian'];
const LAST = ['Ashcombe', 'Belmont', 'Carrow', 'Devereux', 'Ellingham', 'Faraday', 'Gallant', 'Hartley', 'Iverson', 'Jessamy', 'Kingsley', 'Lockwood', 'Marchetti', 'Northam', 'Oakhurst', 'Pemberton', 'Quennell', 'Ravel', 'Silverton', 'Thorne', 'Underwood', 'Vexley', 'Whitlock', 'Yorke'];
const PARTS = [['Lead', 2], ['Lead', 2], ['Supporting', 6], ['Recurring', 8], ['Guest', 10], ['Cameo', 6], ['Host', 2], ['Model', 8], ['Narrator', 1], ['Extra', 20]];
const ARCS = ['rises from fitting girl to house muse', 'hides a debt to the rival house', 'learns to sell the look they once mocked', 'walks the final show with a broken heel', 'trades every PFT for one gate pass', 'finds the missing pattern book', 'runs the pop-up nobody believed in', 'becomes the voice of the host', 'turns a single look into a drop that sells out', 'chooses the club over the crown'];
const TRAITS = ['bold', 'witty', 'loyal', 'restless', 'precise', 'romantic', 'shrewd', 'warm', 'guarded', 'theatrical', 'patient', 'reckless'];
const MOTIFS = ['mirrors', 'stairs', 'rain on glass', 'the final walk', 'a locked atelier', 'the gate at dusk', 'a borrowed gown', 'the ledger', 'a rooftop runway', 'the first fitting', 'a lost brooch', 'the crowd going quiet'];
const MOODS = ['glamorous', 'tense', 'tender', 'electric', 'melancholy', 'triumphant', 'playful', 'noir'];
const CONFLICT = ['two houses want the same slot on show night', 'the drop is counterfeit and only one person knows', 'a host sells the gate twice', 'the muse walks out before the finale', 'a family ledger is opened in public', 'the pool runs dry the week of the launch'];
const STAKES = ['the house', 'the crown of the season', 'a seat in the front row', 'the family name', 'the last pattern', 'the whole pool'];
const EP_A = ['The', 'A', 'Last', 'First', 'Every', 'One'];
const EP_B = ['Fitting', 'Walk', 'Gate', 'Ledger', 'Mirror', 'Drop', 'Encore', 'Seam', 'Curtain', 'Hem', 'Crown', 'Rehearsal', 'Pattern', 'Brooch', 'Premiere', 'Finale'];
const BEAT = ['%LEAD% is offered a deal that would save the house and ruin a friend.', 'A rival books the same runway; %LEAD% has one night to change the lineup.', 'The gate takings vanish and %SUP% is the only one with a key.', 'A guest arrives wearing a look that was never released.', '%LEAD% and %SUP% stay up all night to finish the hem.', 'The pool sponsors the finale, at a price.', 'Old letters reveal who really drew the first pattern.', 'A storm closes the city; the show moves to the rooftop.', 'The host speaks for the first time on camera.', 'Everyone walks, but only one look sells out.'];
const SEASON_T = ['Opening Night', 'The Rival House', 'Gate Season', 'The Ledger', 'Mirror Year', 'The Long Walk', 'Crown'];

const SHARDS = 16; const shardOf = (id) => hash(id) % SHARDS; const shards = Array.from({ length: SHARDS }, () => ({}));
const roleIndex = {}; let nRoles = 0, nEps = 0;
for (const sr of series.series) {
  const r = rngOf('prod:' + sr.id);
  const own = looksOf(sr.clubId); const wardrobe = own.length ? own : anyLooks;
  const pool = poolOfClub(sr.clubId);
  const n = int(r, 16, 64);
  const base = [...new Set([...(sr.cast ?? []), ...some(r, people, n)])].slice(0, n);
  const counts = {}; const partFor = (i) => { let k = 0; for (const [p, c] of PARTS) { k += c; if ((i * 7 + hash(sr.id)) % 65 < k && (counts[p] ?? 0) < c * 3) return p; } return 'Extra'; };
  const castRoles = base.map((pid, i) => {
    const part = i < 2 ? 'Lead' : i < 6 ? 'Supporting' : partFor(i); counts[part] = (counts[part] ?? 0) + 1;
    const hs = userHosts(pid); const host = hs[i % Math.max(1, hs.length)];
    const type = host?.roleTypeId ? typeOf.get(host.roleTypeId) : pick(r, roles.types);
    return { personId: pid, character: `${pick(r, FIRST)} ${pick(r, LAST)}`, part, arc: pick(r, ARCS), traits: some(r, TRAITS, 3),
      roleTypeId: type?.id ?? null, actions: (type?.behaviours ?? []).slice(0, 3), hostId: host?.id ?? null, lookIds: some(r, wardrobe, part === 'Lead' ? 3 : part === 'Model' ? 2 : 1) };
  });
  const leads = castRoles.filter((x) => x.part === 'Lead'); const sups = castRoles.filter((x) => x.part === 'Supporting');
  const crew = some(r, people.filter((p) => !base.includes(p)), 6);
  const director = crew[0], writers = crew.slice(1, 3), producer = sr.clubId ? (core.clubs.find((c) => c.id === sr.clubId)?.founderId ?? crew[3]) : crew[3];
  const beat = () => pick(r, BEAT).replace('%LEAD%', pick(r, leads.length ? leads : castRoles).character.split(' ')[0]).replace('%SUP%', pick(r, sups.length ? sups : castRoles).character.split(' ')[0]);
  const episode = (season, k, total) => {
    const guests = some(r, castRoles.filter((x) => ['Guest', 'Cameo', 'Recurring'].includes(x.part)), int(r, 1, 3)).map((x) => x.personId);
    const look = pick(r, wardrobe); nEps++;
    return { n: k, season, title: k === total ? 'The ' + pick(r, ['Finale', 'Encore', 'Crown', 'Curtain']) : `${pick(r, EP_A)} ${pick(r, EP_B)}`, synopsis: beat(),
      runtime: sr.kind === 'film' ? sr.runtime : int(r, 38, 58), directorId: r() < 0.7 ? director : pick(r, crew), writerIds: some(r, writers, 1), guestIds: guests,
      shop: { lookId: look, poolId: pool, moment: pick(r, ['walks in wearing', 'is fitted for', 'sells', 'swaps into', 'wears to the gate']) } };
  };
  const seasons = sr.kind === 'series'
    ? Array.from({ length: 7 }, (_, i) => { const total = int(r, 5, 13); return { n: i + 1, title: SEASON_T[i], year: 2020 + i, synopsis: `Season ${i + 1}: ${pick(r, CONFLICT)}; ${pick(r, ['nothing less than', 'all for', 'everyone bets'])} ${pick(r, STAKES)}.`,
        episodes: Array.from({ length: total }, (_, k) => episode(i + 1, k + 1, total)) }; })
    : [{ n: 1, title: sr.kind === 'play' ? 'Acts' : 'Feature', year: sr.year ?? 2026, synopsis: sr.synopsis,
        episodes: Array.from({ length: sr.kind === 'play' ? int(r, 2, 5) : 1 }, (_, k, a) => ({ ...episode(1, k + 1, 9), title: sr.kind === 'play' ? 'Act ' + ['I', 'II', 'III', 'IV', 'V'][k] : sr.title, synopsis: k === 0 && sr.kind !== 'play' ? sr.synopsis : beat() })) }];
  const themes = { motifs: some(r, MOTIFS, 3), moods: some(r, MOODS, 2), setting: sr.worldId, conflict: pick(r, CONFLICT), stakes: pick(r, STAKES), palette: [...new Set(castRoles.flatMap((x) => x.lookIds))].slice(0, 6) };
  shards[shardOf(sr.id)][sr.id] = { directorId: director, writerIds: writers, producerId: producer, themes, roles: castRoles, seasons };
  // light summary on the series record (the full production loads per title)
  Object.assign(sr, { directorId: director, castCount: castRoles.length, seasonCount: seasons.length, episodeCount: seasons.reduce((a, s) => a + s.episodes.length, 0), poolId: pool, themes: { motifs: themes.motifs, moods: themes.moods } });
  sr.cast = castRoles.slice(0, 8).map((x) => x.personId);
  for (const x of castRoles) { (roleIndex[x.personId] ??= []).push([sr.id, x.character, x.part]); nRoles++; }
  for (const id of [director, ...writers]) (roleIndex[id] ??= []).push([sr.id, id === director ? 'Director' : 'Writer', 'Crew']);
}
mkdirSync(join(DATA, 'productions'), { recursive: true });
shards.forEach((s, i) => writeFileSync(join(DATA, 'productions', String(i).padStart(2, '0') + '.json'), JSON.stringify(s)));
writeFileSync(join(DATA, 'roleIndex.json'), JSON.stringify(roleIndex));
keep('series.json', series);
console.log(`productions: ${series.series.length} titles · ${nRoles} roles · ${nEps} episodes · ${Object.keys(roleIndex).length} people with credits`);
