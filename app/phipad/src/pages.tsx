
import type { Block } from '@phi-kit/data';
import type { GridItem } from '@phi-kit/blocks';
import { byId, usd, num, initials, type DB, type FullApp, type Launch } from './data';

/** A page is data: a head and the shared blocks that draw it. Nothing here is a component. */
export type Page = { title?: string; sub?: string; blocks: Block[] };
export type Detail = { it: GridItem; blocks: Block[] };

const row = (k: string, v?: string | number | null): [string, string][] => (v == null || v === '' ? [] : [[k, String(v)]]);
const join = (list: (string | number | null | undefined | false)[]) => list.filter(Boolean).join(' · ') || undefined;
const stageLabel = (db: DB, id: string) => byId(db.phipad.stages, id)?.label || id;
const share = (a: FullApp) => Math.min(100, Math.round((a.raised / a.ask) * 100));

/** One application as a card: club, stage, ask and raised, a meter of the share raised. */
const applicationItem = (db: DB, a: FullApp): GridItem => ({
  id: a.id, kind: 'application', title: byId(db.core.clubs, a.clubId)?.name || a.clubId, tag: stageLabel(db, a.stage),
  sub: 'Ask ' + usd(a.ask) + ' · raised ' + usd(a.raised), progress: share(a) / 100, lane: a.stage,
});

const home = (db: DB): Page => {
  const p = db.phipad;
  const featured = p.applications.filter((a) => a.stage === 'incubating' || a.stage === 'funded').slice(0, 3);
  return { blocks: [
    { kind: 'hero', heading: p.hero.title, subtitle: p.hero.subtitle, body: p.hero.body, actions: [{ label: 'Apply', view: 'apply' }, { label: 'See tracks', view: 'tracks' }] },
    { kind: 'stats', items: p.stats },
    { kind: 'grid', title: 'How it works', toolbar: false, items: p.steps.map((st): GridItem => ({ title: st.title, body: st.body, mark: String(st.n), tone: 'accent' })) },
    { kind: 'grid', title: 'In the pipeline', toolbar: false, more: { label: 'Full pipeline', view: 'pipeline' }, items: featured.map((a) => applicationItem(db, a)) },
  ] };
};

const tracks = (db: DB): Page => ({
  title: 'Tracks', sub: 'Four tracks, each with its own pool and mentors.',
  blocks: [{ kind: 'grid', items: db.phipad.tracks.map((t): GridItem => ({
    route: 'apply', title: t.name, tone: t.tone, value: num(t.pool), note: t.currency + ' pool', body: t.body, action: 'Apply to ' + t.name, href: '#/apply',
  })) }],
});

const pipeline = (db: DB): Page => ({
  title: 'Pipeline', sub: 'Every application, by stage.',
  blocks: [{ kind: 'grid', laneSet: db.phipad.stages, items: db.phipad.applications.map((a) => applicationItem(db, a)) }],
});

const portfolio = (db: DB): Page => {
  const launched = db.phipad.applications.filter((a) => a.stage === 'launched' || a.stage === 'funded');
  const raised = launched.reduce((n, a) => n + a.raised, 0);
  return {
    title: 'Portfolio', sub: launched.length + ' funded and launched clubs · ' + usd(raised) + ' committed.',
    blocks: [{ kind: 'grid', items: launched.map((a): GridItem => {
      const c = byId(db.core.clubs, a.clubId);
      return { id: a.id, kind: 'application', title: c?.name || a.clubId, tone: c?.tone || 'neutral', tag: stageLabel(db, a.stage), tagIntent: 'success', body: c?.tagline, note: 'Raised ' + usd(a.raised) };
    }) }],
  };
};

/** The application form as the shared form block: the db's fields, grouped, in steps. */
const apply = (db: DB): Page => {
  const wide = (label: string) => /address|wallet|utility|link|world|host/i.test(label);
  const fieldOf = (groupList: string[]) => db.phipad.fields.filter((f) => groupList.includes(f.group)).map((f) => (
    f.id === 'track'
      ? { id: f.id, label: f.label, group: f.group, control: 'select', options: db.phipad.tracks.map((t) => t.name) }
      : { id: f.id, label: f.label, group: f.group, full: wide(f.label), locked: f.locked, placeholder: f.locked ? 'Filled in after review' : f.label }
  ));
  return {
    title: 'Apply', sub: 'Two ways in. Pick the one that fits where your club is.',
    blocks: [
      { kind: 'grid', toolbar: false, items: (db.phipad.routes || []).map((r): GridItem => ({ title: r.title, body: r.body, pointList: r.points })) },
      { kind: 'form', heading: 'Start an application', sub: 'Five steps. Everything can be edited before you submit.', submitLabel: 'Submit application',
        doneTitle: 'Application in', done: 'Thanks - your application is in. Review happens weekly; watch Messages in Phiegg for a reply.', againLabel: 'Start another',
        steps: [
          { id: 'club', label: 'Club', icon: 'users', title: 'Club', lede: 'Your club, ticker and the track you are applying to.', fields: fieldOf(['Club']) },
          { id: 'token', label: 'Token', icon: 'coin', title: 'Token & funding', lede: 'The contract, the mint and what you are raising.', fields: fieldOf(['Contract & mint', 'Funding']) },
          { id: 'world', label: 'World', icon: 'map', title: 'World & PFTs', lede: 'The world you will build and your Profile Fungible Tokens.', fields: fieldOf(['World', 'PFTs · Profile Fungible Tokens']) },
          { id: 'paper', label: 'Papers', icon: 'file', title: 'Papers', lede: 'Link your EggPaper.', fields: fieldOf(['Papers']) },
          { id: 'review', label: 'Review', icon: 'clipboard', title: 'Review', lede: 'Check what you entered, then submit.', review: true },
        ] },
    ],
  };
};

const news = (db: DB): Page => ({ title: 'News', sub: 'Cohorts, tracks and launches.', blocks: [{ kind: 'news', items: db.phipad.news }] });
const about = (db: DB): Page => ({ title: 'About Phipad', blocks: [{ kind: 'prose', lead: db.phipad.about.body, sections: db.phipad.about.sections }] });
const faq = (db: DB): Page => ({ title: 'FAQ', sub: 'The questions founders ask first.', blocks: [{ kind: 'faq', items: db.phipad.faq }] });

// Launchpad: the GemPad content as its Phi counterpart, straight from the one database.
const launchMoney = (l: Launch) => {
  const raised = typeof l.raised === 'number' ? num(l.raised) : l.raised;
  const cap = l.target ?? (typeof l.hardCap === 'number' ? num(l.hardCap) : undefined);
  return cap ? `Raised ${raised} of ${cap}` : `Raised ${raised}`;
};
const launchpad = (db: DB): Page => {
  const { launches, tiers, graduates } = db.pad;
  const head = { title: 'Launchpad', sub: 'Launches, tiers and graduates live from the one database.' };
  if (!launches.length && !tiers.length && !graduates.length) return { ...head, blocks: [{ kind: 'prose', lead: 'Start Phiora (VITE_PHI_API) to see the launchpad records.' }] };
  const blocks: Block[] = [];
  if (launches.length) blocks.push({ kind: 'grid', title: 'Launches', toolbar: false, items: launches.slice(0, 24).map((l): GridItem => ({
    title: l.name, tag: l.status, body: l.desc, note: launchMoney(l),
    fields: [...row('Tier', l.tier), ...row('Participants', typeof l.participants === 'number' ? num(l.participants) : null)],
  })) });
  if (tiers.length) blocks.push({ kind: 'grid', title: 'Tiers', toolbar: false, items: tiers.slice(0, 12).map((t): GridItem => ({
    title: t.name, tag: t.status, sub: t.min_stake ?? t.stake ? `Stake ${t.min_stake ?? t.stake}` : undefined,
    note: join([t.multiplier ?? t.alloc, typeof t.members === 'number' ? `${t.members} members` : t.pool]),
  })) });
  if (graduates.length) blocks.push({ kind: 'grid', title: 'Graduates', toolbar: false, items: graduates.slice(0, 16).map((g): GridItem => ({
    title: g.name, tag: g.status ?? g.symbol,
    note: join([g.ath_roi ? `ATH ${g.ath_roi}` : g.ath ? `ATH ${g.ath}` : null, g.market_cap ?? g.current, g.launched ?? g.raised]),
  })) });
  return { ...head, blocks };
};

/** Every page, by its view id. */
export const PAGE: Record<string, (db: DB) => Page> = { home, launchpad, tracks, pipeline, portfolio, apply, news, about, faq };

/** What the side panel shows for an opened card: the shared item panel's fields, then blocks (figures, the team). */
export const detail = (db: DB, it: GridItem): Detail => {
  const a = it.kind === 'application' ? byId(db.phipad.applications, it.id) : undefined;
  if (!a) return { it, blocks: [] };
  const c = byId(db.core.clubs, a.clubId); const t = byId(db.phipad.tracks, a.trackId); const pct = share(a);
  return {
    it: {
      title: c?.name || a.clubId, sub: stageLabel(db, a.stage), body: c?.tagline,
      fields: [...row('Track', t ? t.name + ' (' + t.currency + ')' : null), ...row('Applied', a.submittedAt), ...row('Puts minted', a.puts ? num(a.puts.minted) : null), ...row('Utility', a.puts?.utility.join(', '))],
    },
    blocks: [
      { kind: 'stats', items: [{ label: 'Ask', value: usd(a.ask) }, { label: 'Raised', value: usd(a.raised), progress: pct / 100, sub: pct + '% of ask' }] },
      ...(a.members?.length ? [{ kind: 'grid', title: 'Team', layout: 'list', toolbar: false, items: a.members.map((m): GridItem => ({ title: m.role, sub: m.puts + ' Puts', mark: initials(m.userId.replace('u_', '')), tone: 'accent' })) }] : []),
    ],
  };
};
