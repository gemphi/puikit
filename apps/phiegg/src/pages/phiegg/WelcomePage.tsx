import React from 'react';
import { Button, DataTable, ItemCard, Page, Rows, SpriteImage, Stack, Tag, Text, Title } from '@pui/components';
import { FeatureShowcase, type Feature } from '@phi-kit/Showcase';
import { useStore } from '@pui/store';
import { D, rideSprite, seriesOf, t, worldImage, worldOf, rideKind } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { Tile } from '../../components/Phiegg/Tile';
import { PageSections } from '../../components/Phiegg/PageSections';
import type { RideKind } from '../../types/phiegg';

const L = D.landing as unknown as {
  hero: { kicker: string; title: string; body: string; primary: string; secondary: string };
  pillars: { id: string; title: string; body: string }[];
  compare: { columns: string[]; rows: { label: string; a: string; b: string }[] };
  cta: { title: string; body: string; primary: string; secondary: string };
  featured?: { worldIds: string[]; seriesIds: string[] };
};
const KINDS: RideKind[] = ['car', 'cab', 'van', 'jetski', 'saucer', 'fun'];

/** The public home page: a Muse-style welcome that sells Phiegg with real product shots, then the live worlds, rides
 *  and stories to walk straight into. Open to everyone. The marketing frame is the shared FeatureShowcase, so every
 *  app's landing reads the same — only its screenshots, copy and theme change. */
export const WelcomePage: React.FC = () => {
  const s = useStore(phieggStore);
  const worlds = (L.featured?.worldIds ?? []).map(worldOf).filter((w): w is NonNullable<typeof w> => !!w);
  const stories = (L.featured?.seriesIds ?? []).map(seriesOf).filter((x): x is NonNullable<typeof x> => !!x);
  const rides = KINDS.map((k) => D.ride.list.find((r) => r.kind === k)).filter((r): r is NonNullable<typeof r> => !!r);

  // The feature showcase: our terms, our screenshots. Each row is a real part of Phiegg.
  const features: Feature[] = [
    { eyebrow: 'Worlds', title: 'Worlds you can walk into', image: 'assets/landing/worlds.png',
      body: 'Virtual cities, AR layers over real streets, and agentic worlds run by agent citizens — every world a club builds and runs.',
      bullets: ['Virtual, AR and agentic worlds', 'Cities and nests inside each one', 'Built and governed by the club that hosts them'],
      cta: { label: 'Visit the worlds', onClick: () => s.go('worlds') } },
    { eyebrow: 'Clubs & pools', title: 'Every pool gets a home', image: 'assets/landing/explore.png',
      body: 'Clubs run pools of quests — the ways the next hatch gets made. Nests grow into worlds and cities; hosts are gated by what you hold.',
      bullets: ['Pools of quests, not speculation', 'Nests that grow into worlds', 'Membership from the PFTs you hold'],
      cta: { label: 'Explore clubs', onClick: () => s.go('explore') } },
    { eyebrow: 'The feed', title: 'A feed made of what people own', image: 'assets/landing/feed.png',
      body: 'Shots, looks and drops from across the worlds — tagged to the pieces you own. Every sale, quest and show earns $EGG.',
      bullets: ['Shots and looks tagged to real pieces', 'Drops and shows from every club', '$EGG earned, not farmed'],
      cta: { label: 'Open the feed', onClick: () => s.go('feed', { feedKind: 'all' }) } },
  ];

  return (
    <Page>
      <FeatureShowcase
        eyebrow={L.hero.kicker}
        title={L.hero.title}
        lede={L.hero.body}
        actions={<>
          <Button variant="primary" onClick={() => s.go('feed', { feedKind: 'all' })}>{L.hero.primary}</Button>
          <Button variant="outline" onClick={() => s.openSignIn()}>{t('hdSignIn')}</Button>
          <Button variant="ghost" onClick={() => s.go('phipad')}>{L.hero.secondary}</Button>
        </>}
        features={features}
        close={{ title: L.cta.title, body: L.cta.body, actions: <>
          <Button variant="primary" onClick={() => s.go('phipad')}>{L.cta.primary}</Button>
          <Button variant="outline" onClick={() => s.go('join')}>{L.cta.secondary}</Button>
        </> }}
      />

      {/* Walk straight in: the live worlds, rides and stories, pulled from the data. */}
      <Stack direction="column" gap={6} marginTop={10}>
        <PageSections id="welcome" sections={[
          { id: 'worlds', title: t('wlWorlds'), hint: t('wlWorldsHint'), expandable: true, content: (
            <Rows cols={3} colsSm={1} minItemWidth="16rem">{worlds.map((w) => (
              <Tile key={w.id} image={worldImage(w)} tone={w.tone} ratio="16/9" grid title={w.name} sub={w.description} depth={{ worldId: w.id, clubId: w.clubId }} onClick={() => s.go('world', { worldId: w.id })} />))}</Rows>) },
          { id: 'rides', title: t('rdTitle'), hint: t('rdSub'), content: (
            <Rows cols={6} colsSm={2} minItemWidth="9rem">{rides.map((r) => (
              <ItemCard key={r.id} depth={1} variant="flat" layout="vertical" tint={r.hex} onClick={() => s.go('rides')} media={<SpriteImage sprite={rideSprite(r)} alt={r.name} ratio="16 / 10" radius="lg" />} title={rideKind(r.kind)} meta={r.name} />))}</Rows>) },
          { id: 'stories', title: t('wlStories'), hint: t('wlStoriesHint'), content: (
            <Rows cols={3} colsSm={1} minItemWidth="16rem">{stories.map((x) => (
              <ItemCard key={x.id} depth={1} variant="flat" onClick={() => s.openSeries(x.id)} title={x.title} meta={[x.genre, worldOf(x.worldId)?.name].filter(Boolean).join(' · ')}>
                <Stack direction="column" gap={1}><Text size="sm">{x.synopsis}</Text>{x.after && <Tag minimal round size="sm">{t('wsAfter', { work: x.after })}</Tag>}</Stack>
              </ItemCard>))}</Rows>) },
          { id: 'compare', title: t('wlCompare'), content: (
            <DataTable rows={L.compare.rows} getKey={(r) => r.label} columns={[{ id: 'label', header: '', cell: (r) => <Text as="span" size="sm" weight="semibold">{r.label}</Text> }, { id: 'a', header: L.compare.columns[0], cell: (r) => r.a }, { id: 'b', header: L.compare.columns[1], cell: (r) => r.b }]} />) },
        ]} />
      </Stack>
    </Page>
  );
};
