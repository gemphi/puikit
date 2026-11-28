// Hosts shared by their people: who is in each, its rule (roles, who holds which, each room's rights, its owner),
// the hosts people make, and invites. What the app's files say of a host is its start (place.mjs, rule.mjs); what its
// people change since is the host's record, kind `hostState` (apart from the public `host` cards the data files
// seed), one for every host anyone changed or made. Invites are
// records of kind `invite`. Both are private (room.mjs). Words and bounds are data/room.json.
//
//   GET    /host/<app>                    the hosts the viewer is in by choice: { in, out, made: [{ id, group, room, owner }] }
//   POST   /host/<app>                    make one: { group, room } (its menu group and rooms, as the apps build them)
//   GET    /host/<app>/<host>             { host (name, rule, what the viewer may do), member, invite (to those who invite) }
//   PATCH  /host/<app>/<host>             one change: { join } | { give: { who, role, on } } | { owner } |
//                                         { allow: { room, verb, role, on } } | { can: { role, verb, on } } | { role } | { paused }
//   DELETE /host/<app>/<host>             its owner takes a host they made away
//   POST   /host/<app>/<host>/invite      { code?, minutes, uses } → { invite }
//   DELETE /host/<app>/<host>/invite/<c>  take an invite back
//   GET    /invite/<app>/<code>           { state: ok | unknown | stopped | over, host?, inside }
//   POST   /invite/<app>/<code>           join the host by it → { host }
import { randomBytes } from 'node:crypto';
import { APP, ROOM_DATA, no } from './room.mjs';

const MOST = ROOM_DATA.most; const INV = ROOM_DATA.invite; const CODE = new RegExp(INV.code);
const HOST = /^[\w.-]{1,64}$/, NAME = /^[\w.-]{1,64}$/;
const text = (x, most) => { const s = String(x ?? '').trim(); return s && s.length <= most ? s : null; };

/** Whether an invite can be used now, and if not why: nobody made it, its host paused them, it ran out. */
const stateOf = (inv, h) => {
  if (!inv || !h) return 'unknown';
  if (h.rec?.paused) return 'stopped';
  return (inv.minutes > 0 && Date.now() > inv.made + inv.minutes * 60000) || (inv.uses > 0 && inv.used >= inv.uses) ? 'over' : 'ok';
};
const card = (h) => ({ id: h.id, label: h.label, kind: h.kind, mark: h.mark, first: h.first, ...(h.kind === 'made' ? { group: h.rec.group, room: h.rec.room, owner: h.rec.owner ?? h.rec.ownerId } : {}) });
const shown = (inv) => ({ code: inv.code, host: inv.host, space: inv.space, made: inv.made, minutes: inv.minutes, uses: inv.uses, used: inv.used, by: inv.ownerId });

export function createHosts(rooms, store) {
  const { guard, rate, save, lock, idOf } = rooms;
  const recId = (h) => idOf('hostState', h.app + '/' + h.id);
  /** Change a host's record, one change after another: `f` gets the record as it is (or a new one) and the rule. */
  const change = (u, h, fields, f) => lock(recId(h), async () => {
    const fresh = await rooms.hostOf(h.app, h.id);
    const doc = { ...(fresh.rec ?? { id: recId(h), app: h.app, host: h.id, label: h.label, ownerId: u.id }) };
    f(doc, rooms.ruleFor(fresh));
    await save('hostState', doc, u, fresh.rec ? 'update' : 'create', fields);
    return rooms.hostOf(h.app, h.id);
  });
  const must = (u, h, verb, code) => { if (!rooms.verbsIn(u, h, '').includes(verb)) no(403, code); };
  const host = async (app, id) => (await rooms.hostOf(app, id)) ?? no(404, 'no_host');
  const add = (list, id) => [...new Set([...(list ?? []), id])];
  const drop = (list, id) => (list ?? []).filter((x) => x !== id);

  /** The hosts someone is in by choice, and those they made or were let into. */
  async function mine(u, app) {
    if (!APP.test(app)) no(404, 'no_host');
    if (!u || u.guest) return { in: [], out: [], made: [] };
    const all = await store.itemsWhere('hostState', 'app', app);
    const made = all.filter((x) => x.made && x.member?.includes(u.id)).map((x) => ({ id: x.host, group: x.group, room: x.room, owner: x.owner ?? x.ownerId }));
    return { in: all.filter((x) => !x.made && x.member?.includes(u.id)).map((x) => x.host), out: all.filter((x) => !x.made && x.left?.includes(u.id)).map((x) => x.host), made };
  }

  /** Make a host: its menu group (headings over rooms) and its rooms, each `<host>-<n>`. Its maker owns it. */
  async function make(u, app, body) {
    guard(u); rate(u); if (!rooms.places(app)) no(404, 'no_host');
    const g = body?.group; const id = String(g?.id ?? ''); const label = text(g?.label, MOST.label);
    const rooms_ = Object.entries(body?.room ?? {}).slice(0, MOST.room + 1);
    const ok = HOST.test(id) && label && rooms_.length && rooms_.length <= MOST.room && rooms_.every(([r, x]) => r.startsWith(id + '-') && NAME.test(r) && text(x?.label, MOST.label));
    if (!ok || rooms.places(app).host.has(id)) no(400, 'bad_host');
    const key = idOf('hostState', app + '/' + id);
    return lock(key, async () => {
      if (await store.getItem('hostState', key)) no(409, 'host_taken');
      const room = Object.fromEntries(rooms_.map(([r, x]) => [r, { label: text(x.label, MOST.label), space: label, ...(x.kind === 'voice' ? { kind: 'voice' } : {}), member: [], message: [] }]));
      const doc = { id: key, app, host: id, label, icon: typeof g.icon === 'string' ? g.icon.slice(0, 40) : null, made: true, ownerId: u.id, member: [u.id], group: g, room };
      await save('hostState', doc, u, 'create', Object.keys(doc));
      return { host: card(await rooms.hostOf(app, id)) };
    });
  }

  /** A host as someone in it reads it: its card, rule and what they may do, its people, and its invites for those
   *  who may make them. */
  async function read(u, h) {
    const inside = rooms.inHost(u, h); const verbs = rooms.verbsIn(u, h, '');
    const invite = verbs.includes('invite') ? (await store.itemsWhere('invite', 'hostKey', h.app + '/' + h.id)).map(shown) : [];
    return { host: { ...card(h), in: inside, paused: !!h.rec?.paused, can: { host: verbs }, ...(inside ? { rule: rooms.ruleFor(h), me: rooms.whoIn(u, h) } : {}) },
      member: inside ? await rooms.peopleOf(h.rec?.member ?? []) : [], invite };
  }

  /** One change to a host, by someone who may make it. */
  async function patch(u, h, body) {
    guard(u); rate(u);
    const b = body ?? {};
    if (typeof b.join === 'boolean') {
      if (h.kind === 'open') return read(u, h);
      if (b.join && h.kind === 'made' && !rooms.editor(u)) no(403, 'no_join');
      if (!b.join && (rooms.ruleFor(h)?.owner === u.id)) no(409, 'owner_stays');
      return read(u, await change(u, h, ['member'], (d) => { d.member = b.join ? add(d.member, u.id) : drop(d.member, u.id); if (h.kind === 'catalogue') d.left = b.join ? drop(d.left, u.id) : add(d.left, u.id); }));
    }
    if (!rooms.inHost(u, h)) no(403, 'not_in');
    if (b.owner !== undefined) {
      const rule = rooms.ruleFor(h); if (!rule || !rooms.whoIn(u, h).includes(rule.owner)) no(403, 'owner');
      if (!NAME.test(String(b.owner))) no(400, 'bad_step');
      return read(u, await change(u, h, ['owner'], (d) => { d.owner = String(b.owner); }));
    }
    must(u, h, 'manage', 'manage');
    if (b.give) {
      const { who, role, on } = b.give; if (!NAME.test(String(who)) || !NAME.test(String(role))) no(400, 'bad_step');
      return read(u, await change(u, h, ['give'], (d, rule) => { const now = rule?.give[who] ?? []; d.give = { ...d.give, [who]: on ? add(now, role) : drop(now, role) }; }));
    }
    if (b.allow) {
      const { room, verb, role, on } = b.allow;
      if (!ROOM_DATA.roomVerb.includes(verb) || !NAME.test(String(room)) || !NAME.test(String(role))) no(400, 'bad_step');
      return read(u, await change(u, h, ['right'], (d, rule) => {
        const now = rule?.room[room]?.[verb] ?? rule?.role.filter((x) => x.can.includes(verb)).map((x) => x.id) ?? [];
        d.right = { ...d.right, [room]: { ...d.right?.[room], [verb]: on ? add(now, role) : drop(now, role) } };
      }));
    }
    if (b.can) {
      const { role, verb, on } = b.can; if (!ROOM_DATA.verb.includes(verb)) no(400, 'bad_step');
      return read(u, await change(u, h, ['role'], (d, rule) => {
        const r = rule?.role.find((x) => x.id === role) ?? no(400, 'bad_step');
        d.role = [...(d.role ?? []).filter((x) => x.id !== r.id), { ...r, can: on ? add(r.can, verb) : drop(r.can, verb) }];
      }));
    }
    if (b.role !== undefined) {
      const label = text(b.role, 40) ?? no(400, 'bad_step');
      return read(u, await change(u, h, ['role'], (d, rule) => {
        if ((rule?.role.length ?? 0) >= MOST.role) no(400, 'bad_step');
        d.role = [...(d.role ?? []), { id: 'r' + Date.now().toString(36), label, can: ROOM_DATA.default }];
      }));
    }
    if (typeof b.paused === 'boolean') return read(u, await change(u, h, ['paused'], (d) => { d.paused = b.paused; }));
    no(400, 'bad_step');
  }

  /** Make an invite to a host: a code by chance or the maker's own, how long it lasts and how many times it may be used. */
  async function invite(u, h, body) {
    guard(u); rate(u); must(u, h, 'invite', 'no_invite');
    const code = String(body?.code ?? '').trim().toLowerCase() || randomBytes(5).toString('hex');
    if (!CODE.test(code)) no(400, 'bad_code');
    const key = idOf('invite', h.app + '/' + code);
    return lock(key, async () => {
      if (await store.getItem('invite', key)) no(409, 'taken');
      const doc = { id: key, app: h.app, code, host: h.id, hostKey: h.app + '/' + h.id, space: h.label, made: Date.now(), ownerId: u.id,
        minutes: Math.max(0, Math.min(INV.minutes, Math.floor(Number(body?.minutes) || 0))), uses: Math.max(0, Math.min(INV.uses, Math.floor(Number(body?.uses) || 0))), used: 0 };
      await save('invite', doc, u, 'create', Object.keys(doc));
      return { invite: shown(doc) };
    });
  }
  /** Take an invite back: its maker, or one who manages the host. */
  async function unInvite(u, h, code) {
    guard(u);
    const key = idOf('invite', h.app + '/' + code); const inv = (await store.getItem('invite', key))?.doc;
    if (!inv || inv.host !== h.id) no(404, 'no_code');
    if (inv.ownerId !== u.id) must(u, h, 'manage', 'manage');
    await store.removeItem('invite', key, { by: u.id }, { action: 'delete', fields: null, byId: u.id, byHandle: u.handle ?? null });
    return { ok: true };
  }
  /** What an invite opens: its host, and whether it can be used now. */
  async function open(u, app, code) {
    if (!APP.test(app) || !CODE.test(String(code).toLowerCase())) return { state: 'unknown' };
    const inv = (await store.getItem('invite', idOf('invite', app + '/' + String(code).toLowerCase())))?.doc;
    const h = inv ? await rooms.hostOf(app, inv.host) : null; const state = stateOf(inv, h);
    return state === 'unknown' ? { state } : { state, host: card(h), inside: rooms.inHost(u, h) };
  }
  /** Join a host by an invite; joining counts one use. */
  async function join(u, app, code) {
    guard(u); rate(u);
    const c = String(code).toLowerCase(); const key = idOf('invite', app + '/' + c);
    return lock(key, async () => {
      const inv = (await store.getItem('invite', key))?.doc; const h = inv ? await rooms.hostOf(app, inv.host) : null;
      const state = stateOf(inv, h); if (state !== 'ok') no(state === 'unknown' ? 404 : 409, state === 'unknown' ? 'no_code' : state);
      if (rooms.inHost(u, h)) return { host: card(h) };
      const now = await change(u, h, ['member'], (d) => { d.member = add(d.member, u.id); if (h.kind === 'catalogue') d.left = drop(d.left, u.id); });
      await save('invite', { ...inv, used: inv.used + 1 }, u, 'update', ['used']);
      return { host: card(now) };
    });
  }
  /** Take away a host one made, with its invites. */
  async function remove(u, h) {
    guard(u); if (h.kind !== 'made' || rooms.ruleFor(h)?.owner !== u.id) no(403, 'owner');
    for (const inv of await store.itemsWhere('invite', 'hostKey', h.app + '/' + h.id)) await store.removeItem('invite', inv.id, { by: u.id }, { action: 'delete', fields: null, byId: u.id, byHandle: u.handle ?? null });
    await store.removeItem('hostState', recId(h), { by: u.id }, { action: 'delete', fields: null, byId: u.id, byHandle: u.handle ?? null });
    return { ok: true };
  }
  return { mine, make, read, patch, invite, unInvite, open, join, remove, host };
}

/** Answer `route` when it is a host's or an invite's; otherwise leave the response open for the next routes. */
export async function hostRoute(route, { hosts, pathname, readBody, req, res, send, u }) {
  let m;
  if ((m = pathname.match(/^\/invite\/([^/]+)\/([^/]+)$/))) {
    if (req.method === 'GET') return send(res, 200, await hosts.open(u, m[1], decodeURIComponent(m[2])));
    if (req.method === 'POST') return send(res, 200, await hosts.join(u, m[1], decodeURIComponent(m[2])));
  }
  if ((m = pathname.match(/^\/host\/([^/]+)$/))) {
    if (req.method === 'GET') return send(res, 200, await hosts.mine(u, m[1]));
    if (req.method === 'POST') return send(res, 201, await hosts.make(u, m[1], (await readBody(req)) || {}));
  }
  if (!(m = pathname.match(/^\/host\/([^/]+)\/([^/]+?)(?:\/invite(?:\/([^/]+))?)?$/))) return;
  const h = await hosts.host(m[1], decodeURIComponent(m[2]));
  const inv = pathname.includes('/invite');
  if (inv && req.method === 'POST' && !m[3]) return send(res, 201, await hosts.invite(u, h, (await readBody(req)) || {}));
  if (inv && req.method === 'DELETE' && m[3]) return send(res, 200, await hosts.unInvite(u, h, decodeURIComponent(m[3]).toLowerCase()));
  if (inv) return;
  if (req.method === 'GET') return send(res, 200, await hosts.read(u, h));
  if (req.method === 'PATCH') return send(res, 200, await hosts.patch(u, h, await readBody(req)));
  if (req.method === 'DELETE') return send(res, 200, await hosts.remove(u, h));
}
