import type { ViewMode } from '@pui/components';
import type { ListFacet, ListSort } from '../ListView';
import words from '../words.json';
import type { GridItem } from './Grid';

/**
 * What a grid's header offers, read from its data. A block says its own with `layout` (the one it starts in),
 * `layoutSet` (the layouts offered), `sort` and `filter` (field names of its cards); what it leaves out comes from
 * `list.default` in words.json, kept to the fields its cards really carry. So a page passes cards alone and still
 * gets the layout switch, the sorts and the filters.
 */
export const LIST = words.list;
/** A card with its place in the data: the key that survives a sort or a filter, and the order "as listed". */
export type GridRow = { it: GridItem; i: number };

const label = (f: string) => (LIST.field as Record<string, string>)[f] ?? f;
const valueOf = (r: GridRow, f: string): unknown => (r.it as Record<string, unknown>)[f];
const has = (v: unknown) => v != null && v !== '';
/** Numbers by size, words by the alphabet (digits in them by size), a card without the field last. */
const compare = (a: unknown, b: unknown) => (
  !has(a) || !has(b) ? Number(!has(a)) - Number(!has(b))
    : typeof a === 'number' && typeof b === 'number' ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
);

export const layoutOf = (b: { kind: string; layout?: string; layoutSet?: string[] }) => ({
  mode: (b.layout ?? LIST.default.layout) as ViewMode,
  modes: (b.layoutSet ?? LIST.default.layoutSet) as ViewMode[],
});

/** The sorts: the data's own order first, then every named field a card carries. */
export const sortsFor = (rows: GridRow[], named?: string[]): ListSort<GridRow>[] => {
  const fields = (named ?? LIST.default.sort).filter((f) => rows.some((r) => has(valueOf(r, f))));
  return fields.length ? [{ id: 'listed', label: LIST.listed, by: (a, b) => a.i - b.i },
    ...fields.map((f) => ({ id: f, label: label(f), by: (a: GridRow, b: GridRow) => compare(valueOf(a, f), valueOf(b, f)) }))] : [];
};

/** The filters: the fields the block names; unnamed, the default fields that sort the cards into groups (two values
 *  at least, and some value shared by two cards, so no filter of one option or of one card an option). */
export const facetsFor = (rows: GridRow[], named?: string[], skip: string[] = []): ListFacet<GridRow>[] => (
  (named ?? LIST.default.filter).filter((f) => {
    const values = rows.map((r) => valueOf(r, f)).filter(has).map(String);
    const n = new Set(values).size;
    return !skip.includes(f) && (named ? n > 0 : n > 1 && n < values.length);
  }).map((f) => ({ id: f, label: label(f), get: (r: GridRow) => { const v = valueOf(r, f); return has(v) ? String(v) : undefined; } }))
);

/** What the search reads of a card. */
export const textOf = ({ it }: GridRow) => [it.title, it.sub, it.body, it.meta, it.tag, it.note, it.value].filter(Boolean).join(' ');
export const countOf = (n: number) => (n === 1 ? LIST.one : LIST.many.replace('{n}', n.toLocaleString('en-US')));
