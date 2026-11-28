// Friends between accounts, and finding the people of an app. Two accounts stand one of four ways: friends, one
// asked the other, or nothing; a request is a record of kind `bond` that the one asked answers (private, room.mjs).
// A person of the app's files is nobody's account, so a request to them stays the viewer's own (the apps keep it).
//
//   GET /bond/<app>             { bond: [{ id, name, handle, presence, state?, stand: with | sent | asked }] }
//   PUT /bond/<app>/<id>        { to: sent | with | none } one step from where the two stand → { stand }
//   GET /people/<app>?find=x    { person: [...] } the account whose handle that is (with or without @)
//   GET /people/<app>?id=a,b    { person: [...] } those accounts, as others see them
import { APP, ROOM_DATA, no } from './room.mjs';

/** How the viewer stands with the other by a request: friends, the viewer asked, the other asked. */
const standOf = (b, me) => (!b ? 'none' : b.state === 'with' ? 'with' : b.from === me ? 'sent' : 'asked');
/** Where one press leads from each stand. */
const STEP = { none: ['sent'], sent: ['none'], asked: ['with', 'none'], with: ['none'] };

export function createBonds(rooms, store) {
  const { guard, rate, lock, save, idOf, personOf, peopleOf } = rooms;
  const keyOf = (app, a, b) => idOf('bond', app + '/' + [a, b].sort().join('/'));

  async function list(u, app) {
    guard(u); if (!APP.test(app)) no(404, 'bad_room');
    const mine = (await store.itemsWhere('bond', 'app', app)).filter((x) => x.member?.includes(u.id));
    const out = await Promise.all(mine.map(async (x) => { const p = await personOf(x.member.find((m) => m !== u.id)); return p && { ...p, stand: standOf(x, u.id) }; }));
    return { bond: out.filter(Boolean) };
  }
  async function step(u, app, other, to) {
    guard(u); rate(u); if (!APP.test(app)) no(404, 'bad_room');
    if (other === u.id || !(await personOf(other))) no(400, 'bad_bond');
    const key = keyOf(app, u.id, other);
    return lock(key, async () => {
      const had = (await store.getItem('bond', key))?.doc; const now = standOf(had, u.id);
      if (!STEP[now].includes(to)) no(409, 'bad_step');
      if (to === 'none') await store.removeItem('bond', key, { by: u.id }, { action: 'delete', fields: null, byId: u.id, byHandle: u.handle ?? null });
      else await save('bond', { ...(had ?? { id: key, app, member: [u.id, other].sort(), from: u.id, ownerId: u.id }), state: to, at: Date.now() }, u, had ? 'update' : 'create', ['state']);
      return { stand: to === 'none' ? 'none' : standOf({ ...(had ?? { from: u.id }), state: to }, u.id) };
    });
  }
  async function people(u, app, params) {
    guard(u); if (!APP.test(app)) no(404, 'bad_room');
    const find = String(params.get('find') ?? '').trim().replace(/^@/, '').toLowerCase();
    if (find) { const id = await store.handleOwner(find); return { person: id && id !== u.id ? await peopleOf([id]) : [] }; }
    return { person: await peopleOf(String(params.get('id') ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, ROOM_DATA.most.people)) };
  }
  return { list, step, people };
}

/** Answer `route` when it is a bond's or a people's; otherwise leave the response open for the next routes. */
export async function bondRoute(route, { bonds, pathname, readBody, req, res, searchParams, send, u }) {
  let m;
  if (req.method === 'GET' && (m = pathname.match(/^\/people\/([^/]+)$/))) return send(res, 200, await bonds.people(u, m[1], searchParams));
  if (req.method === 'GET' && (m = pathname.match(/^\/bond\/([^/]+)$/))) return send(res, 200, await bonds.list(u, m[1]));
  if (req.method === 'PUT' && (m = pathname.match(/^\/bond\/([^/]+)\/([^/]+)$/))) return send(res, 200, await bonds.step(u, m[1], decodeURIComponent(m[2]), String(((await readBody(req)) || {}).to ?? '')));
}
