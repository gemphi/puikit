// Top-N preview rows for secondary-menu accordions. Sources are named in data/site.json.
import { D, feedPosts, fmt, site, t, rideKind } from '../../lib/data';
import type { PhieggState } from '../../state/phieggStore';

/** `who` = a person id (shows their profile icon); otherwise the row's own default profile icon from id + label. */
export interface Preview { id: string; label: string; meta: string; open: () => void; who?: string }

export function previews(source: string, s: PhieggState, n: number): Preview[] {
  const rows: Preview[] = (() => {
    switch (source) {
      case 'nests': return s.nests.filter((x) => !x.parentId).map((x) => ({ id: x.id, label: '# ' + x.name, meta: x.unread ? String(x.unread) : '', open: () => s.go('hosts') }));
      case 'worlds': return [...D.core.worlds].sort((a, b) => b.visitorsNow - a.visitorsNow).map((w) => ({ id: w.id, label: w.name, meta: fmt(w.visitorsNow), open: () => s.go('world', { worldId: w.id }) }));
      case 'quests': case 'sponsored': return D.economy.quests.filter((q) => source === 'quests' || q.kind === 'sponsored').map((q) => ({ id: q.id, label: q.title, meta: fmt(q.entrants), open: () => s.go(source === 'quests' ? 'quests' : 'play') }));
      case 'recipients': return D.messages.conversations.map((c) => ({ id: c.id, label: c.title, meta: c.unread ? String(c.unread) : c.at, open: () => s.go('messages') }));
      case 'agents': return D.agents.agents.map((a) => ({ id: a.id, label: a.name, meta: a.status, open: () => s.openPerson(a.id), who: a.id }));
      case 'voice': return D.messages.voiceRooms.map((v) => ({ id: v.id, label: v.title, meta: fmt(v.listeners), open: () => s.go('messages') }));
      case 'hosts': return D.hosts.hosts.map((h) => ({ id: h.id, label: h.name, meta: t('online', { n: fmt(h.online) }), open: () => s.go('hosts') }));
      case 'shows': return D.shows.shows.map((x) => ({ id: x.id, label: x.title, meta: String(x.looks.length), open: () => s.go('show', { showId: x.id }) }));
      case 'drops': return D.events.events.filter((e) => e.kind === 'drop').map((e) => ({ id: e.id, label: e.title, meta: e.startsAt.slice(5, 10), open: () => s.go('drops') }));
      case 'coins': return D.economy.coins.map((c) => ({ id: c.id, label: c.symbol, meta: (c.change24h > 0 ? '+' : '') + c.change24h + '%', open: () => s.go('coins') }));
      case 'pools': return D.pools.pools.slice(0, 40).map((p) => ({ id: p.id, label: p.name, meta: t(('plKind_' + p.kind) as 'plKind_show'), open: () => s.go('pool', { poolId: p.id }) }));
      case 'feeds': return (site as unknown as { feedKinds: { id: string; label: string }[] }).feedKinds.map((k) => ({ id: 'fk_' + k.id, label: k.label, meta: '', open: () => s.go('feed', { feedKind: k.id }) }));
      case 'reels': return feedPosts().filter((p) => p.slides.length > 1).map((p) => ({ id: p.id, label: p.slides[0].title, meta: String(p.slides.length), open: () => s.openPost(p.id), who: p.authorId }));
      case 'rides': return (['car', 'cab', 'van', 'jetski', 'saucer', 'fun'] as const).map((k) => ({ id: 'rk_' + k, label: rideKind(k), meta: String(D.ride.list.filter((r) => r.kind === k).length), open: () => s.go('rides') }));
      default: return [];
    }
  })();
  return rows.slice(0, n);
}
