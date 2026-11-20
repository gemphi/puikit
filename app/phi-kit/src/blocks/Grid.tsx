import React from 'react';
import { Box, Button, Frame, Image, ItemCard, Rows, Stack, Tag, Text, ViewToolbar, type ViewMode } from '@pui/components';
import { appUrl, assetUrl, type Block } from '../data';
import { CardExtra, Facet, LaneRow, More, cardHead, cardTag, inFacet } from './GridExtra';

export type GridItem = { id?: string; kind?: string; route?: string; title: string; sub?: string; body?: string; action?: string; done?: string; app?: string; href?: string; cost?: number; meta?: string; image?: string; fields?: [string, string][];
  /** Optional parts, all drawn by GridExtra: a tinted head (`tone`, with `mark` a round mark of initials or a number), a tag
   *  at the title's end, a big figure, a meter (0 to 1; `split` for two shares), one more line, a list of points, and the
   *  lane and facet the card belongs to. */
  tone?: string; mark?: string; tag?: string; tagIntent?: 'success' | 'warning' | 'error'; value?: string; progress?: number; split?: boolean;
  note?: string; pointList?: string[]; lane?: string; facet?: string;
  /** `selected` marks the card as the one picked; `chipList` is a row of small buttons on the card (an agent's verbs),
   *  each handed to the block's `onChip(item, chip)`. */
  selected?: boolean; chipList?: string[] };

/** One grid, every app: the shared ItemCard laid out by Rows, with the house layout toolbar (tile · list · grid).
 *  Nothing bespoke — the card's border, gradient and spacing are the framework's, the only difference is the data. */
export const GRID_MIN = '16rem';
const TILE_W = '18rem';

export const Grid: React.FC<{ b: Block; onOpen: (it: GridItem) => void }> = ({ b, onOpen }) => {
  const [done, setDone] = React.useState<Record<number, boolean>>({});
  const [mode, setMode] = React.useState<ViewMode>((b.layout as ViewMode) || 'grid');
  const [facet, setFacet] = React.useState<string>(b.facet?.[0] ?? '');
  const items: GridItem[] = inFacet(b.items || [], b.facet, facet);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const card = (it: GridItem, i: number, list: boolean) => (
    <ItemCard key={i} layout={list ? 'auto' : 'vertical'} onClick={() => onOpen(it)} selected={it.selected}
      media={it.image ? <Frame ratio={list ? '1/1' : '16/9'} rounded="md" width={list ? '4.5rem' : undefined}><Image src={assetUrl(it.image)} alt="" fit="cover" fill loading="lazy" /></Frame> : cardHead(it)}
      title={it.title} meta={it.sub} aside={cardTag(it)}
      actions={it.action ? (
        it.app || it.href
          ? <Button variant="outline" size="sm" href={it.href || appUrl(it.app!)} onClick={stop}>{it.action}</Button>
          : <Button variant={done[i] ? 'ghost' : 'outline'} size="sm" onClick={(e) => { stop(e); setDone((d) => ({ ...d, [i]: !d[i] })); }}>{done[i] ? it.done || 'Done' : it.action}</Button>
      ) : undefined}>
      {it.body ? <Text as="p" size="sm" intent="secondary">{it.body}</Text> : null}
      {it.chipList?.length ? <Stack direction="row" gap={1} wrap>{it.chipList.map((c) => <Button key={c} size="sm" variant="ghost" onClick={(e) => { stop(e); b.onChip?.(it, c); }}><Text as="span" size="xs" mono>{c}</Text></Button>)}</Stack> : null}
      {it.meta ? <Text as="span" size="xs" intent="muted" mono>{it.meta}</Text> : null}
      {it.fields?.length ? <Stack direction="row" gap={1} wrap>{it.fields.slice(0, 3).map(([k, v]) => <Tag key={k} minimal round size="sm">{k} · {v}</Tag>)}</Stack> : null}
      <CardExtra it={it} />
    </ItemCard>
  );

  const body =
    b.laneSet ? <LaneRow laneSet={b.laneSet} items={items} card={(it, i) => card(it, i, false)} /> :
    mode === 'list' ? <Stack direction="column" gap={2}>{items.map((it, i) => card(it, i, true))}</Stack> :
    mode === 'tile' ? <Box scroll="x" paddingBottom={2}><Stack direction="row" gap={3} align="stretch">{items.map((it, i) => <Box key={i} width={TILE_W} flex="none">{card(it, i, false)}</Box>)}</Stack></Box> :
    // Cards with pictures take the mosaic's sizes; cards of words alone keep their own height, so none stands half empty.
    <Rows minItemWidth={GRID_MIN} cols={4} mosaic={items.some((it) => it.image)}>{items.map((it, i) => card(it, i, false))}</Rows>;

  return (
    <Stack direction="column" gap={3}>
      {b.facet ? <Facet list={b.facet} value={facet} onChange={setFacet} /> : null}
      {b.toolbar === false || b.laneSet ? null : <ViewToolbar mode={mode} onMode={setMode} count={items.length === 1 ? '1 item' : `${items.length} items`} />}
      {b.more ? <More more={b.more} /> : null}
      {body}
    </Stack>
  );
};
