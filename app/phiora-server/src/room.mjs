// Rooms shared by their people: what is said in a room, the marks, pins and votes on its messages, and who may read
// and write there. A room is `<app>/<room>`, as the apps' pages and windows name it. It is one of three:
//  - a room of a host (a host of the app's catalogue, a group of its menu, or one somebody made): its host's people
//    read it, and the host's rule says who sees, writes, calls and pins (rule.mjs);
//  - a direct room between two accounts, `dm-<a>.<b>` (the two ids in order, so both name it alike): those two only;
//  - any other room (a conversation with a person of the files, who is nobody's account): only what its writer wrote.
// Its records (message, mark, direct) are Phiora's like every other, but private: no /tree read serves them, and the
// generic record routes refuse them (server.mjs). Words and bounds are data/room.json.
//
//   GET  /room/<app>/<room>?seen=<stamp>  { key, kind, can, stamp, host?, member?, message, mark, people } — or
//                                         { same, stamp } when nothing changed since that stamp (pages ask often)
//   POST /room/<app>/<room>               { ref, text?, image?, reply?, poll? } → 201 { message }   (write)
//   POST /room/<app>/<room>/mark          { message, icon, on } → { mark }   (see)
//   POST /room/<app>/<room>/pin           { message, on } → { mark }         (pin)
//   POST /room/<app>/<room>/vote          { message, pick: [i] } → { mark }  (see)
//   GET  /direct/<app>                    { direct: [{ room, with, at }] } the direct rooms the viewer is in
//   POST /direct/<app>                    { with: <account id> } → { room, with } the room the two share
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createPlaces, roomsOfGroup } from './place.mjs';
import { can, ruleOf } from './rule.mjs';
import { isEditor } from './records.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOM_DATA = JSON.parse(readFileSync(join(here, '..', 'data', 'room.json'), 'utf8'));
/** The kinds only these routes serve. */
export const PRIVATE = new Set(ROOM_DATA.private);
const W = ROOM_DATA.word; const MOST = ROOM_DATA.most;

export class RoomError extends Error { constructor(status, code) { super(W[code] ?? code); this.status = status; this.code = code; } }
export const no = (status, code) => { throw new RoomError(status, code); };

export const idOf = (kind, s) => createHash('md5').update(kind + ':' + s).digest('hex');
export const APP = /^[\w-]{1,64}$/;
const ROOM = /^[\w.-]{1,64}$/, REF = /^[\w.-]{1,64}$/, ICON = /^[a-z][\w-]{0,31}$/;

/** The direct room two accounts share: both ids in order, so either names it alike. */
export const directRoom = (a, b) => ROOM_DATA.direct.prefix + [a, b].sort().join(ROOM_DATA.direct.join);
const pairOf = (room) => {
  const { prefix, join: by } = ROOM_DATA.direct; if (!room.startsWith(prefix)) return null;
  const two = room.slice(prefix.length).split(by);
  return two.length === 2 && two.every(Boolean) && two[0] < two[1] ? two : null;
};

/** Changes to one record one after another (read, change, write), so two at once never lose one. */
const serial = () => {
  const tail = new Map();
  return (key, f) => {
    const run = (tail.get(key) ?? Promise.resolve()).then(f);
    const done = run.catch(() => {}); tail.set(key, done);
    void done.then(() => { if (tail.get(key) === done) tail.delete(key); });
    return run;
  };
};

/** A poll as it may be posted: a question, two to ten answers, one pick or several, and how long it is open. */
const pollOf = (p) => {
  const answer = Array.isArray(p?.answer) ? p.answer.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
  const question = String(p?.question ?? '').trim();
  if (!question || question.length > MOST.question || answer.length < 2 || answer.length > MOST.answer || answer.some((x) => x.length > MOST.words)) no(400, 'bad_poll');
  const minutes = Math.max(0, Math.min(ROOM_DATA.invite.minutes, Number(p.minutes) || 0));
  return { question, answer, many: !!p.many, made: Date.now(), minutes };
};
/** A message as the apps read it: its id in the room, who said it and when (ms), and what. */
const said = (x) => ({ id: x.ref, by: x.ownerId, at: x.at, ...Object.fromEntries(['text', 'image', 'reply', 'poll'].filter((k) => x[k] != null).map((k) => [k, x[k]])) });

/** Rooms and the hosts they are in, for the routes of rooms, hosts and bonds. */
export function createRooms({ store, appsDir, editors }) {
  const places = createPlaces(appsDir);
  const lock = serial();
  const boot = Date.now(); const stamps = new Map(); const seen = new Map(); const hits = new Map(); let rules = 0;
  const bump = (key) => stamps.set(key, (stamps.get(key) ?? boot) + 1);
  /** A room's stamp: what was said and done in it, what any host's rule became (what one may do changes with it),
   *  and the minute, so people's status and presence are answered afresh at least that often. */
  const stampOf = (key) => [stamps.get(key) ?? boot, rules, Math.floor(Date.now() / 60000)].join('.');
  const editor = (u) => isEditor(u, editors);
  const guard = (u) => { if (!u || u.guest) no(401, 'sign_in'); seen.set(u.id, Date.now()); };
  const rate = (u) => { const now = Date.now(); const h = (hits.get(u.id) ?? []).filter((t) => now - t < 60000); if (h.length >= ROOM_DATA.write) no(429, 'rate'); h.push(now); hits.set(u.id, h); };
  const save = (kind, doc, u, action, fields) => {
    if (Buffer.byteLength(JSON.stringify(doc)) > ROOM_DATA.bytes) no(413, 'too_long');
    if (kind === 'hostState') rules++;
    return store.saveItem(kind, doc.id, doc, { origin: 'api', owner: doc.ownerId ?? u.id, by: u.id }, { action, fields, byId: u.id, byHandle: u.handle ?? null });
  };

  /** A host by its id: what the app's files say of it with its record's changes, or one somebody made. */
  async function hostOf(app, id) {
    const place = places(app); if (!place || typeof id !== 'string') return null;
    const rec = (await store.getItem('hostState', idOf('hostState', app + '/' + id)))?.doc ?? null;
    const file = place.host.get(id);
    if (!file && !rec?.made) return null;
    return { app, id, label: file?.label ?? rec.label, kind: file?.kind ?? 'made', rec, place, mark: file?.mark ?? null, first: file?.first ?? roomsOfGroup(rec?.group)[0] ?? null };
  }
  /** Whether someone is in a host: everyone signed in in the app's own; the catalogue's from the start (the app's
   *  `joined`) or once joined, until they leave; one made, once let in by its owner or an invite. */
  const inHost = (u, h) => {
    if (!u || u.guest) return false; if (editor(u)) return true;
    const rec = h.rec ?? {};
    return h.kind === 'open' || (rec.member ?? []).includes(u.id) || (h.kind === 'catalogue' && h.place.joined.has(h.id) && !(rec.left ?? []).includes(u.id));
  };
  /** The names someone answers to in a host: their account, and in the files' hosts the viewer the files speak of. */
  const whoIn = (u, h) => (h.kind === 'made' || !h.place.me ? [u.id] : [u.id, h.place.me]);
  const ruleFor = (h) => ruleOf(h.place.role, h.label, h.rec, [{ id: 'everyone', label: 'Everyone', can: ROOM_DATA.default }]);
  /** What someone may do in a room of a host ('' for the host as a whole). */
  const verbsIn = (u, h, room) => (editor(u) ? ROOM_DATA.verb : inHost(u, h) ? ROOM_DATA.verb.filter((v) => can(ruleFor(h), whoIn(u, h), room, v)) : []);

  /** What a room is (a host's, a direct one, or its writer's alone), by its app and name. */
  async function roomOf(app, room) {
    if (!APP.test(app) || !ROOM.test(room) || !places(app)) no(404, 'bad_room');
    const place = places(app); const key = app + '/' + room; const pair = pairOf(room);
    if (pair) return { app, room, key, kind: 'direct', member: pair };
    const id = place.fileDirect.has(room) ? null : place.roomHost.get(room) ?? (room.includes('-') ? room.slice(0, room.lastIndexOf('-')) : null);
    const host = id ? await hostOf(app, id) : null;
    if (host && (host.kind !== 'made' || host.rec.room?.[room])) return { app, room, key, kind: 'host', host };
    return { app, room, key, kind: 'own' };
  }
  /** What someone may do in a room: see, write, call, pin. */
  const verbsOf = (u, r) => {
    if (!u || u.guest) return [];
    if (r.kind === 'direct') return r.member.includes(u.id) || editor(u) ? ROOM_DATA.roomVerb : [];
    if (r.kind === 'own') return ROOM_DATA.roomVerb;
    return verbsIn(u, r.host, r.room).filter((v) => ROOM_DATA.roomVerb.includes(v));
  };

  /** Someone as others see them: their name and handle, and how they show by their status (here, away, busy);
   *  unseen, and anyone who has not asked Phiora anything lately, show as off. Nobody for a guest. */
  async function personOf(id) {
    const x = typeof id === 'string' ? await store.user(id) : null; if (!x || x.guest) return null;
    const st = x.docs?.['me-status'] ?? {};
    const about = Date.now() - (seen.get(id) ?? 0) < ROOM_DATA.here * 1000;
    const words = st.words && (!st.until || st.until > Date.now()) ? { state: st.words } : {};
    return { id, name: x.name ?? '', handle: x.handle ?? null, presence: st.shown === 'unseen' || !about ? 'off' : st.shown ?? 'here', ...words };
  }
  const peopleOf = async (ids) => (await Promise.all([...new Set(ids)].filter(Boolean).slice(0, MOST.people).map(personOf))).filter(Boolean);

  /** A message's marks, pin and votes as one person reads them: each mark with how many gave it and whether they
   *  did, each answer's votes and their own picks. In a room only its writer reads, only their own count. */
  const markOf = (u, m, alone) => {
    const mark = Object.fromEntries(Object.entries(m.mark ?? {}).map(([icon, ids]) => [icon, { n: alone ? Number(ids.includes(u.id)) : ids.length, mine: ids.includes(u.id) }]));
    const count = []; for (const [who, picks] of Object.entries(m.vote ?? {})) if (!alone || who === u.id) for (const i of picks) count[i] = (count[i] ?? 0) + 1;
    return { ...(m.pin != null ? { pin: m.pin } : {}), mark, vote: { count: Array.from(count, (n) => n ?? 0), mine: m.vote?.[u.id] ?? [] } };
  };
  /** The host a room is in, as someone in it reads it: its name, its rule and what they may do there. */
  const hostCard = (u, h, room) => {
    const inside = inHost(u, h);
    return { id: h.id, label: h.label, kind: h.kind, in: inside, paused: !!h.rec?.paused,
      can: { host: verbsIn(u, h, ''), room: verbsIn(u, h, room) }, ...(inside ? { rule: ruleFor(h), me: whoIn(u, h) } : {}) };
  };

  /** A room as someone reads it: what they may do, the latest messages, the marks on them, and the people. */
  async function read(u, r, last) {
    if (u && !u.guest) seen.set(u.id, Date.now());
    const stamp = stampOf(r.key); if (last && last === stamp) return { same: true, stamp };
    const may = verbsOf(u, r); const shown = may.includes('see'); const alone = r.kind === 'own';
    const message = (shown ? await store.itemsWhere('message', 'room', r.key) : []).filter((x) => !alone || x.ownerId === u.id).sort((a, b) => a.at - b.at).slice(-MOST.message);
    const marks = shown ? await store.itemsWhere('mark', 'room', r.key) : [];
    return { key: r.key, kind: r.kind, can: may, stamp,
      ...(r.kind === 'host' ? { host: hostCard(u, r.host, r.room) } : {}), ...(r.kind === 'direct' ? { member: r.member } : {}),
      message: message.map(said), mark: Object.fromEntries(marks.map((m) => [m.message, markOf(u, m, alone)])),
      people: shown ? await peopleOf([...message.map((x) => x.ownerId), ...(r.member ?? [])]) : [] };
  }

  /** Say something in a room: words, pictures, a poll, answering a message. The same id again is the same message. */
  async function write(u, r, body) {
    guard(u); rate(u);
    if (!verbsOf(u, r).includes('write')) no(403, 'read_only');
    const ref = String(body?.ref ?? ''); if (!REF.test(ref)) no(400, 'bad_ref');
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (text.length > MOST.text) no(413, 'too_long');
    const image = Array.isArray(body.image) ? body.image.filter((x) => typeof x === 'string' && x.length <= 512).slice(0, MOST.image) : [];
    const poll = body.poll ? pollOf(body.poll) : null;
    if (!text && !image.length && !poll) no(400, 'empty');
    const reply = typeof body.reply === 'string' && REF.test(body.reply) ? body.reply : null;
    const id = idOf('message', r.key + ':' + ref);
    return lock(id, async () => {
      const had = await store.getItem('message', id);
      if (had) return had.doc.ownerId === u.id ? said(had.doc) : no(409, 'bad_ref');
      const doc = { id, ref, app: r.app, room: r.key, ownerId: u.id, byName: u.name ?? '', byHandle: u.handle ?? null, at: Date.now(),
        ...(text ? { text } : {}), ...(image.length ? { image } : {}), ...(reply ? { reply } : {}), ...(poll ? { poll } : {}) };
      await save('message', doc, u, 'create', Object.keys(doc));
      if (r.kind === 'direct') await meet(r, u, doc.at);
      bump(r.key); return said(doc);
    });
  }
  /** A direct room is kept once something is said in it, so each of the two finds it among their direct rooms. */
  const meet = (r, u, at) => lock(idOf('direct', r.key), async () => {
    const had = (await store.getItem('direct', idOf('direct', r.key)))?.doc;
    await save('direct', { ...(had ?? { id: idOf('direct', r.key), app: r.app, room: r.key, ownerId: u.id, member: r.member }), at }, u, had ? 'update' : 'create', ['at']);
  });

  /** Give a message a mark or take it back, pin or unpin it, or vote in its poll: one record a message, shared. */
  async function mark(u, r, body, what) {
    guard(u); rate(u);
    if (!verbsOf(u, r).includes(what === 'pin' ? 'pin' : 'see')) no(403, what === 'pin' ? 'no_pin' : 'unseen');
    const message = String(body?.message ?? ''); if (!REF.test(message)) no(400, 'no_message');
    const icon = String(body?.icon ?? '');
    if (what === 'mark' && !ICON.test(icon)) no(400, 'bad_icon');
    const id = idOf('mark', r.key + ':' + message);
    return lock(id, async () => {
      const had = (await store.getItem('mark', id))?.doc;
      const doc = { ...(had ?? { id, app: r.app, room: r.key, message, ownerId: u.id }), mark: { ...had?.mark }, vote: { ...had?.vote } };
      switch (what) {
        case 'mark': { const ids = new Set(doc.mark[icon] ?? []); if (body.on) ids.add(u.id); else ids.delete(u.id); if (ids.size) doc.mark[icon] = [...ids]; else delete doc.mark[icon]; break; }
        case 'pin': doc.pin = !!body.on; doc.pinBy = u.id; break;
        default: { const picks = [...new Set((Array.isArray(body.pick) ? body.pick : []).map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < MOST.answer))];
          if (picks.length) doc.vote[u.id] = picks; else delete doc.vote[u.id]; }
      }
      await save('mark', doc, u, had ? 'update' : 'create', [what]);
      bump(r.key); return markOf(u, doc, r.kind === 'own');
    });
  }

  /** The direct rooms someone is in, the latest first, with who each is with. */
  async function directs(u, app) {
    guard(u); if (!APP.test(app)) no(404, 'bad_room');
    const mine = (await store.itemsWhere('direct', 'app', app)).filter((x) => x.member?.includes(u.id)).sort((a, b) => b.at - a.at);
    return { direct: (await Promise.all(mine.map(async (x) => ({ room: x.room.slice(app.length + 1), with: await personOf(x.member.find((m) => m !== u.id)), at: x.at })))).filter((x) => x.with) };
  }
  /** The direct room the viewer shares with another account. */
  async function direct(u, app, other) {
    guard(u); if (!APP.test(app) || !places(app)) no(404, 'bad_room');
    const them = other !== u.id ? await personOf(other) : null; if (!them) no(400, 'bad_bond');
    return { room: directRoom(u.id, other), with: them };
  }

  return { places, lock, save, guard, rate, editor, hostOf, inHost, whoIn, ruleFor, verbsIn, roomOf, read, write, mark, directs, direct, personOf, peopleOf, bump, idOf };
}

/** Answer `route` when it is a room's; otherwise leave the response open for the next routes. */
export async function roomRoute(route, { rooms, pathname, readBody, req, res, searchParams, send, u }) {
  let m;
  if ((m = pathname.match(/^\/direct\/([^/]+)$/))) {
    if (req.method === 'GET') return send(res, 200, await rooms.directs(u, m[1]));
    if (req.method === 'POST') return send(res, 200, await rooms.direct(u, m[1], String(((await readBody(req)) || {}).with ?? '')));
  }
  if (!(m = pathname.match(/^\/room\/([^/]+)\/([^/]+?)(?:\/(mark|pin|vote))?$/))) return;
  const r = await rooms.roomOf(m[1], m[2]);
  if (req.method === 'GET' && !m[3]) return send(res, 200, await rooms.read(u, r, searchParams.get('seen')));
  if (req.method === 'POST' && !m[3]) return send(res, 201, { message: await rooms.write(u, r, (await readBody(req)) || {}) });
  if (req.method === 'POST') return send(res, 200, { mark: await rooms.mark(u, r, (await readBody(req)) || {}, m[3]) });
}
