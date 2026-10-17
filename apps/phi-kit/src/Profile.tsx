import React from 'react';
import { Avatar, Box, Button, Stack, Tag, Text, Title } from '@pui/components';
import { apiGet, hasApi } from './api';
import { useMe } from './auth';
import { AccountPanel } from './AccountDialog';
import { appUrl } from './data';
import { Block, type GridItem } from './blocks';
import { useWallet, fmt, LABEL, USD, type Coin } from './wallet';

/**
 * The account dashboard every Phi app shows under You — Phisum reads like a bank: who you are (one Phione identity),
 * your wallet, and what you hold, read live from Phiora. The app's data names the sections (`profile` in its JSON):
 *   sections: [{ title, kind, fields, cols?, empty?, action: { label, view } }]   your records of a kind
 *   totals:   [{ label, kind, sum, via?: { kind, field } }]                      a sum over your records, or (`via`) over
 *                                                                                records that point at yours
 * The shell's foot "You" gets a sub-nav of these sections (buildAccountNav), so the sidebar is the account's menu.
 */
export type ProfileSection = { title: string; kind: string; fields: string[]; cols?: string[]; empty?: string; action?: { label: string; view: string; app?: string } };
export type ProfileTotal = { label: string; kind: string; sum: string; via?: { kind: string; field: string }; sub?: string };
export type ProfileSpec = { title?: string; sub?: string; sections: ProfileSection[]; totals?: ProfileTotal[] };
export type Mine = { rows: Record<string, Row[]>; totals: Record<string, number>; loaded: boolean };
type Row = Record<string, unknown> & { id: string };

const text = (v: unknown) => (v == null || typeof v === 'object' ? '' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));
const human = (k: string) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const num = (v: unknown) => (typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0);
const when = (v: unknown) => { const s = text(v); return /^\d{4}-\d\d-\d\dT/.test(s) ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : s; };

/** Your records across the profile's kinds, and the totals it sums — read once, shared by the page and the sidebar. */
export function useMine(spec?: ProfileSpec): Mine {
  const me = useMe();
  const signedIn = !!me && !me.guest;
  const [rows, setRows] = React.useState<Record<string, Row[]>>({});
  const [totals, setTotals] = React.useState<Record<string, number>>({});
  const [loaded, setLoaded] = React.useState(false);
  const sections = spec?.sections ?? [];
  React.useEffect(() => {
    if (!hasApi || !signedIn || !sections.length) { setRows({}); setTotals({}); setLoaded(!signedIn); return; }
    const kinds = [...new Set([...sections.map((s) => s.kind), ...(spec?.totals ?? []).flatMap((t) => [t.kind, ...(t.via ? [t.via.kind] : [])])])];
    void apiGet<{ kinds: Record<string, Row[]> }>('/tree/mine?kinds=' + kinds.join(',')).then(async (r) => {
      const got = r?.kinds ?? {}; setRows(got);
      const out: Record<string, number> = {};
      for (const t of spec?.totals ?? []) {
        if (!t.via) { out[t.label] = (got[t.kind] ?? []).reduce((a, x) => a + num(x[t.sum]), 0); continue; }
        const ids = (got[t.via.kind] ?? []).map((x) => x.id);
        const pages = await Promise.all(ids.map((id) => apiGet<{ rows: Row[] }>(`/tree/rows?kind=${t.kind}&n=50&where=${t.via!.field}:${id}`)));
        out[t.label] = pages.flatMap((p) => p?.rows ?? []).reduce((a, x) => a + num(x[t.sum]), 0);
      }
      setTotals(out); setLoaded(true);
    });
  }, [signedIn, me?.id, spec]); // eslint-disable-line react-hooks/exhaustive-deps
  return { rows, totals, loaded };
}

/** The account sub-nav for the shell's foot: Overview, a leaf per section (folding out your own records), Wallet, Account. */
export function buildAccountNav(spec: ProfileSpec | undefined, mine: Mine): { id: string; label: string; icon?: React.ReactNode; previews?: { id: string; label: string; sub?: string }[] }[] {
  const sections = spec?.sections ?? [];
  const nav: { id: string; label: string; previews?: { id: string; label: string; sub?: string }[] }[] = [{ id: '_you', label: 'Overview' }];
  for (const s of sections) {
    const rows = mine.rows[s.kind] ?? [];
    nav.push({ id: '_you_' + s.kind, label: s.title, previews: rows.slice(0, 6).map((r) => ({ id: r.id, label: text(r.name) || text(r.title) || text(r.label) || s.kind, sub: text(r[s.fields[1]]) || undefined })) });
  }
  nav.push({ id: '_wallet', label: 'Wallet' }, { id: '_account', label: 'Account' }, { id: '_settings', label: 'Settings' });
  return nav;
}

const Identity: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const me = useMe();
  const signedIn = !!me && !me.guest;
  const initials = (me?.name ?? 'Guest').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <Stack direction="row" gap={3} align="center" wrap surface="card">
      <Avatar size={compact ? 'md' : 'lg'} initials={initials} seed={me?.id} alt={me?.name ?? 'Guest'} />
      <Stack direction="column" gap={1} flex="1" minWidth="12rem">
        <Title level={2} size={compact ? 'md' : 'lg'}>{signedIn ? me!.name : 'Guest'}</Title>
        <Stack direction="row" gap={2} wrap align="center">
          {me?.handle ? <Text size="sm" intent="muted">@{me.handle}</Text> : null}
          <Tag minimal round size="sm" intent={signedIn ? 'success' : undefined}>{signedIn ? 'Phione identity' : 'Not signed in'}</Tag>
        </Stack>
        {!compact && <Text size="sm" intent="secondary">{signedIn ? 'One identity across every Phiace app. Everything you hold here is kept under it.' : 'Sign in to keep what you submit under one Phione identity.'}</Text>}
      </Stack>
      <Button variant="outline" size="sm" href={appUrl('phione')}>Manage in Phione</Button>
    </Stack>
  );
};

const WalletCard: React.FC = () => {
  const w = useWallet();
  const coins: Coin[] = ['usd', 'egg', 'sum', 'eth'];
  return (
    <Stack as="section" direction="column" gap={3}>
      <Title level={2} size="lg">Wallet</Title>
      <Stack autoFill="220px" gap={3}>
        {coins.map((c) => (
          <Stack key={c} direction="column" gap={2} surface="card"><Text as="span" size="xs" intent="muted">{LABEL[c]}</Text><Text as="span" font="heading" size="3xl" lineHeight={1}>{fmt(c, w[c])}</Text><Text as="span" size="sm" intent="secondary" flex="1">≈ {Math.round(w[c] * USD[c]).toLocaleString('en-US')} USD</Text></Stack>
        ))}
      </Stack>
    </Stack>
  );
};

const SectionView: React.FC<{ s: ProfileSection; mine: Mine; onOpen: (it: GridItem) => void }> = ({ s, mine, onOpen }) => {
  const rows = mine.rows[s.kind] ?? [];
  return (
    <Stack as="section" direction="column" gap={2}>
      <Stack direction="row" gap={2} align="center" justify="between" wrap>
        <Stack direction="row" gap={2} align="center"><Title level={2} size="lg">{s.title}</Title><Tag minimal round size="sm">{mine.loaded ? rows.length : '…'}</Tag></Stack>
        {s.action ? <Button variant="outline" size="sm" href={(s.action.app ? appUrl(s.action.app) : '') + '#/' + s.action.view}>{s.action.label}</Button> : null}
      </Stack>
      {rows.length
        ? <Block b={{ kind: 'table', cols: s.cols ?? s.fields.map(human), rows: rows.map((r) => s.fields.map((f) => when(r[f]))), routes: rows.map((r) => '#/' + s.kind + '/' + r.id) }} onOpen={onOpen} />
        : <Text size="sm" intent="muted">{mine.loaded ? s.empty ?? 'Nothing yet.' : 'Loading'}</Text>}
    </Stack>
  );
};

/**
 * The profile page. `section` picks the view the sidebar chose: undefined = Overview (identity, totals, every section);
 * a kind = that section alone; 'wallet' / 'account' = those panels. `mine` is fetched once by the shell (useMine).
 */
export const Profile: React.FC<{ spec?: ProfileSpec; section?: string; mine?: Mine; onOpen?: (it: GridItem) => void }> = ({ spec, section, mine: outer, onOpen = () => undefined }) => {
  const me = useMe();
  const inner = useMine(outer ? undefined : spec);
  const mine = outer ?? inner;
  const signedIn = !!me && !me.guest;
  const sections = spec?.sections ?? [];

  if (!signedIn) {
    return (
      <Stack direction="column" gap={4}>
        <Identity />
        {hasApi ? <Box surface="card" maxWidth="560px"><AccountPanel /></Box> : null}
      </Stack>
    );
  }
  if (section === 'wallet') return <Stack direction="column" gap={4}><Identity compact /><WalletCard /></Stack>;
  if (section === 'account') return <Stack direction="column" gap={4}><Identity compact /><Box surface="card" maxWidth="560px"><Title level={2} size="lg">Account</Title><AccountPanel /></Box></Stack>;
  const one = section ? sections.find((s) => s.kind === section) : undefined;
  if (one) return <Stack direction="column" gap={4}><Identity compact /><SectionView s={one} mine={mine} onOpen={onOpen} /></Stack>;

  // Overview
  return (
    <Stack direction="column" gap={4}>
      <Identity />
      {spec?.totals?.length ? (
        <Block b={{ kind: 'stats', items: spec.totals.map((t) => ({ label: t.label, value: Math.round(mine.totals[t.label] ?? 0).toLocaleString('en-US'), sub: t.sub ?? '' })) }} onOpen={onOpen} />
      ) : null}
      {sections.map((s) => <SectionView key={s.kind + s.title} s={s} mine={mine} onOpen={onOpen} />)}
    </Stack>
  );
};
