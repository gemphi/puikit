// Records: create, edit and delete single items in the one database, with ownership and a change log.
//   GET    /tree/item/<kind>/<id>  → { kind, item, origin, edited, owner, updatedAt, updatedBy, editable, changes }
//   POST   /tree/item  { kind, id?, fields }   → 201 the new record (signed in; you own it)
//   PATCH  /tree/item/<kind>/<id>  { set?, unset? }  → the record after the change
//   DELETE /tree/item/<kind>/<id>  → { ok }   (a record from the files stays as a tombstone, so seeding keeps it gone)
//   GET    /tree/change?kind=&id=&n=  → { changes } newest first: action, fields, by (id and handle), at
// Who may change a record: its owner (whoever created it through the API), the person it is (its id is theirs) or
// names as founder, owner, creator, author, user or holder, and the editors in PHI_EDITORS (ids or handles; `*`:
// anyone signed in). PHI_CREATE_KINDS, when set, is the comma list of kinds anyone signed in may create — other
// kinds then need an editor. Guests never write. Ids are md5 and never change; every record has a slug; field
// names are plain; a record is at most 32 KB.
import { randomUUID } from 'node:crypto';
import { md5, slugify } from './tree.mjs';

export class RecordError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }

export const ID = /^[\w.:-]{1,120}$/;
export const KIND = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
const FIELD = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
const MAX_BYTES = 32 * 1024, MAX_FIELDS = 80;
/** Fields that say whose a record is. */
export const OWNER_FIELDS = ['founderId', 'ownerId', 'creatorId', 'authorId', 'userId', 'holderId', 'createdBy'];

export const isEditor = (u, editors) => !!u && !u.guest && (editors.has('*') || editors.has(u.id) || (u.handle && editors.has(u.handle)));
export const canEdit = (u, rec, editors) => {
  if (!u || u.guest || !rec) return false;
  if (isEditor(u, editors) || rec.owner === u.id) return true;
  return rec.doc?.id === u.id || OWNER_FIELDS.some((f) => rec.doc?.[f] === u.id);
};

const checkFields = (o, what) => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new RecordError(400, 'bad_fields', what + ' must be an object of fields.');
  const keys = Object.keys(o);
  if (keys.length > MAX_FIELDS) throw new RecordError(400, 'bad_fields', 'At most ' + MAX_FIELDS + ' fields.');
  for (const k of keys) {
    if (!FIELD.test(k)) throw new RecordError(400, 'bad_field', 'Field names are letters, digits and _ (' + k.slice(0, 40) + ').');
    if (k === 'id') throw new RecordError(400, 'id_fixed', 'The id cannot change.');
  }
};
const sized = (doc) => { if (Buffer.byteLength(JSON.stringify(doc)) > MAX_BYTES) throw new RecordError(413, 'too_big', 'A record is at most 32 KB.'); return doc; };
const who = (u) => ({ byId: u.id, byHandle: u.handle ?? null });
const guard = (u) => { if (!u || u.guest) throw new RecordError(401, 'sign_in', 'Sign in to change records.'); };
export async function readRecord(store, u, editors, kind, id) {
  const rec = await store.getItem(kind, id); if (!rec) throw new RecordError(404, 'no_record', 'No ' + kind + ' ' + id + '.');
  return { kind, item: rec.doc, origin: rec.origin, edited: rec.edited, owner: rec.owner, updatedAt: rec.updatedAt, updatedBy: rec.updatedBy,
    editable: canEdit(u, rec, editors), changes: await store.itemChanges({ kind, id, n: 20 }) };
}

export async function createRecord(store, u, body, editors = new Set(), createKinds = null) {
  guard(u);
  const kind = String(body?.kind ?? '');
  if (!KIND.test(kind)) throw new RecordError(400, 'bad_kind', 'A kind is a word of letters and digits.');
  if (createKinds && !createKinds.has(kind) && !isEditor(u, editors)) throw new RecordError(403, 'kind_closed', 'Only editors create ' + kind + ' records here.');
  const fields = body?.fields ?? {}; checkFields(fields, 'fields');
  // Ids are md5, always; the slug is the full name with underscores.
  const id = md5(kind + ':' + randomUUID());
  const named = [fields.slug, fields.name, fields.title, fields.label, fields.handle].find((x) => typeof x === 'string' && x.trim())
  const slug = named ? slugify(named) : kind + '_' + id.slice(0, 8);
  if (await store.getItem(kind, id)) throw new RecordError(409, 'exists', 'There is already a ' + kind + ' ' + id + '.');
  // Who made it is a prop like any other relation (ownerId), so profiles and pulls can find it.
  const doc = sized({ id, ownerId: u.id, ...fields, slug });
  await store.saveItem(kind, id, doc, { origin: 'api', owner: u.id, by: u.id }, { action: 'create', fields: Object.keys(fields), ...who(u) });
  return { kind, item: doc, owner: u.id };
}

export async function updateRecord(store, u, editors, kind, id, body) {
  guard(u);
  const rec = await store.getItem(kind, id); if (!rec) throw new RecordError(404, 'no_record', 'No ' + kind + ' ' + id + '.');
  if (!canEdit(u, rec, editors)) throw new RecordError(403, 'not_yours', 'Only its owner or an editor can change this ' + kind + '.');
  const set = body?.set ?? {}; checkFields(set, 'set');
  const unset = Array.isArray(body?.unset) ? body.unset.map(String) : [];
  if (unset.includes('id')) throw new RecordError(400, 'id_fixed', 'The id cannot change.');
  const doc = { ...rec.doc, ...set }; for (const k of unset) delete doc[k];
  const changed = [...Object.keys(set).filter((k) => JSON.stringify(rec.doc[k]) !== JSON.stringify(set[k])), ...unset.filter((k) => k in rec.doc)];
  if (!changed.length) return { kind, item: rec.doc, changed: [] };
  await store.saveItem(kind, id, sized(doc), { by: u.id }, { action: 'update', fields: changed, ...who(u) });
  return { kind, item: doc, changed };
}

export async function deleteRecord(store, u, editors, kind, id) {
  guard(u);
  const rec = await store.getItem(kind, id); if (!rec) throw new RecordError(404, 'no_record', 'No ' + kind + ' ' + id + '.');
  if (!canEdit(u, rec, editors)) throw new RecordError(403, 'not_yours', 'Only its owner or an editor can delete this ' + kind + '.');
  await store.removeItem(kind, id, { by: u.id }, { action: 'delete', fields: null, ...who(u) });
  return { ok: true };
}
