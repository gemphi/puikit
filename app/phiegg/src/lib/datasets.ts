// Phiegg's large data files, loaded once, in parallel, each as its own chunk.
//
// They used to be compiled into the app's code chunk (~8 MB of JSON in one 7.6 MB file), so every visit downloaded
// and parsed all of it in one piece, and every deploy that touched any code made browsers fetch all of it again.
// Here each file is a dynamic import: the build emits it as a separate, content-hashed chunk, the browser fetches them
// side by side, and a deploy that changes only code leaves their names (and so the browser's cached copies) alone.
//
// The top-level await means anything importing this module (lib/ids.ts, lib/data.ts and through them the app) runs
// only once every file is here, so the rest of the app keeps reading its data synchronously, exactly as before.
// lib/ids.ts remaps these same objects to the database's ids before lib/data.ts reads them.
//
// Small files read at start-up (site, settings, landing, profile, explore, threadCounts, tree) stay static imports.

const load = <T,>(p: Promise<{ default: T }>) => p.then((m) => m.default);

export const [
  core, feed, hosts, club, phipad, messages, events, agents, economy, series, ls,
  roles, casts, pools, assets, ride, jewel, beauty, league, collections, heavyIds,
] = await Promise.all([
  load(import('../data/core.json')),
  load(import('../data/feed.json')),
  load(import('../data/hosts.json')),
  load(import('../data/club.json')),
  load(import('../data/phipad.json')),
  load(import('../data/messages.json')),
  load(import('../data/events.json')),
  load(import('../data/agents.json')),
  load(import('../data/economy.json')),
  load(import('../data/series.json')),
  load(import('../data/ls.json')),
  load(import('../data/roles.json')),
  load(import('../data/casts.json')),
  load(import('../data/pools.json')),
  load(import('../data/assets.json')),
  load(import('../data/ride.json')),
  load(import('../data/jewel.json')),
  load(import('../data/beauty.json')),
  load(import('../data/league.json')),
  load(import('../data/collections.json')),
  load(import('../data/heavyIds.json')),
]);
