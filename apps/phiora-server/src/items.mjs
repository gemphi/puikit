// Items beyond price: what people do with them (activity) and what designers say they are (thematic kinds).
//   POST /activity        { events: [...] }  → appends to the user's server-owned `activity` document (newest first, capped)
//   GET  /activity?ref=id                     → the user's events, optionally for one item
//   GET  /item/theme                         → every designer-supplied theme { [lookId]: { kinds, mood, story, by, at } }
//   PUT  /item/<id>/theme { kinds, mood?, story? }  → the look's designer (specs.provenance.designerId) or PHI_DESIGNERS only
export class ItemError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }

export const ACTIVITY_KINDS = new Set(['view', 'angle', 'cart.add', 'cart.remove', 'offer', 'offer.withdraw', 'buy', 'checkout', 'swap', 'lot.buy',
  'quest.join', 'quest.leave', 'coin.buy', 'coin.sell', 'stake', 'unstake', 'follow', 'unfollow', 'rsvp', 'unrsvp', 'like', 'unlike', 'save', 'unsave',
  'share', 'comment', 'chat', 'open']);
const MAX_EVENTS = 1000, MAX_BATCH = 100;
const ID = /^[\w.:-]{1,120}$/;
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : undefined);

/** Validate a batch and prepend it to the user's activity. Unknown kinds or bad refs are refused, not silently dropped. */
export function addActivity(u, body) {
  const list = Array.isArray(body?.events) ? body.events : [];
  if (!list.length || list.length > MAX_BATCH) throw new ItemError(400, 'bad_events', `Send 1 to ${MAX_BATCH} events.`);
  const now = Date.now();
  const clean = list.map((e) => {
    if (!e || !ACTIVITY_KINDS.has(e.kind)) throw new ItemError(400, 'bad_kind', 'Unknown activity kind ' + String(e?.kind) + '.');
    if (!ID.test(String(e.ref ?? ''))) throw new ItemError(400, 'bad_ref', 'Bad ref.');
    const at = Number(e.at); // the client's clock, but never in the future and never older than a day
    return { id: ID.test(String(e.id ?? '')) ? e.id : 's' + now.toString(36) + Math.random().toString(36).slice(2, 6), kind: e.kind, ref: e.ref,
      at: Number.isFinite(at) && at <= now + 60000 && at > now - 864e5 ? at : now,
      ...(ID.test(String(e.refKind ?? '')) ? { refKind: e.refKind } : {}), ...(ID.test(String(e.with ?? '')) ? { with: e.with } : {}),
      ...(Number.isFinite(Number(e.usd)) ? { usd: Math.round(Number(e.usd) * 100) / 100 } : {}), ...(str(e.note, 120) ? { note: str(e.note, 120) } : {}) };
  });
  const doc = u.docs.activity ?? (u.docs.activity = { events: [] });
  const seen = new Set(doc.events.map((x) => x.id));
  doc.events = [...clean.filter((x) => !seen.has(x.id)).sort((a, b) => b.at - a.at), ...doc.events].slice(0, MAX_EVENTS);
  return { added: clean.length, total: doc.events.length };
}
export const activityOf = (u, ref) => (u.docs.activity?.events ?? []).filter((e) => !ref || e.ref === ref || e.with === ref);

const KIND = /^[\p{L}\p{N} &'-]{1,32}$/u;
/** Set a look's thematic kinds. Only its house's designer (or a listed designer) may; guests never. */
export async function setTheme(store, u, catalog, lookId, body, designers) {
  const idmap = (await store.global('items.idmap')) ?? {};
  const look = catalog.looks.get(lookId); if (!look) throw new ItemError(404, 'unknown_look', 'Unknown look ' + lookId + '.');
  if (u.guest) throw new ItemError(401, 'sign_in', 'Sign in as the designer to set thematic kinds.');
  const designer = look.specs?.provenance?.designerId;
  const mine = designer && (designer === u.id || idmap[designer] === u.id);
  if (!(designers.has('*') || designers.has(u.id) || mine)) throw new ItemError(403, 'not_designer', 'Only the designer of ' + look.name + ' can set its thematic kinds.');
  const kinds = [...new Set((Array.isArray(body?.kinds) ? body.kinds : []).map((k) => String(k).trim()).filter(Boolean))];
  if (kinds.length > 12 || kinds.some((k) => !KIND.test(k))) throw new ItemError(400, 'bad_kinds', 'Up to 12 kinds, letters and numbers, 32 characters each.');
  const all = (await store.global('itemThemes')) ?? {};
  // Up to three theme colours (#rrggbb): the page of the look wears the first, the second is its second accent.
  const colours = (Array.isArray(body?.colours) ? body.colours : []).map((c) => String(c).trim().toLowerCase()).filter((c) => /^#[0-9a-f]{6}$/.test(c)).slice(0, 3);
  all[lookId] = { kinds, mood: str(body?.mood, 80) ?? null, story: str(body?.story, 600) ?? null, ...(colours.length ? { colours } : {}), by: u.id, at: Date.now() };
  await store.saveGlobal('itemThemes', all);
  return all[lookId];
}
export const themes = async (store) => (await store.global('itemThemes')) ?? {};
