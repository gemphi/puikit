import React from 'react';
import { Box, Button, Frame, Image, ItemCard, Rows, Stack, Tag, Text, ViewToolbar, type ViewMode } from '@pui/components';
import { appUrl, assetUrl, type Block } from '../data';

export type GridItem = { id?: string; kind?: string; route?: string; title: string; sub?: string; body?: string; action?: string; done?: string; app?: string; href?: string; cost?: number; meta?: string; image?: string; fields?: [string, string][] };

/** One grid, every app: the shared ItemCard laid out by Rows, with the house layout toolbar (tile · list · grid).
 *  Nothing bespoke — the card's border, gradient and spacing are the framework's, the only difference is the data. */
export const GRID_MIN = '16rem';
const TILE_W = '18rem';

export const Grid: React.FC<{ b: Block; onOpen: (it: GridItem) => void }> = ({ b, onOpen }) => {
  const [done, setDone] = React.useState<Record<number, boolean>>({});
  const [mode, setMode] = React.useState<ViewMode>((b.layout as ViewMode) || 'grid');
  const items: GridItem[] = b.items || [];
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const card = (it: GridItem, i: number, list: boolean) => (
    <ItemCard key={i} layout={list ? 'auto' : 'vertical'} onClick={() => onOpen(it)}
      media={it.image ? <Frame ratio={list ? '1/1' : '16/9'} rounded="md" width={list ? '4.5rem' : undefined}><Image src={assetUrl(it.image)} alt="" fit="cover" fill loading="lazy" /></Frame> : undefined}
      title={it.title} meta={it.sub}
      actions={it.action ? (
        it.app || it.href
          ? <Button variant="outline" size="sm" href={it.href || appUrl(it.app!)} onClick={stop}>{it.action}</Button>
          : <Button variant={done[i] ? 'ghost' : 'outline'} size="sm" onClick={(e) => { stop(e); setDone((d) => ({ ...d, [i]: !d[i] })); }}>{done[i] ? it.done || 'Done' : it.action}</Button>
      ) : undefined}>
      {it.body ? <Text as="p" size="sm" intent="secondary">{it.body}</Text> : null}
      {it.meta ? <Text as="span" size="xs" intent="muted" mono>{it.meta}</Text> : null}
      {it.fields?.length ? <Stack direction="row" gap={1} wrap>{it.fields.slice(0, 3).map(([k, v]) => <Tag key={k} minimal round size="sm">{k} · {v}</Tag>)}</Stack> : null}
    </ItemCard>
  );

  const body =
    mode === 'list' ? <Stack direction="column" gap={2}>{items.map((it, i) => card(it, i, true))}</Stack> :
    mode === 'tile' ? <Box scroll="x" paddingBottom={2}><Stack direction="row" gap={3} align="stretch">{items.map((it, i) => <Box key={i} width={TILE_W} flex="none">{card(it, i, false)}</Box>)}</Stack></Box> :
    <Rows minItemWidth={GRID_MIN} cols={4}>{items.map((it, i) => card(it, i, false))}</Rows>;

  return (
    <Stack direction="column" gap={3}>
      <ViewToolbar mode={mode} onMode={setMode} count={items.length === 1 ? '1 item' : `${items.length} items`} />
      {body}
    </Stack>
  );
};
