import React, { useState } from 'react';
import { Backdrop, Bands, Box, Button, Card, DataTable, Icon, Label, Pressable, Showcase, SpriteImage, StageSlider, Text, Title, type ShowcaseSlide, type StageSlide } from '@pui/components';
import { Tile } from '../../components/Phiegg/Tile';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import { PageSections } from '../../components/Phiegg/PageSections';
import { Bookmark, Heart, MessageCircle, Share2, Sparkles, type LucideIcon } from 'lucide-react';
import { useStore } from '@pui/store';
import { D, fmt, rideKind, rideSprite, t, worldMark, itemOf } from '../../lib/data';
import { mediaUrl } from '../../lib/media';
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
  stage: { origin: string; auto: number; enter: string; about: string; sub: string; lead?: { id: string; src: string; title: string; sub: string }[] };
  ask: { title: string; body: string; agentId: string; context: string; prompts: string[]; fan: string[] };
  step: { before: string; after: string; body: string; cta: string };
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
  // The lead slides (landing.json stage.lead) first, then every city.
  const lead: ShowcaseSlide[] = (L.stage.lead ?? []).map((x) => ({ id: x.id, src: mediaUrl(x.src), title: x.title, sub: x.sub }));
  const slides: ShowcaseSlide[] = [...lead, ...cities.map((w) => ({ id: w.id, src: view(w, 'lg')!, thumb: view(w, 'sm'), title: w.name, mark: worldMark(w),
    sub: fill(L.stage.sub, { land: (w.landName && w.landName !== w.name ? w.landName : w.landGroup) ?? '', n: fmt(w.visitorsNow) }) }))];
  // The cities' own posts, named by the data (landing.json post), never stand-in art.
  const posts = D.feed.shots.filter((x) => x.origin === L.post.origin && (x.media.src ?? '').includes(L.post.picture));
  const pics = posts.map((x) => mediaUrl(x.media.src!));
  // The pictures either side of the chat are named in the data (landing.json ask.fan), half a side.
  const fan = L.ask.fan.map(mediaUrl); const half = Math.ceil(fan.length / 2);
  // Rides for the cascade: one of each kind first, then more until the row is full.
  const firsts = KINDS.map((k) => D.ride.list.find((r) => r.kind === k)).filter((r): r is NonNullable<typeof r> => !!r);
  const rides = [...firsts, ...D.ride.list.filter((r) => !firsts.includes(r))].slice(0, Math.max(L.cascade.rides, L.cascade.min));
  const close = cities.find((w) => w.name === L.closing.world) ?? cities[0];

  const [bg, setBg] = useState<string | undefined>(slides[0]?.src);
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
      {/* The slide shown is the whole page's ground, blurred, and changes with it; the picture stays where it is. */}
      {bg && <Backdrop><img key={bg} className={styles.ground} src={bg} alt="" /></Backdrop>}
      <Showcase slides={slides} auto={L.stage.auto} picker={false} onChange={(x) => setBg(x.src)} labels={{ prev: t('slPrev'), next: t('slNext'), picker: L.rows.worlds }}
        actions={(x) => <>
          {cities.some((w) => w.id === x.id) && <Button variant="primary" onClick={() => s.go('world', { worldId: x.id })}>{fill(L.stage.enter, { name: String(x.title) })}</Button>}
          <Button variant="glass" onClick={() => s.go('feed', { feedKind: 'all' })}>{L.hero.primary}</Button>
          <Button variant="glass" onClick={() => s.openSignIn()}>{t('hdSignIn')}</Button>
        </>} />

      {/* Ask: the agent at the centre, her own renders fanned out on either side. */}
      <Box as="section" className={styles.ask}>
        <Box className={styles.askHead}>
          <Title level={2} className={styles.heading}><Label icon={<Icon icon={Sparkles} size="md" />}>{L.ask.title}</Label></Title>
          <Text as="p" className={styles.lede}>{L.ask.body}</Text>
        </Box>
        <Box className={styles.fan}>
          {fan.slice(0, half).map((src, i) => <Bands key={src} className={styles.fanCard} style={{ '--k': i - half } as React.CSSProperties}><img src={src} alt="" loading="lazy" /></Bands>)}
          <Bands className={styles.phone}><AgentChat agentId={L.ask.agentId} context={L.ask.context} prompts={L.ask.prompts} /></Bands>
          {fan.slice(half).map((src, i) => <Bands key={src} className={styles.fanCard} style={{ '--k': i + 1 } as React.CSSProperties}><img src={src} alt="" loading="lazy" /></Bands>)}
        </Box>
      </Box>

      {/* Step in: the line split across the band, the cities' posts floating round it. */}
      <Box as="section" className={styles.step}>
        <Title level={2} className={styles.before}>{L.step.before}</Title>
        {pics.slice(6, 12).map((src, i) => (
          <Pressable key={src} className={styles.capsule} style={{ '--i': i } as React.CSSProperties} onClick={() => s.openPost(posts[i + 6].id)} aria-label={itemOf('world', posts[i + 6].worldId)?.name}>
            <span className={styles.pill}><img src={src} alt="" loading="lazy" /></span></Pressable>))}
        <Title level={2} className={styles.after}>{L.step.after}</Title>
        <Box className={styles.stepFoot}>
          <Text as="p" className={styles.lede}>{L.step.body}</Text>
          <Button variant="primary" onClick={() => s.go('worlds')}>{L.step.cta}</Button>
        </Box>
      </Box>

      {/* The tour: one part at a time on its own stage, a finished city picture whole behind its words. */}
      <Showcase height="min(36rem, 72vh)" auto={L.stage.auto} picker={false} labels={{ prev: t('slPrev'), next: t('slNext'), picker: L.rows.compare }}
        slides={L.tour.map((x) => ({ id: x.tab, src: mediaUrl(x.image), title: x.title, sub: x.body }))}
        actions={(x) => { const f = L.tour.find((y) => y.tab === x.id)!; return <Button variant="primary" onClick={() => s.go(f.tab as Tab)}>{f.cta}</Button>; }} />

      {/* Every slider on Home is the same cascade: the middle card the largest, one smaller each side, the next two as thin edges. */}
      <PageSections variant="band" id="welcome-rows" sections={[
        { id: 'worlds', title: L.rows.worlds, hint: String(picked.length), content: cascade(picked.map((w) => ({ id: w.id, label: w.name,
          node: <Tile tone={w.tone} image={view(w, 'lg')} solo ratio="16/9" title={w.name} sub={w.landName && w.landName !== w.name ? w.landName : w.landGroup} onClick={() => s.go('world', { worldId: w.id })}
            owner={w.creatorId ? <PersonAvatar id={w.creatorId} size="md" /> : undefined} actions={worldActs(w.id)} /> }))) },
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
          <Button variant="primary" onClick={() => s.go('phipad')}>{L.cta.primary}</Button>
          <Button variant="glass" onClick={() => s.go('join')}>{L.cta.secondary}</Button>
        </>} />}
    </Box>
  );
};
