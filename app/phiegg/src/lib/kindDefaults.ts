// A record is whole the moment it enters the app: each kind in data/kinds.json may declare `defaults` (the fields
// every record of that kind must carry, whoever made it) and `derive` (fields filled from another field when missing,
// e.g. a pool's lead clubId from the first of its clubIds). Applied where records land (create, edit, the change log)
// and before a create is saved, so pages never meet half a record and the database holds whole ones.
import kindsJson from '../data/kinds.json';

type Decl = { defaults?: Record<string, unknown>; derive?: Record<string, string> };
const KINDS = kindsJson as unknown as Record<string, Decl>;
const dig = (r: unknown, path: string): unknown => path.split('.').reduce<unknown>((v, k) => (v == null ? v : (v as Record<string, unknown>)[k]), r);
const empty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0);
const copy = <T,>(v: T): T => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);

export function withDefaults<T extends object>(kind: string, row: T): T {
  const k = KINDS[kind];
  if (!k || (!k.defaults && !k.derive)) return row;
  const out = { ...(row as Record<string, unknown>) };
  for (const [f, v] of Object.entries(k.defaults ?? {})) if (out[f] == null) out[f] = copy(v);
  for (const [f, path] of Object.entries(k.derive ?? {})) {
    if (!empty(out[f])) continue;
    const v = dig(out, path);
    if (!empty(v)) out[f] = Array.isArray(out[f]) && !Array.isArray(v) ? [v] : v;
  }
  return out as T;
}
