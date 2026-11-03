/**
 * How each catalogue presents itself — declared once, as data, and read by
 * every listing page. A section is its presentation: shape, columns, list
 * variant, badge policy. Nothing about a grid is decided inside a page.
 */
export type TileRatio = 'portrait' | 'square' | 'wide';

export interface Presentation {
  /** The list variant `PostList` runs. */
  variant: 'card' | 'row';
  /** Tile shape for the card variant. */
  ratio: TileRatio;
  columns: { xs?: number; sm?: number; md?: number; lg?: number };
  /** What rides the tile's corner. */
  badge: 'none' | 'category' | 'live';
}

const P = (o: Partial<Presentation>): Presentation => ({
  variant: 'card',
  ratio: 'portrait',
  columns: { xs: 2, sm: 3, md: 4, lg: 4 },
  badge: 'none',
  ...o,
});

export const PRESENTATION: Record<string, Presentation> = {
  // pages
  explore: P({ ratio: 'portrait', columns: { xs: 1, sm: 2, md: 2, lg: 3 } }),
  live:    P({ ratio: 'wide', columns: { xs: 1, sm: 2, md: 3, lg: 3 }, badge: 'live' }),
  search:  P({ ratio: 'portrait', columns: { xs: 2, sm: 3, md: 4, lg: 4 } }),
  creator: P({ ratio: 'portrait', columns: { xs: 2, sm: 3, md: 4, lg: 5 } }),
  // menu
  snaps:   P({ ratio: 'square', columns: { xs: 2, sm: 3, md: 4, lg: 5 } }),
  reels:   P({ ratio: 'portrait', columns: { xs: 1, sm: 2, md: 3, lg: 3 } }),
  shows:   P({ ratio: 'wide', columns: { xs: 1, sm: 1, md: 2, lg: 2 } }),
  looks:   P({ ratio: 'portrait', columns: { xs: 2, sm: 3, md: 4, lg: 4 } }),
  zones:   P({ ratio: 'square', columns: { xs: 2, sm: 2, md: 3, lg: 4 } }),
  shops:   P({ ratio: 'square', columns: { xs: 1, sm: 2, md: 3, lg: 3 }, badge: 'category' }),
  // more
  snips:   P({ ratio: 'wide', columns: { xs: 1, sm: 2, md: 3, lg: 3 } }),
  hosts:   P({ variant: 'row', columns: { xs: 1 } }),
  rides:   P({ ratio: 'wide', columns: { xs: 1, sm: 1, md: 2, lg: 2 } }),
  lands:   P({ ratio: 'square', columns: { xs: 2, sm: 3, md: 4, lg: 5 } }),
  // taxonomy topics browsed from the explore tabs
  chaps:   P({ ratio: 'portrait', columns: { xs: 2, sm: 3, md: 3, lg: 4 } }),
  chats:   P({ variant: 'row', columns: { xs: 1 } }),
  clubs:   P({ ratio: 'square', columns: { xs: 2, sm: 2, md: 3, lg: 4 } }),
  coins:   P({ ratio: 'square', columns: { xs: 2, sm: 3, md: 4, lg: 5 } }),
  shots:   P({ ratio: 'square', columns: { xs: 2, sm: 3, md: 4, lg: 5 } }),
};

export const presentationOf = (key: string): Presentation => PRESENTATION[key] ?? P({});
