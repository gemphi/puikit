// The database's ids, locally. Phiora's seed gave every record an md5 id (md5 of `kind:originalId`), a slug and
// remapped references; this module applies the exact same rules (phi-kit/normalize) to the bundled data at import
// time, so the app speaks the one database's ids with or without the API. Import it before reading any data —
// lib/data.ts imports it first, so everything downstream sees md5 ids only.
// Stories stay on their original ids (data/stories.json loads lazily and joins nothing outside itself).
// Stores, shows and sales load lazily too (lib/heavy.ts); their ids come from data/heavyIds.json (scripts/heavy-ids.mjs).
import { buildIdMap, mapKeys as keysOf, remapDeep, reverseOf, treeId, type IdMap, type TreeEntry } from '@phi-kit/normalize';
import manifest from '../data/tree.json';
import heavyIds from '../data/heavyIds.json';
import core from '../data/core.json';
import feed from '../data/feed.json';
import hosts from '../data/hosts.json';
import club from '../data/club.json';
import phipad from '../data/phipad.json';
import messages from '../data/messages.json';
import events from '../data/events.json';
import agents from '../data/agents.json';
import economy from '../data/economy.json';
import series from '../data/series.json';
import ls from '../data/ls.json';
import roles from '../data/roles.json';
import casts from '../data/casts.json';
import pools from '../data/pools.json';
import assets from '../data/assets.json';
import ride from '../data/ride.json';
import jewel from '../data/jewel.json';
import explore from '../data/explore.json';
import profile from '../data/profile.json';
import landing from '../data/landing.json';
import league from '../data/league.json';
import beauty from '../data/beauty.json';
import collections from '../data/collections.json';

const FILES: Record<string, unknown> = { core, feed, hosts, club, phipad, messages, events, agents, economy, series, ls, roles, casts, pools, assets, ride, jewel, collections };
const HEAVY = new Set(['stores', 'shows', 'sales']);
const entries = (manifest as { sources: TreeEntry[] }).sources.filter((e) => e.kind !== 'story' && !HEAVY.has(e.file));

/** originalId → database id, over every bundled record. */
export const ID_MAP: IdMap = { ...buildIdMap(entries, FILES as Record<string, any>), ...(heavyIds as IdMap) };
const SRC = reverseOf(ID_MAP);
/** The database id of a known original id (`rid('club', 'c_opal')`). */
export const rid = (kind: string, originalId: string) => ID_MAP[originalId] ?? treeId(kind, originalId);
/** Back to the original id, for the seams still keyed by the old names (thread shards, role credits, counts). */
export const srcId = (id: string) => SRC[id] ?? id;
/** Remap a lazily loaded document with the same map (places, productions, role credits). */
export const remapDoc = (doc: unknown) => { remapDeep(doc, ID_MAP); return doc; };
export { mapKeys } from '@phi-kit/normalize';
export const MAP = ID_MAP;

for (const f of [...Object.values(FILES), explore, profile, landing, league, beauty]) remapDeep(f, ID_MAP);
// Tables keyed by record id (a nest's messages, a conversation's thread) move to the database ids too, or every
// nest and conversation opens empty: remapDeep changes values, not keys.
const H = hosts as unknown as { messages: Record<string, unknown> }; H.messages = keysOf(H.messages, ID_MAP);
const M = messages as unknown as { threads?: Record<string, unknown> }; if (M.threads) M.threads = keysOf(M.threads, ID_MAP);
