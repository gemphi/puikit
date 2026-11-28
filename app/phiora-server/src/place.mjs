// What an app's own files say of its rooms and hosts, for the rooms its people share (room.mjs): who the files call
// the viewer (`me`), the role file (role.json, named by the people file), every host by its id with its name and
// whether anyone may join and leave it (a host of the catalogue, host.json) or everyone is in it (a group of the app's
// own menu), the host each room of the people file belongs to, the rooms that are a conversation with one person of
// the file, and the hosts an account is in from the start (the app's `joined`). Read from
// <appsDir>/<app>/public/data, again when one of the files changed; the people file is large, so only this is kept.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const APP = /^[\w-]{1,64}$/;
/** A file an app's data names (`data/room.json`), under its public folder; nothing for a reference elsewhere. */
const fileOf = (appsDir, app, ref) => (typeof ref === 'string' && /^[\w./-]+\.json$/.test(ref) && !ref.includes('..') ? join(appsDir, app, 'public', ref) : null);
const read = (f) => (f && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const stamp = (files) => files.map((f) => (f && existsSync(f) ? f + ':' + statSync(f).mtimeMs : f + ':-')).join('|');

/** The rooms of a menu group, in order: every item that is not a heading, inside headings too. */
export const roomsOfGroup = (group) => (group?.items ?? []).flatMap((x) => (x.items ? roomsOfGroup(x) : x.head ? [] : [x.id])).filter((x) => typeof x === 'string');

/** One app's places, read from its files. */
function load(appsDir, app) {
  const data = read(join(appsDir, app, 'public', 'data', app + '.json')) ?? {};
  const peopleFile = fileOf(appsDir, app, data.people); const hostFile = fileOf(appsDir, app, data.host);
  const people = read(peopleFile) ?? {};
  const roleFile = fileOf(appsDir, app, people.role);
  const host = new Map(); const byLabel = new Map(); const roomHost = new Map(); const fileDirect = new Set();
  const add = (g, kind) => {
    if (!g?.id || !g.label || host.has(g.id)) return;
    const rooms = roomsOfGroup(g);
    host.set(g.id, { id: g.id, label: g.label, kind, mark: g.mark ?? null, icon: g.icon ?? null, first: rooms[0] ?? null });
    byLabel.set(g.label, g.id); rooms.forEach((r) => roomHost.set(r, g.id));
  };
  for (const g of read(hostFile)?.host ?? []) add(g, 'catalogue');
  for (const g of data.nav ?? []) if (g.items?.length) add(g, 'open');
  for (const [id, r] of Object.entries(people.room ?? {})) {
    if (r?.with) { fileDirect.add(id); roomHost.delete(id); continue; }
    if (!r?.space || roomHost.has(id)) continue;
    // A space the people file names that no menu group or catalogue entry is: a host everyone is in, by its name.
    if (!byLabel.has(r.space)) { host.set(r.space, { id: r.space, label: r.space, kind: 'open', mark: null, icon: null, first: id }); byLabel.set(r.space, r.space); }
    roomHost.set(id, byLabel.get(r.space));
  }
  // A group of the menu whose rooms are all conversations with one person is the direct list, not a host.
  for (const [id, h] of host) if (h.kind === 'open' && h.first && fileDirect.has(h.first)) { host.delete(id); byLabel.delete(h.label); }
  return { app, me: people.me ?? null, role: read(roleFile), host, byLabel, roomHost, fileDirect, joined: new Set(data.joined ?? []), files: [join(appsDir, app, 'public', 'data', app + '.json'), peopleFile, hostFile, roleFile] };
}

/** The places of every app, each read once and again when its files change. */
export function createPlaces(appsDir) {
  const cache = new Map();
  return (app) => {
    if (!APP.test(String(app))) return null;
    const had = cache.get(app);
    if (had && stamp(had.files) === had.stamp) return had;
    if (!existsSync(join(appsDir, app, 'public', 'data', app + '.json'))) return null;
    const got = load(appsDir, app); got.stamp = stamp(got.files); cache.set(app, got); return got;
  };
}
