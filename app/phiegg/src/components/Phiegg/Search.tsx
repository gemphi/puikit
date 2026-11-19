import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Box, Button, Icon, Input, Pressable, ShellBackButton, Stack, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronLeft, ChevronRight, Search as SearchIcon } from 'lucide-react';
import { D, clubsOfCollection, fmt, holderOf, initials, person, placeOf, site, t, rideKind, itemOf } from '../../lib/data';
import { routeOf } from '../../lib/route';
import { titleOf } from '../../lib/fields';
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
      { label: t('pgShows'), hits: D.shows.shows.filter((x) => m(x.title)).map((x) => ({ id: x.id, title: x.title, sub: t('looksN', { n: x.looks.length }) + ' · ' + (itemOf('world', x.worldId)?.name ?? ''), initials: initials(x.title), open: () => s.go('show', { showId: x.id }) })) },
      { label: t('pgRides'), hits: D.ride.list.filter((c) => m(c.name) || m(c.make) || m(c.lift) || m(rideKind(c.kind))).map((c) => ({ id: c.id, title: c.name, sub: rideKind(c.kind) + ' · ' + (itemOf('world', c.worldId)?.name ?? ''), initials: initials(c.name), open: () => s.openAsset?.(c.id) })) },
      { label: t('pgJewels'), hits: D.jewel.list.filter((j) => m(j.name) || m(j.piece) || m(j.metal) || m(j.stone ?? '')).map((j) => ({ id: j.id, title: j.name, sub: `${j.piece} · ${j.metal}`, initials: initials(j.name), open: () => s.openAsset?.(j.id) })) },
      { label: t('pgTitles'), hits: D.series.series.filter((x) => m(x.title) || m(x.genre)).map((x) => ({ id: x.id, title: x.title, sub: [x.genre, x.era].filter(Boolean).join(' · '), initials: initials(x.title), open: () => s.openSeries?.(x.id) })) },
      { label: t('pgHosts'), hits: D.hosts.hosts.filter((h) => m(h.name)).map((h) => ({ id: h.id, title: h.name, sub: fmt(h.online), initials: initials(h.name), open: () => s.go('host', { hostId: h.id }) })) },
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
            <Box key={g.label} className={styles.group}><Text as="span" size="xs" weight="bold" intent="secondary" letterSpacing="0.06em" paddingY={1} paddingX={2}>{g.label}</Text>
              {g.hits.map((h) => { k += 1; const i = k; return (
                <Pressable key={h.id} row gap={3} fill rounded="lg" paddingY={2} paddingX={2} className={i === cur ? styles.on : undefined} onMouseEnter={() => setSel(i)} onClick={() => pick(h)}>
                  <Avatar initials={h.initials} size="sm" />
                  <Stack as="span" direction="column" gap={0} flex="1" minWidth="0"><Text size="sm" weight="bold" truncate>{h.title}</Text>{h.sub && <Text size="xs" intent="muted" truncate>{h.sub}</Text>}</Stack>
                </Pressable>); })}
            </Box>))}
          {q.trim() && !flat.length && <Text size="sm" intent="muted">{t('navNoMatch', { q: q.trim() })}</Text>}
          {q.trim() && <Button variant="glass" size="sm" onClick={() => { const v = q.trim(); shut(); phieggStore.setState({ searchQ: v }); s.go('search'); onPick?.(); }}>{t('srSeeAll', { q: q.trim() })}</Button>}
        </Box>)}
    </Box>
  );
};

/** Back button + parent-page trail for the current tab. */
export const Crumbs: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const s = useStore(phieggStore);
  // Home is the welcome page (the sidebar has no separate Welcome); every trail starts there.
  const trail: [string, (() => void) | null][] = [[t('pgHome'), s.tab === 'welcome' ? null : () => s.go('welcome')]];
  // The rest of the trail is read from the path (data/route.json): the list it sits under, the record that holds
  // its record (a zone's world, a look's shop), then the record itself. One rule for every path, no path named here.
  const word = (k: string) => (k in site.copy ? t(k as SiteCopyKey) : k);
  const nameOf = (path: string) => { const r = routeOf(path); return r.name ? word(r.name) : path.charAt(0).toUpperCase() + path.slice(1); };
  const route = routeOf(s.tab); const id = route.param ? (s as unknown as Record<string, string>)[route.param] : undefined;
  if (id) {
    const kind = [route.record ?? route.kind ?? []].flat().find((k) => itemOf(k, id)); const row = kind ? itemOf(kind, id) : undefined;
    const by = route.upBy && row ? route.upBy[String(row[route.upBy.field])] : undefined; const up = (typeof by === 'object' ? by : undefined) ?? route.up;
    if (up) trail.push([up.name ? word(up.name) : nameOf(up.path), () => s.go(up.path, up.params)]);
    const holder = kind ? holderOf(kind, id) : undefined;
    if (holder) trail.push([titleOf(holder.kind, holder.row), () => s.openRef({ kind: holder.kind, id: holder.row.id })]);
    // A place is kept in the places file, which loads when its page opens: its name comes from there.
    trail.push([kind && row ? titleOf(kind, row) : placeOf(id)?.place.name ?? '', null]);
  } else if (s.tab !== 'welcome') trail.push([nameOf(s.tab), null]);
  return (
    <Box className={styles.crumbs}>
      <ShellBackButton label={t('navBack')} disabled={!s.hist.length} onClick={s.back} />
      <Box as="nav" aria-label="Breadcrumb" className={styles.crumbs}>
        {(compact && trail.length > 2 ? trail.slice(-1) : trail).map(([name, go], i, shown) => { const last = i === shown.length - 1; return (
          <React.Fragment key={i}>{i > 0 && <Text as="span" intent="secondary" flex="none"><Icon icon={ChevronRight} size="xs" /></Text>}
            <Pressable rounded="full" hover className={[styles.crumb, last ? styles.last : ''].join(' ')} aria-current={last ? 'page' : undefined}
              onClick={go && !last ? go : () => document.querySelectorAll('.pui-shell-content').forEach((el) => el.scrollTo({ top: 0, behavior: 'smooth' }))}>{name}</Pressable></React.Fragment>); })}
      </Box>
    </Box>
  );
};
