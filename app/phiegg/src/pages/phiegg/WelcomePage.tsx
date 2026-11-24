import React, { useState } from 'react';
import { Backdrop, Bands, Box, CardStage, FocusBand, Button, Card, DataTable, Icon, Image, Label, Picture, Rows, Showcase, SpriteImage, StageSlider, TabList, Text, Title, type ShowcaseSlide, type StageSlide } from '@pui/components';
import { Tile } from '../../components/Phiegg/Tile';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import { PageSections } from '../../components/Phiegg/PageSections';
import { Bookmark, Heart, MessageCircle, Share2, Sparkles, type LucideIcon } from 'lucide-react';
import { useStore } from '@pui/store';
import { D, fmt, rideKind, rideSprite, t, worldMark, itemOf } from '../../lib/data';
import { mediaUrl } from '../../lib/media';
import { pictureId } from '../../lib/picturePost';
import { stageCards } from '../../components/Phiegg/stageCards';
import { phieggStore } from '../../state/phieggStore';
import { AgentChat } from '../../components/Phiegg/AgentChat';
import type { RideKind, World } from '../../types/phiegg';
import styles from './WelcomePage.module.scss';

type Tab = Parameters<ReturnType<typeof phieggStore.getState>['go']>[0];
const L = D.landing as unknown as {
  hero: { primary: string };
  compare: { columns: string[]; rows: { label: string; a: string; b: string }[] };
  cta: { title: string; body: string; primary: string; secondary: string };
  featured?: { seriesIds: string[] };
  stage: { origin: string; auto: number; enter: string; about: string; sub: string; lead?: { id: string; src: string; title: string; sub: string }[]; kinds: { id: string; label: string }[]; kindsLabel: string; most: number };
  ask: { title: string; body: string; agentId: string; context: string; prompts: string[]; fan: string[]; fanShown?: number };
  gallery?: { title: string; all: string; group: { id: string; label: string; ratio: string; picture: string[] }[] };
  step: { before: string; after: string; body: string; cta: string; picture?: string[]; centre?: string };
  tour: { title: string; image: string; body: string; cta: string; tab: string }[];
  rows: { worlds: string; posts: string; rides: string; compare: string };
  post: { origin: string; picture: string };
  closing: { world: string };
  cascade: { min: number; sides: number; sideScale: number; overlap: number; outerOverlap: number; rides: number };
};
const KINDS: RideKind[] = ['car', 'cab', 'van', 'jetski', 'saucer', 'fun'];
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
/** A city's finished view: the three-quarter one first, then whichever it has. */
const view = (w: World, size: 'sm' | 'lg') => { const g = w.gallery?.find((x) => x.view === 'three-quarter') ?? w.gallery?.[0]; return g ? mediaUrl(g[size]) : undefined; };

/**
 * The public home page, in our own look after the TV-style stage, the assistant at the centre and the worlds you step
 * into: the 16 cities on a screen-filling stage (each whole on screen), Lora's Spark to ask between their posts, the
 * cities to step into, a short tour, cascades of worlds, posts and rides, and the closing city. Open to all.
 */
export const WelcomePage: React.FC = () => {
  const s = useStore(phieggStore);
  const cities = D.core.worlds.filter((w) => w.origin === L.stage.origin && w.gallery?.length);
  // The cities' own posts, named by the data (landing.json post), never stand-in art.
  const posts = D.feed.shots.filter((x) => x.origin === L.post.origin && (x.media.src ?? '').includes(L.post.picture));
  const pics = posts.map((x) => mediaUrl(x.media.src!));
  // The pictures either side of the chat are named in the data (landing.json ask.fan), half a side.
  // `fanShown` of them are picked on each visit: the first always, the rest at random.
  const [fan] = useState(() => { const [first, ...rest] = L.ask.fan; return [first, ...rest.sort(() => Math.random() - 0.5)].slice(0, L.ask.fanShown ?? L.ask.fan.length).map(mediaUrl); });
  const half = Math.ceil(fan.length / 2);
  // Rides for the cascade: one of each kind first, then more until the row is full.
  const firsts = KINDS.map((k) => D.ride.list.find((r) => r.kind === k)).filter((r): r is NonNullable<typeof r> => !!r);
  const rides = [...firsts, ...D.ride.list.filter((r) => !firsts.includes(r))].slice(0, Math.max(L.cascade.rides, L.cascade.min));
  const close = cities.find((w) => w.name === L.closing.world) ?? cities[0];

  // The finished renders in their sets (landing.json gallery): a tab per set, and one for all of them.
  const [set, setSet] = useState('all');
  const shown = (L.gallery?.group ?? []).filter((g) => set === 'all' || g.id === set);

  // The stage's cards, once a visit (shows come in after the page; the cards follow them).
  const cards = React.useMemo(() => stageCards(cities, view, L.stage.most), [cities.length, D.shows.shows.length]); // eslint-disable-line react-hooks/exhaustive-deps
  // Every card on Home sits inside the two bands of light (kit Bands), so it merges into its row.
  // The same actions everywhere, as on the post itself: like, comments, save, share.
  const share = () => { void navigator.clipboard?.writeText(location.href); s.flash(t('isCopied')); };
  const act = (id: string, label: string, I: LucideIcon, onClick: () => void, active?: boolean) => ({ id, label, icon: <I size={18} />, onClick, active });
  const postActs = (id: string) => [act('like', t('isLike'), Heart, () => s.toggle('liked', id), !!s.liked[id]), act('comments', t('poViewComments'), MessageCircle, () => s.openComments(id, 0)),
    act('save', t('isSave'), Bookmark, () => s.toggle('saved', id), !!s.saved[id]), act('share', t('isShare'), Share2, share)];
  const worldActs = (id: string) => [act('like', t('isLike'), Heart, () => s.toggle('liked', id), !!s.liked[id]), act('save', t('isSave'), Bookmark, () => s.toggle('saved', id), !!s.saved[id]), act('share', t('isShare'), Share2, share)];
  const cascade = (items: StageSlide[]) => <StageSlider items={items.map((x) => ({ ...x, node: <Bands>{x.node}</Bands> }))} sides={L.cascade.sides} sideScale={L.cascade.sideScale} overlap={L.cascade.overlap} outerOverlap={L.cascade.outerOverlap}
    prevLabel={t('slPrev')} nextLabel={t('slNext')} positionLabel={(k, n) => t('slPos', { i: k, n })} />;
  // A few cities picked at random on each visit for the worlds stage (data: landing.json worldStage).
  const [picked] = useState(() => [...cities].sort(() => Math.random() - 0.5).slice(0, Math.max(L.cascade.min, 7)));

  return (
    <Box className={styles.page}>
      {/* The stage: Phiegg's reels, shows, drops and worlds as cards that fill it (kit CardStage); the first card's
          picture is the page's ground, blurred. A press opens a card as a post. */}
      {cards[0] && <Backdrop><Image className={styles.ground} src={cards[0].image} alt="" /></Backdrop>}
      <Box as="section" className={styles.stage}>
        <CardStage cards={cards} kinds={L.stage.kinds} onOpen={(id) => s.openPost(id)} auto={L.stage.auto}
          labels={{ prev: t('slPrev'), next: t('slNext'), kinds: L.stage.kindsLabel }} />
        <Box className={styles.stageActions}>
          <Button variant="glass" onClick={() => s.go('feed', { feedKind: 'all' })}>{L.hero.primary}</Button>
          <Button variant="glass" onClick={() => s.openSignIn()}>{t('hdSignIn')}</Button>
          <Button variant="glass" onClick={() => s.go('about' as Tab)}>{L.stage.about}</Button>
        </Box>
      </Box>

      {/* Ask: the agent at the centre, her own renders fanned out on either side. */}
      <Box as="section" className={styles.ask}>
        <Box className={styles.askHead}>
          <Title level={2} className={styles.heading}><Label icon={<Icon icon={Sparkles} size="md" />}>{L.ask.title}</Label></Title>
          <Text as="p" className={styles.lede}>{L.ask.body}</Text>
        </Box>
        <Box className={styles.fan}>
          {fan.slice(0, half).map((src, i) => <Bands key={src} className={styles.fanCard} style={{ '--k': i - half } as React.CSSProperties}><Box className={styles.fanPicture}><Picture src={src} /></Box></Bands>)}
          <Bands className={styles.phone}><AgentChat agentId={L.ask.agentId} context={L.ask.context} prompts={L.ask.prompts} /></Bands>
          {fan.slice(half).map((src, i) => <Bands key={src} className={styles.fanCard} style={{ '--k': i + 1 } as React.CSSProperties}><Box className={styles.fanPicture}><Picture src={src} /></Box></Bands>)}
        </Box>
      </Box>

      {/* Step in: the line split across the band, the cities' posts floating round it. A picture pressed comes to the
          middle, half the band, everything else stepping back but the arrows; pressed again it opens as a post. */}
      <FocusBand className={styles.step} onOpen={(id) => s.openPost(id)} labels={{ close: t('close') }} items={[
        ...(L.step.picture ?? []).slice(0, L.step.centre ? 5 : 6).map((src, i) => ({ id: pictureId(src), label: L.step.after,
          className: `${styles.capsule} ${styles.upright} ${L.step.centre ? styles.around : ''}`, style: { '--i': i } as React.CSSProperties,
          node: <Box as="span" className={styles.pill}><Image src={mediaUrl(src)} alt="" fit="contain" fill loading="lazy" /></Box> })),
        ...(L.step.centre ? [{ id: pictureId(L.step.centre), label: L.step.after, className: `${styles.capsule} ${styles.upright} ${styles.centre}`, style: { '--i': 6 } as React.CSSProperties,
          node: <Box as="span" className={styles.pill}><Image src={mediaUrl(L.step.centre)} alt="" fit="contain" fill loading="lazy" /></Box> }] : []),
        ...(!L.step.picture ? pics.slice(6, 12).map((src, i) => ({ id: posts[i + 6].id, label: itemOf('world', posts[i + 6].worldId)?.name, className: styles.capsule,
          style: { '--i': i } as React.CSSProperties, node: <Box as="span" className={styles.pill}><Image src={src} alt="" fit="cover" fill loading="lazy" /></Box> })) : []),
      ]}>
        <Title level={2} className={styles.before}>{L.step.before}</Title>
        <Title level={2} className={styles.after}>{L.step.after}</Title>
        <Box className={styles.stepFoot}>
          <Text as="p" className={styles.lede}>{L.step.body}</Text>
          <Button variant="glass" onClick={() => s.go('worlds')}>{L.step.cta}</Button>
        </Box>
      </FocusBand>

      {L.gallery && <Box as="section" className={styles.gallery}>
        <Title level={2} className={styles.heading}>{L.gallery.title}</Title>
        <TabList size="sm" variant="pills" aria-label={L.gallery.title} activeId={set} onChange={setSet} items={[{ id: 'all', label: L.gallery.all }, ...L.gallery.group.map((g) => ({ id: g.id, label: g.label, count: g.picture.length }))]} />
        {shown.map((g) => (
          <Box key={g.id} className={styles.set}><Rows cols={4} colsSm={2} minItemWidth="12rem">{g.picture.map((src) => (
            <Box key={src} className={styles.shot} style={{ '--r': g.ratio } as React.CSSProperties}><Picture src={mediaUrl(src)} /></Box>))}</Rows></Box>))}
      </Box>}

      {/* The tour: one part at a time on its own stage, a finished city picture whole behind its words. */}
      <Showcase height="min(36rem, 72vh)" auto={L.stage.auto} picker={false} labels={{ prev: t('slPrev'), next: t('slNext'), picker: L.rows.compare }}
        slides={L.tour.map((x) => ({ id: x.tab, src: mediaUrl(x.image), title: x.title, sub: x.body }))}
        actions={(x) => { const f = L.tour.find((y) => y.tab === x.id)!; return <Button variant="glass" onClick={() => s.go(f.tab as Tab)}>{f.cta}</Button>; }} />

      {/* Every slider on Home is the same cascade: the middle card the largest, one smaller each side, the next two as thin edges. */}
      <PageSections variant="band" id="welcome-rows" sections={[
        { id: 'posts', title: L.rows.posts, hint: String(posts.length), hidden: posts.length < L.cascade.min, content: cascade(posts.map((x) => ({ id: x.id, label: itemOf('world', x.worldId)?.name,
          node: <Tile tone="accent" image={mediaUrl(x.media.src!)} solo ratio="4/5" title={itemOf('world', x.worldId)?.name} sub={x.caption} onClick={() => s.openPost(x.id)}
            owner={<PersonAvatar id={x.authorId} size="md" />} actions={postActs(x.id)} /> }))) },
        { id: 'rides', title: L.rows.rides, hint: String(rides.length), hidden: rides.length < L.cascade.min, content: cascade(rides.map((r) => ({ id: r.id, label: r.name,
          node: <Card flush className={styles.ride} onClick={() => s.go('rides')}><SpriteImage sprite={rideSprite(r)} alt={r.name} ratio="16 / 10" /><Box className={styles.rideText}><Text size="sm" weight="semibold">{r.name}</Text><Text size="xs" intent="muted">{rideKind(r.kind)}</Text></Box></Card> }))) },
      ]} />

      <PageSections variant="band" id="welcome" sections={[{ id: 'compare', title: L.rows.compare, content: (
        <DataTable rows={L.compare.rows} getKey={(r) => r.label} columns={[{ id: 'label', header: '', cell: (r) => <Text as="span" size="sm" weight="semibold">{r.label}</Text> }, { id: 'a', header: L.compare.columns[0], cell: (r) => r.a }, { id: 'b', header: L.compare.columns[1], cell: (r) => r.b }]} />) }]} />

      {close && <Showcase height="min(34rem, 70vh)" auto={0} slides={[{ id: close.id, src: view(close, 'lg')!, thumb: view(close, 'sm'), title: L.cta.title, sub: L.cta.body, mark: worldMark(close) }]}
        actions={() => <>
          <Button variant="glass" onClick={() => s.go('phipad')}>{L.cta.primary}</Button>
          <Button variant="glass" onClick={() => s.go('join')}>{L.cta.secondary}</Button>
        </>} />}
    </Box>
  );
};
