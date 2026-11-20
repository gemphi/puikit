// What a record holds beyond what its kind declares (data/kinds.json): its other plain fields and its other links, so a
// record's sheet is never thinner than its data and no kind has to list everything. What to leave out and what to call
// a key are data (data/site.json `recordHide`, `recordName`).
import React from 'react';
import { fmt, kindOfId, site } from './data';
import { fieldsOf, kindLabel, type Relation } from './fields';

const SITE = site as unknown as { recordHide?: string[]; recordName?: Record<string, string> };
/** Keys that are a record's workings, not something to read. */
const HIDE = new Set(SITE.recordHide ?? []);
/** What a key is called when its own words do not say it. */
const NAME = SITE.recordName ?? {};
const wordsOf = (k: string) => k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const isMoment = (v: unknown) => /^\d{4}-\d\d-\d\dT/.test(String(v));
/** A plain value said for people: a share as a percentage, a figure with its separators, a moment as its day. */
const plain = (v: unknown): React.ReactNode => {
  if (typeof v === 'number') return v > 0 && v < 1 ? Math.round(v * 100) + '%' : fmt(v);
  return isMoment(v) ? String(v).slice(0, 10) : String(v);
};

/** The record's plain fields its kind does not declare, named from their keys. */
export function undeclared(kind: string, row: Record<string, unknown>): { id: string; label: string; value: React.ReactNode; group?: string }[] {
  const known = new Set(fieldsOf(kind).flatMap((f) => [f.id, (f.path ?? f.id).split('.')[0]]));
  return Object.entries(row)
    .filter(([k, v]) => k !== 'id' && !known.has(k) && !HIDE.has(k) && !/(Id|Ids)$/.test(k) && v !== '' && v != null
      && ['string', 'number', 'boolean'].includes(typeof v) && String(v).length < 200)
    .map(([k, v]) => ({ id: k, label: NAME[k] ?? wordsOf(k), value: plain(v) }));
}

/** The record's links its kind does not declare as relations: any field named …Id or …Ids whose ids are records of a
 *  known kind. Each is a tab on the record's sheet, like a declared relation. */
export function linksOf(kind: string, row: Record<string, unknown>): Relation[] {
  const declared = new Set(fieldsOf(kind).filter((f) => f.control === 'link' || f.control === 'links').map((f) => f.id));
  return Object.entries(row).flatMap(([k, v]) => {
    if (!/(Id|Ids)$/.test(k) || declared.has(k) || HIDE.has(k)) return [];
    const list = (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === 'string' && !!x);
    const to = list.length ? kindOfId(list[0]) : undefined;
    return to ? [{ dir: 'out' as const, kind: to, field: k, label: wordsOf(kindLabel(to)) + (list.length > 1 ? 's' : '') }] : [];
  });
}
