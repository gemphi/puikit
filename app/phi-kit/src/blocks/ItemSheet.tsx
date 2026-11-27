import React from 'react';
import { Accordion, AccordionItem, Carousel, TabRail } from '@pui/components';
import { ArrowLeft, ChevronLeft, ChevronRight, GalleryHorizontal, GalleryVertical, Gavel, Heart, Maximize2, MessageCircle, Minimize2, Share2, ShoppingBag } from 'lucide-react';
import { assetUrl, currentAppKey, type Block } from '../data';
import { toggleBag, useBag } from '../bag';
import { CommentsPanel } from '../RecordSheet';
import words from '../words.json';
import s from '../kit.module.scss';
import type { GridItem } from './Grid';

/**
 * One card of a grid opened over the page it is on, never a page of its own (#/<kind>/<id> draws it over the grid's
 * page): the picture large with arrows either side, the strip of its own group (its `facet`, a club) under it or
 * upright beside it, full screen on a tap, and a column of tabs: its facts with how many share each, its standing,
 * and any of `offers`, `trail`, `owners`, `sales` its data carries, then the cards related to it, filtered by any of
 * its facts. Keys: arrows step, F full screen, Esc closes. Everything it shows is the grid's own data.
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
  const [full, setFull] = React.useState(false);
  // A card with pictures of its own (`gallery`: a city's views) steps through them; any other through its group.
  const gallery: string[] = (it as GridItem & { gallery?: string[] }).gallery ?? [];
  const [shot, setShot] = React.useState(0);
  React.useEffect(() => setShot(0), [at]);
  const [upright, setUpright] = React.useState(false);
  const [tab, setTab] = React.useState('facts');
  // Every section folds (the kit's Accordion, as the account drawer and the sidebars fold); a tab opens its own.
  const [opened, setOpened] = React.useState<Record<string, boolean>>({ facts: true, related: true });
  const fold = (id: string) => setOpened((o) => ({ ...o, [id]: !o[id] }));
  const pickTab = (id: string) => { setTab(id); setOpened((o) => ({ ...o, [id]: true })); requestAnimationFrame(() => document.getElementById('sheet-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })); };
  // Related starts as its own group (by the fact that names it, or the facet), when another card is in it.
  const [match, setMatch] = React.useState<string[]>(() => {
    if (!it.facet || !list.some((x, i) => i !== at && x.facet === it.facet)) return [];
    const own = (it.fields ?? []).find(([, v]) => v === it.facet); return own ? [own[0]] : ['facet'];
  });
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
  const pct = (k: string, v: string) => (list.length < SHARE_FROM ? '' : ' · ' + ((100 * (share[k + '\u0000' + v] ?? 0)) / list.length).toFixed(1) + '%');

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
      else if (e.key === 'Escape') (full ? setFull(false) : close()); else if (e.key === 'f') setFull((f) => !f);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });

  // The cards related to it: those sharing every fact picked below (its group by default), nearest first.
  const facts: Row[] = it.fields ?? [];
  const related = React.useMemo(() => list.filter((x, i) => i !== at && match.every((m) => (m === 'facet' ? x.facet === it.facet : (x.fields ?? []).some(([k, v]) => k === m && v === facts.find(([fk]) => fk === m)?.[1])))).slice(0, 24),
    [list, at, match, it.facet, facts]);
  const extra = it as unknown as Extra;
  // The sections, each from the card's own data: its facts, its standing, and any lists it carries.
  const sections: { id: string; label: string; rows: Row[] }[] = [
    { id: 'facts', label: W.tab.facts, rows: facts.map(([k, v]) => [k, v + pct(k, v)] as Row) },
    { id: 'stats', label: W.tab.stats, rows: [[W.rank, '#' + rank[at] + ' / ' + list.length.toLocaleString('en-US')], [W.facts, String(facts.length)], [W.rarest, rarest(facts, share)]] },
    ...(['offers', 'trail', 'owners', 'sales'] as const).filter((k) => extra[k]?.length).map((k) => ({ id: k, label: W.tab[k], rows: extra[k] ?? [] })),
  ];
  const tabs = [...sections.map(({ id, label }) => ({ id, label })), { id: 'related', label: W.related }];
  const toggle = (m: string) => setMatch((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]));
  const pic = (x: GridItem) => (x.image ? assetUrl(x.image) : undefined);

  // The strip: a card's own pictures, or its group round it.
  const thumbs = gallery.length ? gallery.map((g, i) => (
    <button key={g} type="button" className={i === shot ? s.thumb + ' ' + s.thumbOn : s.thumb} aria-current={i === shot} aria-label={it.title + ' ' + (i + 1)} onClick={() => { setDir(Math.sign(i - shot)); setShot(i); }}><img src={assetUrl(g)} alt="" loading="lazy" /></button>
  )) : strip.map(([x, i]) => (
    <button key={x.id ?? i} type="button" className={i === at ? s.thumb + ' ' + s.thumbOn : s.thumb} aria-label={x.title} aria-current={i === at} onClick={() => { setDir(Math.sign(i - at)); open(x); }}>
      {pic(x) ? <img src={pic(x)} alt="" loading="lazy" /> : <span>{x.title.replace(/^.*#/, '#')}</span>}
    </button>
  ));

  return (
    <div className={[s.sheet, full ? s.sheetFull : '', upright ? s.sheetUpright : ''].join(' ')} role="dialog" aria-modal="true" aria-label={it.title}>
      <div className={s.sheetBar}>
        <button type="button" className={s.sheetIcon} aria-label={W.back} onClick={close}><ArrowLeft size={20} /></button>
        <strong className={s.sheetTitle}>{it.title}</strong>
        {it.sub ? <span className={s.sheetSub}>{it.sub}</span> : null}
        <span className={s.sheetGap} />
        <button type="button" className={s.sheetIcon} aria-label={upright ? W.stripAcross : W.stripUpright} onClick={() => setUpright((u) => !u)}>{upright ? <GalleryHorizontal size={20} /> : <GalleryVertical size={20} />}</button>
        <button type="button" className={s.sheetIcon} aria-label={full ? W.fit : W.full} onClick={() => setFull((f) => !f)}>{full ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
      </div>
      <div className={s.sheetBody}>
        <div className={s.sheetStage}>
          {/* The strip of its group above the picture, the picture taking the rest of the column. */}
          {upright ? <div ref={stripRef} className={s.strip} role="list">{thumbs}</div>
            : <div ref={stripRef} className={s.strip}><Carousel slidesPerView={STRIP_SLIDES} gap={1} labels={{ prev: words.view.prev, next: words.view.next }}>{thumbs}</Carousel></div>}
          <div className={s.stagePic}>
            {(() => { const src = gallery.length ? assetUrl(gallery[shot]) : pic(it); const slide = dir > 0 ? s.slideNext : dir < 0 ? s.slidePrev : '';
              return src ? <img key={src} className={slide} src={src} alt={it.title} /> : <span className={s.stageNone}>{it.title}</span>; })()}
            <button type="button" className={s.stageArrow + ' ' + s.stagePrev} aria-label={words.view.prev} disabled={first} onClick={() => step(-1)}><ChevronLeft size={28} /></button>
            <button type="button" className={s.stageArrow + ' ' + s.stageNext} aria-label={words.view.next} disabled={last} onClick={() => step(1)}><ChevronRight size={28} /></button>
            {/* The actions stand over the picture's right edge, a column of icons, as a short-video app lays them. */}
            <ItemActions it={it} />
          </div>
        </div>
        <aside className={s.sheetSide}>
          {/* The kit's TabRail, as Phiegg's record sheet holds its sections: the tabs on top, each opening its section. */}
          <TabRail aria-label={it.title} activeId={tab} onChange={(id) => pickTab(String(id))} items={tabs}>
          <Accordion>
            {sections.map((sec) => (
              <div key={sec.id} id={'sheet-' + sec.id}>
                <AccordionItem title={sec.label} open={!!opened[sec.id]} onToggle={() => fold(sec.id)}>
                  <div className={s.sheetRows}>{sec.rows.map(([k, v]) => <div key={k} className={s.sheetRow}><span>{k}</span><strong>{v}</strong></div>)}</div>
                </AccordionItem>
              </div>
            ))}
            <div id="sheet-related">
              <AccordionItem title={W.related} open={!!opened.related} onToggle={() => fold('related')}>
          <div className={s.relatedHead}>
            <div className={s.chips}>
              {/* Its group as a chip of its own, unless one of its facts already says it (Club · BPSC). */}
              {it.facet && !facts.some(([, v]) => v === it.facet) ? <button type="button" className={match.includes('facet') ? s.chip + ' ' + s.chipOn : s.chip} onClick={() => toggle('facet')}>{it.facet}</button> : null}
              {facts.map(([k, v]) => <button key={k} type="button" className={match.includes(k) ? s.chip + ' ' + s.chipOn : s.chip} onClick={() => toggle(k)}>{k} · {v}</button>)}
            </div>
          </div>
          <div className={s.relatedGrid}>
            {related.map((x) => (
              <button key={x.id} type="button" className={s.relatedCard} onClick={() => open(x)} aria-label={x.title}>
                {pic(x) ? <img src={pic(x)} alt="" loading="lazy" /> : null}<span>{x.title.replace(/^.*#/, '#')}</span>
              </button>
            ))}
          </div>
              </AccordionItem>
            </div>
          </Accordion>
          </TabRail>
        </aside>
      </div>
    </div>
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
        <button key={label} type="button" className={on ? s.sheetAct + ' ' + s.sheetActOn : s.sheetAct} aria-label={label} title={label} aria-pressed={on} disabled={off} onClick={act}>
          <span className={s.sheetActIcon}><Icon size={22} /></span>
        </button>
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
