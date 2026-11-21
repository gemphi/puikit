// Phiegg, domain + page data types. Mirrors /data/*.json.

export type ID = string;
export type ISODate = string;
export type Tone = 'accent' | 'sage' | 'neutral' | 'ink';
export type Chain = 'Ethereum' | 'Base' | 'Solana';

export interface User {
  id: ID; handle: string; name: string; tone: Tone; bio: string;
  verified: boolean; wallet: string; followers: number; following: number;
  clubIds: ID[]; badges: string[];
  /** Hosts this person is a member of (the hosts they own are hosts[].ownerId). */
  hostIds?: ID[];
  /** Star, singer, model or reality-cast numbers (scripts/celebs.mjs). */
  celebStats?: Record<string, string | number>;
}

/** Club lifecycle. "applied" → "review" → "incubating" happen inside Phipad. */
export type ClubStatus = 'applied' | 'review' | 'incubating' | 'live' | 'graduated';
/** How a club reached Phiegg: through the Phipad accelerator or directly. */
export type ClubRoute = 'phipad' | 'direct';

export interface Club {
  id: ID; name: string; ticker: string; tone: Tone;
  supply: number; floor: number | null; holders: number; chain: Chain;
  founderId: ID; status: ClubStatus; route: ClubRoute;
  tagline: string; description: string; tags: string[];
  hostId: ID | null; worldIds: ID[];
  /** Colours of the club's looks, every card without an image is painted with them. */
  colors?: string[];
  /** Utility PFT supply when the club is one PFT pool (OHHC, Bold Pups, Epic Pods AC). */
  pftSupply?: number;
}

export type WorldKind = 'virtual' | 'ar' | 'agentic';
/** A zone of a world (a world is a city: World = City -> Zones -> Places, and Lands). */
export interface City { id: ID; name: string; population: number; vibe: string }
/** One view of a world's own renders (public/cities/<slug>/<view>-sm|lg.webp): sm for cards and strips, lg for the page. */
export interface WorldView { view: string; sm: string; lg: string }
export interface World {
  id: ID; name: string; clubId: ID; kind: WorldKind; tone: Tone;
  /** The generator that made it (bold-cities …), so a rerun can replace its own records. */
  origin?: string;
  visitorsNow: number; description: string; cities: City[];
  /** The pool this world is the party of, and its colours. */
  poolId?: ID; colors?: string[];
  tags?: string[];
  /** Who built it and the host it belongs to. */
  creatorId?: ID; hostId?: ID;
  /** agentic worlds only */
  agents?: number;
  /** generated default image, assets/worlds/<id>.png (served from public/worlds) */
  image?: string;
  /** A world with its own renders (the Bold Cities, scripts/bold-cities.py): its mark and every view, cut out on a clear background. */
  logo?: string; gallery?: WorldView[];
  /** The land type it stands on, 1-16, and its group (BC-Land-Types-Phase-01). */
  land?: number; landName?: string; landGroup?: string;
}

export interface CoreData { currentUserId: ID; users: User[]; clubs: Club[]; worlds: World[] }

// ── Hosts & Nests ──────────────────────────────────────────────
/** A Host is a community server, usually owned by a Club. */
export interface Host {
  id: ID; name: string; clubId: ID | null; tone: Tone;
  members: number; online: number; gated: string; roles: string[];
  /** The profile this host belongs to, hosts are children of a profile. */
  ownerId?: ID;
  /** One of the 64 role types (data/roles.json), its genre and the behaviours it plays in casts. */
  roleTypeId?: ID; genre?: string; behaviours?: string[];
}

/** A Nest is anything you "nest" inside a host: a channel, a world for the
 *  host/club, a city inside a world, a quest, a voice room… Nests form a tree. */
export type NestKind = 'channel' | 'world' | 'city' | 'quest' | 'voice' | 'stage' | 'gallery' | 'collection';
export interface Nest {
  id: ID; hostId: ID; parentId: ID | null; kind: NestKind;
  name: string; topic: string; unread: number;
  worldId?: ID; cityId?: ID; live?: number;
}
export interface NestMessage { id: ID; authorId: ID; at: string; text: string; shotId?: ID; /** A look attached to the message (shown as a card under it). */ lookId?: ID }
export interface NestKindOption { kind: NestKind; label: string; hint: string }
export interface HostsPage {
  hosts: Host[]; nests: Nest[];
  messages: Record<ID, NestMessage[]>;
  nestKinds: NestKindOption[];
}
export interface CreateNestInput { hostId: ID; parentId: ID | null; kind: NestKind; name: string; topic?: string }

// ── Shots (posts) ──────────────────────────────────────────────
export type ShotMediaKind = 'image' | 'look' | 'world-capture' | 'reel';
export interface Shot {
  id: ID; authorId: ID; clubId: ID | null; worldId: ID | null;
  /** The generator that made it (city-life …). */
  origin?: string;
  /** Where it was posted: the zone (a world's city) it is pinned to. */
  cityId?: ID;
  media: { kind: ShotMediaKind; tone: Tone; ratio: '1/1' | '4/5'; title: string; src?: string; hex?: string; lookId?: ID; family?: string;
    /** More pictures after the cover, each its own slide (a world's views). */
    views?: { view: string; src: string }[] };
  caption: string; likes: number; comments: number; reshares: number;
  createdAt: ISODate; tags: string[]; lookItems: string[];
}
export interface Moment { id: ID; userId: ID; label: string; isSelf?: boolean; live?: boolean }
export interface FeedPage { moments: Moment[]; shots: Shot[]; suggestedClubIds: ID[]; upcomingEventIds: ID[] }

// ── Pages ──────────────────────────────────────────────────────
export interface ClubPiece { id: ID; tokenId: string; name: string; tone: Tone; trait: string; ownerId?: ID; clubId?: ID; creatorId?: ID }
export interface ClubPage { clubId: ID; pieces: ClubPiece[]; tabs: string[] }

export interface ExplorePage { categories: string[]; trendingClubIds: ID[]; trendingWorldIds: ID[]; creatorIds: ID[]; worldRegions: string[] }

export interface ProfilePage { userId: ID; tabs: string[]; shotIds: ID[]; pinnedLook: string }

export type PhipadStage = 'applied' | 'review' | 'incubating' | 'funded' | 'launched';
export type PhipadTrackId = 't_ar' | 't_virtual' | 't_agentic' | 't_pfp';
export interface PhipadTrack { id: PhipadTrackId; name: string; tone: Tone; pool: number; currency: 'USDC'; body: string }
export interface PhipadApplication {
  id: ID; clubId: ID; trackId: PhipadTrackId; stage: PhipadStage;
  ask: number; raised: number; submittedAt: ISODate; mentorIds?: ID[];
}
export interface PhipadPage {
  hero: { title: string; subtitle: string; body: string };
  routes: { id: ClubRoute; title: string; body: string; points: string[] }[];
  tracks: PhipadTrack[];
  stages: { id: PhipadStage; label: string }[];
  applications: PhipadApplication[];
}
export interface SubmitClubInput {
  clubName: string; ticker: string; chain: Chain; contract?: string;
  route: ClubRoute; trackId?: PhipadTrackId; ask?: number;
}

export type ConversationKind = 'dm' | 'group';
export interface Conversation { id: ID; kind: ConversationKind; title: string; userIds: ID[]; last: string; at: string; unread: number }
export interface DirectMessage { id: ID; authorId: ID; at: string; text: string }
export interface VoiceRoom { id: ID; title: string; hostId: ID; speakerIds: ID[]; listeners: number; live: boolean; startsAt?: string }
export interface MessagesPage { conversations: Conversation[]; thread: { conversationId: ID; messages: DirectMessage[] }; voiceRooms: VoiceRoom[]; threads?: Record<ID, DirectMessage[]> }

export type EventKind = 'drop' | 'runway' | 'party' | 'talk' | 'show';
export interface PhieggEvent {
  id: ID; kind: EventKind; title: string; clubId: ID | null; worldId: ID | null;
  cityId?: ID; startsAt: ISODate; rsvps: number; price?: number; supply?: number; poolId?: ID; genre?: string;
  /** A yearly event says when it comes back ('Every summer'). */
  recurring?: string;
}
export interface EventsPage { filters: string[]; events: PhieggEvent[] }

export type SettingItem =
  | { id: string; type: 'text'; label: string; value: string }
  | { id: string; type: 'toggle'; label: string; value: boolean }
  | { id: string; type: 'choice'; label: string; value: string; options: string[] }
  | { id: string; type: 'wallet'; label: string; value: string; chain: Chain; verified: boolean };
export interface SettingsPage { sections: { id: string; label: string; items: SettingItem[] }[] }

export interface LandingPage {
  nav: string[];
  hero: { kicker: string; title: string; body: string; primary: string; secondary: string };
  pillars: { id: string; title: string; body: string }[];
  compare: { columns: [string, string]; rows: { label: string; a: string; b: string }[] };
  cta: { title: string; body: string; primary: string; secondary: string };
}

// ── AI agents ──────────────────────────────────────────────────
export type AgentGlyph = 'bridge' | 'spark' | 'bow' | 'wand' | 'bubble';
export interface StoryFrame { title: string; tone: Tone; caption: string }
export interface Highlight { id: ID; label: string; tone: Tone; frames: StoryFrame[] }
export interface Agent {
  id: ID; name: string; handle: string; tone: Tone; glyph: AgentGlyph;
  role: string; house: string; home: string; status: string; verified: boolean;
  followers: number; following: number; postCount: number; since: string;
  clubIds: ID[]; badges: string[]; bio: string; style: string;
  /** system-prompt persona used by the assistant */
  persona: string; askHint: string; abilities: string[]; prompts: string[];
  greeting: string; fallback: string; commentFallback: string; summonLine: string;
  stats: { conversations: string; looks: string; rating: string };
  highlights: Highlight[];
  wardrobe: { title: string; pieces: string[] };
}
export interface Comment { id: ID; authorId: ID; text: string; likes: number; at: string; parentId?: ID | null }
export interface Slide { title: string; tone: Tone; caption?: string; src?: string; hex?: string; lookId?: ID; family?: string }
/** Carousel post (agents and people). Feed shots convert to this for the shot viewer. */
export interface Post {
  id: ID; authorId: ID; kind: ShotMediaKind; clubId: ID | null; worldId: ID | null; cityId?: ID;
  caption: string; likes: number; createdAt: ISODate; tags: string[];
  slides: Slide[]; comments: Comment[];
}
export interface AgentsData { agents: Agent[]; posts: Post[] }
export type AgentChatMessage =
  | { role: 'user'; text: string }
  | { role: 'agent'; text: string }
  | { role: 'agent'; look: { title: string; pieces: string[]; note?: string; tone: Tone } }
  | { role: 'agent'; action: string };


// ── SS26 shows: 64 looks × 64 poses per world ──────────────────
export type PoseFamily = 'walk' | 'stand' | 'turn' | 'lean' | 'sit' | 'gesture' | 'motion' | 'float';
/** Joint angles in degrees, drives phiber mannequins and web previews alike. */
export interface PoseRig { spine: number; head: number; armL: number; armR: number; legL: number; legR: number; hip: number }
export interface Pose { id: ID; n: number; name: string; family: PoseFamily; rig: PoseRig; durationMs: number }
/** A runway look; `lookId` is the store look (PFT) it walks, `hex` that look's render colour. */
export interface Look { id: ID; n: number; title: string; tone: Tone; pieces: string[]; poseId: ID; hex?: string; lookId?: ID }
export interface Show {
  id: ID; worldId: ID; season: string; title: string; venueCityId: ID; date: ISODate;
  hostAgentId: ID; clubId: ID; tone: Tone; looks: Look[]; poseIds: ID[];
}
export interface ShowsData { season: string; poses: Pose[]; shows: Show[] }

// ── Economy: coins, pools, quests ──────────────────────────────
export interface Coin { id: ID; symbol: string; name: string; clubId: ID | null; tone: Tone; price: number; change24h: number; holders: number }
/** Liquidity behind a pool: a PHI / club-coin pair that takes USD stakes. */
export interface Liquidity { id: ID; name: string; pair: [string, string]; tone: Tone; tvl: number; apr: number; stakers: number; poolId?: ID }
export interface Quest { id: ID; title: string; worldId: ID; sponsorClubId: ID; tone: Tone; reward: number; rewardCoin: string; entrants: number; progress: number; endsAt: ISODate; kind: 'sponsored' | 'open' }
export interface EconomyData { coins: Coin[]; liquidity: Liquidity[]; quests: Quest[] }

export interface PageDataMap {
  economy: EconomyData;
  shows: ShowsData;
  agents: AgentsData;
  landing: LandingPage; feed: FeedPage; hosts: HostsPage; club: ClubPage;
  explore: ExplorePage; phipad: PhipadPage; messages: MessagesPage;
  events: EventsPage; profile: ProfilePage; settings: SettingsPage;
}
export type PageKey = keyof PageDataMap;

// ── Series & films (data/series.json) ──
export interface Episode { n: number; title: string; tone: Tone; runtime: number; synopsis?: string }
export interface Series {
  id: ID; kind: 'film' | 'series' | 'play'; title: string; clubId: ID; hostId: ID; worldId: ID; tone: Tone; synopsis: string;
  cast: ID[]; runtime: number; rating: number; views: number; episodes: Episode[]; genre: string; era: string; storyId?: string; /** The work a storyline is retold after (author, title, year). */ after?: string;
  year?: number; studio?: string; boxOfficeUsd?: number; awards?: number; restored?: boolean;
  /** Production summary (scripts/productions.mjs); the full production loads per title (lib/productions.ts). */
  directorId?: ID; castCount?: number; seasonCount?: number; episodeCount?: number; poolId?: ID | null; themes?: { motifs: string[]; moods: string[] };
}
/** One role in a production: the character a person plays, through which host, wearing which looks. */
export interface ProdRole { personId: ID; character: string; part: string; arc: string; traits: string[]; roleTypeId: ID | null; actions: string[]; hostId: ID | null; lookIds: ID[] }
export interface ProdEpisode { n: number; season: number; title: string; synopsis: string; runtime: number; directorId: ID; writerIds: ID[]; guestIds: ID[]; shop: { lookId: ID; poolId: ID | null; moment: string } }
export interface ProdSeason { n: number; title: string; year: number; synopsis: string; episodes: ProdEpisode[] }
export interface Production { directorId: ID; writerIds: ID[]; producerId: ID; themes: { motifs: string[]; moods: string[]; setting: ID; conflict: string; stakes: string; palette: ID[] }; roles: ProdRole[]; seasons: ProdSeason[] }
/** person → [titleId, character or crew job, part] */
export type RoleIndex = Record<ID, [ID, string, string][]>;

// ── Item types in a pool: PFT (looks), EGG (host earnings, gate takings, land), SUM (investment machines) ──
export type ItemType = 'pft' | 'egg' | 'sum';
export interface EggItem {
  id: ID; type: 'egg'; kind: 'gate' | 'earnings' | 'land'; name: string; hostId: ID; ownerId: ID | null; clubId: ID; worldId: ID | null; poolId: ID | null; cityId?: ID | null;
  seriesIds: ID[]; priceEgg: number; priceUsd: number; supply: number; sold: number; yieldDay: number; desc: string; sharePct?: number; sizeM2?: number;
}
export interface SumItem { id: ID; type: 'sum'; name: string; poolId: ID; clubId: ID; inputs: ID[]; strategy: string; apy: number; tvlEgg: number; minEgg: number; holders: number; rebalance: string; rules: string[]; seriesIds: ID[] }
/** A profile PFT: a portrait token (Bold Pups beta art) held by a profile or host. */
export interface ProfileItem { id: ID; type: 'pft'; kind: 'profile'; tokenId: string; n: number; name: string; clubId: ID; poolId: ID | null; holderId: ID | null; holderHostId?: ID; bg: string; outfit: string; sheet: number; index: number; priceUsd: number; traits: Record<string, string> }
export interface AssetsData { eggUsd: number; eggs: EggItem[]; sums: SumItem[]; profiles: ProfileItem[] }
export type RideKind = 'car' | 'cab' | 'van' | 'jetski' | 'saucer' | 'fun';
export type RideMode = 'sale' | 'fun' | 'hire';
/** A ride (data/ride.json, scripts/rides.mjs): a flying car, robo cab, robo van, jetski, flying saucer or fun ride, a PFT
 * with a set theme, drawn at `index` on sheet `sheet`. For sale (price), for fun (a ticket a ride) or for hire (a fare). */
export interface RideItem {
  id: ID; type: 'pft'; kind: RideKind; mode: RideMode; sheet: number; index: number; name: string; make: string; clubId: ID; worldId: ID; cityId: ID; holderId: ID;
  hex: string; glow: string; year: number; body: string; seats: number; rangeKm: number; topKmh: number; lift: string; lane: string; cargoM3?: number; minutes?: number; thrill?: number;
  edition: number; minted: number; owners: number; priceUsd: number; ticketUsd: number; ridesToday: number; change7d: number;
  theme: { kinds: string[]; mood: string; story: string; colours: string[]; by: ID; source: 'designer' };
}
export interface RideData { sheets: string[]; cols: number; rows: number; cell: [number, number]; list: RideItem[] }
/** A piece of Maison Once jewellery or a watch (data/jewel.json, scripts/jewels.mjs), made once. */
export interface JewelItem {
  id: ID; type: 'pft'; kind: 'jewel' | 'watch'; piece: 'ring' | 'necklace' | 'earrings' | 'bracelet' | 'watch'; index: number; name: string; make: string; clubId: ID; worldId: ID; cityId: ID; holderId: ID | null;
  metal: string; metalHex: string; stone: string | null; stoneHex: string; hex: string; carats: number; movement?: string; complication?: string; caseMm?: number; waterM?: number; strap?: string; powerHours?: number;
  hoursToMake: number; edition: number; minted: number; priceUsd: number; change7d: number;
  theme: { kinds: string[]; mood: string; story: string; colours: string[]; by: ID; source: 'designer' };
}
export interface JewelData { sheet: string; cols: number; rows: number; cell: [number, number]; list: JewelItem[] }
export interface SeriesData { series: Series[] }

// ── League (data/league.json) ──
export interface LeagueMetric { id: string; label: string; hint: string }
export interface LeagueRow { clubId: ID; score: number; seed: number; [metric: string]: number | string }
export interface LeagueMatch { id: ID; a: ID; b: ID; metric: string; scoreA: number; scoreB: number; winner: ID; questId: ID }
export interface LeagueRound { id: string; label: string; metric: string; matches: LeagueMatch[] }
export interface LeagueData { season: string; format: string; metrics: LeagueMetric[]; table: LeagueRow[]; rounds: LeagueRound[]; champion: ID; bracketOrder: number[] }

// The commerce types (shop, places, stores, roles, casts, sales, pools) live in their own file.
export * from './commerce';
