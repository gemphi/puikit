
import type { Block } from '@phi-kit/data';
import type { GridItem } from '@phi-kit/blocks';
import { num, pctOf, met, STATUS, initials, type DB, type Proposal } from './data';

/** A page is data: a head and the shared blocks that draw it. Nothing here is a component. */
export type Page = { title?: string; sub?: string; blocks: Block[] };
export type Detail = { it: GridItem; blocks: Block[] };
export type VoteSet = Record<string, 'for' | 'against'>;

const WEIGHT = '1,420 PFT';
const tally = (p: Proposal) => num(p.for) + ' vs ' + num(p.against) + ' · quorum ' + (met(p) ? 'met' : num(p.quorum) + ' needed');

/** One proposal as a card: number and title, summary, the for and against meter with its tally. */
const proposalItem = (p: Proposal): GridItem => ({
  id: p.id, kind: 'proposal', title: p.n + ' · ' + p.title, body: p.summary, progress: pctOf(p) / 100, split: true,
  note: pctOf(p) + '% for · ' + tally(p), facet: p.status,
});

const home = (db: DB): Page => ({ blocks: [
  { kind: 'hero', heading: db.hero.title, subtitle: db.hero.subtitle, body: db.hero.body, actions: [{ label: 'See proposals', view: 'proposals' }, { label: 'Swap tokens', view: 'swap' }] },
  { kind: 'stats', items: db.stats },
  { kind: 'grid', title: 'Open for voting', layout: 'list', toolbar: false, more: { label: 'All proposals', view: 'proposals' },
    items: db.proposals.filter((p) => p.status === 'open').map((p): GridItem => ({ ...proposalItem(p), tag: p.closes, tagIntent: STATUS[p.status].intent })) },
] });

const proposals = (db: DB, mine: VoteSet): Page => ({
  title: 'Proposals', sub: 'Vote with your Phiput weight. Any member can propose.',
  blocks: [{ kind: 'grid', layout: 'list', facet: ['All', 'Open', 'Passed', 'Rejected'], items: db.proposals.map((p): GridItem => ({
    ...proposalItem(p), tag: STATUS[p.status].label, tagIntent: STATUS[p.status].intent,
    sub: p.category + ' · ' + (p.status === 'open' ? p.closes : 'by ' + p.proposer) + (mine[p.id] ? ' · you voted ' + mine[p.id] : ''),
  })) }],
});

const treasury = (db: DB): Page => ({
  title: 'Treasury', sub: 'Held in the open. ' + db.treasury.total + ' across four assets.',
  blocks: [
    { kind: 'table', cols: ['Asset', 'Amount', 'Value (USD)', 'Share', '7d'], rows: db.treasury.holdings.map((h) => [h.asset, h.amount, h.usd.toLocaleString('en-US'), h.pct + '%', h.change]) },
    { kind: 'table', title: 'Recent flows', cols: ['Date', 'Movement', 'Amount'], rows: db.treasury.flows.map((fl) => [fl.date, fl.what, fl.amount + ' ' + fl.coin]) },
  ],
});

const swap = (db: DB): Page => ({
  title: 'Swap', sub: '$EGG and $UM interchange here, priced from the token table. ' + (db.swap.fee * 100).toFixed(1) + '% goes to the treasury.',
  blocks: [{ kind: 'swap', coins: db.swap.coins, from: db.swap.from, to: db.swap.to, fee: db.swap.fee }],
});

const delegates = (db: DB): Page => ({
  title: 'Delegates', sub: 'Members who vote on behalf of others. Delegation is revocable any time.',
  blocks: [{ kind: 'grid', items: db.delegates.map((d): GridItem => ({
    id: d.id, kind: 'delegate', title: d.name, mark: initials(d.name), tone: d.tone, sub: num(d.weight) + ' PFT · ' + d.votes + ' votes', body: d.bio,
  })) }],
});

const news = (db: DB): Page => ({ title: 'News', sub: 'Decisions, treasury reports and drafts from the council.', blocks: [{ kind: 'news', items: db.news }] });

const about = (db: DB): Page => ({
  title: 'About Phidao',
  blocks: [
    { kind: 'prose', lead: db.about.body, sections: db.about.sections },
    { kind: 'table', title: 'Parameters', rows: [['Quorum', db.params.quorum], ['Voting period', db.params.votingPeriod], ['Proposal stake', db.params.proposalStake], ['Pass threshold', db.params.passThreshold]] },
  ],
});

const docs = (db: DB): Page => ({
  title: 'Docs', sub: 'How governance works, in detail.',
  blocks: [
    { kind: 'grid', items: db.docs.map((d): GridItem => ({ title: d.title, sub: d.sub, body: d.body, action: d.action, href: d.href })) },
    { kind: 'faq', title: 'FAQ', items: db.faq },
  ],
});

/** Every page, by its view id. */
export const PAGE: Record<string, (db: DB, mine: VoteSet) => Page> = { home, proposals, treasury, swap, delegates, news, about, docs };

/** What the side panel shows for an opened card: the shared item panel's fields, then blocks (figures, the ballot). */
export const detail = (db: DB, it: GridItem, mine: VoteSet): Detail => {
  const p = it.kind === 'proposal' ? db.proposals.find((x) => x.id === it.id) : undefined;
  if (p) return {
    it: { title: p.n + ' · ' + p.title, sub: STATUS[p.status].label, body: p.body, fields: [['Category', p.category], ['Proposer', p.proposer], ...(p.status === 'open' ? [['Closes', p.closes] as [string, string]] : [])] },
    blocks: [
      { kind: 'stats', items: [{ label: 'For', value: pctOf(p) + '%', progress: pctOf(p) / 100, split: true, sub: tally(p) }] },
      p.status === 'open'
        ? { kind: 'vote', id: p.id, mine: mine[p.id], weight: WEIGHT, note: 'Stake to propose: ' + db.params.proposalStake + ' · period ' + db.params.votingPeriod }
        : { kind: 'prose', lead: 'Voting has closed.' },
    ],
  };
  const d = it.kind === 'delegate' ? db.delegates.find((x) => x.id === it.id) : undefined;
  if (d) return {
    it: { title: d.name, sub: 'Delegate', body: d.bio, fields: [['Handle', '@' + d.handle], ['Since', d.since]] },
    blocks: [
      { kind: 'stats', items: [{ label: 'Weight', value: num(d.weight) + ' PFT' }, { label: 'Votes cast', value: d.votes }, { label: 'Proposals', value: d.proposals }] },
      { kind: 'grid', layout: 'list', toolbar: false, items: [{ title: 'Delegate to ' + d.name.split(' ')[0], sub: '@' + d.handle, mark: initials(d.name), tone: d.tone, action: 'Delegate', done: 'Delegated' }] },
    ],
  };
  return { it, blocks: [] };
};
