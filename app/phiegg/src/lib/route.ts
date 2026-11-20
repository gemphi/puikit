// What each path of the site has (data/route.json): the kind it shows, the id it carries, its menu, its header tools
// and its tabs. Everything that asks "what does this path have" reads it here; nothing decides it in a page.
import routeJson from '../data/route.json';
import { dataAt, fmt, itemsOf, valueAt, valuesAt, type ItemRow } from './data';

type Rule = Record<string, string>;
/** A tab: a kind, and which rows of it belong to the path's record (see data/route.json). */
export type RouteTab = { id: string; label: string; kind: string; where?: Rule; not?: Rule; menu?: boolean };
export type Route = { kind?: string | string[]; param?: string; menu?: string; header: string[]; /** The header's tools on a phone, where there is room for one beside the account. */ headerPhone?: string[]; title?: string; sub?: string; tab?: RouteTab[];
  /** The tab that is on when the path opens (else the first), and the path this one is like (it has what that has, then its own). */
  on?: string; like?: string;
  /** What the path is called in the trail and in menus (words or a copy key); the kind of record it names when that is
   *  not its `kind`; and the list it sits under: `up`, or `upBy` when a field of the record decides (a reel sits under Reels). */
  name?: string; record?: string | string[]; up?: Up; upBy?: { field: string } & Record<string, Up | string>;
  /** The right sidebar's groups for this path. */
  side?: SideGroup[] };
/** A group on the right sidebar: its icon (a lucide name), where on the rail it sits, and its menu: rows of a kind
 *  that belong to the path's record (`@` is the path's own kind; `where` as on a tab), then plain links to paths. */
export type SideGroup = { id: string; label: string; icon: string; place?: 'top' | 'center' | 'bottom'; kind?: string; where?: Record<string, string>; limit?: number; link?: { label: string; path: string }[];
  /** This group lists the page's own columns (chat, linked, people): picking one shows or hides it. */
  columns?: boolean };
/** The list a path sits under: its path, what it is called there when that differs from the path's own name, and its params. */
export type Up = { path: string; name?: string; params?: Record<string, string> };

const R = routeJson as unknown as { default: Route; menu: Record<string, Partial<Route>>; path: Record<string, Partial<Route>> };

/** What a path has: the site's defaults, then its menu's, then what the path it is like has, then its own. */
export const routeOf = (path: string): Route => {
  const own = R.path[path] ?? {}; const base = own.like ? R.path[own.like] ?? {} : {}; const menu = own.menu ?? base.menu;
  return { ...R.default, ...(menu ? R.menu[menu] : {}), ...base, ...own };
};
/** The id each path carries: { world: 'worldId', shop: 'storeId' … }. */
export const PARAM_OF: Record<string, string> = Object.fromEntries(
  Object.entries(R.path).flatMap(([path, p]) => (p.param ? [[path, p.param]] : [])));
/** The path a record of each kind opens on: { series: 'title', egg: 'asset' … }. */
export const PATH_OF: Record<string, string> = Object.fromEntries(
  Object.entries(R.path).flatMap(([path, p]) => [p.kind ?? []].flat().map((kind) => [kind, path])));

/** A path's words with their figures in: `{count}` is how many rows it lists, `{shows.season}` a value of the data. */
export const worded = (text: string | undefined, count: number): string =>
  (text ?? '').replace(/\{([\w.]+)\}/g, (_, k: string) => (k === 'count' ? fmt(count) : String(dataAt(k) ?? '')));

/** A rule's fields, each with the values it takes: the value written, or those at `$path` in the path's record. */
const wanted = (rule: Rule | undefined, record: unknown) => Object.entries(rule ?? {}).map(([field, v]) =>
  [field, new Set(v.startsWith('$') ? valuesAt(record, v.slice(1).split('.')).map(String) : [v])] as const);
/** The rows of a tab: its kind's rows that meet every `where` and no `not`, for the record the path shows. A rule's
 *  field may step through a link ("worldId.kind" is the kind of the row's world). */
export const rowsOf = (tab: RouteTab, record: unknown): ItemRow[] => {
  const yes = wanted(tab.where, record), no = wanted(tab.not, record);
  const has = (r: ItemRow, [field, values]: readonly [string, Set<string>]) => values.has(String(valueAt(r, field) ?? ''));
  return itemsOf(tab.kind).filter((r) => yes.every((x) => has(r, x)) && !no.some((x) => has(r, x)));
};
