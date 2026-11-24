import PREF_DATA from './prefs.json';

/** A setting's picture: a small window drawn as the choice lays it (settings.tsx `Mini`). */
export type Mini = { tabs?: 'top' | 'side'; feed?: 'headings' | 'partial' | 'full'; swatch?: string[]; dark?: boolean; split?: boolean };
/** One option of a group: its value, its name, its picture, and for a feed the list layout it opens in. */
export type PrefOption = { value: string; label: string; mini?: Mini; mode?: string };
/** A group of Settings: what it sets (`kind`), its name, its options when they are data. */
export type PrefGroup = { id: string; kind: 'look' | 'mode' | 'layout' | 'palette' | 'gradient' | 'radius' | 'density'; label: string; fallback?: string; shared?: boolean; options?: PrefOption[] };

/** Settings as every app has it (prefs.json): its head and its groups in order. */
export const PREFS = PREF_DATA as unknown as { head: { title: string; sub: string }; groups: PrefGroup[] };

const group = (id: string) => PREFS.groups.find((g) => g.id === id) as PrefGroup & { options: PrefOption[] };

/** The feed layout: which list layout each choice opens a feed in (blocks/Grid.tsx reads it). */
export const FEED = { id: 'feed', fallback: group('feed').fallback ?? '', options: group('feed').options };
