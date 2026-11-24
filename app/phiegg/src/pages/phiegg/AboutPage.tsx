import React from 'react';
import * as Lucide from 'lucide-react';
import { Backdrop, Bands, Box, Button, Grid, Icon, Image, ItemCard, Label, Picture, Showcase, Tag, Text, Title } from '@pui/components';
import { StatGrid } from '@phi-kit/blocks/Stats';
import { useStore } from '@pui/store';
import about from '../../data/about.json';
import { D, dataAt, fmt, itemOf, t, usd } from '../../lib/data';
import { mediaUrl } from '../../lib/media';
import { phieggStore } from '../../state/phieggStore';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import styles from './AboutPage.module.scss';
import { OpensPost } from '../../components/Phiegg/OpensPost';
import { pictureId } from '../../lib/picturePost';

type Tab = Parameters<ReturnType<typeof phieggStore.getState>['go']>[0];
type Link = { label: string; tab: string };
const glyph = (name: string) => (Lucide as unknown as Record<string, Lucide.LucideIcon>)[name] ?? Lucide.Circle;

/**
 * The About page (/about): who Phiegg is, read as a run of screens, every word and picture from data/about.json. The
 * mission over the arena, the parts of the platform with a picture each (sides alternating), today's counts, the
 * coins (how they move, then the most held club coins) and the closing screen. Open to all.
 */
export const AboutPage: React.FC = () => {
  const s = useStore(phieggStore);
  const go = (l: Link) => s.go(l.tab as Tab);
  const button = (l?: Link) => (l ? <Button key={l.tab} variant="glass" onClick={() => go(l)}>{l.label}</Button> : null);
  const coins = [...D.economy.coins].sort((a, b) => b.holders - a.holders).slice(0, about.coin.shown);
  return (
    <Box className={styles.page}>
      <Backdrop><Image src={mediaUrl(about.hero.picture)} alt="" fit="cover" fill /></Backdrop>
      <Showcase auto={0} picker={false} labels={{ prev: t('slPrev'), next: t('slNext'), picker: about.hero.kicker }}
        slides={[{ id: 'about', src: mediaUrl(about.hero.picture), title: about.hero.title, sub: about.hero.body }]}
        actions={() => <>{button(about.hero.primary)}{button(about.hero.secondary)}</>} />

      {about.band.map((b, i) => (
        <Box as="section" key={b.id} className={`${styles.band} ${i % 2 ? styles.flip : ''}`}>
          <Box className={styles.shot}><OpensPost id={pictureId(b.picture)} label={b.title} fill><Picture src={mediaUrl(b.picture)} /></OpensPost></Box>
          <Box className={styles.words}>
            <Title level={2} className={styles.heading}>{b.title}</Title>
            <Text as="p" className={styles.lede}>{b.body}</Text>
            {button(b.cta)}
          </Box>
        </Box>))}

      <Box as="section" className={styles.block}>
        <Title level={2} className={styles.heading}>{about.figure.title}</Title>
        <StatGrid size="sm" items={about.figure.item.map((x) => ({ label: x.label, value: fmt(((dataAt(x.count) as unknown[] | undefined) ?? []).length) }))} />
      </Box>

      <Box as="section" className={styles.block}>
        <Title level={2} className={styles.heading}><Label icon={<Icon icon={Lucide.Coins} size="md" />}>{about.coin.title}</Label></Title>
        <Text as="p" className={styles.lede}>{about.coin.body}</Text>
        <Grid gap={3} xs={1} sm={2} lg={4}>{about.coin.step.map((x) => (
          <Bands key={x.title} className={styles.step}>
            <Icon icon={glyph(x.icon)} size="lg" />
            <Title level={3} size="md">{x.title}</Title>
            <Text as="p" size="sm" intent="secondary">{x.body}</Text>
          </Bands>))}</Grid>
        <Grid gap={2} xs={1} sm={2} lg={4}>{coins.map((c) => { const club = c.clubId ? itemOf('club', c.clubId) : undefined; return (
          <ItemCard key={c.id} variant="flat" stackBelow="never" onClick={() => go(about.coin.cta)} media={<EntityAvatar id={c.clubId ?? c.id} name={club?.name ?? c.name} size="lg" />}
            title={c.symbol} meta={about.coin.held.replace('{n}', fmt(c.holders))}
            aside={<Tag minimal round size="sm">{usd(c.price)}</Tag>} />); })}</Grid>
        {button(about.coin.cta)}
      </Box>

      <Showcase height="min(34rem, 70vh)" auto={0} picker={false} labels={{ prev: t('slPrev'), next: t('slNext'), picker: about.closing.title }}
        slides={[{ id: 'closing', src: mediaUrl(about.closing.picture), title: about.closing.title, sub: about.closing.body }]}
        actions={() => <>{button(about.closing.primary)}{button(about.closing.secondary)}</>} />
    </Box>
  );
};
