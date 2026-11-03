import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, DataTable, Input, ItemCard, Rows, Stack, Swatch, Tag, Text, type DataTableColumn } from '@pui/components';
import { EntityAvatar } from './EntityAvatar';
import { hasApi } from '@phi-kit/api';
import { canDesign, saveTheme, useTheme } from '../../lib/themes';
import { useStore } from '@pui/store';
import { castOf, clubOf, person, salesOfItem, seriesOf, showOf, site, t, usd } from '../../lib/data';
import { useActivity } from '../../lib/activity';
import { phieggStore } from '../../state/phieggStore';
import type { ShopLook } from '../../types/phiegg';

const swatch = (hex: string) => <Swatch color={hex} size="xs" label={hex} />;
const evLabel = (k: string) => t(('ev_' + k.replace('.', '_')) as 'ev_buy');

/** Every spec field of an item, so nothing about it lives outside the record (data/…looks[].specs). */
export const ItemSpecs: React.FC<{ look: ShopLook }> = ({ look }) => {
  const sp = look.specs; const theme = useTheme(look); if (!sp) return null;
  const rows: { id: string; field: string; value: React.ReactNode }[] = [
    { id: 'colour', field: t('spColour'), value: <Stack direction="row" gap={1} align="center">{swatch(sp.colour.hex)}<Text as="span" size="sm">{sp.colour.name} · {sp.colour.source === 'render' ? t('spMeasured') : sp.colour.hex}</Text></Stack> },
    ...(sp.colour.designer ? [{ id: 'designer', field: t('spDesigner'), value: <Stack direction="row" gap={1} align="center">{swatch(sp.colour.designer.hex)}<Text as="span" size="sm">{sp.colour.designer.name}</Text></Stack> }] : []),
    { id: 'palette', field: t('spPalette'), value: <Stack direction="row" gap={1}>{sp.colour.palette.map((h) => <React.Fragment key={h}>{swatch(h)}</React.Fragment>)}</Stack> },
    { id: 'theme', field: t('spTheme'), value: theme.kinds.length
      ? <Stack direction="column" gap={1}><Stack direction="row" gap={1} wrap>{theme.kinds.map((k) => <Tag key={k} minimal round size="sm" intent="primary">{k}</Tag>)}</Stack>
          {(theme.mood || theme.by) && <Text as="span" size="xs" intent="muted">{[theme.mood, theme.by ? t('spThemeBy', { name: person(theme.by).name }) : null].filter(Boolean).join(' · ')}</Text>}
          {!!theme.colours?.length && <Stack direction="row" gap={1} align="center">{theme.colours.map((c) => <Swatch key={c} color={c} size="xs" />)}<Text as="span" size="xs" intent="muted">{t('spThemeWorn')}</Text></Stack>}</Stack>
      : <Text as="span" size="sm" intent="muted">{t('spThemePending')}</Text> },
    { id: 'category', field: t('spCategory'), value: sp.category }, { id: 'silhouette', field: t('spSilhouette'), value: sp.silhouette },
    { id: 'fabric', field: t('spFabric'), value: sp.fabric.join(', ') }, { id: 'finish', field: t('spFinish'), value: sp.finish },
    { id: 'garments', field: t('spGarments'), value: sp.garments.join(', ') }, { id: 'sizes', field: t('spSizes'), value: sp.sizes.join(' · ') + ' · ' + sp.fit },
    { id: 'fits', field: t('spFits'), value: sp.fits.join(', ') }, { id: 'season', field: t('spSeason'), value: sp.season ?? '·' }, { id: 'collection', field: t('spCollection'), value: sp.collection ?? '·' },
    { id: 'renders', field: t('spRenders'), value: sp.renders.angles.length ? sp.renders.angles.join(' · ') + (sp.renders.opaque ? ' · opaque' : '') : '·' },
    { id: 'house', field: t('spProvenance'), value: clubOf(sp.provenance.clubId)?.name ?? '·' }, { id: 'designerBy', field: t('spDesignerBy'), value: sp.provenance.designerId ? person(sp.provenance.designerId).name : '·' },
    { id: 'mint', field: t('spMintDate'), value: sp.provenance.mintDate ?? '·' }, { id: 'supply', field: t('spSupply'), value: `${sp.supply.minted} / ${sp.supply.edition} · ${sp.supply.owners} owners` },
    { id: 'utility', field: t('spUtility'), value: sp.utility.join(' · ') }, { id: 'tags', field: t('spTags'), value: sp.tags.join(' · ') },
    { id: 'physical', field: t('spPhysical'), value: sp.physical.available ? 'Made ' + sp.physical.made : '·' },
    ...(sp.gender ? [
      { id: 'gender', field: t('spGender'), value: sp.gender },
      { id: 'occasion', field: t('spOccasion'), value: <Stack direction="row" gap={1} wrap>{(sp.occasion ?? []).map((o) => <Tag key={o} minimal round size="sm">{o}</Tag>)}</Stack> },
      { id: 'neckline', field: t('spNeckline'), value: sp.neckline }, { id: 'sleeve', field: t('spSleeve'), value: sp.sleeve }, { id: 'length', field: t('spLength'), value: sp.length },
      { id: 'waist', field: t('spWaist'), value: sp.waist }, { id: 'closure', field: t('spClosure'), value: sp.closure }, { id: 'embellishment', field: t('spEmbellishment'), value: sp.embellishment },
      { id: 'craft', field: t('spCraft'), value: sp.craft ? t('spCraftLine', { hours: sp.craft.hours, technique: sp.craft.technique, artisans: sp.craft.artisans }) : '·' },
      { id: 'atelier', field: t('spAtelier'), value: sp.craft?.atelier ?? '·' }, { id: 'inspiration', field: t('spInspiration'), value: sp.inspiration ?? '·' },
      { id: 'care', field: t('spCare'), value: sp.care ? sp.care.physical : '·' },
      { id: 'made', field: t('spSustain'), value: sp.sustainability ? t('spSustainLine', { madeTo: sp.sustainability.madeTo, deadstock: sp.sustainability.deadstock ? ' · deadstock cloth' : '' }) : '·' },
    ] : []),
  ];
  const cols: DataTableColumn<(typeof rows)[number]>[] = [{ id: 'field', header: t('isField'), cell: (r) => <Text as="span" size="sm" intent="muted">{r.field}</Text>, width: '9rem' }, { id: 'value', header: t('isValue'), cell: (r) => r.value }];
  return <Stack direction="column" gap={3}><DataTable rows={rows} getKey={(r) => r.id} columns={cols} />{canDesign(look) && <ThemeEditor look={look} />}</Stack>;
};

type Row = { id: string; at: number; kind: string; who: string; usd?: number; mine: boolean };
/** Everything that happened to an item: its ledger (mint, list, offers, sales, transfers) and what you did with it. */
export const ItemActivity: React.FC<{ look: ShopLook }> = ({ look }) => {
  const mine = useActivity().events.filter((e) => e.ref === look.id || e.with === look.id); useStore(phieggStore);
  const rows: Row[] = [
    ...salesOfItem(look.id).map((x) => ({ id: x.id, at: Date.parse(x.at), kind: x.event, who: person(x.toId ?? x.fromId ?? '').name ?? '', usd: x.priceUsd || undefined, mine: false })),
    ...mine.map((e) => ({ id: e.id, at: e.at, kind: e.kind, who: t('isYou'), usd: e.usd, mine: true })),
  ];
  if (!rows.length) return <Text size="sm" intent="muted">{t('isNoActivity')}</Text>;
  const cols: DataTableColumn<Row>[] = [
    { id: 'at', header: t('isWhen'), cell: (r) => new Date(r.at).toISOString().slice(0, 16).replace('T', ' '), sortValue: (r) => r.at },
    { id: 'kind', header: t('isEvent'), cell: (r) => <Tag minimal round size="sm" intent={r.mine ? 'primary' : undefined}>{evLabel(r.kind)}</Tag>, sortValue: (r) => r.kind },
    { id: 'who', header: t('isWho'), cell: (r) => r.who, sortValue: (r) => r.who },
    { id: 'usd', header: t('isPrice'), cell: (r) => (r.usd ? usd(Math.abs(r.usd)) : ''), sortValue: (r) => r.usd ?? 0, align: 'right' },
  ];
  return <DataTable rows={rows} getKey={(r) => r.id} columns={cols} defaultSort={{ id: 'at', dir: 'desc' }} />;
};

/** The designer's editor for thematic kinds: pick from the vocabulary (site.json themeKinds) or type new ones, add a mood. */
const ThemeEditor: React.FC<{ look: ShopLook }> = ({ look }) => {
  const theme = useTheme(look); const vocab = (site as unknown as { themeKinds: string[] }).themeKinds;
  const [kinds, setKinds] = useState<string[]>(theme.kinds); const [mood, setMood] = useState(theme.mood ?? ''); const [draft, setDraft] = useState(''); const [msg, setMsg] = useState('');
  useEffect(() => { setKinds(theme.kinds); setMood(theme.mood ?? ''); setMsg(''); }, [look.id]);
  const toggle = (k: string) => setKinds((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k].slice(0, 12)));
  const add = () => { const k = draft.trim(); if (k && !kinds.includes(k)) setKinds([...kinds, k].slice(0, 12)); setDraft(''); };
  const save = async () => { const r = await saveTheme(look, { kinds, mood: mood.trim() || null, story: theme.story, colours: theme.colours?.length ? theme.colours : [look.hex] }); setMsg(r.ok ? (hasApi ? t('spThemeSaved') : t('spThemeLocal')) : r.message ?? ''); };
  return (
    <Card depth={1} variant="flat"><CardBody><Stack direction="column" gap={2}>
      <Text size="sm" weight="bold">{t('spThemeEdit')}</Text>
      <Stack direction="row" gap={1} wrap>{[...new Set([...vocab, ...kinds])].map((k) => <Tag key={k} interactive round size="sm" minimal={!kinds.includes(k)} intent={kinds.includes(k) ? 'primary' : undefined} onClick={() => toggle(k)}>{k}</Tag>)}</Stack>
      <Stack direction="row" gap={2} align="center"><Input value={draft} placeholder={t('spThemeAdd')} aria-label={t('spThemeAdd')} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Input value={mood} placeholder={t('spThemeMood')} aria-label={t('spThemeMood')} onChange={(e) => setMood(e.target.value)} /></Stack>
      <Stack direction="row" gap={2} align="center"><Button size="sm" variant="primary" onClick={save}>{t('spThemeSave')}</Button>{msg && <Text size="xs" role="status" intent="muted">{msg}</Text>}</Stack>
    </Stack></CardBody></Card>
  );
};

/** The price, as a table: list, live, floor, last sale, the week's move and the creator royalty. */
export const ItemPrice: React.FC<{ look: ShopLook; live: number }> = ({ look, live }) => {
  const p = look.specs?.price;
  const rows = [{ id: 'live', k: t('prLive'), v: usd(live), n: live }, { id: 'list', k: t('prList'), v: usd(p?.list ?? look.usd), n: p?.list ?? look.usd }, { id: 'floor', k: t('prFloor'), v: usd(p?.floor ?? look.floor), n: p?.floor ?? look.floor },
    { id: 'last', k: t('prLast'), v: p?.lastSale ? usd(p.lastSale) : '·', n: p?.lastSale ?? 0 }, { id: 'change', k: t('prChange'), v: (look.change7d > 0 ? '+' : '') + look.change7d + '%', n: look.change7d },
    { id: 'royalty', k: t('prRoyalty'), v: (p?.royaltyPct ?? 5) + '%', n: p?.royaltyPct ?? 5 }];
  return <DataTable rows={rows} getKey={(r) => r.id} columns={[{ id: 'k', header: t('isPrice2'), cell: (r) => r.k, sortValue: (r) => r.k }, { id: 'v', header: t('isValue'), cell: (r) => <Text as="span" size="sm" weight="bold" numeric>{r.v}</Text>, sortValue: (r) => r.n, align: 'right' }]} />;
};

/** The item's stats as a table sortable by its headings. */
export const ItemStatsTable: React.FC<{ stats: { label: string; text: string }[] }> = ({ stats }) =>
  <DataTable rows={stats} getKey={(r) => r.label} columns={[{ id: 'k', header: t('isStat'), cell: (r) => r.label, sortValue: (r) => r.label }, { id: 'v', header: t('isValue'), cell: (r) => <Text as="span" size="sm" weight="bold" numeric>{r.text}</Text>, sortValue: (r) => parseFloat(r.text.replace(/[^0-9.-]/g, '')) || r.text, align: 'right' }]} />;

/** Where the look appears: casts, runway shows and productions (roles dressed in it, episodes that shop it). */
export const ItemAppears: React.FC<{ look: ShopLook }> = ({ look }) => {
  const s = useStore(phieggStore); const a = look.specs?.appearsIn;
  const rows = [
    ...(a?.seriesIds ?? []).map((id) => ({ id, kind: t('apTitle'), name: seriesOf(id)?.title ?? id, open: () => s.openSeries(id), tone: seriesOf(id)?.tone ?? 'accent', clubId: seriesOf(id)?.clubId })),
    ...(a?.showIds ?? []).map((id) => ({ id, kind: t('apShow'), name: showOf(id)?.title ?? id, open: () => s.go('show', { showId: id }), tone: showOf(id)?.tone ?? 'accent', clubId: showOf(id)?.clubId })),
    ...(a?.castIds ?? []).map((id) => ({ id, kind: t('apCast'), name: castOf(id)?.title ?? id, open: () => s.openDetails({ kind: 'cast', id }), tone: 'neutral', clubId: castOf(id)?.clubId })),
  ];
  if (!rows.length) return <Text size="sm" intent="muted">{t('isAppearsNone')}</Text>;
  return (
    <Stack direction="column" gap={2}>
      {a && a.episodes > 0 && <Text size="xs" intent="muted">{t('apEpisodes', { n: a.episodes })}</Text>}
      <Rows cols={2} colsSm={1} minItemWidth="14rem">{rows.slice(0, 24).map((r) => <ItemCard key={r.kind + r.id} variant="flat" stackBelow="never" onClick={r.open} media={<EntityAvatar id={r.clubId ?? r.id} name={r.name} size="sm" />} title={r.name} meta={r.kind} />)}</Rows>
    </Stack>
  );
};
