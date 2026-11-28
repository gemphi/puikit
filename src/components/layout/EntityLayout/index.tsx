import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../primitives/Button';
import { Pressable } from '../../primitives/Pressable';
import { Box } from '../Box';
import { Stack } from '../Stack';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { ShownTitle, useTitleShown } from '../ShownTitle';
import { columnStore, dragWidth, useColumnEntries } from '../Columns/store';
import { useShell } from '../../navigation/AppShell/context';
import styles from './styles.module.scss';

/** One column of an entity page. A column with a `width` sits at the side; the one without is the middle and grows. */
export interface EntityColumn { id: string; title: React.ReactNode; content: React.ReactNode; width?: string; minWidth?: string; label?: string; closable?: boolean; expandable?: boolean;
  /** A side column that starts folded to its strip (a chat, comments): the middle takes the room until it is opened. */
  folded?: boolean;
  /** The column stays in view under the header while the page scrolls by its neighbours (a profile's feed); it
   *  scrolls inside itself, with no scroll bar of its own. */
  stick?: boolean }

export type EntityLayoutProps = {
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** The one thing to do with the record (buy it, join it, follow it): at the right of its heading, or of its row of
   *  tabs when the page opens as a profile. */
  action?: React.ReactNode;
  columns: EntityColumn[];
  /** The last column (a chat) stays in view beside the others, its own overflow hidden. */
  stickLast?: boolean;
  /** What lies under the whole page (a blurred picture). */
  backdrop?: React.ReactNode;
  /** A profile's opening (a club, a world, a shop): the first screen is the backdrop alone with the name at its foot
   *  and the page's tabs centred under it; scrolling brings the record's own square card to the centre and the rest
   *  after it, the tabs held at the top. How far the first screen has scrolled away is --pui-hero-p (0 to 1) on the
   *  page and on the shell's stage: the card grows by it to the width of the columns, the backdrop blurs by it. */
  hero?: EntityHero;
};

/** The parts of a profile's opening. */
export type EntityHero = {
  /** The page's row of tabs (a TabList): at the foot of the first screen, then held at the top as the page scrolls. */
  tabs?: React.ReactNode;
  /** The record's own picture, a square in the centre under the first screen. */
  card?: React.ReactNode;
  /** Pressing the card (it opens the record full screen), and what that is called. */
  onCard?: () => void; cardLabel?: string;
};

const ColumnHead: React.FC<{ title: React.ReactNode; fold?: { side: 'left' | 'right'; label: string; onFold: () => void } }> = ({ title, fold }) => {
  const shown = useTitleShown(title);
  if (shown && !fold) return null;
  const Icon = fold?.side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <Box className={styles.colHead}>
      {!shown && (typeof title === 'string' ? <Text weight="semibold">{title}</Text> : title)}
      {fold && <Button variant="glass" className={styles.fold} icon={<Icon size={16} />} aria-label={fold.label} title={fold.label} onClick={fold.onFold} />}
    </Box>
  );
};

/**
 * EntityLayout: the page an entity opens on, in every app. Its title over glass columns that share the page's width:
 * side columns by their widths, and on a desktop the middle as wide as the screen is tall, so the square picture in it
 * fits the screen. A title is never said twice: a column or section header that would repeat the page's title (or its
 * column's) is left out (ShownTitle). Every side column folds away with the button in its head (shown while the
 * pointer is over the column) and leaves no strip: it is listed in columnStore, and a menu (the shell's right sidebar)
 * brings it back (a column can start `folded`). A side column's inner edge drags, so it is as wide as it is pulled.
 */
export const EntityLayout: React.FC<EntityLayoutProps> = ({ title, sub, action, columns, stickLast, backdrop, hero }) => {
  // The columns share the page's width in proportion to their widths (a side column's rem as its weight, the middle
  // half again the widest side), never under 12rem, so a docked sidebar narrows them instead of pushing them sideways.
  const weight = (w?: string) => parseFloat(w ?? '') || 0;
  // The middle is half again the widest side, and never narrower than both sides together (a feed between two columns).
  const middle = Math.max(Math.max(...columns.map((c) => weight(c.width)), 20) * 1.5, columns.reduce((n, c) => n + weight(c.width), 0));
  const known = useColumnEntries(); const [px, setPx] = useState<Record<string, number>>({});
  const sides = columns.filter((c) => c.width); const ids = sides.map((c) => c.id).join('|');
  useEffect(() => { sides.forEach((c) => columnStore.add(c.id, c.label ?? (typeof c.title === 'string' ? c.title : c.id), !c.folded)); return () => columnStore.remove(ids.split('|')); }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  const isFolded = (c: EntityColumn) => { const e = known.find((x) => x.id === c.id); return !!c.width && (e ? !e.open : !!c.folded); };
  const anyFolded = columns.some(isFolded);
  // A page whose only column in view is the middle one gives it the whole width: kept square it stood as a narrow
  // strip at the left with the rest of the page empty.
  const alone = columns.filter((c) => !isFolded(c)).length === 1;
  const nameOf = (c: EntityColumn) => c.label ?? (typeof c.title === 'string' ? c.title : c.id);
  // On a desktop the middle takes --pui-entity-middle (styles): as wide as the screen is tall, so it is square.
  // A folded side column is a strip; with one folded, the middle takes all the room it leaves (no longer kept square).
  const template = columns.filter((c) => !isFolded(c)).map((c) => px[c.id] ? `${px[c.id]}px` : c.width ? `minmax(12rem, ${weight(c.width)}fr)`
    : alone ? 'minmax(0, 1fr)' : anyFolded ? `minmax(${c.minWidth ?? '16rem'}, ${middle * 2}fr)` : `var(--pui-entity-middle, minmax(${c.minWidth ?? '16rem'}, ${middle}fr))`).join(' ');
  // The middle column (no width) comes first on a narrow page (styles).
  const side = (c: EntityColumn) => (!c.width ? styles.middle : '');
  // A profile's opening: how far its first screen has scrolled away, 0 to 1, said to the page and the shell's stage.
  const pageRef = useRef<HTMLElement>(null); const headRef = useRef<HTMLElement>(null); const { stage } = useShell(); const opens = !!hero;
  useEffect(() => {
    const page = pageRef.current; if (!opens || !page) return;
    let scroller: HTMLElement | null = page.parentElement;
    while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    if (!scroller) return;
    let frame = 0; const from = scroller;
    const say = () => { frame = 0; const far = headRef.current?.offsetHeight || 1; const p = Math.min(1, Math.max(0, from.scrollTop / far)).toFixed(3);
      page.style.setProperty('--pui-hero-p', p); stage?.style.setProperty('--pui-hero-p', p); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(say); };
    // A profile opens on its first screen, wherever the page before it was scrolled to.
    from.scrollTo({ top: 0, behavior: 'instant' });
    say(); from.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); from.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); stage?.style.removeProperty('--pui-hero-p'); };
  }, [opens, stage]);
  return (
    <Box ref={pageRef} className={[styles.page, hero ? styles.withHero : ''].join(' ')}>
      {backdrop}
      {hero ? (<>
        <Box as="header" ref={headRef} className={styles.hero}>
          <Title level={1} className={styles.title}>{title}</Title>
          {sub && <Text intent="secondary" className={styles.sub}>{sub}</Text>}
        </Box>
        {(hero.tabs || action) && <Box className={styles.heroTabs}>{hero.tabs}{action && <Box className={styles.heroAction}>{action}</Box>}</Box>}
        {hero.card && (hero.onCard
          ? <Pressable className={styles.heroCard} aria-label={hero.cardLabel} title={hero.cardLabel} onClick={hero.onCard}>{hero.card}</Pressable>
          : <Box className={styles.heroCard}>{hero.card}</Box>)}
      </>) : (
      /* A heading has no ground: the record's name and line stand bare, its action at the right. */
      <Stack direction="row" gap={3} align="end" wrap className={styles.head}>
        <Title level={1} className={styles.title}>{title}</Title>
        {sub && <Text intent="secondary" className={styles.sub}>{sub}</Text>}
        {action && <Box className={styles.headAction}>{action}</Box>}
      </Stack>)}
      <ShownTitle title={title}>
        <Box className={styles.grid} style={{ '--pui-entity-cols': template } as React.CSSProperties}>
          {columns.map((c, i) => {
            const sideOf: 'left' | 'right' = columns.findIndex((x) => !x.width) > i ? 'left' : 'right';
            if (isFolded(c)) return null;
            return (
            <Box as="section" key={c.id} aria-label={nameOf(c)}
              className={[styles.col, 'phi-layers', side(c), stickLast && i === columns.length - 1 ? styles.stick : '', c.stick ? styles.hold : ''].join(' ')}>
              <ColumnHead title={c.title} fold={c.width ? { side: sideOf, label: nameOf(c), onFold: () => columnStore.set(c.id, false) } : undefined} />
              {c.width && <span role="separator" aria-orientation="vertical" className={[styles.grip, sideOf === 'left' ? styles.gripEnd : styles.gripStart].join(' ')}
                onPointerDown={(e) => { const el = e.currentTarget.parentElement; if (el) dragWidth(e, el.getBoundingClientRect().width, sideOf === 'left' ? 1 : -1, (w) => setPx((x) => ({ ...x, [c.id]: w }))); }} />}
              <ShownTitle title={c.title}><Box className={styles.colBody}>{c.content}</Box></ShownTitle>
            </Box>);
          })}
        </Box>
      </ShownTitle>
    </Box>
  );
};
