
import React from 'react';
import { Divider, Frame, Image, Stack, Tag, Text, Title } from '@pui/components';
import { assetUrl, type Block } from '../data';
import s from '../kit.module.scss';
import { HeroSplit, Ways } from './Site';

/** The ways in a hero offers, the same in every variant (Site.tsx's Ways: an `off` one cannot be pressed). */
const heroActions = (b: Block) => <Ways items={b.actions} />;

/** `variant: "card"`: a site card (kit.module.scss .siteCard), its picture in a panel of the theme's sweep and its
 *  words beside it; `flip` puts the words first. */
const HeroCard: React.FC<{ b: Block }> = ({ b }) => (
  <section className={b.flip ? s.siteCard + ' ' + s.siteCardFlip : s.siteCard}>
    <div className={s.siteCardPanel}>{b.image ? <img src={assetUrl(b.image)} alt="" loading="lazy" /> : null}</div>
    <div className={s.siteCardWords}>
      <h2 className={s.siteCardTitle}>{b.heading}</h2>
      {b.body ? <p className={s.siteCardBody}>{b.body}</p> : null}
      {heroActions(b)}
    </div>
  </section>
);

/** Hero band for an app's Home view. `variant: "wide"` is a product page's: the name, one line and the ways in,
 *  centred, then its picture across the page. */
export const Hero: React.FC<{ b: Block }> = ({ b }) => (b.variant === 'split' ? <HeroSplit b={b} actions={heroActions(b)} /> : b.variant === 'card' ? <HeroCard b={b} /> : b.variant === 'wide' ? (
  <Stack direction="column" gap={6} align="center" paddingY={6}>
    <Stack direction="column" gap={3} align="center">
      <Title level={1} size="3xl" align="center">{b.heading}</Title>
      {b.subtitle ? <Text size="xl" intent="secondary" maxWidth="40ch" align="center">{b.subtitle}</Text> : null}
      <Ways items={b.actions} justify="center" />
    </Stack>
    {/* The picture in a panel of the theme's sweep, as a site card holds it. */}
    {b.image ? <div className={s.siteCardPanel} style={{ width: '100%' }}><img src={assetUrl(b.image)} alt="" /></div> : null}
  </Stack>
) : (
  <Stack direction="row" gap={6} padding={8} rounded="lg" background="gradient-sidebar" wrap align="center">
  {/* `flip` puts the picture first, so rows of a page can take turns (a product page's features). */}
  {b.flip ? heroPicture(b) : null}
  <Stack direction="column" gap={3} flex="1 1 22rem" minWidth="0">
    <Title level={1} size="3xl">{b.heading}</Title>
    {b.subtitle ? <Text size="lg" intent="secondary">{b.subtitle}</Text> : null}
    {b.body ? <Text intent="secondary" maxWidth="64ch">{b.body}</Text> : null}
    {heroActions(b)}
  </Stack>
  {b.flip ? null : heroPicture(b)}
  </Stack>
));

/** A hero's picture: `ratio` keeps its own shape (a square portrait: "1/1"), `pictureWidth` how wide it may grow
 *  (a screenshot wants more than a portrait). */
const heroPicture = (b: Block) => (b.image ? (
  <Frame ratio={b.ratio ?? '16/10'} rounded="lg" width={`min(100%, ${b.pictureWidth ?? '26rem'})`} flex={`0 1 ${b.pictureWidth ?? '26rem'}`}><Image src={assetUrl(b.image)} alt="" fit="cover" fill /></Frame>
) : null);

/** Dated news / announcement list. */
export const News: React.FC<{ b: Block }> = ({ b }) => (
  <Stack direction="column" gap={3}>
    {(b.items || []).map((n: any, i: number) => (
      <Stack key={i} direction="column" gap={2}>
        <Stack direction="row" gap={4} align="start">
          {n.image ? <Frame ratio="4/3" rounded="md" width="8.5rem" flex="none"><Image src={assetUrl(n.image)} alt="" fit="cover" fill loading="lazy" /></Frame> : null}
          <Stack direction="column" gap={1} minWidth="0">
            <Stack direction="row" gap={2} wrap align="baseline">{n.tag ? <Text size="xs" weight="medium" as="span">{n.tag}</Text> : null}<Text size="xs" intent="muted" as="span">{n.date}</Text></Stack>
            <Title level={3} size="md">{n.title}</Title>
            <Text size="sm" intent="secondary">{n.body}</Text>
          </Stack>
        </Stack>
        <Divider />
      </Stack>
    ))}
  </Stack>
);

/** Long-form prose sections (About). */
export const Prose: React.FC<{ b: Block }> = ({ b }) => (
  <Stack direction="column" gap={4} maxWidth="70ch">
    {b.lead ? <Text size="lg" intent="secondary">{b.lead}</Text> : null}
    {(b.sections || []).map((sec: any, i: number) => (
      <Stack key={i} direction="column" gap={1}><Title level={2} size="lg">{sec.title}</Title><Text size="sm" intent="secondary">{sec.body}</Text></Stack>
    ))}
  </Stack>
);

/** Question / answer list (FAQ). */
export const Faq: React.FC<{ b: Block }> = ({ b }) => (
  <Stack direction="column" gap={0} maxWidth="70ch">{(b.items || []).map((f: any, i: number) => (
    <Stack key={i} direction="column" gap={1} paddingY={4}>
      <Text weight="bold">{f.q}</Text><Text size="sm" intent="secondary">{f.a}</Text>
      <Divider />
    </Stack>
  ))}</Stack>
);
