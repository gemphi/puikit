import { Breadcrumbs, Button, Frame, Image, Pressable, Stack, Text, Title } from '@pui/components';
import React from 'react';
import { assetUrl, type Block } from '../data';
import type { GridItem } from '../blocks/Grid';
import { FieldList, cardPicture, cardTag } from '../blocks/GridExtra';

/** What a product's own page shows past its card: a look's views, its story, its facts and what it gives. */
type Page = { viewList?: { label: string; image: string }[]; body?: string; fieldList?: [string, string][]; pointList?: string[] };
export type ProductItem = GridItem & { page?: Page };
type Step = { label: string; view?: string };

/**
 * One product's own page, from the block's data alone: `item` (a grid card with `page`), `trail` (where it stands:
 * the shop, the page of its menu, itself) and `onAct` (a press of the card's action: into the bag, or out of it).
 * The picture is the card's own (a file, a cell of a sheet, colours); a product with views shows the one picked and
 * the others under it.
 */
export const Product: React.FC<{ b: Block }> = ({ b }) => {
  const it = b.item as ProductItem; const page = it.page ?? {};
  const views = page.viewList ?? [];
  const [angle, setAngle] = React.useState(0);
  const top = React.useRef<HTMLDivElement>(null);
  // Another product is another page: its first view, read from its top.
  React.useEffect(() => { setAngle(0); for (let e = top.current?.parentElement; e; e = e.parentElement) if (e.scrollTop) e.scrollTop = 0; }, [it.id]);
  const shown = views[angle] ?? views[0];
  return (
    <Stack as="article" direction="column" gap={4} ref={top}>
      {b.trail?.length ? <Breadcrumbs items={(b.trail as Step[]).map((t) => ({ label: t.label, href: t.view ? '#/' + t.view : undefined }))} /> : null}
      <Stack autoFill="22rem" gap={5} align="start">
        <Stack direction="column" gap={3}>
          {shown
            ? <Frame ratio="1/1" rounded="lg"><Image src={assetUrl(shown.image)} alt={it.title + ', ' + shown.label} fit="cover" fill /></Frame>
            : cardPicture(it, false, '1/1')}
          {views.length > 1 ? (
            <Stack direction="row" gap={2}>
              {views.map((v, i) => (
                <Pressable key={v.label} column flex="1 1 0" onClick={() => setAngle(i)} aria-label={v.label} aria-pressed={i === angle} opacity={i === angle ? 1 : 0.6}>
                  <Frame ratio="1/1" rounded="md"><Image src={assetUrl(v.image)} alt="" fit="cover" fill loading="lazy" /></Frame>
                  <Text as="span" size="xs" intent="secondary" truncate>{v.label}</Text>
                </Pressable>))}
            </Stack>) : null}
        </Stack>
        <Stack direction="column" gap={4}>
          <Stack direction="column" gap={1}>
            {it.kind ? <Text as="p" size="sm" intent="secondary">{it.kind}</Text> : null}
            <Title level={1} size="2xl" lineHeight={1.1}>{it.title}</Title>
            <Stack direction="row" gap={2} align="center">
              {it.sub ? <Text as="span" size="lg" weight="semibold" numeric>{it.sub}</Text> : null}
              {cardTag(it)}
            </Stack>
          </Stack>
          {it.action ? <Button variant="glass" size="lg" aria-pressed={!!it.selected} onClick={() => b.onAct?.(it)}>{it.action}</Button> : null}
          {page.body ? <Text intent="secondary" maxWidth="48ch">{page.body}</Text> : null}
          {page.fieldList?.length ? <FieldList list={page.fieldList} /> : null}
          {page.pointList?.length ? <Stack as="ul" gap={1} paddingLeft={5} margin={0}>{page.pointList.map((p) => <Text as="li" key={p} size="sm" intent="secondary">{p}</Text>)}</Stack> : null}
        </Stack>
      </Stack>
    </Stack>
  );
};
