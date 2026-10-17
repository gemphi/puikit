import { createStore } from '@pui/store';
import { D, FLAGSHIP_ID, agentOf, clubOf, greetingOf, person, poolOf, postById, site, storySets, t } from '../lib/data';
import { poolStory } from '../lib/market';
import { reply, type AgentResult } from '../lib/agent';
import { chat as modelChat, hasApi, persisted } from '@phi-kit/api';
import { liveCreate, liveRemove } from '../lib/live';
import type { Shot } from '../types/phiegg';
import type { AgentChatMessage, Comment, ID, Nest, NestKind, NestMessage, StoryFrame } from '../types/phiegg';
import { record } from '../lib/activity';
import { ONBOARDING } from '../lib/onboarding';
/** Which page param a record id in the address fills: #/pool/<id>, #/club/<id>, #/world/<id>… One map for the
    address, agent hrefs and navigation, so every record has a link. */
const ID_PARAM: Record<string, string> = { world: 'worldId', show: 'showId', club: 'clubId', city: 'cityId', shop: 'storeId', pool: 'poolId', profile: 'profileId', collection: 'nestId' };
const parseRoute = (hash: string): { tab: string; params: Record<string, string> } => {
  const [tab = '', id] = hash.replace(/^#\/?/, '').split('/');
  return { tab, params: id && ID_PARAM[tab] ? { [ID_PARAM[tab]]: decodeURIComponent(id) } : {} };
};
const START = parseRoute(typeof location !== 'undefined' ? location.hash : '');
const startTab = () => START.tab || (ONBOARDING.get().done ? 'feed' : 'welcome');
/** Keep the address on the page you are on (replaceState: no reload, no hashchange loop). */
const writeRoute = (tab: string, state: Record<string, unknown>) => {
  if (typeof history === 'undefined') return;
  const key = ID_PARAM[tab]; const id = key ? state[key] : undefined;
  const next = '#/' + tab + (typeof id === 'string' && id ? '/' + encodeURIComponent(id) : '');
  if (location.hash !== next) history.replaceState(null, '', next);
};

/** Anything the details column can show: a person, host, cast, club, world, look… (the relations kinds). */
export type DetailRef = { kind: string; id: ID };
export type Frame = StoryFrame & { set: string; setK: number; i: number };
export type Overlay =
  | { kind: 'none' }
  | { kind: 'story'; uid: ID; frames: Frame[]; idx: number; paused: boolean }
  | { kind: 'shot'; postId: ID; slide: number; auto: boolean }
  /** The agent chat sheet: agents · chat · details. `detail` is the right column's back stack (last = shown). */
  | { kind: 'chat'; agentId: ID; detail: DetailRef[] }
  | { kind: 'nest'; hostId: ID; parentId: ID | null; nestKind: NestKind }
  | { kind: 'person'; id: ID }
  | { kind: 'editProfile' }
  /** Create a record of any declared kind: the form comes from data/kinds.json. */
  | { kind: 'create'; createKind: string; initial?: Record<string, unknown>; back?: { recordKind: string; id: ID } }
  /** Any record of any declared kind: its fields as declared, links resolved, edit and remove. */
  | { kind: 'record'; recordKind: string; id: ID }
  | { kind: 'editClub'; id: ID }
  | { kind: 'signin' }
  | { kind: 'look'; id: ID }
  | { kind: 'cart' }
  | { kind: 'series'; id: ID }
  | { kind: 'asset'; id: ID }
  | { kind: 'place'; id: ID }
  /** Fungible swap: give an item you hold (`giveId`), pick what to take. */
  | { kind: 'swap'; giveId: ID; getId?: ID }
  /** A pool stat and the quest it links to. */
  | { kind: 'stat'; poolId: ID; metricId: string }
  /** A "see all" list (drops, clubs, events…) in the shared browse sheet. */
  | { kind: 'list'; list: string };
export interface Appearance { radius: string; gradient: string; motion: string; sidebar: string; content: string; opacity: string }
type Flags = Record<string, boolean>;
export type FlagKey = 'liked' | 'saved' | 'follow' | 'rsvp';
export interface Params { worldId?: ID; showId?: ID; clubId?: ID; profileId?: ID; cityId?: ID; storeId?: ID; poolId?: ID; nestId?: ID; feedKind?: string }

export interface PhieggState extends Required<Params> {
  tab: string; liked: Flags; saved: Flags; follow: Flags; rsvp: Flags;
  /** Bumped when lib/heavy.ts or lib/live.ts lands new data, so open pages re-render over the fresh indexes. */
  dataRev: number;
  nests: Nest[]; nestMsgs: Record<ID, NestMessage[]>; comments: Record<ID, Comment[]>; chats: Record<ID, AgentChatMessage[]>;
  overlay: Overlay; toast: string | null; rail: string; searchQ: string; appearance: Appearance; view: { mode: 'tile' | 'list' | 'grid'; cols: number }; setView: (v: { mode: 'tile' | 'list' | 'grid'; cols: number }) => void;
  setRail: (r: string) => void; setAppearance: (k: keyof Appearance, v: string) => void; openPerson: (id: ID) => void; openSignIn: () => void; openEditProfile: () => void; openEditClub: (id: ID) => void; openCreate: (createKind: string, initial?: Record<string, unknown>, back?: { recordKind: string; id: ID }) => void; openRecord: (recordKind: string, id: ID) => void;
  /** Delete your own shot from the one database (and the feed). */
  removeShot: (id: ID) => void;
  /** Share a shot from the composer: a real record in the one database when Phiora is on. */
  postShot: (text: string) => void;
  openLook: (id: ID) => void; openAsset: (id: ID) => void; openSwap: (giveId: ID, getId?: ID) => void; openStat: (poolId: ID, metricId: string) => void; openList: (list: string) => void; openCart: () => void; openSeries: (id: ID) => void; openPlace: (id: ID) => void;
  hist: { tab: string; p: Params }[]; back: () => void;
  go: (tab: string, p?: Params) => void; toggle: (k: FlagKey, id: ID) => void; flash: (m: string) => void; close: () => void;
  openPost: (id: ID) => void; slide: (d: number, abs?: boolean) => void; setAuto: (a: boolean) => void;
  openStory: (uid: ID, from?: number) => void; storyStep: (d: number) => void; pause: (p: boolean) => void;
  openChat: (id: ID, text?: string, details?: boolean) => void;
  /** Push a record onto the chat sheet's details column (opens the sheet if needed). */
  openDetails: (ref: DetailRef) => void; detailBack: () => void; closeDetails: () => void; sendChat: (id: ID, text: string) => void; comment: (postId: ID, text: string) => void;
  nestMsg: (nestId: ID, text: string) => void; openNest: (hostId: ID, parentId: ID | null, k: NestKind) => void;
  createNest: (name: string, k: NestKind) => void; summon: (agentId: ID) => void;
}

/** Likes, saves, follows, RSVPs and agent chats, Phiora `/state/flags` + `/state/chats` when VITE_PHI_API is set, localStorage otherwise. */
type FlagSet = Record<FlagKey, Flags>;
const FLAGS = persisted<FlagSet>('flags', { liked: {}, saved: {}, follow: {}, rsvp: {} });
const CHATS = persisted<Record<ID, AgentChatMessage[]>>('chats', {});
/** Appearance (radius, gradient, motion, shades, opacity) follows the user across reloads and devices. */
const APPEARANCE = persisted<Appearance>('appearance', { radius: site.appearance.defaults.radius, gradient: site.appearance.defaults.gradient, motion: site.appearance.defaults.motion,
  sidebar: site.appearance.defaults.sidebar, content: site.appearance.defaults.content, opacity: site.appearance.defaults.opacity });

/** Agents hand back web-style hrefs ("/world?id=…"); map them onto tabs. */
const hrefToNav = (href: string): [string, Params] => {
  const [path, q] = href.split('?id=');
  const tab = path.replace('/', '');
  return [tab, q ? { [ID_PARAM[tab] ?? 'profileId']: q } : {}];
};

export const phieggStore = createStore<PhieggState>((set, get) => ({
  // The public home page is where a first visit lands; `#tab` in the address opens a page directly.
  tab: startTab(), dataRev: 0, worldId: D.core.worlds[0].id, showId: D.shows.shows[0]?.id ?? '', clubId: D.club.clubId, profileId: D.profile.userId, cityId: D.core.worlds[0].cities[0].id, storeId: FLAGSHIP_ID, poolId: D.pools.pools[0].id, nestId: '', ...START.params,
  ...FLAGS.get(), nests: D.hosts.nests.slice(), nestMsgs: { ...D.hosts.messages }, comments: {}, chats: CHATS.get(),
  overlay: { kind: 'none' }, toast: null, rail: 'home', searchQ: '', feedKind: 'all',
  appearance: APPEARANCE.get(),
  view: { mode: 'grid', cols: 4 }, setView: (view) => set({ view }),
  setRail: (rail) => set({ rail }),
  setAppearance: (k, v) => set({ appearance: { ...get().appearance, [k]: v } }),
  // Agents open in the chat sheet with their details beside the chat; people open their profile drawer.
  openPerson: (id) => (agentOf(id) ? get().openChat(id, undefined, true) : set({ overlay: { kind: 'person', id } })),
  openLook: (id) => { record('view', id, { refKind: 'look' }); set({ overlay: { kind: 'look', id } }); },
  openSwap: (giveId, getId) => set({ overlay: { kind: 'swap', giveId, getId } }),
  openStat: (poolId, metricId) => set({ overlay: { kind: 'stat', poolId, metricId } }),
  openList: (list) => set({ overlay: { kind: 'list', list } }),
  openCart: () => set({ overlay: { kind: 'cart' } }),
  openSignIn: () => set({ overlay: { kind: 'signin' } }),
  openEditProfile: () => set({ overlay: { kind: 'editProfile' } }),
  openCreate: (createKind, initial, back) => set({ overlay: { kind: 'create', createKind, initial, back } }),
  openRecord: (recordKind, id) => set({ overlay: { kind: 'record', recordKind, id } }),
  openEditClub: (id) => set({ overlay: { kind: 'editClub', id } }),
  removeShot: (id) => {
    const done = () => { set({ overlay: { kind: 'none' }, dataRev: Date.now() }); get().flash(t('shotRemoved')); };
    if (!hasApi) { const i = D.feed.shots.findIndex((x) => x.id === id); if (i >= 0) D.feed.shots.splice(i, 1); done(); return; }
    void liveRemove('shot', id).then((r) => {
      if (r.ok) done();
      else if (r.status === 401) set({ overlay: { kind: 'signin' } });
      else get().flash(r.message);
    });
  },
  postShot: (text) => { if (!text.trim()) return;
    const me = person(D.core.currentUserId); const clubId = me.clubIds[0] ?? null;
    const fields = { title: text.trim().split(/\s+/).slice(0, 6).join(' '), authorId: me.id, clubId, worldId: clubOf(clubId)?.worldIds?.[0] ?? null,
      media: { kind: 'image', tone: me.tone, ratio: '4/5', title: text.trim().split(/\s+/).slice(0, 4).join(' ') },
      caption: text.trim(), likes: 0, comments: 0, reshares: 0, createdAt: new Date().toISOString(), tags: [], lookItems: [] };
    const lead = (shot: Shot) => { const i = D.feed.shots.indexOf(shot); if (i > 0) { D.feed.shots.splice(i, 1); D.feed.shots.unshift(shot); } };
    if (hasApi) {
      void liveCreate('shot', fields).then((r) => {
        if (r.ok) { lead(r.item as unknown as Shot); set({ dataRev: Date.now() }); get().flash(t('shared')); }
        else if (r.status === 401) set({ overlay: { kind: 'signin' } });
        else get().flash(r.message);
      }); return; }
    const shot = { id: 's_' + Date.now(), ...fields } as unknown as Shot;
    D.feed.shots.unshift(shot); set({ dataRev: Date.now() }); get().flash(t('shared')); },
  openSeries: (id) => set({ overlay: { kind: 'series', id } }),
  openAsset: (id) => { record('view', id, { refKind: 'asset' }); set({ overlay: { kind: 'asset', id } }); },
  openPlace: (id) => set({ overlay: { kind: 'place', id } }),
  hist: [],
  go: (tab, p = {}) => { const g = get(); const hist = [...g.hist, { tab: g.tab, p: { worldId: g.worldId, showId: g.showId, clubId: g.clubId, profileId: g.profileId, cityId: g.cityId, storeId: g.storeId, poolId: g.poolId, nestId: g.nestId, feedKind: g.feedKind } }].slice(-40);
    set({ tab, ...p, hist, overlay: { kind: 'none' } } as Partial<PhieggState>); writeRoute(tab, get() as unknown as Record<string, unknown>); },
  back: () => { const hist = get().hist.slice(); const prev = hist.pop(); if (prev) { set({ tab: prev.tab, ...prev.p, hist, overlay: { kind: 'none' } } as Partial<PhieggState>); writeRoute(prev.tab, get() as unknown as Record<string, unknown>); } },
  toggle: (k, id) => { const on = !get()[k][id]; record((({ liked: ['like', 'unlike'], saved: ['save', 'unsave'], follow: ['follow', 'unfollow'], rsvp: ['rsvp', 'unrsvp'] } as const)[k])[on ? 0 : 1], id);
    set({ [k]: { ...get()[k], [id]: on } } as Partial<PhieggState>); },
  flash: (toast) => { set({ toast }); setTimeout(() => get().toast === toast && set({ toast: null }), site.autoplay.toastMs); },
  close: () => set({ overlay: { kind: 'none' } }),
  openPost: (postId) => { record('open', postId, { refKind: 'post' }); set({ overlay: { kind: 'shot', postId, slide: 0, auto: true } }); },
  slide: (d, abs = false) => { const o = get().overlay; if (o.kind !== 'shot') return;
    const n = postById(o.postId)?.slides.length ?? 1; set({ overlay: { ...o, slide: abs ? d : (o.slide + d + n) % n } }); },
  setAuto: (auto) => { const o = get().overlay; if (o.kind === 'shot') set({ overlay: { ...o, auto } }); },
  openStory: (uid, from = 0) => {
    const pool = poolOf(uid);
    const frames = (pool ? poolStory(pool) : storySets(uid)).slice(from).flatMap((h, k) => h.frames.map((f, i) => ({ ...f, set: h.label, setK: k, i })));
    if (frames.length) set({ overlay: { kind: 'story', uid, frames, idx: 0, paused: false } }); else get().flash(t('noMoments'));
  },
  storyStep: (d) => { const o = get().overlay; if (o.kind !== 'story') return; const idx = o.idx + d;
    set({ overlay: idx >= o.frames.length ? { kind: 'none' } : { ...o, idx: Math.max(0, idx) } }); },
  pause: (paused) => { const o = get().overlay; if (o.kind === 'story') set({ overlay: { ...o, paused } }); },
  openChat: (agentId, text, details) => {
    const chats = get().chats; const o = get().overlay;
    const detail = details ? [{ kind: 'person', id: agentId }] : o.kind === 'chat' && o.agentId === agentId ? o.detail : [];
    set({ overlay: { kind: 'chat', agentId, detail }, chats: chats[agentId] ? chats : { ...chats, [agentId]: [{ role: 'agent', text: (() => { const a = agentOf(agentId); return a ? greetingOf(a) : ''; })() }] } });
    if (text) get().sendChat(agentId, text);
  },
  openDetails: (ref) => {
    const o = get().overlay;
    if (o.kind === 'chat') { const top = o.detail[o.detail.length - 1]; if (top?.kind === ref.kind && top.id === ref.id) return; set({ overlay: { ...o, detail: [...o.detail, ref] } }); return; }
    const recent = Object.keys(get().chats)[0] ?? D.agents.agents[0].id;
    get().openChat(recent); const o2 = get().overlay; if (o2.kind === 'chat') set({ overlay: { ...o2, detail: [ref] } });
  },
  detailBack: () => { const o = get().overlay; if (o.kind === 'chat') set({ overlay: { ...o, detail: o.detail.slice(0, -1) } }); },
  closeDetails: () => { const o = get().overlay; if (o.kind === 'chat') set({ overlay: { ...o, detail: [] } }); },
  sendChat: (agentId, text) => {
    const ag = agentOf(agentId); if (!ag || !text.trim()) return; record('chat', agentId, { refKind: 'agent', note: text.slice(0, 120) });
    const apply = (r: AgentResult) => {
      const s = get();
      set({ chats: { ...s.chats, [agentId]: [...(s.chats[agentId] ?? []), ...r.msgs] }, rsvp: r.rsvp ? { ...s.rsvp, [r.rsvp]: true } : s.rsvp });
      if (r.href) { const [tab, p] = hrefToNav(r.href); set({ tab, ...p } as Partial<PhieggState>); }
    };
    const s0 = get(); const history = [...(s0.chats[agentId] ?? []), { role: 'user', text } as AgentChatMessage];
    set({ chats: { ...s0.chats, [agentId]: history } });
    if (!hasApi) { apply(reply(ag, text)); return; }
    // Phiora's model proxy answers in persona; the offline brain covers errors and an unset API.
    const turns = history.flatMap((m) => ('text' in m ? [{ role: m.role === 'user' ? 'user' as const : 'assistant' as const, text: m.text }] : []));
    void modelChat('phiegg', agentId, turns).then((r) => apply(r ? { msgs: [{ role: 'agent', text: r.text }], href: r.href, rsvp: r.rsvp } : reply(ag, text)));
  },
  comment: (postId, text) => {
    if (!text.trim()) return; record('comment', postId, { refKind: 'post', note: text.slice(0, 120) }); const post = postById(postId); const ag = post && agentOf(post.authorId); const now = Date.now();
    const list: Comment[] = [...(get().comments[postId] ?? []), { id: postId + '_m' + now, authorId: D.core.currentUserId, text, likes: 0, at: t('now') }];
    if (ag) list.push({ id: postId + '_a' + now, authorId: ag.id, text: ag.commentFallback, likes: 0, at: t('now') });
    set({ comments: { ...get().comments, [postId]: list } });
  },
  nestMsg: (nestId, text) => { if (!text.trim()) return; const m = get().nestMsgs;
    set({ nestMsgs: { ...m, [nestId]: [...(m[nestId] ?? []), { id: nestId + '_' + Date.now(), authorId: D.core.currentUserId, at: t('now'), text }] } }); },
  openNest: (hostId, parentId, nestKind) => set({ overlay: { kind: 'nest', hostId, parentId, nestKind } }),
  createNest: (name, nestKind) => { const o = get().overlay; if (o.kind !== 'nest' || !name.trim()) return;
    const fields = { hostId: o.hostId, parentId: o.parentId, kind: nestKind, name, topic: t('nestedByYou', { kind: nestKind }), unread: 0 };
    if (hasApi) { // the one database makes the record (md5 id, slug, owner); the row lands locally via lib/live
      void liveCreate('nest', fields).then((r) => {
        if (r.ok) { set({ nests: [...get().nests, r.item as unknown as Nest], overlay: { kind: 'none' }, dataRev: Date.now() }); get().flash(t('nested', { kind: nestKind, name })); }
        else if (r.status === 401) set({ overlay: { kind: 'signin' } });
        else get().flash(r.message);
      }); return; }
    const n: Nest = { id: 'n_' + Date.now(), ...fields } as Nest;
    set({ nests: [...get().nests, n], overlay: { kind: 'none' } }); get().flash(t('nested', { kind: nestKind, name })); },
  summon: (agentId) => { const ag = agentOf(agentId); const host = D.hosts.hosts[0]; const nest = get().nests.find((n) => n.hostId === host.id && !n.parentId);
    if (!ag || !nest) return; get().nestMsg(nest.id, ag.summonLine); get().flash(t('summoned', { name: ag.name, host: host.name, nest: nest.name })); },
}));

// Keep the persisted documents and the store in step (both directions; reference checks stop loops).
phieggStore.subscribe((n, o) => {
  const f = FLAGS.get();
  if ((n.liked !== o.liked || n.saved !== o.saved || n.follow !== o.follow || n.rsvp !== o.rsvp) && (n.liked !== f.liked || n.saved !== f.saved || n.follow !== f.follow || n.rsvp !== f.rsvp)) FLAGS.set({ liked: n.liked, saved: n.saved, follow: n.follow, rsvp: n.rsvp });
  if (n.chats !== o.chats && n.chats !== CHATS.get()) CHATS.set(n.chats);
  if (n.appearance !== o.appearance && n.appearance !== APPEARANCE.get()) APPEARANCE.set(n.appearance);
});
FLAGS.subscribe(() => { const f = FLAGS.get(), s = phieggStore.getState(); if (f.liked !== s.liked || f.saved !== s.saved || f.follow !== s.follow || f.rsvp !== s.rsvp) phieggStore.setState({ ...f }); });
CHATS.subscribe(() => { const c = CHATS.get(); if (c !== phieggStore.getState().chats) phieggStore.setState({ chats: c }); });
APPEARANCE.subscribe(() => { const a = APPEARANCE.get(); if (a !== phieggStore.getState().appearance) phieggStore.setState({ appearance: a }); });

// A link typed or pasted into the address of an open page navigates too (replaceState above never fires this).
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => {
  const r = parseRoute(location.hash); const g = phieggStore.getState();
  if (r.tab && (r.tab !== g.tab || Object.entries(r.params).some(([k, v]) => (g as unknown as Record<string, unknown>)[k] !== v))) g.go(r.tab, r.params as never);
});
