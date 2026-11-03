import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, DataTable, Icon, Image, ItemCard, Pressable, Rows, SpriteImage, Stack, Tag, Text, Title, WorldScene } from '@pui/components';
import { Minus, Plus } from 'lucide-react';
import { useStore } from '@pui/store';
import { D, itemImage, rideSprite, seriesOf, t, worldImage, worldOf, rideKind } from '../../lib/data';
import { worldLogo } from '../../lib/media';
import { phieggStore } from '../../state/phieggStore';
import type { RideKind } from '../../types/phiegg';
import styles from './WelcomePage.module.scss';

const L = D.landing as unknown as {
  hero: { kicker: string; title: string; body: string; primary: string; secondary: string };
  pillars: { id: string; title: string; body: string }[];
  compare: { columns: string[]; rows: { label: string; a: string; b: string }[] };
  cta: { title: string; body: string; primary: string; secondary: string };
  featured?: { worldIds: string[]; seriesIds: string[] };
  art: { heroBack: string; heroCast: string[]; closingCast: string[]; worlds: Record<string, { image?: string }> };
};
const KINDS: RideKind[] = ['car', 'cab', 'van', 'jetski', 'saucer', 'fun'];

const Section: React.FC<{ eyebrow?: string; title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ eyebrow, title, sub, action, children }) => (
  <Box as="section" data-reveal className={styles.section}>
    <Box className={styles.head}>
      <Box className={styles.headCopy}>
        {eyebrow ? <Text as="span" className={styles.eyebrow}>{eyebrow}</Text> : null}
        <Title level={2} className={styles.heading}>{title}</Title>
        {sub ? <Text as="p" className={styles.sub}>{sub}</Text> : null}
      </Box>
      {action}
    </Box>
    {children}
  </Box>
);

/** Characters that drift on their own and lean with the pointer, each at its own depth. */
const Cast: React.FC<{ art: string[] }> = ({ art }) => (
  <>{art.map((src, i) => <Image key={src} className={[styles.cast, styles[`cast${i}`]].join(' ')} src={itemImage(src)} alt="" fit="contain" />)}</>
);

/** The pointer's place in a panel, as --mx and --my from -1 to 1, for the cast to lean with. */
const lean = (e: React.PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', String(((e.clientX - r.left) / r.width) * 2 - 1));
  e.currentTarget.style.setProperty('--my', String(((e.clientY - r.top) / r.height) * 2 - 1));
};

/** The public home page, after Meta's Worlds and Muse pages: characters around one big scene, world portals, a tour of
 *  what's inside with real product shots, then the live rides and stories. Open to everyone. */
export const WelcomePage: React.FC = () => {
  const s = useStore(phieggStore);
  const worlds = (L.featured?.worldIds ?? []).map(worldOf).filter((w): w is NonNullable<typeof w> => !!w).slice(0, 6);
  const stories = (L.featured?.seriesIds ?? []).map(seriesOf).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 6);
  const rides = KINDS.map((k) => D.ride.list.find((r) => r.kind === k)).filter((r): r is NonNullable<typeof r> => !!r);

  // The tour: our terms, our screenshots. Each choice is a real part of Phiegg.
  const tour = [
    { title: 'Worlds you can walk into', image: 'assets/landing/worlds.png',
      body: 'Virtual cities, AR layers over real streets, and agentic worlds run by agent citizens - every world a club builds and runs.',
      cta: { label: 'Visit the worlds', onClick: () => s.go('worlds') } },
    { title: 'Every pool gets a home', image: 'assets/landing/explore.png',
      body: 'Clubs run pools of quests - the ways the next hatch gets made. Nests grow into worlds and cities; hosts are gated by what you hold.',
      cta: { label: 'Explore clubs', onClick: () => s.go('explore') } },
    { title: 'A feed made of what people own', image: 'assets/landing/feed.png',
      body: 'Shots, looks and drops from across the worlds - tagged to the pieces you own. Every sale, quest and show earns $EGG.',
      cta: { label: 'Open the feed', onClick: () => s.go('feed', { feedKind: 'all' }) } },
  ];
  const [open, setOpen] = useState(0);

  // Sections rise in as they scroll into view.
  const page = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parts = page.current?.querySelectorAll('[data-reveal]');
    if (!parts) return;
    const seen = new IntersectionObserver((rows) => rows.forEach((r) => { if (r.isIntersecting) { r.target.setAttribute('data-shown', ''); seen.unobserve(r.target); } }), { threshold: 0.08 });
    parts.forEach((p) => seen.observe(p));
    return () => seen.disconnect();
  }, []);

  return (
    <Box ref={page} className={styles.page}>
      <Box as="section" className={styles.hero} onPointerMove={lean}>
        <Image className={styles.scene} src={itemImage(L.art.heroBack)} alt="" fit="cover" fill />
        <Cast art={L.art.heroCast} />
        <Box className={styles.copy}>
          <Text as="span" className={styles.kicker}>{L.hero.kicker}</Text>
          <Title level={1} className={styles.heroTitle}>{L.hero.title}</Title>
          <Text as="p" className={styles.lede}>{L.hero.body}</Text>
          <Box className={styles.actions}>
            <Button variant="primary" onClick={() => s.go('feed', { feedKind: 'all' })}>{L.hero.primary}</Button>
            <Button variant="outline" className={styles.glass} onClick={() => s.openSignIn()}>{t('hdSignIn')}</Button>
          </Box>
        </Box>
      </Box>

      <Section sub={t('wlWorldsHint')} title={t('wlWorlds')} action={<Button variant="outline" onClick={() => s.go('worlds')}>Visit the worlds</Button>}>
        <Box className={styles.portals}>
          {worlds.map((w, i) => {
            const art = L.art.worlds[w.name];
            return (
              <Pressable key={w.id} className={styles.portal} style={{ '--i': i } as React.CSSProperties} onClick={() => s.go('world', { worldId: w.id })} aria-label={w.name}>
                <Image className={styles.scene} src={art?.image ? itemImage(art.image) : worldImage(w) ?? ''} alt="" fit="cover" fill loading="lazy" />
                <Box className={styles.portalCopy}>
                  {worldLogo(w.name) ? <Image className={styles.portalLogo} src={worldLogo(w.name) ?? ''} alt="" fit="contain" /> : <Text as="span" className={styles.portalName}>{w.name}</Text>}
                  <Text as="span" className={styles.portalBody}>{w.description}</Text>
                </Box>
              </Pressable>
            );
          })}
        </Box>
      </Section>

      <Section title="Everything lives inside">
        <Box className={styles.tour}>
          <Box className={styles.choices}>
            {tour.map((f, i) => (
              <Box key={f.title} className={styles.choice}>
                <Pressable className={styles.choiceHead} aria-expanded={open === i} onClick={() => setOpen(i)}>
                  {f.title}<Icon name={open === i ? Minus : Plus} />
                </Pressable>
                {open === i ? (
                  <Box className={styles.choiceBody}>
                    <Text as="p">{f.body}</Text>
                    <Button variant="primary" onClick={f.cta.onClick}>{f.cta.label}</Button>
                  </Box>
                ) : null}
              </Box>
            ))}
          </Box>
          <Box className={styles.shot}>
            <Image key={open} className={[styles.scene, styles.fade].join(' ')} src={itemImage(tour[open].image)} alt={tour[open].title} fit="cover" fill />
          </Box>
        </Box>
      </Section>

      <Section sub={t('rdSub')} title={t('rdTitle')}>
        <Rows cols={6} colsSm={2} minItemWidth="9rem">{rides.map((r) => (
          <ItemCard key={r.id} depth={1} variant="flat" layout="vertical" tint={r.hex} onClick={() => s.go('rides')} media={<SpriteImage sprite={rideSprite(r)} alt={r.name} ratio="16 / 10" radius="lg" />} title={rideKind(r.kind)} meta={r.name} />))}</Rows>
      </Section>

      <Section sub={t('wlStoriesHint')} title={t('wlStories')}>
        <Box className={styles.stories}>{stories.map((x) => (
          <Pressable key={x.id} className={styles.story} onClick={() => s.openSeries(x.id)} aria-label={x.title}>
            <Box className={styles.storyArt}><Image className={styles.scene} src={worldImage(worldOf(x.worldId)) ?? ''} alt="" fit="cover" fill loading="lazy" /></Box>
            <Stack direction="column" gap={1} className={styles.storyCopy}>
              <Text as="span" className={styles.storyTitle}>{x.title}</Text>
              <Text as="span" size="xs" intent="muted">{[x.genre, worldOf(x.worldId)?.name].filter(Boolean).join(' · ')}</Text>
              <Text as="span" size="sm" intent="secondary">{x.synopsis}</Text>
              {x.after && <Box><Tag minimal round size="sm">{t('wsAfter', { work: x.after })}</Tag></Box>}
            </Stack>
          </Pressable>))}</Box>
      </Section>

      <Section title={t('wlCompare')}>
        <DataTable rows={L.compare.rows} getKey={(r) => r.label} columns={[{ id: 'label', header: '', cell: (r) => <Text as="span" size="sm" weight="semibold">{r.label}</Text> }, { id: 'a', header: L.compare.columns[0], cell: (r) => r.a }, { id: 'b', header: L.compare.columns[1], cell: (r) => r.b }]} />
      </Section>

      <Box as="section" data-reveal className={styles.closing} onPointerMove={lean}>
        <Box className={styles.scene}><WorldScene seed="phiegg-hatch" night pattern="none" /></Box>
        <Cast art={L.art.closingCast} />
        <Box className={styles.copy}>
          <Title level={2} className={styles.closingTitle}>{L.cta.title}</Title>
          <Text as="p" className={styles.lede}>{L.cta.body}</Text>
          <Box className={styles.actions}>
            <Button variant="primary" onClick={() => s.go('phipad')}>{L.cta.primary}</Button>
            <Button variant="outline" className={styles.glass} onClick={() => s.go('join')}>{L.cta.secondary}</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
