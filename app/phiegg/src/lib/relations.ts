// Data relations: every *Id / *Ids link in data/*.json, indexed in both directions, so any record can list the
// records it points at and the records that point at it, club → founder, worlds, host, shots, shows, events,
// series, quests, coin, store; world → club, creator, cities, shows, quests, nests; person → clubs, hosts,
// shots, worlds created, shows hosted; and so on. Built once, lazily, from the same JSON the pages read.
import type { ID } from '../types/phiegg';
import { D, STORES, feedPosts, onDataRefresh } from './data';
import { buildDB } from '@phi-kit/kinds';
import { indexRelations, type RelationIndex } from '@phi-kit/relations';

export type Kind = 'person' | 'club' | 'world' | 'city' | 'host' | 'nest' | 'post' | 'show' | 'event' | 'series' | 'quest' | 'coin' | 'store' | 'look' | 'room' | 'role' | 'cast' | 'piece' | 'ride' | 'jewel';
export type Ref = { kind: Kind; id: ID };
export const key = (r: Ref) => r.kind + ':' + r.id;

type Row = Record<string, unknown>;
/** One link type: rows of `from` carry `field` pointing at `to`; `out` names it from the row, `in` from the target. */
type Spec = { from: Kind; rows: () => Row[]; field: string; to: Kind; out: string; in: string };

const rows = <T,>(xs: T[] | undefined) => (xs ?? []) as unknown as Row[];
const people = () => [...rows(D.core.users), ...rows(D.agents.agents)];
const cities = () => D.core.worlds.flatMap((w) => w.cities.map((c) => ({ ...c, worldId: w.id }) as unknown as Row));
const looks = () => STORES.flatMap((s) => s.looks.map((l) => ({ ...l, storeId: s.id }) as unknown as Row));
const stores = () => rows(STORES);

export const SPECS: Spec[] = [
  { from: 'club', rows: () => rows(D.core.clubs), field: 'nestId', to: 'nest', out: 'Collection', in: 'Clubs' },
  { from: 'club', rows: () => rows(D.core.clubs), field: 'founderId', to: 'person', out: 'Founder', in: 'Founded' },
  { from: 'club', rows: () => rows(D.core.clubs), field: 'hostId', to: 'host', out: 'Host', in: 'Clubs' },
  { from: 'club', rows: () => rows(D.core.clubs), field: 'worldIds', to: 'world', out: 'Worlds', in: 'Club' },
  { from: 'world', rows: () => rows(D.core.worlds), field: 'clubId', to: 'club', out: 'Club', in: 'Worlds' },
  { from: 'world', rows: () => rows(D.core.worlds), field: 'creatorId', to: 'person', out: 'Creator', in: 'Worlds created' },
  { from: 'world', rows: () => rows(D.core.worlds), field: 'hostId', to: 'host', out: 'Host', in: 'Worlds' },
  { from: 'city', rows: cities, field: 'worldId', to: 'world', out: 'World', in: 'Cities' },
  { from: 'person', rows: people, field: 'clubIds', to: 'club', out: 'Clubs', in: 'Members' },
  { from: 'person', rows: people, field: 'hostIds', to: 'host', out: 'Hosts', in: 'Members' },
  { from: 'post', rows: () => rows(feedPosts()), field: 'authorId', to: 'person', out: 'By', in: 'Shots' },
  { from: 'post', rows: () => rows(feedPosts()), field: 'clubId', to: 'club', out: 'Club', in: 'Shots' },
  { from: 'post', rows: () => rows(feedPosts()), field: 'worldId', to: 'world', out: 'World', in: 'Shots' },
  { from: 'host', rows: () => rows(D.hosts.hosts), field: 'clubId', to: 'club', out: 'Club', in: 'Host' },
  { from: 'host', rows: () => rows(D.hosts.hosts), field: 'ownerId', to: 'person', out: 'Owner', in: 'Hosts owned' },
  { from: 'nest', rows: () => rows(D.hosts.nests), field: 'hostId', to: 'host', out: 'Host', in: 'Nests' },
  { from: 'nest', rows: () => rows(D.hosts.nests), field: 'worldId', to: 'world', out: 'World', in: 'Nests' },
  { from: 'nest', rows: () => rows(D.hosts.nests), field: 'cityId', to: 'city', out: 'City', in: 'Nests' },
  { from: 'nest', rows: () => rows(D.hosts.nests), field: 'parentId', to: 'nest', out: 'Inside', in: 'Nested' },
  { from: 'show', rows: () => rows(D.shows.shows), field: 'clubId', to: 'club', out: 'Club', in: 'Shows' },
  { from: 'show', rows: () => rows(D.shows.shows), field: 'worldId', to: 'world', out: 'World', in: 'Shows' },
  { from: 'show', rows: () => rows(D.shows.shows), field: 'hostAgentId', to: 'person', out: 'Hosted by', in: 'Shows hosted' },
  { from: 'show', rows: () => rows(D.shows.shows), field: 'venueCityId', to: 'city', out: 'Venue', in: 'Shows' },
  { from: 'event', rows: () => rows(D.events.events), field: 'clubId', to: 'club', out: 'Club', in: 'Events' },
  { from: 'event', rows: () => rows(D.events.events), field: 'worldId', to: 'world', out: 'World', in: 'Events' },
  { from: 'event', rows: () => rows(D.events.events), field: 'cityId', to: 'city', out: 'City', in: 'Events' },
  { from: 'series', rows: () => rows(D.series.series), field: 'clubId', to: 'club', out: 'Club', in: 'Series & films' },
  { from: 'series', rows: () => rows(D.series.series), field: 'worldId', to: 'world', out: 'World', in: 'Series & films' },
  { from: 'series', rows: () => rows(D.series.series), field: 'hostId', to: 'host', out: 'Host', in: 'Series & films' },
  { from: 'quest', rows: () => rows(D.economy.quests), field: 'sponsorClubId', to: 'club', out: 'Sponsor', in: 'Quests' },
  { from: 'quest', rows: () => rows(D.economy.quests), field: 'worldId', to: 'world', out: 'World', in: 'Quests' },
  { from: 'coin', rows: () => rows(D.economy.coins), field: 'clubId', to: 'club', out: 'Club', in: 'Coin' },
  { from: 'store', rows: stores, field: 'clubId', to: 'club', out: 'Club', in: 'Store' },
  { from: 'look', rows: looks, field: 'storeId', to: 'store', out: 'Store', in: 'Looks' },
  { from: 'look', rows: looks, field: 'nestId', to: 'nest', out: 'Collection', in: 'Looks' },
  { from: 'piece', rows: () => rows(D.club.pieces), field: 'nestId', to: 'nest', out: 'Collection', in: 'Pieces' },
  { from: 'ride', rows: () => rows(D.ride.list), field: 'nestId', to: 'nest', out: 'Collection', in: 'Rides' },
  { from: 'jewel', rows: () => rows(D.jewel.list), field: 'nestId', to: 'nest', out: 'Collection', in: 'Jewellery' },
  { from: 'room', rows: () => rows(D.messages.voiceRooms), field: 'hostId', to: 'host', out: 'Host', in: 'Voice rooms' },
  { from: 'room', rows: () => rows(D.messages.voiceRooms), field: 'speakerIds', to: 'person', out: 'Speakers', in: 'Speaking in' },
  // Hosts as roles; casts (where hosts feature); pieces
  { from: 'host', rows: () => rows(D.hosts.hosts), field: 'roleTypeId', to: 'role', out: 'Role', in: 'Hosts' },
  { from: 'cast', rows: () => rows(D.casts.casts), field: 'hostIds', to: 'host', out: 'Hosts', in: 'Casts' },
  { from: 'cast', rows: () => rows(D.casts.casts), field: 'showId', to: 'show', out: 'Show', in: 'Casts' },
  { from: 'cast', rows: () => rows(D.casts.casts), field: 'seriesId', to: 'series', out: 'Series', in: 'Casts' },
  { from: 'cast', rows: () => rows(D.casts.casts), field: 'lookIds', to: 'look', out: 'Looks', in: 'Casts' },
  { from: 'cast', rows: () => rows(D.casts.casts), field: 'questIds', to: 'quest', out: 'Quests', in: 'Casts' },
  { from: 'cast', rows: () => rows(D.casts.casts), field: 'hostAgentId', to: 'person', out: 'Hosted by', in: 'Casts hosted' },
  { from: 'cast', rows: () => rows(D.casts.casts), field: 'worldId', to: 'world', out: 'World', in: 'Casts' },
  // Rides and Maison Once's pieces (round 29): their club, world, city and whoever holds them.
  { from: 'ride', rows: () => rows(D.ride.list), field: 'clubId', to: 'club', out: 'Made by', in: 'Rides' },
  { from: 'ride', rows: () => rows(D.ride.list), field: 'worldId', to: 'world', out: 'World', in: 'Rides' },
  { from: 'ride', rows: () => rows(D.ride.list), field: 'cityId', to: 'city', out: 'City', in: 'Rides' },
  { from: 'ride', rows: () => rows(D.ride.list), field: 'holderId', to: 'person', out: 'Held by', in: 'Rides held' },
  { from: 'jewel', rows: () => rows(D.jewel.list), field: 'clubId', to: 'club', out: 'Made by', in: 'Jewellery and watches' },
  { from: 'jewel', rows: () => rows(D.jewel.list), field: 'cityId', to: 'city', out: 'City', in: 'Jewellery and watches' },
  { from: 'jewel', rows: () => rows(D.jewel.list), field: 'holderId', to: 'person', out: 'Held by', in: 'Jewellery held' },
  { from: 'piece', rows: () => rows(D.club.pieces), field: 'clubId', to: 'club', out: 'Club', in: 'Pieces' },
  { from: 'piece', rows: () => rows(D.club.pieces), field: 'creatorId', to: 'person', out: 'Creator', in: 'Pieces created' },
];

/** The same records in the shared items+kinds shape (phi-kit/kinds), what Phidata browses and Phiora serves. */
export function itemsDB() {
  const byKind = new Map<string, Row[]>();
  for (const sp of SPECS) if (!byKind.has(sp.from)) byKind.set(sp.from, sp.rows());
  return buildDB([...byKind.entries()].map(([kind, rs]) => ({ kind, rows: rs })));
}

let INDEX: RelationIndex | null = null;
onDataRefresh(() => { INDEX = null; }); // heavy.ts / live.ts landed rows: rebuild on next ask
/** The two-way link index (phi-kit/relations, built on first use from SPECS). Links to kinds with no rows here
 *  (roles) are taken on trust, as before. */
export function relationIndex(): RelationIndex {
  if (INDEX) return INDEX;
  const byKind = new Map<string, Row[]>();
  for (const sp of SPECS) if (!byKind.has(sp.from)) byKind.set(sp.from, sp.rows());
  return (INDEX = indexRelations([...byKind.entries()].map(([kind, rows]) => ({ kind, rows })), SPECS.map(({ from, field, to, out, in: back }) => ({ from, field, to, out, in: back }))));
}

/** Relations of one record, grouped by relation name, biggest kinds last so single links (Founder, Club) lead. */
export function relationsOf(r: Ref): { rel: string; refs: Ref[] }[] {
  return relationIndex().relationsOf(r).map((g) => ({ rel: g.rel, refs: g.refs as Ref[] }));
}

/** How many records link to or from this one. */
export const degreeOf = (r: Ref) => relationIndex().degreeOf(r);
