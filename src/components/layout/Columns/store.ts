// The columns a page shows, known outside the page: which are open, so a menu (the shell's right sidebar) can show
// and hide them and no column needs a strip of its own to come back from. Also the one way a column is dragged wider.
import { useSyncExternalStore } from 'react';
import type React from 'react';

/** A column that can be closed: its id, its name for a menu, and whether it is open. */
export type ColumnEntry = { id: string; label: string; open: boolean };

let entries: ColumnEntry[] = [];
const listeners = new Set<() => void>();
const put = (next: ColumnEntry[]) => { entries = next; listeners.forEach((f) => f()); };

export const columnStore = {
  /** A layout says a column exists (once; a column already known keeps its state). */
  add: (id: string, label: string, open = true) => { if (!entries.some((e) => e.id === id)) put([...entries, { id, label, open }]); },
  /** A layout leaving the page takes its columns with it. */
  remove: (ids: string[]) => { if (entries.some((e) => ids.includes(e.id))) put(entries.filter((e) => !ids.includes(e.id))); },
  set: (id: string, open: boolean) => put(entries.map((e) => (e.id === id ? { ...e, open } : e))),
  toggle: (id: string) => put(entries.map((e) => (e.id === id ? { ...e, open: !e.open } : e))),
  list: () => entries,
};

/** The columns on the page now, for a menu that shows and hides them. */
export const useColumnEntries = (): ColumnEntry[] =>
  useSyncExternalStore((f) => { listeners.add(f); return () => { listeners.delete(f); }; }, () => entries, () => entries);

/** Drag a column's edge: from the press, every move hands back the column's new width (never under `least` px).
 *  `grow` is +1 when dragging right widens it (a column on the left) and -1 for one on the right. */
export const dragWidth = (e: React.PointerEvent, from: number, grow: 1 | -1, onWidth: (px: number) => void, least = 160) => {
  e.preventDefault(); const x0 = e.clientX;
  const move = (m: PointerEvent) => onWidth(Math.max(least, Math.round(from + (m.clientX - x0) * grow)));
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
};
