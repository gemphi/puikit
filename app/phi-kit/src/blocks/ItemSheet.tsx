import React from 'react';
import { Accordion, AccordionItem, Box, Button, Carousel, Drawer, Frame, Image, Pressable, Stack } from '@pui/components';
import { ChevronLeft, ChevronRight, GalleryHorizontal, GalleryVertical, Gavel, Heart, MessageCircle, Share2, ShoppingBag } from 'lucide-react';
import { assetUrl, currentAppKey, type Block } from '../data';
import { toggleBag, useBag } from '../bag';
import { CommentsPanel } from '../RecordSheet';
import words from '../words.json';
import s from '../kit.module.scss';
import { Grid, type GridItem } from './Grid';
import { FieldList } from './GridExtra';
import { StatGrid } from './Stats';

/**
 * One card of a grid opened over the page it is on, never a page of its own (#/<kind>/<id> draws it over the grid's
 * page): the picture large with arrows either side, the strip of its own group (its `facet`, a club) under it or
 * upright beside it, the whole window on a tap, and a column of folding sections: its traits as tiles with how many
 * share each, its standing,
 * and any of `offers`, `trail`, `owners`, `sales` its data carries, then the cards related to it in the kit's own Grid
 * (its header, filters and sort, as every grid has them). Keys: arrows step, F the whole window. Everything it shows
 * is the grid's own data.
 */
type Row = [string, string];
type Extra = Record<'offers' | 'trail' | 'owners' | 'sales', Row[] | undefined>;
const W = words.item;
const STRIP = 40;
const SHARE_FROM = 50;
/** The strip's slides (the kit's Carousel: snapping, arrows, no scrollbar; it reads one count). */
const STRIP_SLIDES = 12;

export const ItemSheet: React.FC<{ b: Block; list: GridItem[]; at: number; go: (hash: string) => void; close: () => void }> = ({ b, list, at, go, close }) => {
  const it = list[at];
  // Open at the window's full size, picture and column half and half; the drawer's own button shrinks it.
  const [full, setFull] = React.useState(true);
  // A card with pictures of its own (`gallery`: a city's views) steps through them; any other through its group.
  const gallery: string[] = (it as GridItem & { gallery?: string[] }).gallery ?? [];
  const [shot, setShot] = React.useState(0);
  React.useEffect(() => setShot(0), [at]);
  const [upright, setUpright] = React.useState(false);
  // Every section folds (the kit's Accordion, as the account drawer and the sidebars fold).
  const [opened, setOpened] = React.useState<Record<string, boolean>>({ facts: true, related: true });
  const fold = (id: string) => setOpened((o) => ({ ...o, [id]: !o[id] }));
  const open = (x?: GridItem) => { if (x) go('#/' + x.kind + '/' + x.id); };

  // How many of the grid share each fact, and each card's standing (the rarer its facts, the higher).
  const { share, rank } = React.useMemo(() => {
    const n: Record<string, number> = {};
    for (const x of list) for (const [k, v] of x.fields ?? []) n[k + '\u0000' + v] = (n[k + '\u0000' + v] ?? 0) + 1;
    const score = (x: GridItem) => (x.fields ?? []).reduce((a, [k, v]) => a + list.length / (n[k + '\u0000' + v] || 1), 0);
    const order = list.map((x, i) => [score(x), i] as const).sort((p, q) => q[0] - p[0]);
    const r: Record<number, number> = {}; order.forEach(([, i], k) => { r[i] = k + 1; });
    return { share: n, rank: r };
  }, [list]);
  // How many share a fact says something only of a large set (a collection), not of a handful.
  const share1 = (k: string, v: string) => (list.length < SHARE_FROM ? '' : ((100 * (share[k + '\u0000' + v] ?? 0)) / list.length).toFixed(1) + '%');

  // Its own group (same `facet`) for the strip, a window round it so ten thousand cards stay light.
  const group = React.useMemo(() => list.map((x, i) => [x, i] as const).filter(([x]) => !it.facet || x.facet === it.facet), [list, it.facet]);
  const here = group.findIndex(([, i]) => i === at);
  // From just before it, so the card that is open stands at the start of the strip.
  const from = Math.max(0, here - 2);
  const strip = group.slice(from, from + STRIP);
  // Which way the picture slides in: from the side the person steps toward, like a drawer.
  const [dir, setDir] = React.useState(0);
  const step = (d: number) => { setDir(d); if (gallery.length) setShot((x) => Math.min(gallery.length - 1, Math.max(0, x + d))); else open(group[here + d]?.[0]); };
  const stripRef = React.useRef<HTMLDivElement>(null);
  // The strip glides to keep the open card in view.
  React.useEffect(() => { stripRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }, [at, shot]);
  const first = gallery.length ? shot <= 0 : here <= 0;
  const last = gallery.length ? shot >= gallery.length - 1 : here >= group.length - 1;

  React.useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'f') setFull((f) => !f);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });

  // The cards related to it: the rest of its group, which the shared Grid below pages, filters and sorts.
  const facts: Row[] = it.fields ?? [];
  const related = React.useMemo(() => group.filter(([, i]) => i !== at).map(([x]) => x), [group, at]);
  const extra = it as unknown as Extra;
  // The sections, each from the card's own data: its facts, its standing, and any lists it carries.
  const sections: { id: string; label: string; rows: Row[] }[] = [
    { id: 'facts', label: W.tab.facts, rows: facts },
    { id: 'stats', label: W.tab.stats, rows: [[W.rank, '#' + rank[at] + ' / ' + list.length.toLocaleString('en-US')], [W.facts, String(facts.length)], [W.rarest, rarest(facts, share)]] },
    ...(['offers', 'trail', 'owners', 'sales'] as const).filter((k) => extra[k]?.length).map((k) => ({ id: k, label: W.tab[k], rows: extra[k] ?? [] })),
  ];
  const pic = (x: GridItem) => (x.image ? assetUrl(x.image) : undefined);

  const uprightToggle = <Button variant="icon" aria-label={upright ? W.stripAcross : W.stripUpright} title={upright ? W.stripAcross : W.stripUpright} onClick={() => setUpright((u) => !u)} icon={upright ? <GalleryHorizontal size={18} /> : <GalleryVertical size={18} />} />;
  // The strip: a card's own pictures, or its group round it; each a kit Pressable holding a kit picture.
  const thumb = (key: string, src: string | undefined, label: string, on: boolean, act: () => void) => (
    <Pressable key={key} rounded="md" pad="none" selected={on} aria-label={label} aria-current={on} onClick={act}>
      <Frame ratio="1/1" rounded="md">{src ? <Image src={src} alt="" fit="cover" fill loading="lazy" /> : null}</Frame>
    </Pressable>
  );
  const thumbs = gallery.length
    ? gallery.map((g, i) => thumb(g, assetUrl(g), it.title + ' ' + (i + 1), i === shot, () => { setDir(Math.sign(i - shot)); setShot(i); }))
    : strip.map(([x, i]) => thumb(x.id ?? String(i), pic(x), x.title, i === at, () => { setDir(Math.sign(i - at)); open(x); }));
  const src = gallery.length ? assetUrl(gallery[shot]) : pic(it);

  // Built from the kit's own parts only (Drawer, Stack, Frame, Image, Button, Pressable, Carousel, Accordion, the
  // stats grid, FieldList, Grid), so the person's Settings (theme, surface, corners, spacing) reach every piece.
  return (
    <Drawer isOpen onClose={close} position="right" size="xl" title={it.sub ? it.title + ' · ' + it.sub : it.title}
      expandable expanded={full} onExpandedChange={setFull} expandLabel={W.full} collapseLabel={W.fit}>
      <Stack direction="row" gap={6} wrap align="start">
        <Stack direction={upright ? 'row' : 'column'} gap={3} flex="1 1 24rem" minWidth="0" className={s.sheetStick}>
          {/* The strip of its group above the picture (upright: beside it). */}
          <Stack ref={stripRef} direction={upright ? 'column' : 'row'} gap={2} align="center" minWidth="0">
            {uprightToggle}
            {upright ? thumbs : <Box flex="1" minWidth="0"><Carousel slidesPerView={STRIP_SLIDES} gap={1} labels={{ prev: words.view.prev, next: words.view.next }}>{thumbs}</Carousel></Box>}
          </Stack>
          <Stack direction="row" gap={2} align="center" flex="1" minWidth="0">
            <Button variant="glass" aria-label={words.view.prev} disabled={first} onClick={() => step(-1)} icon={<ChevronLeft size={22} />} />
            <Box flex="1" minWidth="0" className={s.sheetPicture}>
              <Frame ratio={b.ratio ?? '1/1'} rounded="lg">{src ? <Image key={src} className={dir > 0 ? s.slideNext : dir < 0 ? s.slidePrev : ''} src={src} alt={it.title} fit="contain" fill /> : null}</Frame>
              {/* The actions over the picture's right edge, a column of icons, as a short-video app lays them. */}
              <ItemActions it={it} />
            </Box>
            <Button variant="glass" aria-label={words.view.next} disabled={last} onClick={() => step(1)} icon={<ChevronRight size={22} />} />
          </Stack>
        </Stack>
        <Box flex="1 1 24rem" minWidth="0">
          <Accordion>
            {sections.map((sec) => (
              <AccordionItem key={sec.id} title={sec.label} open={!!opened[sec.id]} onToggle={() => fold(sec.id)}>
                {/* Traits as the kit's stats grid (name, value, how many share it), as a marketplace shows them. */}
                {sec.id === 'facts' ? <StatGrid size="sm" items={facts.map(([k, v]) => ({ label: k, value: v, sub: share1(k, v) || undefined }))} />
                  : <FieldList list={sec.rows} />}
              </AccordionItem>
            ))}
            <AccordionItem title={W.related} open={!!opened.related} onToggle={() => fold('related')}>
              {/* Related is the kit's own Grid, the same as the collection's: its header, its filters, its sort. */}
              <Grid b={{ ...b, title: undefined, items: related, layout: 'grid', layoutSet: ['grid', 'list'], pageSize: 24, cols: 4, minItemWidth: '7rem', cardFields: 0, more: undefined }} onOpen={open} />
            </AccordionItem>
          </Accordion>
        </Box>
      </Stack>
    </Drawer>
  );
};

/** The five things a person does with any card, the same in every app (as a record's sheet has them): put it in the
 *  kit's bag (as Phiegg's shop does), offer on it (when it has a price), like it, talk about it, share it. Icons only;
 *  each says what it does to a screen reader and on hover. */
const ItemActions: React.FC<{ it: GridItem }> = ({ it }) => {
  const app = currentAppKey();
  const { bag } = useBag(app);
  const inBag = bag.some((l) => l.id === it.id);
  const likeKey = 'phi-like::' + it.kind + '/' + it.id;
  const [liked, setLiked] = React.useState(() => { try { return window.localStorage.getItem(likeKey) === '1'; } catch { return false; } });
  const [talk, setTalk] = React.useState(false);
  const [shared, setShared] = React.useState(false);
  const like = () => { const v = !liked; setLiked(v); try { window.localStorage.setItem(likeKey, v ? '1' : '0'); } catch { /* storage blocked */ } };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title: it.title, url }).catch(() => undefined); return; }
    await navigator.clipboard?.writeText(url).then(() => setShared(true), () => undefined);
  };
  const A = W.act;
  return (
    <div className={s.sheetActions}>
      {([
        [ShoppingBag, inBag ? A.inBag : A.bag, false, () => toggleBag(app, it.kind ?? 'item', it), inBag],
        [Gavel, A.offer, !it.cost, () => undefined, false],
        [Heart, liked ? A.liked : A.like, false, like, liked],
        [MessageCircle, A.comment, false, () => setTalk(true), talk],
        [Share2, shared ? A.shared : A.share, false, share, shared],
      ] as const).map(([Icon, label, off, act, on]) => (
        <Button key={label} variant={on ? 'primary' : 'glass'} aria-label={label} title={label} aria-pressed={on} disabled={off} onClick={act} icon={<Icon size={20} />} />
      ))}
      {it.id ? <CommentsPanel kind={it.kind ?? 'item'} id={it.id} title={it.title} open={talk} onClose={() => setTalk(false)} /> : null}
    </div>
  );
};

/** The fact fewest cards share, as "name · value". */
const rarest = (facts: Row[], share: Record<string, number>) => {
  const r = facts.slice().sort((a, b) => (share[a[0] + '\u0000' + a[1]] ?? 0) - (share[b[0] + '\u0000' + b[1]] ?? 0))[0];
  return r ? r[0] + ' · ' + r[1] : '';
};
