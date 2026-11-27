import registry from './registry.json';
import { resolveLinks } from './links';

export type IconPath = { d: string; tf?: string; fill: string; stroke: string; sw: number };
export type AppMeta = { look?: string; mode?: 'light' | 'dark'; /** The face the app reads in until a person picks one (an id from fonts.ts). */ font?: string;
  /** A world's own display face for its headings alone (a family in phi-fonts.css); the text keeps the reading face. */
  heading?: string;
  /** The app's logo face, for its name in the brand alone (a family in world-fonts.css). */
  logo?: string;
  /** The domain whose root is this app (phiogy.com): there the address has no /<key>/ of its own. */
  domain?: string; key: string; name: string; tagline: string; desc: string; color: string; port: number; built: boolean; config?: boolean; icon: IconPath[] };
export type NavItem = { id: string; label: string; icon: string; /** A person of the app (an id in its `people` file): the entry shows their picture and presence in place of the icon. */ who?: string;
  /** A heading over its `items` (a space's text and voice rooms): it folds them and is no page. */ head?: boolean;
  /** A room of the `people` file (a voice room): who is in it shows folded under the entry. */ crowd?: string;
  /** How many things wait behind the entry (requests to answer), shown as its count. */ count?: number;
  /** A group's own picture on the rail, a cell of a sheet, in place of its icon (a host's portrait). */ mark?: { sheet: string; cols: number; index: number }; items?: NavItem[]; image?: string; pull?: Record<string, unknown>; previews?: import('./blocks/Grid').GridItem[] };
export type Block = { kind: string; title?: string; [k: string]: any };
export type View = { title: string; sub?: string; blocks: Block[] };
export type AppData = { app: string; start?: string; bare?: boolean;
  /** A bare page's column width (a product page: "72rem"); unset, the page runs the window's width. */
  width?: string; nav: NavItem[];
  /** The file that holds the app's people (their names, pictures and presence), for menu entries that name one (`who`). */
  people?: string;
  /** The catalogue of hosts a person joins, leaves and makes (the hosts they are in become groups of the menu), and the
   *  ones they are in before they choose. */
  host?: string; joined?: string[];
  /** The index of the shops a person opens (`shops.tsx`): an open shop is a group of the menu, its own menu its pages. */
  shop?: string;
  /** The menu group that lists direct conversations (its id): the way to find anyone, and everyone the viewer began a
   *  conversation with, join it. */
  direct?: string;
  /** The right sidebar: groups like `nav`, shown as icons at the right edge, each opening its menu. */
  side?: NavItem[]; views: Record<string, View>; profile?: import('./Profile').ProfileSpec };

export const APPS = registry as AppMeta[];
export const appMeta = (key: string) => APPS.find((a) => a.key === key) as AppMeta;

/** Under the one host (app/phi) every config app is the same running app at /<key>/. */
export const HOSTED = import.meta.env.VITE_PHI_HOST === '1';
/** The app a page is: the first segment of its address, or, at the root of an app's own domain (its `domain` in
 *  registry.json, which Caddy serves at `/`), that app. */
export const currentAppKey = () => window.location.pathname.split('/')[1]
  || APPS.find((a) => a.domain && a.domain === window.location.hostname.replace(/^www\./, ''))?.key || '';
/** Where this app's own files are served from. */
export const appBase = () => (HOSTED ? '/' + currentAppKey() + '/' : (import.meta.env.BASE_URL as string));
/** The media store (phiegg.com/cdn on the server; in dev the host serves media/phi-media at /cdn). */
const MEDIA = ((import.meta.env.VITE_PHI_MEDIA as string | undefined) ?? '/cdn').replace(/\/$/, '');

/** In dev the one host (app/phi) serves every config app at /<key>/ (dev-all starts it on :3100). */
const DEV_HOST = ((import.meta.env.VITE_PHI_HOST_URL as string | undefined) ?? 'http://localhost:3100').replace(/\/?$/, '/');

/**
 * Link to another app: VITE_PHI_APPS_BASE in prod (e.g. https://phiace.com/). In dev a config app lives in the host
 * (/<key>/ from inside it, DEV_HOST/<key>/ from a standalone app), and an app with its own code on its own port.
 */
export const appUrl = (key: string) => {
  const base = import.meta.env.VITE_PHI_APPS_BASE as string | undefined;
  const a = appMeta(key);
  if (HOSTED && a?.config) return '/' + key + '/';
  if (base) return base.replace(/\/?$/, '/') + key + '/';
  if (a?.config) return DEV_HOST + key + '/';
  return 'http://localhost:' + (a ? a.port : 3101) + '/';
};

/** An image reference in app data: "cdn:collections/hhoc/images/00017.webp" is a key of the media store;
    "phiegg:worlds/w_aria.png" is a file another app serves (the shared art lives in phiegg's public folder, so every app
    links to it instead of copying it); a full URL or "/path" is used as is; anything else is relative to this app. */
export function assetUrl(ref: string): string;
export function assetUrl(ref?: string): string | undefined;
export function assetUrl(ref?: string): string | undefined {
  if (!ref) return undefined;
  if (ref.startsWith('cdn:')) return MEDIA + '/' + ref.slice(4).replace(/^\//, '');
  const m = ref.match(/^([a-z]+):(?!\/\/)(.+)$/);
  if (m && HOSTED) return '/' + m[1] + '/' + m[2].replace(/^\//, '');
  if (m) return appUrl(m[1]) + m[2].replace(/^\//, '');
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith('/')) return ref;
  return appBase() + ref;
}

/** An app's menus and pages: from Phiora (GET {VITE_PHI_API}/app/<key>, composed from its app, menu, page and block
 *  records) or, with no API, from public/data/<key>.json, the file that seeds them. Linked blocks resolve here. */
export const loadApp = async (key: string): Promise<AppData> => {
  const api = import.meta.env.VITE_PHI_API as string | undefined;
  const file = appBase() + 'data/' + key + '.json';
  // An API that cannot be reached is no answer, like one that has not been told about the app yet: the app still has
  // its own file, so the site opens either way.
  let r = api ? await fetch(api.replace(/\/$/, '') + '/app/' + key).catch(() => null) : null;
  if (!r?.ok) r = await fetch(file);
  if (!r.ok) throw new Error('Could not load ' + key + ' (' + r.status + ')');
  return resolveLinks(await fillSources(await r.json()));
};

/** A block whose cards are a file of their own (`source: "data/token.json"`, every token of a collection) gets them
 *  here, so the app document, and the block record Phiora seeds from it, stay small. A file that cannot be read is
 *  no cards. */
const fillSources = async (d: AppData): Promise<AppData> => {
  const fill = (b: Block): Promise<Block> => (b.source && !b.items?.length
    ? fetch(assetUrl(b.source)).then((r) => (r.ok ? r.json() : []), () => []).then((items) => ({ ...b, items }))
    : Promise.resolve(b));
  const views = await Promise.all(Object.entries(d.views).map(async ([k, v]) => [k, { ...v, blocks: await Promise.all(v.blocks.map(fill)) }] as const));
  return { ...d, views: Object.fromEntries(views) };
};
