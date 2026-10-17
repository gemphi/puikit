
import React from 'react';
import { apiSend, hasApi } from '@phi-kit/api';

export type Club = { id: string; name: string; tagline: string; tone: string };
export type Application = { id: string; clubId: string; trackId: string; stage: string; ask: number; raised: number };
export type Track = { id: string; name: string; tone: string; pool: number; currency: string; body: string };
export type Stage = { id: string; label: string };
export type Member = { userId: string; role: string; puts: number };
export type Puts = { minted: number; utility: string[] };
export type FullApp = Application & { submittedAt?: string; members?: Member[]; mentorIds?: string[]; puts?: Puts };
export type Stat = { label: string; value: string; sub: string };
export type Launch = { id: string; name: string; status: string; tier?: string; raised?: number | string; target?: string; hardCap?: number; participants?: number; symbol?: string; desc?: string; score?: number };
export type TierRow = { id: string; name: string; status?: string; members?: number; min_stake?: string; multiplier?: string; stake?: string; alloc?: string; pool?: string };
export type Graduate = { id: string; name: string; status?: string; ath_roi?: string; launched?: string; market_cap?: string; symbol?: string; raised?: string; ath?: string; current?: string };
export type Pad = { launches: Launch[]; tiers: TierRow[]; graduates: Graduate[] };
export type Step = { n: number; title: string; body: string };
export type News = { id: string; date: string; tag: string; title: string; body: string };
export type Phipad = {
  hero: { title: string; subtitle: string; body: string };
  routes?: { id: string; title: string; body: string; points: string[] }[];
  stats: Stat[]; steps: Step[]; news: News[];
  about: { body: string; sections: { title: string; body: string }[] };
  faq: { q: string; a: string }[];
  tracks: Track[]; stages: Stage[]; applications: FullApp[];
  fields: { id: string; label: string; group: string; locked?: boolean }[];
};
export type DB = { core: { currentUserId: string; clubs: Club[] }; phipad: Phipad; pad: Pad };

const FILES = ['core', 'phipad'] as const;

type TreeSource = { kind: string; rows: Record<string, unknown>[] };

/**
 * The app's data. With VITE_PHI_API set, the records (clubs, tracks, applications) come from Phiora's one database
 * (GET /tree?kind=…, md5 ids and slugs); the bundled files carry the copy (hero, steps, news) and stand in fully
 * when the API is off.
 */
export const useDB = () => {
  const [db, setDb] = React.useState<DB | null>(null);
  const [live, setLive] = React.useState(false);
  const [err, setErr] = React.useState('');
  React.useEffect(() => {
    void (async () => {
      try {
        const all = await Promise.all(FILES.map((f) => fetch(import.meta.env.BASE_URL + 'data/' + f + '.json').then((r) => r.json())));
        const d = Object.fromEntries(FILES.map((f, i) => [f, all[i]])) as DB;
        d.pad = { launches: [], tiers: [], graduates: [] };
        if (hasApi) {
          const t = await apiSend<{ sources: TreeSource[] }>('GET', '/tree?kind=club,track,application,phipadLaunch,phipadTier,phipadGraduate');
          if (t.ok) {
            const rows = (k: string) => t.body.sources.find((s) => s.kind === k)?.rows ?? [];
            const cs = rows('club') as unknown as Club[]; if (cs.length) d.core.clubs = cs;
            const ts = rows('track') as unknown as Track[]; if (ts.length) d.phipad.tracks = ts;
            const as_ = rows('application') as unknown as FullApp[]; if (as_.length) d.phipad.applications = as_;
            d.pad.launches = rows('phipadLaunch') as unknown as Launch[];
            d.pad.tiers = rows('phipadTier') as unknown as TierRow[];
            d.pad.graduates = rows('phipadGraduate') as unknown as Graduate[];
            setLive(true);
          }
        }
        setDb(d);
      } catch (e) { setErr(String(e)); }
    })();
  }, []);
  return { db, err, live };
};

export const byId = <T extends { id: string }>(list: T[], id: string | null | undefined) => list.find((x) => x.id === id);
export const usd = (n: number) => Math.round(n).toLocaleString('en-US') + ' USD';

export const num = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);

export const TONE: Record<string, [string, string]> = { accent: ['var(--phi-organic-accent-300)', 'var(--phi-organic-accent-900)'], sage: ['var(--phi-organic-sage-300)', 'var(--phi-organic-sage-900)'], ink: ['var(--phi-color-gray-800)', '#f5ead8'], neutral: ['var(--phi-color-background-secondary)', 'var(--phi-color-text-primary)'] };
export const tone = (t: string) => TONE[t] || TONE.neutral;
export const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
