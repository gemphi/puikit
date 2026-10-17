import React, { useMemo, useState } from 'react';
import { BrowseSheet, Button, Card, CardBody, Stack, Tag, Text, type BrowseFacet, type BrowseLayout } from '@pui/components';
import { useStore } from '@pui/store';
import { D, clubOf, fmt, site, t, worldOf } from '../../lib/data';
import { livePools, useNow } from '../../lib/market';
import { phieggStore, type PhieggState } from '../../state/phieggStore';
import { AgentChat } from './AgentChat';
import { PoolCard } from './Pools';
import { Tile } from './Tile';

/**
 * Every "see all" list opens the same puijs BrowseSheet. A source only says what its items are, how to read their
 * relations into facets, how to draw one card and which agent to chat with, the sheet takes that data for its
 * areas (filters · grid · layout + chat) and nothing is hardcoded per list.
 */
type Facet<T> = { id: string; label: string; get: (r: T) => string | undefined };
type Source<T> = {
  title: () => string;
  items: (now: number) => T[];
  key: (r: T) => string;
  text: (r: T) => string;
  facets: Facet<T>[];
  card: (r: T, s: PhieggState, now: number) => React.ReactNode;
  /** The agent who talks about these items: the one who shares a club with the first match. */
  clubOf: (r: T) => string | undefined;
  prompts: () => string[];
};

const band = (p: number) => (p >= 0.9 ? '90 %+ sold' : p >= 0.75 ? '75–90 % sold' : p >= 0.5 ? '50–75 % sold' : 'under 50 % sold');
type DropRow = ReturnType<typeof livePools>[number];
type Club = (typeof D.core.clubs)[number];
type Ev = (typeof D.events.events)[number];

const SOURCES: Record<string, Source<DropRow> | Source<Club> | Source<Ev>> = {
  drops: {
    title: () => t('drops'),
    items: (now) => livePools(now, 400),
    key: (r) => r.pool.id, text: (r) => r.pool.name + ' ' + (clubOf(r.pool.clubId)?.name ?? ''),
    facets: [
      { id: 'kind', label: 'Kind', get: (r) => t(('plKind_' + r.pool.kind) as 'plKind_show') },
      { id: 'club', label: 'Club', get: (r) => clubOf(r.pool.clubId)?.name },
      { id: 'world', label: 'World', get: (r) => worldOf(r.pool.worldId)?.name },
      { id: 'sold', label: 'Sold', get: (r) => band(r.N.supply ? r.N.sold / r.N.supply : 0) },
    ],
    card: (r, _s, now) => <PoolCard pool={r.pool} now={now} />,
    clubOf: (r) => r.pool.clubId, prompts: () => [t('lsAskDrop'), t('lsAskCheap'), t('lsAskSwap')],
  } as Source<DropRow>,
  clubs: {
    title: () => t('clubsToJoin'),
    items: () => [...D.core.clubs].sort((a, b) => b.holders - a.holders),
    key: (r) => r.id, text: (r) => r.name + ' ' + r.tagline,
    facets: [
      { id: 'status', label: 'Status', get: (r) => (site.clubStatus as Record<string, string>)[r.status] },
      { id: 'tag', label: 'Tag', get: (r) => r.tags[0] },
      { id: 'chain', label: 'Chain', get: (r) => r.chain },
      { id: 'world', label: 'World', get: (r) => worldOf(r.worldIds[0])?.name },
    ],
    card: (c, s) => (
      <Card depth={2}><CardBody><Stack direction="column" gap={2}>
        <Tile tone={c.tone} ratio="16/10" depth={{ clubId: c.id, worldId: c.worldIds[0], personId: c.founderId }} title={c.name} sub={c.tagline} onClick={() => s.go('club', { clubId: c.id })}
          badges={<Tag round size="sm">{(site.clubStatus as Record<string, string>)[c.status]}</Tag>} />
        <Text size="xs" intent="muted">{fmt(c.holders)} {t('holders')}{c.floor ? ' · ' + c.floor + ' ETH ' + t('floor') : ''}</Text>
        <Stack direction="row" gap={2}>
          <Button size="sm" variant={s.follow[c.id] ? 'secondary' : 'primary'} onClick={() => s.toggle('follow', c.id)}>{s.follow[c.id] ? t('following') : t('follow')}</Button>
          <Button size="sm" variant="outline" onClick={() => s.go('club', { clubId: c.id })}>{t('view')}</Button>
        </Stack>
      </Stack></CardBody></Card>),
    clubOf: (r) => r.id, prompts: () => [t('lsAskClub'), t('lsAskPerks'), t('lsAskNew')],
  } as Source<Club>,
  events: {
    title: () => t('comingUp'),
    items: () => [...D.events.events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    key: (r) => r.id, text: (r) => r.title,
    facets: [
      { id: 'kind', label: 'Kind', get: (r) => r.kind },
      { id: 'genre', label: 'Genre', get: (r) => r.genre },
      { id: 'world', label: 'World', get: (r) => worldOf(r.worldId)?.name },
      { id: 'month', label: 'Month', get: (r) => r.startsAt.slice(0, 7) },
    ],
    card: (e, s) => { const going = !!s.rsvp[e.id]; const club = clubOf(e.clubId); return (
      <Card depth={2}><CardBody><Stack direction="column" gap={2}>
        <Tile tone={club?.tone ?? 'accent'} ratio="16/10" depth={{ clubId: e.clubId, worldId: e.worldId }} title={e.title} sub={worldOf(e.worldId)?.name} badges={<Tag round size="sm">{e.kind}{e.genre ? ' · ' + e.genre : ''}</Tag>} />
        <Text size="xs" intent="muted">{e.startsAt.slice(0, 10)} · {fmt(e.rsvps + (going ? 1 : 0))} RSVPs</Text>
        <Button size="sm" variant={going ? 'secondary' : 'primary'} onClick={() => s.toggle('rsvp', e.id)}>{going ? t('going') : t('rsvp')}</Button>
      </Stack></CardBody></Card>); },
    clubOf: (r) => r.clubId, prompts: () => [t('lsAskEvent'), t('lsAskTonight'), t('lsAskWear')],
  } as Source<Ev>,
};
export const LIST_SOURCES = Object.keys(SOURCES);

export const CollectionSheet: React.FC<{ list: string }> = ({ list }) => {
  const s = useStore(phieggStore); const now = useNow(3000);
  const src = (SOURCES[list] ?? SOURCES.drops) as Source<unknown>;
  const [q, setQ] = useState(''); const [sel, setSel] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<BrowseLayout>({ mode: 'grid', cols: 3 });
  const all = useMemo(() => src.items(now), [list, Math.floor(now / 30000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const facets: BrowseFacet[] = src.facets.map((f) => {
    const counts = new Map<string, number>(); for (const r of all) { const v = f.get(r); if (v) counts.set(v, (counts.get(v) ?? 0) + 1); }
    return { id: f.id, label: f.label, options: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([v, n]) => ({ id: v, label: v, count: n })) };
  });
  const ql = q.trim().toLowerCase();
  const shown = all.filter((r) => (!ql || src.text(r).toLowerCase().includes(ql)) && src.facets.every((f) => !sel[f.id] || f.get(r) === sel[f.id]));
  const firstClub = shown[0] ? src.clubOf(shown[0]) : undefined;
  const agent = D.agents.agents.find((a) => firstClub && a.clubIds.includes(firstClub)) ?? D.agents.agents[0];
  return (
    <BrowseSheet isOpen onClose={s.close} title={src.title()} count={shown.length} facets={facets} selected={sel}
      onSelect={(f, o) => setSel((x) => ({ ...x, [f]: o ?? '' }))} search={q} onSearch={setQ} layout={layout} onLayout={setLayout}
      asideTitle={t('lsLayoutChat')} aside={<AgentChat agentId={agent.id} context={src.title()} prompts={src.prompts()} />}
      labels={{ filters: t('lsFilters'), layout: t('lsLayout'), search: t('searchPh'), all: t('seAll'), clear: t('lsClear'), expand: t('expand'), collapse: t('collapse') }}>
      {shown.slice(0, 120).map((r) => <React.Fragment key={src.key(r)}>{src.card(r, s, now)}</React.Fragment>)}
    </BrowseSheet>
  );
};
