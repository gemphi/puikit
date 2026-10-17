// Full productions (seasons, episodes, cast roles, crew, themes) load per title from 16 shards
// (scripts/productions.mjs → src/data/productions/NN.json); the person → roles index loads for profiles.
import { useEffect, useState } from 'react';
import type { ID, Production, RoleIndex } from '../types/phiegg';
import { MAP, remapDoc, srcId } from './ids';

const SHARDS = 16;
const shardOf = (id: string) => [...id].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7) % SHARDS;
const files = import.meta.glob<{ default: Record<ID, Production> }>('../data/productions/*.json');
const cache = new Map<number, Record<ID, Production>>(); const pending = new Map<number, Promise<Record<ID, Production>>>();
const load = (k: number) => pending.get(k) ?? (pending.set(k, files[`../data/productions/${String(k).padStart(2, '0')}.json`]().then((m) => { const d = m.default; remapDoc(d); cache.set(k, d); return d; })), pending.get(k)!);

/** One title's production; undefined while its shard loads. */
export function useProduction(dbId?: ID): Production | undefined {
  // Shards were cut and keyed on the original title ids.
  const id = dbId ? srcId(dbId) : undefined;
  const k = id ? shardOf(id) : -1; const [doc, setDoc] = useState(() => (k >= 0 ? cache.get(k) : undefined));
  useEffect(() => { if (k < 0) return; if (cache.has(k)) setDoc(cache.get(k)); else void load(k).then(setDoc); }, [k]);
  return id ? doc?.[id] : undefined;
}

let index: RoleIndex | undefined; let indexP: Promise<RoleIndex> | undefined;
/** Every credit a person has: [titleId, character or crew job, part]. */
export function useCredits(personId?: ID) {
  const [ix, setIx] = useState(index);
  useEffect(() => { if (!ix) void (indexP ??= import('../data/roleIndex.json').then((m) => {
    // Keys are original person ids; each credit's title id joins series pages, so it moves to the database id.
    const raw = m.default as unknown as RoleIndex;
    for (const credits of Object.values(raw)) for (const c of credits) if (MAP[c[0]]) c[0] = MAP[c[0]];
    return (index = raw);
  })).then(setIx); }, [ix]);
  return personId && ix ? ix[srcId(personId)] ?? [] : undefined;
}
