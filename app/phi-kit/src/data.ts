import registry from './registry.json';
import { resolveLinks } from './links';

export type IconPath = { d: string; tf?: string; fill: string; stroke: string; sw: number };
export type AppMeta = { key: string; name: string; tagline: string; desc: string; color: string; port: number; built: boolean; icon: IconPath[] };
export type NavItem = { id: string; label: string; icon: string; items?: NavItem[]; image?: string; pull?: Record<string, unknown>; previews?: import('./blocks/Grid').GridItem[] };
export type Block = { kind: string; title?: string; [k: string]: any };
export type View = { title: string; sub?: string; blocks: Block[] };
export type AppData = { app: string; nav: NavItem[]; views: Record<string, View>; profile?: import('./Profile').ProfileSpec };

export const APPS = registry as AppMeta[];
export const appMeta = (key: string) => APPS.find((a) => a.key === key) as AppMeta;

/** Link to another app: VITE_PHI_APPS_BASE in prod (e.g. https://phiace.com/), localhost ports in dev. */
export const appUrl = (key: string) => {
  const base = import.meta.env.VITE_PHI_APPS_BASE as string | undefined;
  const a = appMeta(key);
  return base ? base.replace(/\/?$/, '/') + key + '/' : 'http://localhost:' + (a ? a.port : 3101) + '/';
};

/** An image reference in app data: "phiegg:worlds/w_aria.png" is a file another app serves (the shared art lives in
    phiegg's public folder, so every app links to it instead of copying it); a full URL or "/path" is used as is; anything
    else is relative to this app. */
export function assetUrl(ref: string): string;
export function assetUrl(ref?: string): string | undefined;
export function assetUrl(ref?: string): string | undefined {
  if (!ref) return undefined;
  const m = ref.match(/^([a-z]+):(?!\/\/)(.+)$/);
  if (m) return appUrl(m[1]) + m[2].replace(/^\//, '');
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith('/')) return ref;
  return import.meta.env.BASE_URL + ref;
}

/** An app's menus and pages: from Phiora (GET {VITE_PHI_API}/app/<key>, composed from its app, menu, page and block
 *  records) or, with no API, from public/data/<key>.json, the file that seeds them. Linked blocks resolve here. */
export const loadApp = async (key: string): Promise<AppData> => {
  const api = import.meta.env.VITE_PHI_API as string | undefined;
  const url = api ? api.replace(/\/$/, '') + '/app/' + key : import.meta.env.BASE_URL + 'data/' + key + '.json';
  const r = await fetch(url);
  if (!r.ok) throw new Error('Could not load ' + key + ' (' + r.status + ')');
  return resolveLinks(await r.json());
};
