// Commerce types: the shop and its looks, places, stores, hosts as roles, casts, sales and pools.
import type { ID, ISODate, Tone } from './phiegg';

// ── Shop: Lora's Spark (data/ls.json, images in public/items/ls) ──
export interface ShopLook {
  id: ID; n: string; poolId: string; storeId: string; name: string; colour: string; hex: string; garments: string[];
  rarity: string; edition: number; minted: number; owners: number; usd: number; floor: number; lastSale?: number; change7d: number;
  mintDate?: string; views: Record<string, string>; opaque?: Record<string, string>;
  /** Every field an item can carry (scripts/items.mjs). Designers fill `theme` over time. */
  specs?: LookSpecs;
}
/** Item specs. `colour` is measured from the render (scripts/item-colors.py); `designer` keeps the colour it was named for. */
export interface LookSpecs {
  colour: { name: string; hex: string; family?: string; palette: string[]; measured: string | null; share: number | null; source: 'render' | 'swatch'; designer: { name: string; hex: string } | null };
  /** Thematic kinds come from the designers; `source: 'pending'` until they do. */
  theme: { kinds: string[]; mood: string | null; story: string | null; colours?: string[]; by?: ID | null; seeded?: boolean; source: 'pending' | 'designer' };
  category: string; silhouette: string; fabric: string[]; finish: string; garments: string[];
  sizes: string[]; fits: string[]; fit: string; season: string | null; collection: string | null;
  renders: { angles: string[]; opaque: boolean; front: string | null; from: ID | null };
  provenance: { storeId: ID | null; clubId: ID | null; poolId: ID | null; worldId: ID | null; designerId: ID | null; mintDate: string | null };
  supply: { edition: number; minted: number; owners: number };
  utility: string[]; tags: string[]; physical: { available: boolean; made: string };
  gender?: string; occasion?: string[]; neckline?: string; sleeve?: string; length?: string; embellishment?: string; closure?: string; waist?: string;
  craft?: { hours: number; technique: string; artisans: number; atelier: string | null }; inspiration?: string;
  care?: { digital: string; physical: string }; sustainability?: { madeTo: string; deadstock: boolean; traceable: boolean };
  price?: { list: number; floor: number; lastSale: number | null; change7d: number; currency: string; royaltyPct: number };
  appearsIn?: { castIds: ID[]; showIds: ID[]; seriesIds: ID[]; episodes: number };
}
export interface LsData {
  store: { id: ID; code: string; name: string; tagline: string; world?: string; club?: string };
  views: { id: string; label: string }[];
  pools: { id: string; name: string; season: string; desc: string; lookIds: ID[] }[];
  looks: ShopLook[];
}

// ── Places (data/places.json): world → city → district → place ──
export type PlaceKind = 'boutique' | 'atelier' | 'runway' | 'fitting' | 'gallery' | 'cafe' | 'cinema' | 'studio' | 'screening' | 'library' | 'theatre' | 'market' | 'club' | 'arcade' | 'park' | 'plaza';
export interface Place { id: ID; name: string; kind: PlaceKind; clubId: ID; tone: Tone; hours: string; visitors: number; rating: number; desc: string }
export interface District { id: ID; name: string; vibe: string; tone: Tone; places: Place[] }
export interface PlacesData { cities: Record<ID, { worldId: ID; tone: Tone; desc: string }>; districts: Record<ID, District[]> }

// ── Stores (data/stores.json): one per club; Lora's Spark (ls.json) is the flagship ──
export interface Store {
  id: ID; clubId: ID; code: string; name: string; tagline: string;
  pools: { id: string; name: string; season: string; desc: string; lookIds: ID[] }[];
  looks: (ShopLook & { tone?: Tone })[];
}
export interface StoresData { stores: Store[] }

// ── Hosts as roles (data/roles.json): 16 categories × 4 types = 64; a host is a child of a profile ──
export interface RoleCategory { id: ID; name: string; genres: string[] }
export interface RoleType { id: ID; name: string; categoryId: ID; genres: string[]; behaviours: string[] }
export interface RolesData { categories: RoleCategory[]; types: RoleType[] }
// ── Casts (data/casts.json): where hosts feature, shows, plays, films, with looks, quests, plays, stats, live chat ──
export interface CastChat { id: ID; authorId: ID; text: string; at: string }
export interface Cast {
  id: ID; title: string; kind: 'show' | 'play' | 'film'; clubId: ID; worldId: ID; hostIds: ID[]; lookIds: ID[]; questIds: ID[];
  plays: number; live: boolean; stats: { views: number; likes: number; chats: number; tipsUsd: number }; chat: CastChat[];
  showId?: ID; seriesId?: ID; hostAgentId?: ID;
  /** The people on the cast (models, singers) and their names. */
  memberIds?: ID[]; castNames?: string[];
}
export interface CastsData { casts: Cast[] }
// ── Sales (data/sales.json): OpenSea-style activity on pieces and looks ──
export interface SaleEvent { id: ID; event: 'mint' | 'list' | 'offer' | 'sale' | 'transfer'; itemKind: 'piece' | 'look'; itemId: ID; fromId?: ID; toId?: ID; priceUsd: number; at: string }
export interface SalesData { sales: SaleEvent[] }

// ── Pools (data/pools.json, scripts/pools.mjs): the centre of PFTs (profile fungible tokens) ──
// A pool is a store line, a club drop or a fashion show. It sells lots (solo looks, 4–7-look packs, drops of up to 64
// units), publishes stats (each linked to a quest), runs one pool quest (its stats, sub-quests and coins) and
// sponsors fungible swaps out of it.
export type PoolKind = 'collection' | 'drop' | 'show' | 'pft';
export interface PoolMetric { id: string; label: string; group: string; format: 'usd' | 'count' | 'pct' | 'ratio'; hint: string }
export interface Pool {
  id: ID; name: string; kind: PoolKind; storeId?: ID; showId?: ID; clubId: ID; worldId?: ID; season?: string; desc: string;
  lookIds: ID[]; lotIds: ID[]; eventIds?: ID[]; questId: ID; coinIds: ID[]; liquidityId?: ID; eggIds?: ID[]; sumIds?: ID[]; profileIds?: ID[];
  /** Hosts of the club (the team, added automatically), the people who own them, the worlds that party for it. */
  teamIds?: ID[]; memberIds?: ID[]; worldIds?: ID[]; partyIds?: ID[]; colors?: string[];
  /** Declared at mint (kinds.json pool): what it is, its supply and terms, and every club, city and host it links to. */
  category?: string; chain?: string; drop?: string; supply?: number; floorUsd?: number; royaltyPct?: number;
  clubIds?: ID[]; cityIds?: ID[]; hostIds?: ID[];
}
export interface PoolQuest {
  id: ID; poolId: ID; kind: 'pool' | 'drop' | 'show' | 'pft'; clubId: ID; worldId?: ID; title: string; rewardCoin: string; reward: number;
  entrants: number; endsAt: ISODate; metricIds: string[]; questIds: ID[]; coinIds: ID[]; sponsorClubId: ID;
  stepsDone: number; answered: number; teamIds?: ID[]; memberIds?: ID[];
}
export interface AppStep { id: string; n: number; title: string; groups: string[]; hint: string }
export interface AppQuestion { id: string; step: string; kind: 'text' | 'number' | 'choice'; text: string; options?: string[] }
export interface PoolLot {
  id: ID; kind: 'solo' | 'pack' | 'drop'; poolId: ID; title: string; itemIds: ID[]; anchors?: number[]; supply: number; sold0: number;
  sellRate: number; opensAt: ISODate; base: number; spread: number; shelf?: number; seed: string; eventId?: ID; showId?: ID;
}
export interface PoolsData { metrics: PoolMetric[]; application: { steps: AppStep[]; questions: AppQuestion[] }; pools: Pool[]; lots: PoolLot[]; quests: PoolQuest[] }
