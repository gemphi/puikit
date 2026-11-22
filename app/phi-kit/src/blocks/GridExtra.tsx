import React from 'react';
import { Box, Button, Frame, Image, ProgressBar, SpriteImage, Stack, Swatch, TabList, Tag, Text } from '@pui/components';
import { assetUrl } from '../data';
import s from '../kit.module.scss';
import type { GridItem } from './Grid';

/** The optional parts of the one Grid: a card's tinted head, tag, figure, meter and point list, and the grid's lane,
 *  facet and "more" rows. A site asks for them by data (`tone`, `mark`, `tag`, `progress`, `laneSet`, `facet`). */

/** A tone by name, from the theme: [fill, ink]. */
const TONE: Record<string, [string, string]> = {
  accent: ['var(--phi-organic-accent-300)', 'var(--phi-organic-accent-900)'],
  sage: ['var(--phi-organic-sage-300)', 'var(--phi-organic-sage-900)'],
  ink: ['var(--phi-color-text-primary)', 'var(--phi-color-text-inverse)'],
  neutral: ['var(--phi-color-background-secondary)', 'var(--phi-color-text-primary)'],
};
const toneOf = (t?: string) => TONE[t ?? ''] ?? TONE.neutral;

/** A meter in the theme's colours; `split` shows two shares (for and against). */
export const meter = (value: number, split?: boolean) => (
  split ? <ProgressBar value={value} color="var(--phi-color-success)" rest="var(--phi-color-error)" /> : <ProgressBar value={value} size="sm" />
);

/** The head of a card with no picture: a round mark (initials, a step number) in its tone. A card with a tone and no
 *  mark has no head: its title is the card's own, said once. */
export const cardHead = (it: GridItem): React.ReactNode => {
  if (!it.mark) return undefined;
  const [fill, ink] = toneOf(it.tone);
  return <Frame ratio="1/1" width="2.5rem" rounded="full" tint={fill} tintStrength={100} ink={ink}><Text as="span" size="sm" weight="bold">{it.mark}</Text></Frame>;
};

/** A card's picture: its own file, a cell of a sheet, or its colours (the first a square, a theme's ground, the rest
 *  round, its accents) on the kit's surface like every picture; with none of them, its head.
 *  In a list it is a small square; `wide` is the shape of a card's own file elsewhere (a panel). */
export const cardPicture = (it: GridItem, list: boolean, wide = '16/9'): React.ReactNode => {
  const shape = { rounded: 'md' as const, width: list ? '4.5rem' : undefined };
  if (it.image) return <Frame ratio={list ? '1/1' : wide} {...shape}><Image src={assetUrl(it.image)} alt="" fit="cover" fill loading="lazy" /></Frame>;
  if (it.sprite) return <Frame ratio="1/1" {...shape}><SpriteImage sprite={{ src: assetUrl(it.sprite.sheet), cols: it.sprite.cols, index: it.sprite.index }} alt={it.title} radius="md" /></Frame>;
  if (it.swatch?.length) return (
    <Frame ratio={list ? '1/1' : wide} {...shape}>
      <Stack direction="row" gap={list ? 1 : 2} align="center">{it.swatch.map((c, i) => <Swatch key={i} color={c} size={list ? 'xs' : 'lg'} shape={i ? 'round' : 'square'} label={it.title} />)}</Stack>
    </Frame>);
  return cardHead(it);
};

/** A record's facts, one a row: what it is called, and what the record holds there. */
export const FieldList: React.FC<{ list: [string, string][] }> = ({ list }) => (
  <Stack direction="column" gap={1}>
    {list.map(([k, v]) => (
      <Stack key={k} direction="row" justify="between" gap={3} paddingY={1} className={s.fieldRow}>
        <Text as="span" size="sm" intent="muted">{k}</Text><Text as="span" size="sm" weight="medium" align="right">{v}</Text>
      </Stack>))}
  </Stack>
);

/** The tag at the end of a card's title row (a stage, a status). */
export const cardTag = (it: GridItem): React.ReactNode => (it.tag ? <Tag minimal round intent={it.tagIntent}>{it.tag}</Tag> : undefined);

/** What a card can add under its body: a big figure, a meter, one more line, a list of points. */
export const CardExtra: React.FC<{ it: GridItem }> = ({ it }) => (
  <>
    {it.value ? <Text as="span" font="heading" size="3xl" lineHeight={1}>{it.value}</Text> : null}
    {it.progress != null ? meter(it.progress, it.split) : null}
    {it.note ? <Text as="span" size="xs" intent="muted">{it.note}</Text> : null}
    {it.pointList?.length ? <Stack as="ul" gap={1} paddingLeft={5} margin={0}>{it.pointList.map((p) => <Text as="li" key={p} size="sm" intent="secondary">{p}</Text>)}</Stack> : null}
  </>
);

export type Lane = { id: string; label: string };

/** The grid as lanes (a pipeline by stage): one column per lane, each with its count, holding the cards whose `lane` names it. */
export const LaneRow: React.FC<{ laneSet: Lane[]; items: GridItem[]; card: (it: GridItem, i: number) => React.ReactNode }> = ({ laneSet, items, card }) => (
  <Box scroll="x" paddingBottom={2}>
    <Stack direction="row" gap={3} align="start">
      {laneSet.map((l) => {
        const own = items.map((it, i) => [it, i] as const).filter(([it]) => it.lane === l.id);
        return (
          <Stack key={l.id} direction="column" gap={2} flex="1 0 14rem" minWidth="14rem">
            <Text as="strong" weight="bold">{l.label} <Text as="span" size="xs" intent="muted">{own.length}</Text></Text>
            {own.map(([it, i]) => card(it, i))}
          </Stack>
        );
      })}
    </Stack>
  </Box>
);

/** The facet row above a grid: the first entry shows every card, each other entry the cards whose `facet` matches it. */
export const Facet: React.FC<{ list: string[]; value: string; onChange: (v: string) => void }> = ({ list, value, onChange }) => (
  <TabList size="sm" variant="pills" activeId={value} onChange={(id) => onChange(String(id))} items={list.map((x) => ({ id: x, label: x }))} />
);
export const inFacet = (items: GridItem[], list: string[] | undefined, value: string) => (
  list && value !== list[0] ? items.filter((it) => (it.facet ?? '').toLowerCase() === value.toLowerCase()) : items
);

/** The link from a short grid to the full page (`more: { label, view }`). */
export const More: React.FC<{ more: { label: string; view?: string; href?: string } }> = ({ more }) => (
  <Stack direction="row" justify="end"><Button variant="glass" href={more.href || '#/' + more.view}>{more.label}</Button></Stack>
);
