// Calls: how the browsers in one room (`<app>/<room>`) find each other. Phiora carries no sound and no picture: it
// keeps who is in a room's call and passes their WebRTC offers, answers and ICE candidates from one to another; the
// call itself runs between the browsers.
//
//   GET  /call/<app>/<room>?peer=<id>   the room's line, an event stream. Its first event is who is in the call
//                                       (`{ roster: [{ peer, name, handle }], ice }`); a new roster follows each time
//                                       someone joins or leaves, and `{ from, signal }` when a caller sends this peer one.
//   POST /call/<app>/<room>             `{ peer, join?: boolean, send?: [{ to, signal }], typing?: boolean }` from a
//                                       peer whose line is open: join or leave the call, pass signals to others who
//                                       are in it, and say to every other page on the line that it is writing
//                                       (`{ typing: { peer, name, handle, on } }`), call or no call.
//
// A peer is one open page, named by the page itself; it belongs to whoever opened its line, and only they may speak
// for it. Closing the line (the page goes away) leaves the call. Nothing is stored: a restart empties every room.
import { request } from 'node:http';

const ROOM = /^\/call\/([\w-]{1,64})\/([\w.-]{1,64})$/;
const PEER = /^[\w-]{8,64}$/;
/** A call is a mesh, every caller connected to every other, so it stays small. */
const MOST = 8;
/** How many pages may hold one room's line. */
const WATCH = 256;
/** A comment line this often keeps a proxy from closing a quiet stream. */
const BEAT = 20000;

/** The rooms with a line open, and the ICE servers browsers are told to use (`PHI_CALL_ICE`, a JSON list of
 *  RTCIceServer; none by default, which reaches the same machine and the same network). */
export function createCalls(env = {}) {
  const rooms = new Map();
  let ice = []; try { const v = JSON.parse(env.PHI_CALL_ICE || '[]'); if (Array.isArray(v)) ice = v; } catch { /* not JSON: none */ }
  const beat = setInterval(() => rooms.forEach((room) => room.forEach((p) => p.res.write(': beat\n\n'))), BEAT); beat.unref?.();
  /** End every line (the server is closing). */
  const close = () => { clearInterval(beat); rooms.forEach((room) => room.forEach((p) => p.res.end())); rooms.clear(); };
  // The one call line is Phiogy's, in Rust (`phikit/crates/appkit/app/phiogy`, `phiogy --line`). Told where it is
  // (`PHI_CALL_LINE`, a URL) and the word the two share (`PHI_CALL_KEY`), Phiora keeps no rooms of its own: it passes
  // every ask of a room's line on, saying who the page belongs to. With either unset the rooms above are used.
  let line = null; try { if (env.PHI_CALL_LINE && env.PHI_CALL_KEY) line = new URL(env.PHI_CALL_LINE); } catch { /* not a URL: none */ }
  return { rooms, ice, close, line, key: env.PHI_CALL_KEY || '' };
}

/** The heads of the line's answer a page is given; the rest (its cookie, its own answers to a browser) stay behind. */
const KEPT = ['content-type', 'cache-control', 'x-accel-buffering'];
/**
 * Pass one ask on to Phiogy's line and its answer back, saying who the page belongs to. A room's line stays open
 * both ways: when the page goes away the line is let go, so the room hears at once. Done once the answer has begun.
 */
const forward = (calls, { fail, req, res, u }, body) => new Promise((done) => {
  const head = { 'x-phi-key': calls.key, 'x-phi-user': encodeURIComponent(u.id), 'x-phi-name': encodeURIComponent(u.name ?? ''), 'x-phi-handle': encodeURIComponent(u.handle ?? '') };
  if (body !== undefined) { head['content-type'] = 'application/json'; head['content-length'] = Buffer.byteLength(body); }
  const up = request({ hostname: calls.line.hostname, port: calls.line.port, path: req.url, method: req.method, headers: head }, (got) => {
    res.writeHead(got.statusCode ?? 502, Object.fromEntries(KEPT.filter((k) => got.headers[k]).map((k) => [k, got.headers[k]])));
    got.pipe(res); done();
  });
  up.on('error', () => { if (res.headersSent) res.end(); else fail(res, 502, 'no_line', 'The call line does not answer.'); done(); });
  res.on('close', () => up.destroy());
  up.end(body);
});

const tell = (p, msg) => p.res.write('data: ' + JSON.stringify(msg) + '\n\n');
const rosterOf = (room) => [...room].filter(([, p]) => p.joined).map(([peer, p]) => ({ peer, name: p.name, handle: p.handle }));
const announce = (room) => { const roster = rosterOf(room); room.forEach((p) => tell(p, { roster })); };

/** Answer `route` when it is a room's call; otherwise leave the response open for the next routes. */
export async function callRoute(route, { calls, fail, pathname, readBody, req, res, searchParams, send, u }) {
  const m = pathname.match(ROOM); if (!m) return;
  if (calls.line && (req.method === 'GET' || req.method === 'POST')) return forward(calls, { fail, req, res, u }, req.method === 'POST' ? JSON.stringify((await readBody(req)) || {}) : undefined);
  const key = m[1] + '/' + m[2];
  if (req.method === 'GET') {
    const peer = searchParams.get('peer') || '';
    if (!PEER.test(peer)) return fail(res, 400, 'bad_peer', 'Name this page: ?peer=<id>.');
    const room = calls.rooms.get(key) ?? new Map(); const old = room.get(peer);
    if (old && old.user !== u.id) return fail(res, 403, 'not_yours', 'That peer is someone else.');
    if (!old && room.size >= WATCH) return fail(res, 429, 'full', 'That room is full.');
    calls.rooms.set(key, room);
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
    // The same page opening its line again (the network dropped) takes the place of its old line.
    const entry = { res, user: u.id, name: u.name, handle: u.handle ?? null, joined: false };
    room.set(peer, entry); old?.res.end();
    if (old?.joined) announce(room);
    tell(entry, { roster: rosterOf(room), ice: calls.ice });
    res.on('close', () => {
      if (room.get(peer) !== entry) return;
      room.delete(peer); if (!room.size && calls.rooms.get(key) === room) calls.rooms.delete(key);
      if (entry.joined) announce(room);
    });
    return;
  }
  if (req.method !== 'POST') return;
  const body = (await readBody(req)) || {};
  const room = calls.rooms.get(key); const me = room?.get(body.peer);
  if (!me || me.user !== u.id) return fail(res, 403, 'no_line', 'Open the room\'s line first.');
  if (typeof body.join === 'boolean' && body.join !== me.joined) {
    if (body.join && rosterOf(room).length >= MOST) return fail(res, 409, 'full', 'That call is full.');
    me.joined = body.join; announce(room);
  }
  // Signals go only between people who are both in the call, in the order they were sent.
  for (const x of Array.isArray(body.send) ? body.send.slice(0, 64) : []) {
    const to = x && room.get(x.to);
    if (me.joined && to?.joined && x.signal && typeof x.signal === 'object') tell(to, { from: body.peer, signal: x.signal });
  }
  // Writing is told to every other page that has the room open, whether in the call or not.
  if (typeof body.typing === 'boolean') room.forEach((p, peer) => { if (peer !== body.peer) tell(p, { typing: { peer: body.peer, name: me.name, handle: me.handle, on: body.typing } }); });
  return send(res, 200, { roster: rosterOf(room) });
}
