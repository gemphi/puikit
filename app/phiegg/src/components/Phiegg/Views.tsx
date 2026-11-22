import React from 'react';
import { Deck, Rows, StageSlider } from '@pui/components';
import { ListView as SharedListView, type ListViewProps } from '@phi-kit/ListView';
import { useStore } from '@pui/store';
import { garmentOf, site, t } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { useViewport } from '../../lib/viewport';

/** Club brand glyph drawn from data/site.json garments. */
export const ClubIcon: React.FC<{ icon?: string; size?: string }> = ({ icon, size = '1.5rem' }) => {
  const g = garmentOf(icon);
  return g ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-label={g.name}><path d={g.path} /></svg> : null;
};

/** The layouts' words (site.json layouts): one per layout, and the switch's own name. */
const LAYOUT = (site as unknown as { layouts: { label: string; list: { id: string; label: string }[] } }).layouts;
const layoutLabel = Object.fromEntries(LAYOUT.list.map((l) => [l.id, l.label])) as Record<string, string>;

/** Grid wrapper that follows the chosen view: the stage slider (tile), full rows (grid), decks or one a row (list). */
export const ViewGrid: React.FC<{ children: React.ReactNode; cols?: number; minItemWidth?: string }> = ({ children, cols: want = 4, minItemWidth = '15rem' }) => {
  const { view } = useStore(phieggStore); const { mobile } = useViewport();
  // Tile is the slider: 1–3 large cards per view. Grid is full rows (two a row on phones). List is one a row.
  if (view.mode === 'tile') {
    // Tile is the stage: one card in the centre and its neighbours, each half the height of the one in
    // front with half of it tucked under, arrows on the sides and the progress under it.
    const items = React.Children.toArray(children).map((c, i) => ({ id: String((c as React.ReactElement).key ?? i), node: c }));
    // How many show, how large the centre is and how the sides fill the row is the kit's (StageSlider), not the page's.
    return <StageSlider items={items} prevLabel={t('slPrev')} nextLabel={t('slNext')} positionLabel={(k, n) => t('slPos', { i: k, n })} />;
  }
  const cols = view.mode === 'list' ? 1 : mobile ? Math.min(want, 2) : want;
  // Decks: the grid's columns, every card its own height under two bars (the cards behind it).
  if (view.mode === 'deck') return <Rows cols={cols} colsSm={Math.min(cols, 2)} minItemWidth={minItemWidth} mosaic={false}>{React.Children.toArray(children).map((c, i) => <Deck key={(c as React.ReactElement).key ?? i}>{c}</Deck>)}</Rows>;
  // Responsive: up to `cols` a row, but never narrower than minItemWidth (the grid measures its own width).
  return <Rows cols={cols} colsSm={Math.min(cols, 2)} minItemWidth={view.mode === 'list' ? undefined : minItemWidth}>{children}</Rows>;
};

export type { ListFacet, ListSort } from '@phi-kit/ListView';
type Own = 'view' | 'onView' | 'labels' | 'count' | 'tile' | 'openCard' | 'cardClassName' | 'tableOptions' | 'mode' | 'pageSize' | 'noun';
/**
 * Every list in the app is the shared ListView (app/phi-kit). This only hands it what is Phiegg's own: the one view
 * the store keeps for all lists, the words, the stage slider for tile mode, cards that open their record, and the
 * table that stays in view. In list mode `groupBy` sections the table into groups that expand and collapse.
 */
export function ListView<T>({ groupBy, onRow, cols, empty, ...rest }: Omit<ListViewProps<T>, Own> & { render: (r: T) => React.ReactNode; groupBy?: (r: T) => string }) {
  const { view, setView, openId } = useStore(phieggStore); const { mobile } = useViewport();
  return <SharedListView<T> {...rest} view={view} onView={setView} tile="stage" openCard cardClassName="ph-open"
    // Every record opens: the page's own action, else its record by id (state openId: its page, or its record page).
    onRow={onRow ?? ((r) => openId(rest.keyOf(r)))} cols={mobile ? Math.min(cols ?? 4, 2) : cols} empty={empty ?? t('lsNone')}
    count={(n) => `${n} items`} tableOptions={{ sticky: true, maxHeight: '34rem', limit: groupBy ? undefined : 25, groupBy }}
    labels={{ tile: layoutLabel.tile, list: layoutLabel.list, deck: layoutLabel.deck, grid: layoutLabel.grid, layout: LAYOUT.label, filters: t('lsFilters'), close: t('lsClose'), search: t('searchPh'), sort: t('lsSort'), all: t('seAll'), clear: t('lsClear'), order: t('lsOrder'), forward: t('lsForward'), backward: t('lsBackward'),
      prev: t('slPrev'), next: t('slNext'), position: (k, n) => t('slPos', { i: k, n }) }} />;
}
