import React from 'react';
import { Box, Button, ItemCard, Stack, Tag, Text } from '@pui/components';
import { useLayout } from '@pui/providers';
import { FEED } from '../prefs';
import { appUrl, type Block } from '../data';
import { ListView } from '../ListView';
import type { Wear } from '../looks';
import { CardExtra, Facet, LaneRow, More, cardPicture, cardTag, inFacet } from './GridExtra';
import { LIST, countOf, facetsFor, layoutOf, sortsFor, textOf, type GridRow } from './GridList';

export type GridItem = { id?: string; kind?: string; route?: string; title: string; sub?: string; body?: string; action?: string; done?: string; app?: string; href?: string; cost?: number; meta?: string; image?: string; fields?: [string, string][];
  /** A card's picture when it is no file of its own: a cell of a sheet (`sprite`, a portrait), or colours (`swatch`: a
   *  theme's ground, then its accents). */
  sprite?: { sheet: string; cols: number; index: number }; swatch?: string[];
  /** What the thing puts on once it is the viewer's (a theme: its palette, or a ground). `given`: the house gives it
   *  to everybody, priced, until it goes on sale (shop.json). */
  wear?: Wear; given?: boolean;
  /** Optional parts, all drawn by GridExtra: a tinted head (`tone`, with `mark` a round mark of initials or a number), a tag
   *  at the title's end, a big figure, a meter (0 to 1; `split` for two shares), one more line, a list of points, and the
   *  lane and facet the card belongs to. */
  tone?: string; mark?: string; tag?: string; tagIntent?: 'success' | 'warning' | 'error'; value?: string; progress?: number; split?: boolean;
  note?: string; pointList?: string[]; lane?: string; facet?: string;
  /** `selected` marks the card as the one picked; `chipList` is a row of small buttons on the card (an agent's verbs),
   *  each handed to the block's `onChip(item, chip)`. A block with `onAct(item)` is handed a press of a card's
   *  `action` too, and says how the card stands by the words it gives it (a shop: add to the bag, in the bag, owned). */
  selected?: boolean; chipList?: string[] };

/** One grid, every app: the shared ItemCard in the shared ListView, so every grid has the one header: its count, Filter,
 *  Sort and the layout (list, deck or grid, from one icon). All of it is read from the block's data (GridList): `layout`,
 *  `layoutSet`, `sort`, `filter`; a block that names none gets the defaults. Nothing bespoke: the card's border, ground
 *  and spacing are the framework's, the only difference is the data. */
export const GRID_MIN = '16rem';
const TILE_W = '18rem';

export const Grid: React.FC<{ b: Block; onOpen: (it: GridItem) => void }> = ({ b, onOpen }) => {
  const [done, setDone] = React.useState<Record<number, boolean>>({});
  const [facet, setFacet] = React.useState<string>(b.facet?.[0] ?? '');
  // The feed layout the person chose in Settings, which every app's grids open in.
  const [feed] = useLayout(FEED.id, FEED.fallback);
  const feedMode = FEED.options.find((o) => o.value === feed)?.mode;
  const all: GridRow[] = ((b.items || []) as GridItem[]).map((it, i) => ({ it, i }));
  const rows = all.filter((r) => inFacet([r.it], b.facet, facet).length > 0);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const card = (it: GridItem, i: number, list: boolean) => (
    <ItemCard key={i} layout={list ? 'auto' : 'vertical'} onClick={() => onOpen(it)} selected={it.selected}
      media={cardPicture(it, list)}
      title={it.title} meta={it.sub} aside={cardTag(it)}
      actions={it.action ? (
        it.app || it.href
          ? <Button variant="glass" href={it.href || appUrl(it.app!)} onClick={stop}>{it.action}</Button>
          : <Button variant="glass" aria-pressed={b.onAct ? !!it.selected : undefined} onClick={(e) => { stop(e); if (b.onAct) b.onAct(it); else setDone((d) => ({ ...d, [i]: !d[i] })); }}>{!b.onAct && done[i] ? it.done || 'Done' : it.action}</Button>
      ) : undefined}>
      {it.body ? <Text as="p" size="sm" intent="secondary">{it.body}</Text> : null}
      {it.chipList?.length ? <Stack direction="row" gap={1} wrap>{it.chipList.map((c) => <Button key={c} variant="glass" onClick={(e) => { stop(e); b.onChip?.(it, c); }}><Text as="span" size="xs" mono>{c}</Text></Button>)}</Stack> : null}
      {it.meta ? <Text as="span" size="xs" intent="muted" mono>{it.meta}</Text> : null}
      {it.fields?.length ? <Stack direction="row" gap={1} wrap>{it.fields.slice(0, 3).map(([k, v]) => <Tag key={k} minimal round size="sm">{k} · {v}</Tag>)}</Stack> : null}
      <CardExtra it={it} />
    </ItemCard>
  );

  const tabs = b.facet ? <Facet list={b.facet} value={facet} onChange={setFacet} /> : null;
  const more = b.more ? <More more={b.more} /> : null;
  // Lanes are their own layout (a pipeline by stage): no switch.
  if (b.laneSet) return <Stack direction="column" gap={3}>{tabs}{more}<LaneRow laneSet={b.laneSet} items={rows.map((r) => r.it)} card={(it, i) => card(it, i, false)} /></Stack>;
  const { mode, modes } = layoutOf(b, feedMode);
  return (
    <ListView<GridRow> key={mode} rows={rows} keyOf={(r) => String(r.i)} text={textOf} sorts={sortsFor(all, b.sort)} facets={facetsFor(all, b.filter, b.facet ? ['facet'] : [])}
      mode={mode} modes={modes} toolbar={b.toolbar !== false} count={countOf} empty={LIST.empty} cols={4} minItemWidth={GRID_MIN}
      // Cards with pictures take the mosaic's sizes; cards of words alone keep their own height, so none stands half empty.
      mosaic={rows.some((r) => r.it.image)} tabs={tabs ?? undefined} lead={more ?? undefined}
      render={(r, m) => card(r.it, r.i, m === 'list')}
      // Tile: one sideways row of cards a fixed width.
      slider={(list) => <Box scroll="x" paddingBottom={2}><Stack direction="row" gap={3} align="stretch">{list.map((r) => <Box key={r.i} width={TILE_W} flex="none">{card(r.it, r.i, false)}</Box>)}</Stack></Box>}
      labels={{ tile: LIST.tile, list: LIST.list, deck: LIST.deck, grid: LIST.grid, layout: LIST.layout, filters: LIST.filter, sort: LIST.sort, search: LIST.search, all: LIST.all, clear: LIST.clear }} />
  );
};
