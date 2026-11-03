import React from 'react';
import { Avatar, Button, Card, CardBody, Page, Rows, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { D, cityOf, clubOf, initials, lookOf, person, poolOf, postById, showOf, storeOf, t, usd, worldImage, worldOf } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { Tile } from '../../components/Phiegg/Tile';
import { ListView } from '../../components/Phiegg/Views';
import { useActivity, type ActivityEvent } from '../../lib/activity';
import type { Tone } from '../../types/phiegg';

type Params = Record<string, string | undefined>;
type Visit = { key: string; tab: string; p: Params; title: string; kind: string; tone: Tone };

/** One card per place visited (store history), newest first. */
const describe = (tab: string, p: Params): Visit | null => {
  const v = (title: string | undefined, kind: string, id: string | undefined, tone: Tone = 'neutral') => (title ? { key: tab + ':' + (id ?? ''), tab, p, title, kind, tone } : null);
  switch (tab) {
    case 'club': { const c = clubOf(p.clubId!); return v(c?.name, t('pgClubs'), p.clubId, c?.tone); }
    case 'world': { const w = worldOf(p.worldId!); return v(w?.name, t('pgWorlds'), p.worldId, 'sage'); }
    case 'city': { const h = cityOf(p.cityId!); return v(h?.city.name, h?.world.name ?? '', p.cityId, 'accent'); }
    case 'show': { const x = showOf(p.showId!); return v(x?.title, t('pgShows'), p.showId, 'ink'); }
    case 'profile': return v(person(p.profileId!).name, t('pgCreators'), p.profileId, 'accent');
    case 'shop': return v(storeOf(p.storeId!).name, t('pgShop'), p.storeId, 'neutral');
    case 'feed': case 'recent': return null;
    default: return v(tab.charAt(0).toUpperCase() + tab.slice(1).replace(/-/g, ' '), '', '', 'neutral');
  }
};

const START = ((D.landing as unknown as { featured?: { worldIds: string[] } }).featured?.worldIds ?? []).map(worldOf).filter((w): w is NonNullable<ReturnType<typeof worldOf>> => !!w).slice(0, 8);
const evLabel = (k: string) => t(('ev_' + k.replace('.', '_')) as 'ev_buy');
const refName = (e: ActivityEvent) => lookOf(e.ref)?.name ?? postById(e.ref)?.slides[0]?.title ?? (e.refKind === 'agent' || e.ref.startsWith('u_') || e.ref.startsWith('ag_') ? person(e.ref).name : undefined) ?? clubOf(e.ref)?.name ?? poolOf(e.ref)?.name ?? e.ref;

export const RecentPage: React.FC = () => {
  const s = useStore(phieggStore); const activity = useActivity().events;
  const seen = new Set<string>(); const visits: Visit[] = [];
  for (const h of [...s.hist].reverse()) { const d = describe(h.tab, h.p as Params); if (d && !seen.has(d.key)) { seen.add(d.key); visits.push(d); } }
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="row" justify="between" align="end" wrap gap={2}>
        <Stack direction="column" gap={1}><Title level={2} size="xl">{t('rcTitle')}</Title><Text intent="secondary">{t('rcSub')}</Text></Stack>
        <Button variant="ghost" size="sm" disabled={!s.hist.length} onClick={() => phieggStore.setState({ hist: [] })}>{t('rcClear')}</Button>
      </Stack>
      {!visits.length && <Stack direction="column" gap={2}>
        <Text intent="muted">{t('rcEmpty')}</Text>
        <Title level={4} size="md">{t('rcStart')}</Title><Text size="sm" intent="secondary">{t('rcStartHint')}</Text>
        <Rows cols={4} colsSm={2} minItemWidth="12rem">{START.map((w) => (
          <Tile key={w.id} image={worldImage(w)} tone={w.tone} ratio="16/10" title={w.name} sub={w.description} depth={{ worldId: w.id, clubId: w.clubId }} onClick={() => s.go('world', { worldId: w.id })} />))}</Rows>
      </Stack>}
      {visits.length > 0 && <ListView<Visit & { n: number }> rows={visits.map((x, n) => ({ ...x, n }))} keyOf={(x) => x.key} text={(x) => x.title + ' ' + x.kind} onRow={(x) => s.go(x.tab, x.p as Record<string, string>)}
        facets={[{ id: 'kind', label: t('lsColKind'), get: (x) => x.kind || undefined }]}
        sorts={[{ id: 'recent', label: t('lsSortRecent'), by: (a, b) => a.n - b.n }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.title.localeCompare(b.title) }]}
        table={[{ id: 'n', header: '#', cell: (x) => x.n + 1, sortValue: (x) => x.n, align: 'right' }, { id: 'title', header: t('lsColName'), cell: (x) => x.title, sortValue: (x) => x.title }, { id: 'kind', header: t('lsColKind'), cell: (x) => x.kind, sortValue: (x) => x.kind }]}
        render={(x) => (
          <Card depth={2} onClick={() => s.go(x.tab, x.p as Record<string, string>)}><CardBody><Tile tone={x.tone} ratio="16/9" title={x.title} sub={x.kind || undefined} /></CardBody></Card>)} />}
      <Stack direction="column" gap={1}><Title level={4} size="md">{t('rcActivity')}</Title><Text size="sm" intent="muted">{t('rcActivitySub')}</Text></Stack>
      {!activity.length && <Stack direction="row" gap={2} wrap>
        <Button variant="outline" size="sm" onClick={() => s.go('shop')}>{t('rcGoShop')}</Button>
        <Button variant="outline" size="sm" onClick={() => s.go('quests')}>{t('rcGoQuests')}</Button>
        <Button variant="outline" size="sm" onClick={() => s.go('events')}>{t('rcGoEvents')}</Button></Stack>}
      {activity.length > 0 && <ListView<ActivityEvent> rows={activity} keyOf={(e) => e.id} text={(e) => evLabel(e.kind) + ' ' + refName(e) + ' ' + (e.note ?? '')}
        facets={[{ id: 'kind', label: t('isEvent'), get: (e) => evLabel(e.kind) }, { id: 'ref', label: t('lsColKind'), get: (e) => e.refKind }]}
        sorts={[{ id: 'new', label: t('lsSortRecent'), by: (a, b) => b.at - a.at }, { id: 'usd', label: t('lsSortPrice'), by: (a, b) => (b.usd ?? 0) - (a.usd ?? 0) }]}
        table={[{ id: 'at', header: t('isWhen'), cell: (e) => new Date(e.at).toLocaleString(), sortValue: (e) => e.at }, { id: 'kind', header: t('isEvent'), cell: (e) => evLabel(e.kind), sortValue: (e) => e.kind },
          { id: 'ref', header: t('lsColName'), cell: refName, sortValue: refName }, { id: 'usd', header: t('isPrice'), cell: (e) => (e.usd ? usd(Math.abs(e.usd)) : ''), sortValue: (e) => e.usd ?? 0, align: 'right' }]}
        empty={t('isNoActivity')}
        render={(e) => <Card depth={1} variant="flat" padding="sm"><CardBody><Stack direction="column" gap={1}><Tag minimal round size="sm" intent="primary">{evLabel(e.kind)}</Tag>
          <Text size="sm" weight="bold">{refName(e)}</Text><Text size="xs" intent="muted">{new Date(e.at).toLocaleString()}{e.usd ? ' · ' + usd(Math.abs(e.usd)) : ''}</Text></Stack></CardBody></Card>} />}
      <Title level={4} size="md">{t('rcChats')}</Title>
      <Stack direction="column" gap={1}>{D.messages.conversations.map((c) => (
        <Button key={c.id} variant="ghost" onClick={() => s.go('messages')} align="start" tall>
          <Stack direction="row" gap={2} align="center"><Avatar initials={initials(c.title)} size="sm" />
            <Stack direction="column" gap={0} align="start"><Text size="sm" weight="bold">{c.title}</Text><Text size="xs" intent="muted">{c.last}</Text></Stack>
            {c.unread > 0 && <Tag round size="sm" intent="primary">{c.unread}</Tag>}</Stack>
        </Button>))}</Stack>
    </Stack></Page>
  );
};
