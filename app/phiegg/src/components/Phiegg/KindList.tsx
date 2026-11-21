import React, { createContext, useContext, useState } from 'react';
import { Button, Card, CardBody, Figure, FigureRow, ItemCard, Stack, StageSlider, TabList, Tag, Text, type DataTableColumn } from '@pui/components';
import * as Glyph from 'lucide-react';
import { useStore } from '@pui/store';
import cardJson from '../../data/card.json';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, fill, kindLabel, listOf, tableFor, titleOf } from '../../lib/fields';
import { fmt, itemImage, itemOf, t, usd, valueAt, valuesAt, type ItemRow, type SiteCopyKey } from '../../lib/data';
import { mediaUrl } from '../../lib/media';
import { PARAM_OF, type RouteTab } from '../../lib/route';
import { lookLive, poolNumbers, poolStats, quote, useNow } from '../../lib/market';
import { useEconomy } from '../../lib/economy';
import { useOwned } from '../../lib/cart';
import { ListView, type ListFacet, type ListSort } from './Views';
import { Tile } from './Tile';
import { postTile } from './ShotCard';
import { EntityAvatar } from './EntityAvatar';
import { LookImage } from './LookImage';
import { LotCard, PoolCard } from './Pools';
import { DateArt, hasParts, Parts, ACT, type PartDecl } from './CardPart';
import type { Pool, PoolLot, Post, ShopLook, Tone } from '../../types/phiegg';

/** How a kind's card is drawn (data/card.json): a layout, that layout's options, and how often its live values move. */
type CardDecl = PartDecl & { layout?: string; tick?: number; cols?: number; ratio?: string; title?: string; sub?: string; aside?: string; mark?: string; flag?: { field: string; label: string };
  tone?: string; club?: string; world?: string; person?: string; path?: string;
  /** A tile's own picture (paths tried in order), floor grid and size; the words on it; the values listed under it. */
  image?: string[]; grid?: boolean; big?: boolean; animate?: boolean; badge?: string[]; tag?: string;
  /** The look a tile wears: the first of the record's rows at `of` whose `look` names a look with a picture; `colour` is that row's own. */
  lead?: { of: string; look: string; colour?: string };
  /** Tile mode as a stage: the card's options there, and the button under it (its words and glyph). */
  slider?: { card?: Partial<CardDecl>; action?: string; icon?: string } };
const CARD = (cardJson as unknown as { kind: Record<string, CardDecl> }).kind;
type CardProps = { kind: string; row: ItemRow; decl: CardDecl; open: () => void };
const at = (row: ItemRow, field?: string) => (field ? (valueAt(row, field) as string | undefined) : undefined);
const as = <T,>(row: ItemRow) => row as unknown as T;
/** The look a card wears (card.json `lead`): its picture and its colour. */
const leadOf = (row: ItemRow, lead?: CardDecl['lead']): { mid?: string; hex?: string } => {
  for (const x of lead ? (valuesAt(row, lead.of.split('.')) as Record<string, unknown>[]) : []) {
    const look = itemOf('look', x[lead!.look] as string);
    if (look?.views.FRONT) return { mid: itemImage(look.views.FRONT), hex: (lead!.colour ? (x[lead!.colour] as string | undefined) : undefined) ?? look.hex };
  }
  return {};
};
/** What a record is found by in a list's search: its own words, and what its card says (its line, the values under it). */
const wordsOf = (kind: string, r: ItemRow) => { const d = CARD[kind] ?? {};
  return [...Object.values(r).filter((v) => typeof v === 'string'), fill(kind, r, d.sub), ...(d.tag ? valuesAt(r, d.tag.split('.')) : [])].join(' '); };

/** The clock a list's live cards read (prices move): one tick for the whole list. */
const Now = createContext(0);

/** The card layouts, each written once. A kind picks one in data/card.json; no page draws a card of its own. */
const LAYOUT: Record<string, React.FC<CardProps>> = {
  /** A picture tile: the record's scene, its club, world or person, its title and line. */
  tile: ({ kind, row, decl, open }) => {
    const lead = leadOf(row, decl.lead); const image = (decl.image ?? []).map((p) => valueAt(row, p)).find((v): v is string => typeof v === 'string' && !!v);
    const badges = [...(decl.flag && row[decl.flag.field] ? [t(decl.flag.label as SiteCopyKey)] : []), ...(decl.badge ?? []).map((b) => fill(kind, row, b)).filter(Boolean)]; const tags = decl.tag ? valuesAt(row, decl.tag.split('.')).map(String) : [];
    const tile = (
      <Tile tone={(at(row, decl.tone) as Tone | undefined) ?? 'neutral'} ratio={decl.ratio} grid={decl.grid} big={decl.big} animate={decl.animate} color={lead.hex} image={image ? mediaUrl(image.replace(/^assets\//, '')) : undefined}
        depth={{ clubId: at(row, decl.club), worldId: at(row, decl.world), personId: at(row, decl.person), mid: lead.mid }}
        title={fill(kind, row, decl.title)} sub={fill(kind, row, decl.sub)} onClick={open}
        badges={badges.length ? <>{badges.map((b) => <Tag key={b} round size="sm">{b}</Tag>)}</> : undefined} />);
    const face = tags.length ? <Stack direction="column" gap={1}>{tile}<Stack direction="row" gap={1} wrap>{tags.map((x) => <Tag key={x} minimal round size="sm" intent="primary">{x}</Tag>)}</Stack></Stack> : tile;
    return hasParts(decl) ? <Card depth={2}><CardBody><Stack direction="column" gap={2}>{face}<Parts kind={kind} row={row} decl={decl} /></Stack></CardBody></Card> : face;
  },
  /** A row: the record's mark (or its day and art), its title and line, at its end a figure, or a flag when the record
   *  carries it; with parts, they sit under it and what the viewer can do at its foot. */
  row: ({ kind, row, decl, open }) => {
    const title = fill(kind, row, decl.title) || titleOf(kind, row); const aside = fill(kind, row, decl.aside);
    const end = decl.flag && row[decl.flag.field] ? t(decl.flag.label as 'live') : aside; const Act = decl.act ? ACT[decl.act] : undefined; const parts = hasParts(decl);
    return (
      <ItemCard variant={parts ? undefined : 'flat'} depth={parts ? 2 : undefined} stackBelow={parts ? 'lg' : 'never'} onClick={parts ? undefined : open}
        media={decl.date || decl.art ? <DateArt kind={kind} row={row} date={decl.date} art={decl.art} /> : <EntityAvatar id={at(row, decl.mark) ?? row.id} name={title} size={parts ? 'md' : 'lg'} />}
        title={title} meta={fill(kind, row, decl.sub)} aside={end ? <Tag minimal round size="sm">{end}</Tag> : undefined}
        actions={Act ? <Act kind={kind} row={row} /> : undefined}>{parts ? <Parts kind={kind} row={row} decl={decl} actHere={false} /> : undefined}</ItemCard>);
  },
  /** A look: its render, rarity, whether the viewer owns it, and its live price. */
  look: function LookCard({ row, open }) {
    const l = as<ShopLook>(row); const mine = useOwned(); const now = useContext(Now);
    return (
      <Card onClick={open}><CardBody><Stack direction="column" gap={2}>
        <LookImage look={l} title={l.name} badges={<><Tag round size="sm">{l.rarity}</Tag>{mine[l.id] ? <Tag intent="success" round size="sm">{t('shOwned')}</Tag> : null}</>} />
        <FigureRow><Figure label={t('lsColLive')} value={usd(lookLive(l, now).total)} /><Figure label={t('lsColMinted')} value={l.minted + ' / ' + l.edition} share={l.edition ? l.minted / l.edition : 0} /></FigureRow>
      </Stack></CardBody></Card>);
  },
  /** A lot (a pack or a drop): its units, price and buying. */
  lot: function LotTile({ row }) { return <LotCard lot={as<PoolLot>(row)} now={useContext(Now)} />; },
  /** A pool: its numbers as they stand now. */
  pool: function PoolTile({ row }) { return <PoolCard pool={as<Pool>(row)} now={useContext(Now)} />; },
  /** A post or a reel: its first slide. */
  post: ({ row, open }) => { const x = as<Post>(row); return <Tile {...postTile(x)} ratio="4/5" title={x.slides[0]?.title} sub={x.caption} onClick={open} />; },
  /** A sale: the look sold, its price and day. */
  sale: function SaleRow({ row }) {
    const l = itemOf('look', row.itemId as string); const s = useStore(phieggStore);
    return l ? <ItemCard variant="flat" stackBelow="never" onClick={() => s.openRef({ kind: 'look', id: l.id })} media={<LookImage look={l} />} title={l.name} meta={usd(row.priceUsd as number) + ' · ' + String(row.at).slice(0, 10)} /> : null;
  },
};

/** How a record of a kind opens: on its kind's own page (data/route.json), or the path its card names. */
const useOpen = (kind: string) => {
  const s = useStore(phieggStore); const path = CARD[kind]?.path;
  return (row: ItemRow) => (path ? s.go(path, { [PARAM_OF[path]]: row.id }) : s.openRef({ kind, id: row.id }));
};

/** One record of any kind as its card. */
export const KindCard: React.FC<{ kind: string; row: ItemRow }> = ({ kind, row }) => {
  const open = useOpen(kind); const decl = CARD[kind] ?? {}; const Layout = LAYOUT[decl.layout ?? 'row'] ?? LAYOUT.row;
  return <Layout kind={kind} row={row} decl={decl} open={() => open(row)} />;
};

/** Tile mode as a stage (card.json `slider`): one record in the centre, its neighbours either side, and under it the
 *  button that opens the one shown. */
const KindSlider: React.FC<{ kind: string; rows: ItemRow[]; label: string }> = ({ kind, rows, label }) => {
  const open = useOpen(kind); const decl = CARD[kind] ?? {}; const stage = decl.slider ?? {}; const [i, setI] = useState(0); const cur = rows[i] ?? rows[0];
  const Layout = LAYOUT[decl.layout ?? 'row'] ?? LAYOUT.row; const card = { ...decl, ...stage.card, tag: undefined };
  const glyph = stage.icon ? (Glyph as unknown as Record<string, Glyph.LucideIcon>)[stage.icon] : undefined;
  return (
    <StageSlider aria-label={label} index={i} onIndexChange={setI} prevLabel={t('slPrev')} nextLabel={t('slNext')} positionLabel={(k, n) => t('slPos', { i: k, n })}
      footer={stage.action ? <Button variant="glass" iconLeft={glyph} onClick={() => open(cur)}>{t(stage.action as SiteCopyKey)}</Button> : undefined}
      items={rows.map((r) => ({ id: r.id, label: titleOf(kind, r), node: <Layout kind={kind} row={r} decl={card} open={() => open(r)} /> }))} />
  );
};

type ListParts = { facets?: ListFacet<ItemRow>[]; sorts?: ListSort<ItemRow>[]; table?: DataTableColumn<ItemRow>[] };
/** What a kind's list has beyond its declared fields (data/kinds.json): values worked out live, a price that moves or
 *  what the viewer holds. Each is a hook of its kind; a list is keyed by its kind, so the same one runs every time. */
const LIVE: Record<string, (now: number) => ListParts> = {
  look: function useLookList(now) {
    const mine = useOwned(); const look = as<ShopLook>;
    return {
      facets: facetsFor<ItemRow>('look', { get: { owned: (r) => (mine[r.id] ? t('lsOwned') : t('lsOpen')) } }),
      table: [{ id: 'live', header: t('lsColLive'), cell: (r) => usd(lookLive(look(r), now).total), sortValue: (r) => lookLive(look(r), now).total, align: 'right' },
        { id: 'minted', header: t('lsColMinted'), cell: (r) => look(r).minted + ' / ' + look(r).edition, sortValue: (r) => look(r).minted / (look(r).edition || 1), align: 'right' }],
    };
  },
  lot: (now) => {
    // A lot's quote is worked out once a tick, then read by every filter, sort and column.
    const lot = as<PoolLot>; const seen = new Map<string, ReturnType<typeof quote>>();
    const of = (r: ItemRow) => { let q = seen.get(r.id); if (!q) { q = quote(lot(r), now); seen.set(r.id, q); } return q; };
    const move = (n: number) => (n > 0 ? '+' : '') + (n * 100).toFixed(1) + '%';
    return {
      facets: [...facetsFor<ItemRow>('lot'),
        { id: 'stock', label: t('lsStock'), get: (r) => (of(r).remaining <= 0 ? t('lsSoldOut') : t('lsOnSale')) },
        { id: 'move', label: t('lsMove'), get: (r) => (of(r).change >= 0 ? t('lsRising') : t('lsFalling')) },
        { id: 'size', label: t('lsSize'), get: (r) => t('lsSizeOf', { n: lot(r).itemIds.length }) }],
      sorts: [{ id: 'value', label: t('lsSortValue'), by: (a, b) => of(b).total - of(a).total }, { id: 'valueLow', label: t('lsSortValueLow'), by: (a, b) => of(a).total - of(b).total },
        { id: 'top', label: t('lsSortTop'), by: (a, b) => of(b).high - of(a).high }, { id: 'move', label: t('lsSortMove'), by: (a, b) => Math.abs(of(b).change) - Math.abs(of(a).change) },
        { id: 'sold', label: t('lsSortSold'), by: (a, b) => of(b).soldPct - of(a).soldPct }, { id: 'soldLeast', label: t('lsSortSoldLeast'), by: (a, b) => of(a).soldPct - of(b).soldPct },
        { id: 'units', label: t('lsSortUnits'), by: (a, b) => lot(b).itemIds.length - lot(a).itemIds.length },
        { id: 'new', label: t('lsSortNew'), by: (a, b) => lot(a).opensAt.localeCompare(lot(b).opensAt) }, { id: 'az', label: t('lsSortAz'), by: (a, b) => lot(a).title.localeCompare(lot(b).title, undefined, { numeric: true }) }],
      table: [{ id: 'total', header: t('lsColValue'), cell: (r) => usd(of(r).total), sortValue: (r) => of(r).total, align: 'right' },
        { id: 'move', header: t('lsColMove'), cell: (r) => <Text as="span" size="sm" numeric intent={of(r).change >= 0 ? 'success' : 'danger'}>{move(of(r).change)}</Text>, sortValue: (r) => of(r).change, align: 'right' },
        { id: 'high', header: t('lsColHigh'), cell: (r) => usd(of(r).high), sortValue: (r) => of(r).high, align: 'right' },
        { id: 'sold', header: t('lsColSold'), cell: (r) => fmt(of(r).sold) + ' / ' + fmt(lot(r).supply), sortValue: (r) => of(r).soldPct, align: 'right' },
        { id: 'left', header: t('lsColLeft'), cell: (r) => fmt(Math.max(0, of(r).remaining)), sortValue: (r) => of(r).remaining, align: 'right' }],
    };
  },
  quest: function useQuestList() {
    const eco = useEconomy();
    return { facets: [...facetsFor<ItemRow>('quest'), { id: 'status', label: t('lsStatus'), get: (r) => (eco.quests[r.id] ? t('lsEntered') : t('lsOpen')) }] };
  },
  coin: function useCoinList() {
    const eco = useEconomy();
    return { facets: [...facetsFor<ItemRow>('coin'), { id: 'held', label: t('lsStatus'), get: (r) => ((eco.coins[r.id] ?? 0) > 0 ? t('lsHeld') : t('lsNotHeld')) }] };
  },
  pool: (now) => {
    // A pool's numbers are worked out once a tick, then read by every sort and column.
    const seen = new Map<string, { sold: number; supply: number; floor: number; total: number; vol: number; volText: string }>();
    const of = (r: ItemRow) => { let n = seen.get(r.id); if (!n) { const N = poolNumbers(as<Pool>(r), now); const v = poolStats(as<Pool>(r), now).find((x) => x.metric.id === 'vol24h');
      n = { sold: N.sold, supply: N.supply, floor: N.floor, total: N.total, vol: v?.value ?? 0, volText: v?.text ?? '' }; seen.set(r.id, n); } return n; };
    const club = (r: ItemRow) => itemOf('club', as<Pool>(r).clubId)?.name; const kind = (r: ItemRow) => t(('plKind_' + as<Pool>(r).kind) as 'plKind_show');
    return {
      facets: [{ id: 'club', label: t('lsColClub'), get: club }, { id: 'world', label: t('lsWorld'), get: (r) => itemOf('world', as<Pool>(r).worldId)?.name }, { id: 'season', label: t('lsSeason'), get: (r) => as<Pool>(r).season }],
      sorts: [{ id: 'value', label: t('lsSortValue'), by: (a, b) => of(b).total - of(a).total }, { id: 'vol', label: t('lsSortVol'), by: (a, b) => of(b).vol - of(a).vol },
        { id: 'sold', label: t('lsSortSold'), by: (a, b) => of(b).sold / (of(b).supply || 1) - of(a).sold / (of(a).supply || 1) },
        { id: 'floor', label: t('lsSortFloor'), by: (a, b) => of(a).floor - of(b).floor }, { id: 'az', label: t('lsSortAz'), by: (a, b) => as<Pool>(a).name.localeCompare(as<Pool>(b).name) }],
      table: [{ id: 'kind', header: t('lsColKind'), cell: kind, sortValue: kind }, { id: 'club', header: t('lsColClub'), cell: (r) => club(r) ?? '', sortValue: (r) => club(r) ?? '' },
        { id: 'sold', header: t('lsColSold'), cell: (r) => fmt(of(r).sold) + ' / ' + fmt(of(r).supply), sortValue: (r) => of(r).sold / (of(r).supply || 1), align: 'right' },
        { id: 'floor', header: t('lsColFloor'), cell: (r) => usd(of(r).floor), sortValue: (r) => of(r).floor, align: 'right' }, { id: 'vol', header: t('lsColVol'), cell: (r) => of(r).volText, sortValue: (r) => of(r).vol, align: 'right' },
        { id: 'value', header: t('lsColValue'), cell: (r) => '$' + fmt(of(r).total), sortValue: (r) => of(r).total, align: 'right' }],
    };
  },
};

/**
 * The list of any kind: the view toolbar, Filter and sort, and a table in list mode, all from the kind's declared
 * fields (data/kinds.json), each row drawn as the kind's card (data/card.json). A page hands it a kind and its rows.
 */
export const KindList: React.FC<{ kind: string; rows: ItemRow[]; label?: string }> = ({ kind, rows, label }) => {
  const decl = CARD[kind] ?? {}; const now = useNow(decl.tick ?? 60000); const open = useOpen(kind);
  const base = listOf<ItemRow>(kind); const live = LIVE[kind]?.(now) ?? {};
  const table = [...(live.table ? tableFor<ItemRow>(kind) : base.table), ...(live.table ?? [])];
  return (
    <Now.Provider value={now}>
      <ListView<ItemRow> rows={rows} keyOf={(r) => r.id} text={(r) => wordsOf(kind, r)} onRow={open} cols={decl.cols}
        slider={decl.slider ? (shown) => shown.length > 0 && <KindSlider key={shown.length} kind={kind} rows={shown} label={label ?? kindLabel(kind)} /> : undefined}
        facets={live.facets ?? base.facets} sorts={live.sorts ?? base.sorts} table={table.length ? table : undefined}
        render={(r) => <KindCard kind={kind} row={r} />} />
    </Now.Provider>
  );
};

/**
 * A path's tabs (data/route.json), each with its rows: the tab bar when there is more than one, then the list of the
 * tab that is on. `children` sit between the bar and the list (what narrows it). Every page with tabs is this.
 */
export const TabLists: React.FC<{ tabs: { tab: RouteTab; rows: ItemRow[] }[]; on?: string; onTab: (id: string) => void; label: string; children?: (tab: RouteTab) => React.ReactNode }> = ({ tabs, on, onTab, label, children }) => {
  const at = tabs.find((x) => x.tab.id === on) ?? tabs[0];
  return (
    <>
      {tabs.length > 1 && <TabList size="sm" variant="pills" aria-label={label} activeId={at?.tab.id} onChange={onTab} items={tabs.map(({ tab, rows }) => ({ id: tab.id, label: tab.label, count: fmt(rows.length) }))} />}
      {at && children?.(at.tab)}
      {at && <KindList key={at.tab.id} kind={at.tab.kind} rows={at.rows} label={label} />}
    </>
  );
};
