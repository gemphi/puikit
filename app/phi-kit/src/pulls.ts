import { apiSend } from './api';
import { appUrl, type AppData, type Block, type NavItem } from './data';
import type { GridItem } from './blocks/Grid';

/**
 * A pull: records of one kind read live from Phiora (GET /tree/rows), so a menu entry or a home section shows what
 * the database holds, not a copy. Used by menu entries (their top records fold out under them in the sidebar), by
 * grid and news blocks (`pull` fills their items), table blocks (a row per record, a column per `fields` entry) and by stat items (`count` shows how many records a kind has).
 *   { kind: 'pool', n: 6, label: 'name', sub: 'category', body: 'desc', sort: 'supply', where: { status: 'live' },
 *     join: ['worldId'], image: 'world.image', fields: ['supply', 'floorUsd'], open: 'phiegg', art: [...] }
 */
export type Pull = {
  kind: string; n?: number; label?: string; sub?: string; body?: string; sort?: string; dir?: 'asc' | 'desc';
  where?: Record<string, string>; join?: string[]; image?: string; fields?: string[]; open?: string; art?: string[];
  /** The card's action: a form of this app filled in with the record (`{ label, view, param }` → #/view?param=id). */
  act?: { label: string; view: string; param: string };
};
type Row = Record<string, unknown> & { id: string };

const dig = (r: unknown, path?: string): unknown => (path ? path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r) : undefined);
const text = (v: unknown) => (v == null || typeof v === 'object' ? '' : String(v));
const human = (k: string) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()).replace(/ (Usd|Pct)$/, (m) => (m === ' Usd' ? ' (USD)' : ' %'));
const MONEY = /usd|amount|target|price|floor|valuation|raise|ask/i;
/** A field value for a card tag: money fields (by name) read as $1.2M, everything else as its text. */
const fieldText = (k: string, v: unknown) => { const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/,/g, '')); return MONEY.test(k) && Number.isFinite(n) && String(v).trim() !== '' ? '$' + (Math.abs(n) >= 1000 ? Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : n) : text(v); };
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
/** Phiegg's art paths in the data ("assets/worlds/w_aria.png") as references every app can show. */
const artRef = (v: unknown) => { const s = text(v); return !s ? undefined : /^[a-z]+:/.test(s) ? s : 'phiegg:' + s.replace(/^assets\//, ''); };
const SKIP = new Set(['id', 'slug', 'srcId', 'name', 'title', 'label', 'desc', 'description', 'image', 'created_at']);
/** Where a record of a Phiegg kind opens: its page in Phiegg. */
const PHIEGG: Record<string, (id: string) => string> = { pool: (id) => 'pool/' + id, world: (id) => 'world/' + id, club: (id) => 'club/' + id, quest: () => 'quests', event: () => 'events', look: () => 'shop', host: () => 'hosts' };

const cache = new Map<string, Promise<{ total: number; rows: Row[] } | null>>();
const fetchRows = (p: Pull, n = p.n ?? 6) => {
  const q = new URLSearchParams({ kind: p.kind, n: String(n) });
  if (p.sort) q.set('sort', p.sort); if (p.dir) q.set('dir', p.dir);
  if (p.where) q.set('where', Object.entries(p.where).map(([k, v]) => k + ':' + v).join(','));
  if (p.join?.length) q.set('join', p.join.join(','));
  const key = q.toString();
  if (!cache.has(key)) cache.set(key, apiSend<{ total: number; rows: Row[] }>('GET', '/tree/rows?' + key).then((r) => (r.ok ? r.body : null)));
  return cache.get(key)!;
};

/** A pulled record as a card: title, tag, body, art, its plain fields, and where it opens. */
export const itemOf = (p: Pull, r: Row): GridItem => {
  const title = text(dig(r, p.label)) || text(r.name) || text(r.title) || text(r.label) || p.kind;
  const fields = (p.fields ?? Object.keys(r).filter((k) => !SKIP.has(k) && !/Ids?$/.test(k) && typeof r[k] !== 'object').slice(0, 6))
    .map((k) => [human(k), fieldText(k, dig(r, k))] as [string, string]).filter(([, v]) => v);
  const route = PHIEGG[p.kind];
  return {
    id: r.id, title, sub: text(dig(r, p.sub)) || undefined, body: text(dig(r, p.body)) || undefined,
    image: artRef(dig(r, p.image ?? 'image')) ?? (p.art?.length ? p.art[hash(r.id) % p.art.length] : undefined),
    // Clicking the card opens the record here, routed by kind (#/<kind>/<id>); an action button (if any) acts separately.
    kind: p.kind, route: '#/' + p.kind + '/' + encodeURIComponent(r.id),
    fields, ...(p.act ? { action: p.act.label, href: '#/' + p.act.view + '?' + p.act.param + '=' + encodeURIComponent(r.id) }
      : p.open && route ? { app: p.open, href: appUrl(p.open) + '#/' + route(r.id), action: 'Open' } : {}),
  };
};

export async function pullItems(p: Pull): Promise<GridItem[]> { const r = await fetchRows(p); return r ? r.rows.map((x) => itemOf(p, x)) : []; }
export async function pullCount(p: Pull): Promise<number | null> { const r = await fetchRows({ ...p, sort: undefined }, 1); return r ? r.total : null; }

/** Fill every pull in an app document: block items, stat counts and the records under menu entries. */
export async function resolvePulls(d: AppData): Promise<AppData> {
  const block = async (b: Block): Promise<Block> => {
    // A table pull: a row per record, a column per field (the block's cols, or the fields' names).
    if (b.pull && b.kind === 'table') {
      const p = b.pull as Pull; const r = await fetchRows(p); const fields = p.fields ?? [];
      // Each row carries a route to its record sheet (#/<kind>/<id>), so a pulled table is as clickable as a grid.
      return r && r.rows.length && fields.length ? { ...b, cols: b.cols ?? fields.map(human), rows: r.rows.map((x) => fields.map((f) => text(dig(x, f)))), routes: r.rows.map((x) => '#/' + p.kind + '/' + encodeURIComponent(x.id)) } : b;
    }
    if (b.pull) { const items = await pullItems(b.pull as Pull); return items.length ? { ...b, items } : b; }
    if (b.kind === 'stats' && b.items?.some((x: { count?: Pull }) => x.count)) {
      const items = await Promise.all(b.items.map(async (x: { count?: Pull; value?: string }) => {
        if (!x.count) return x; const n = await pullCount(x.count); return n == null ? x : { ...x, value: n.toLocaleString('en-US') };
      }));
      return { ...b, items };
    }
    return b;
  };
  const nav = async (list: NavItem[]): Promise<NavItem[]> => Promise.all(list.map(async (n) => ({
    ...n, ...(n.items ? { items: await nav(n.items) } : {}), ...(n.pull ? { previews: await pullItems(n.pull as Pull) } : {}),
  })));
  const views = Object.fromEntries(await Promise.all(Object.entries(d.views).map(async ([k, v]) => [k, { ...v, blocks: await Promise.all(v.blocks.map(block)) }] as const)));
  return { ...d, nav: await nav(d.nav), views };
}
