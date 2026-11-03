import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Box, Button, Icon, Input, Pressable, Stack, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronLeft, ChevronRight, Search as SearchIcon } from 'lucide-react';
import { D, cityOf, clubOf, clubsOfCollection, fmt, initials, person, showOf, storeOf, t, worldOf, rideKind } from '../../lib/data';
import type { SiteCopyKey } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import styles from './Search.module.scss';

export type Hit = { id: string; title: string; sub: string; initials: string; open: () => void };
export type Group = { label: string; hits: Hit[] };

const JUMP: [string, SiteCopyKey][] = [['feed', 'pgHome'], ['explore', 'pgExplore'], ['worlds', 'pgWorlds'], ['shows', 'pgShows'], ['hosts', 'pgHosts'],
  ['agents-hub', 'pgAgents'], ['events', 'pgEvents'], ['messages', 'pgMessages'], ['phipad', 'pgPhipad']];

/** Search clubs, worlds, people, agents, shows and hosts; empty query = the "Jump to" pages. Shared by the header box and the Search page. */
export function searchGroups(q: string, s: { go: (tab: string, p?: Record<string, string>) => void; openPerson: (id: string) => void; openAsset?: (id: string) => void; openSeries?: (id: string) => void }, limit = 4): Group[] {
    const n = q.trim().toLowerCase(); const m = (x?: string) => !!x && x.toLowerCase().includes(n);
    if (!n) return [{ label: t('navJump'), hits: JUMP.map(([tab, k]) => ({ id: tab, title: t(k), sub: '', initials: initials(t(k)), open: () => s.go(tab) })) }];
    const g: Group[] = [
      { label: t('pgClubs'), hits: D.core.clubs.filter((c) => m(c.name) || m(c.ticker) || m(c.tagline) || c.tags.some(m)).map((c) => ({ id: c.id, title: c.name, sub: c.tagline, initials: initials(c.name), open: () => s.go('club', { clubId: c.id }) })) },
      { label: t('pgCollections'), hits: D.hosts.nests.filter((x) => x.kind === 'collection' && (m(x.name) || m((x as { topic?: string }).topic))).map((x) => ({ id: x.id, title: '#' + x.name, sub: t('colClubsN', { n: clubsOfCollection(x.id).length }), initials: initials(x.name), open: () => s.go('collection', { nestId: x.id }) })) },
      { label: t('pgWorlds'), hits: D.core.worlds.filter((w) => m(w.name) || w.cities.some((c) => m(c.name))).map((w) => ({ id: w.id, title: w.name, sub: w.cities.map((c) => c.name).join(', '), initials: initials(w.name), open: () => s.go('world', { worldId: w.id }) })) },
      { label: t('pgPeople'), hits: D.core.users.filter((u) => m(u.name) || m(u.handle)).map((u) => ({ id: u.id, title: u.name, sub: '@' + u.handle, initials: initials(u.name), open: () => s.openPerson(u.id) })) },
      { label: t('pgAgents'), hits: D.agents.agents.filter((a) => m(a.name) || m(a.handle)).map((a) => ({ id: a.id, title: a.name, sub: '@' + a.handle, initials: initials(a.name), open: () => s.openPerson(a.id) })) },
      { label: t('pgShows'), hits: D.shows.shows.filter((x) => m(x.title)).map((x) => ({ id: x.id, title: x.title, sub: t('looksN', { n: x.looks.length }) + ' · ' + (worldOf(x.worldId)?.name ?? ''), initials: initials(x.title), open: () => s.go('show', { showId: x.id }) })) },
      { label: t('pgRides'), hits: D.ride.list.filter((c) => m(c.name) || m(c.make) || m(c.lift) || m(rideKind(c.kind))).map((c) => ({ id: c.id, title: c.name, sub: rideKind(c.kind) + ' · ' + (worldOf(c.worldId)?.name ?? ''), initials: initials(c.name), open: () => s.openAsset?.(c.id) })) },
      { label: t('pgJewels'), hits: D.jewel.list.filter((j) => m(j.name) || m(j.piece) || m(j.metal) || m(j.stone ?? '')).map((j) => ({ id: j.id, title: j.name, sub: `${j.piece} · ${j.metal}`, initials: initials(j.name), open: () => s.openAsset?.(j.id) })) },
      { label: t('pgTitles'), hits: D.series.series.filter((x) => m(x.title) || m(x.genre)).map((x) => ({ id: x.id, title: x.title, sub: [x.genre, x.era].filter(Boolean).join(' · '), initials: initials(x.title), open: () => s.openSeries?.(x.id) })) },
      { label: t('pgHosts'), hits: D.hosts.hosts.filter((h) => m(h.name)).map((h) => ({ id: h.id, title: h.name, sub: fmt(h.online), initials: initials(h.name), open: () => s.go('hosts') })) },
    ];
    return g.map((x) => ({ ...x, hits: x.hits.slice(0, limit) })).filter((x) => x.hits.length);
}

/** Header search across clubs, worlds, people, agents, shows and hosts. "/" or Ctrl/Cmd+K focuses it. */
export const SearchBox: React.FC<{ autoFocus?: boolean; onPick?: () => void }> = ({ autoFocus, onPick }) => {
  const s = useStore(phieggStore);
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false); const [sel, setSel] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const input = () => wrap.current?.querySelector('input') ?? null;
  useEffect(() => {
    const onK = (e: KeyboardEvent) => { const el = e.target as HTMLElement; const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); input()?.focus(); } };
    window.addEventListener('keydown', onK); return () => window.removeEventListener('keydown', onK);
  }, []);
  const groups: Group[] = useMemo(() => searchGroups(q, s), [q, s]);
  const flat = groups.flatMap((g) => g.hits); const cur = Math.min(sel, Math.max(0, flat.length - 1));
  const shut = () => { setQ(''); setOpen(false); setSel(0); input()?.blur(); };
  const pick = (h: Hit) => { shut(); h.open(); onPick?.(); };
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = flat.length || 1; setSel((cur + (e.key === 'ArrowDown' ? 1 : -1) + n) % n); }
    else if (e.key === 'Enter' && flat[cur]) { e.preventDefault(); pick(flat[cur]); } else if (e.key === 'Escape') shut();
  };
  let k = -1;
  return (
    <Box ref={wrap} className={styles.wrap} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <Input value={q} autoFocus={autoFocus} placeholder={t('navSearch')} aria-label={t('navSearch')} icon={<Icon icon={SearchIcon} size="xs" />}
        trailing={!open && !q ? <Text as="kbd" size="xs" mono weight="bold" intent="secondary" className={styles.kbd} title={t('navSearch')}>{mac ? '⌘K' : 'Ctrl K'}</Text> : null}
        onChange={(e) => { setQ(e.target.value); setSel(0); setOpen(true); }} onKeyDown={onKey} />
      {open && (
        <Box className={styles.drop} onMouseDown={(e) => e.preventDefault()}>
          {groups.map((g) => (
            <Box key={g.label} className={styles.group}><Text as="span" size="xs" weight="bold" intent="secondary" textTransform="uppercase" letterSpacing="0.06em" paddingY={1} paddingX={2}>{g.label}</Text>
              {g.hits.map((h) => { k += 1; const i = k; return (
                <Pressable key={h.id} row gap={3} fill rounded="lg" paddingY={2} paddingX={2} className={i === cur ? styles.on : undefined} onMouseEnter={() => setSel(i)} onClick={() => pick(h)}>
                  <Avatar initials={h.initials} size="sm" />
                  <Stack as="span" direction="column" gap={0} flex="1" minWidth="0"><Text size="sm" weight="bold" truncate>{h.title}</Text>{h.sub && <Text size="xs" intent="muted" truncate>{h.sub}</Text>}</Stack>
                </Pressable>); })}
            </Box>))}
          {q.trim() && !flat.length && <Text size="sm" intent="muted">{t('navNoMatch', { q: q.trim() })}</Text>}
          {q.trim() && <Button variant="ghost" size="sm" onClick={() => { const v = q.trim(); shut(); phieggStore.setState({ searchQ: v }); s.go('search'); onPick?.(); }}>{t('srSeeAll', { q: q.trim() })}</Button>}
        </Box>)}
    </Box>
  );
};

/** Back button + parent-page trail for the current tab. */
export const Crumbs: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const s = useStore(phieggStore);
  const trail: [string, (() => void) | null][] = [[t('pgHome'), () => s.go('feed')]];
  const label: Record<string, SiteCopyKey> = Object.fromEntries(JUMP);
  if (s.tab === 'club') trail.push([t('pgClubs'), () => s.go('explore')], [clubOf(s.clubId)?.name ?? '', null]);
  else if (s.tab === 'world') trail.push([t('pgWorlds'), () => s.go('worlds')], [worldOf(s.worldId)?.name ?? '', null]);
  else if (s.tab === 'city') { const hit = cityOf(s.cityId); trail.push([t('pgWorlds'), () => s.go('worlds')], [hit?.world.name ?? '', () => hit && s.go('world', { worldId: hit.world.id })], [hit?.city.name ?? '', null]); }
  else if (s.tab === 'shop') trail.push([t('pgShop'), null], [storeOf(s.storeId).name, null]);
  else if (s.tab === 'show') trail.push([t('pgShows'), () => s.go('shows')], [showOf(s.showId)?.title ?? '', null]);
  else if (s.tab === 'profile') trail.push([t('pgCreators'), () => s.go('explore')], [person(s.profileId).name, null]);
  else if (s.tab !== 'feed') trail.push([label[s.tab] ? t(label[s.tab]) : s.tab.charAt(0).toUpperCase() + s.tab.slice(1), null]);
  return (
    <Box className={styles.crumbs}>
      <Button variant="ghost" size="sm" aria-label={t('navBack')} disabled={!s.hist.length} onClick={s.back} icon={<Icon icon={ChevronLeft} size="xs" />} />
      <Box as="nav" aria-label="Breadcrumb" className={styles.crumbs}>
        {(compact && trail.length > 2 ? trail.slice(-1) : trail).map(([name, go], i, shown) => { const last = i === shown.length - 1; return (
          <React.Fragment key={i}>{i > 0 && <Text as="span" intent="secondary" flex="none"><Icon icon={ChevronRight} size="xs" /></Text>}
            <Pressable rounded="full" hover={!last} className={[styles.crumb, last ? styles.last : ''].join(' ')} onClick={last || !go ? undefined : go}>{name}</Pressable></React.Fragment>); })}
      </Box>
    </Box>
  );
};
