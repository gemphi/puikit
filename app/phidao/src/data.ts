
import React from 'react';
import { apiSend, hasApi, persisted } from '@phi-kit/api';

export type Proposal = { id: string; n: number; title: string; status: 'open' | 'passed' | 'rejected'; closes: string; stake: number; summary: string; body: string; for: number; against: number; quorum: number; category: string; proposer: string };
export type Holding = { asset: string; amount: string; usd: number; pct: number; change: string };
export type Flow = { date: string; what: string; amount: string; coin: string; dir: 'in' | 'out' };
export type Delegate = { id: string; name: string; handle: string; weight: number; votes: number; proposals: number; since: string; tone: string; bio: string };
export type News = { id: string; date: string; tag: string; title: string; body: string };
export type Stat = { label: string; value: string; sub: string };
export type Doc = { title: string; sub: string; body: string; action?: string; href?: string };
export type DB = {
  hero: { title: string; subtitle: string; body: string };
  stats: Stat[];
  params: { quorum: string; votingPeriod: string; proposalStake: string; passThreshold: string };
  proposals: Proposal[];
  treasury: { total: string; holdings: Holding[]; flows: Flow[] };
  delegates: Delegate[];
  news: News[];
  about: { body: string; sections: { title: string; body: string }[] };
  docs: Doc[];
  faq: { q: string; a: string }[];
  swap: { coins: string[]; from: string; to: string; fee: number };
};

type TreeSource = { kind: string; rows: Record<string, unknown>[] };

/**
 * The DAO's data. With VITE_PHI_API set, the governed records — proposals and delegates — come from Phiora's one
 * database (GET /tree?kind=proposal,delegate), so a proposal created or changed through the API is on the ballot
 * at once; the bundled file carries the copy and stands in fully when the API is off.
 */
export const useDB = () => {
  const [db, setDb] = React.useState<DB | null>(null);
  const [live, setLive] = React.useState(false);
  const [err, setErr] = React.useState('');
  React.useEffect(() => {
    void (async () => {
      try {
        const d = (await fetch(import.meta.env.BASE_URL + 'data/phidao.json').then((r) => r.json())) as DB;
        if (hasApi) {
          const t = await apiSend<{ sources: TreeSource[] }>('GET', '/tree?kind=proposal,delegate');
          if (t.ok) {
            const rows = (k: string) => t.body.sources.find((s) => s.kind === k)?.rows ?? [];
            const ps = rows('proposal') as unknown as Proposal[];
            const ds = rows('delegate') as unknown as Delegate[];
            if (ps.length) d.proposals = [...ps].sort((a, b) => (b.n ?? 0) - (a.n ?? 0));
            if (ds.length) d.delegates = ds;
            setLive(true);
          }
        }
        setDb(d);
      } catch (e) { setErr(String(e)); }
    })();
  }, []);
  return { db, err, live };
};

export const num = (n: number) => n.toLocaleString('en-US');
export const pctOf = (p: Proposal) => Math.round((p.for / (p.for + p.against)) * 100);
export const met = (p: Proposal) => p.for + p.against >= p.quorum;
export const STATUS: Record<Proposal['status'], { label: string; intent: 'success' | 'error' | 'warning' }> = {
  open: { label: 'Open', intent: 'warning' }, passed: { label: 'Passed', intent: 'success' }, rejected: { label: 'Rejected', intent: 'error' },
};

/** Proposal votes — Phiora `/state/dao.votes` when VITE_PHI_API is set, localStorage otherwise. */
const VOTES = persisted<Record<string, 'for' | 'against'>>('dao.votes', {});
export const votes = (): Record<string, 'for' | 'against'> => ({ ...VOTES.get() });
export const castVote = (id: string, v: 'for' | 'against') => VOTES.set({ ...VOTES.get(), [id]: v });
export const TONE: Record<string, [string, string]> = {
  accent: ['var(--phi-organic-accent-300)', 'var(--phi-organic-accent-900)'], sage: ['var(--phi-organic-sage-300)', 'var(--phi-organic-sage-900)'],
  ink: ['var(--phi-color-gray-800)', '#f5ead8'], sand: ['var(--phi-color-background-secondary)', 'var(--phi-color-text-primary)'],
};
export const tone = (t: string) => TONE[t] || TONE.sand;
export const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
