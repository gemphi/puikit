
import React from 'react';
import { Box, Button, Frame, Input, Pressable, ProgressBar, Rows, Select, Stack, StepForm, type StepFormStep, Tag, Text, Textarea, Title } from '@pui/components';
import { Users, Coins, Globe, ClipboardCheck } from 'lucide-react';
import k from '@phi-kit/kit.module.scss';
import s from './app.module.scss';
import { byId, usd, num, tone, initials, type DB, type FullApp, type Launch } from './data';

export type Open = { kind: 'application' | 'news'; id: string };
const Head: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (<Box as="header"><Title level={1} size="2xl">{title}</Title>{sub ? <Text intent="secondary" maxWidth="60ch" marginTop={2}>{sub}</Text> : null}</Box>);
const stageLabel = (db: DB, id: string) => byId(db.phipad.stages, id)?.label || id;

const AppCard: React.FC<{ db: DB; a: FullApp; onOpen: (o: Open) => void }> = ({ db, a, onOpen }) => {
  const c = byId(db.core.clubs, a.clubId); const pct = Math.min(100, Math.round((a.raised / a.ask) * 100));
  return (
    <Pressable fill onClick={() => onOpen({ kind: 'application', id: a.id })} card column gap={2}>
      
        <Stack direction="row" justify="between" align="center" wrap><Text as="strong" weight="bold">{c?.name || a.clubId}</Text><Tag minimal round>{stageLabel(db, a.stage)}</Tag></Stack>
        <Text as="span" size="xs" intent="muted">Ask {usd(a.ask)} · raised {usd(a.raised)}</Text>
        <ProgressBar value={pct / 100} size="sm" />
      
    </Pressable>
  );
};

export const Home: React.FC<{ db: DB; go: (v: string) => void; onOpen: (o: Open) => void }> = ({ db, go, onOpen }) => {
  const p = db.phipad; const featured = p.applications.filter((a) => a.stage === 'incubating' || a.stage === 'funded').slice(0, 3);
  return (
    <>
      <Stack as="section" direction="column" gap={2.5} surface="hero">
        <Title level={1} size="2xl">{p.hero.title}</Title><Text size="lg" intent="secondary">{p.hero.subtitle}</Text>
        <Text size="sm" intent="secondary" maxWidth="64ch">{p.hero.body}</Text>
        <Stack direction="row" gap={2} wrap align="center"><Button variant="primary" onClick={() => go('apply')}>Apply</Button><Button variant="outline" onClick={() => go('tracks')}>See tracks</Button></Stack>
      </Stack>
      <Stack autoFill="150px" gap={3}>{p.stats.map((st) => <Stack key={st.label} direction="column" gap={2} surface="card"><Text as="span" size="xs" intent="muted">{st.label}</Text><Text as="span" font="heading" size="3xl" lineHeight={1}>{st.value}</Text><Text as="span" size="sm" intent="secondary">{st.sub}</Text></Stack>)}</Stack>
      <Stack as="section" direction="column" gap={3}><Title level={2} size="lg">How it works</Title>
        <Stack autoFill="180px" gap={3}>{p.steps.map((st) => <Stack key={st.n} direction="column" gap={2} surface="card"><Frame ratio="1/1" width="38px" rounded="full" tint="var(--phi-organic-accent-200)" tintStrength={100} ink="var(--phi-organic-accent-900)"><Text as="span" font="heading">{st.n}</Text></Frame><Title level={3} size="md">{st.title}</Title><Text size="sm" intent="secondary">{st.body}</Text></Stack>)}</Stack>
      </Stack>
      <Stack as="section" direction="column" gap={3}><Stack direction="row" justify="between" align="center" wrap><Title level={2} size="lg">In the pipeline</Title><Button size="sm" variant="ghost" onClick={() => go('pipeline')}>Full pipeline</Button></Stack>
        <Stack autoFill="220px" gap={3}>{featured.map((a) => <AppCard key={a.id} db={db} a={a} onOpen={onOpen} />)}</Stack>
      </Stack>
    </>
  );
};

export const Tracks: React.FC<{ db: DB; go: (v: string) => void }> = ({ db, go }) => (
  <>
    <Head title="Tracks" sub="Four tracks, each with its own pool and mentors." />
    <Stack autoFill="220px" gap={3}>{db.phipad.tracks.map((t) => { const [bg, ink] = tone(t.tone); return (
      <Stack as="article" key={t.id} direction="column" gap={2} surface="card">
        <Frame ratio="3/1" rounded="md" place="end-start" tint={bg} tintStrength={100} ink={ink}><Title level={3} size="lg" color={ink}>{t.name}</Title></Frame>
        <Text as="span" font="heading" size="3xl" lineHeight={1}>{num(t.pool)}</Text><Text as="span" size="xs" intent="muted">{t.currency} pool</Text>
        <Text size="sm" intent="secondary">{t.body}</Text>
        <Button size="sm" variant="outline" onClick={() => go('apply')}>Apply to {t.name}</Button>
      </Stack>); })}</Stack>
  </>
);

export const Pipeline: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => (
  <>
    <Head title="Pipeline" sub="Every application, by stage." />
    <Box className={s.lanes}>{db.phipad.stages.map((st) => { const apps = db.phipad.applications.filter((a) => a.stage === st.id); return (
      <Box key={st.id} className={s.stage}>
        <Text as="strong" weight="bold">{st.label} <Text as="span" size="xs" intent="muted">{apps.length}</Text></Text>
        {apps.map((a) => <AppCard key={a.id} db={db} a={a} onOpen={onOpen} />)}
      </Box>); })}</Box>
  </>
);

export const Portfolio: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const launched = db.phipad.applications.filter((a) => a.stage === 'launched' || a.stage === 'funded');
  const raised = launched.reduce((n, a) => n + a.raised, 0);
  return (
    <>
      <Head title="Portfolio" sub={launched.length + ' funded and launched clubs · ' + usd(raised) + ' committed.'} />
      <Stack autoFill="220px" gap={3}>{launched.map((a) => { const c = byId(db.core.clubs, a.clubId); const [bg, ink] = tone(c?.tone || 'neutral'); return (
        <Pressable key={a.id} fill onClick={() => onOpen({ kind: 'application', id: a.id })} card column gap={2}>
          <Frame ratio="3/1" rounded="md" place="end-start" tint={bg} tintStrength={100} ink={ink}><Title level={3} size="md" color={ink}>{c?.name || a.clubId}</Title></Frame>
          <Stack direction="row" gap={2} wrap align="center"><Tag minimal round intent="success">{byId(db.phipad.stages, a.stage)?.label}</Tag></Stack>
          <Text as="strong" weight="bold">{c?.name || a.clubId}</Text>
          {c ? <Text as="span" size="sm" intent="secondary">{c.tagline}</Text> : null}
          <Text as="span" size="xs" intent="muted">Raised {usd(a.raised)}</Text>
        </Pressable>); })}</Stack>
    </>
  );
};

export const Apply: React.FC<{ db: DB }> = ({ db }) => {
  const FIELDS = db.phipad.fields as { id: string; label: string; group: string; locked?: boolean }[];
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const [track, setTrack] = React.useState(db.phipad.tracks[0]?.id || '');
  const [sent, setSent] = React.useState(false);
  const set = (id: string) => (v: string) => setVals((x) => ({ ...x, [id]: v }));
  const full = (label: string) => /address|wallet|utility|link|world|host/i.test(label);
  const control = (f: { id: string; label: string; locked?: boolean }) =>
    f.id === 'track' ? <Select value={track} onChange={(e) => setTrack(e.target.value)} options={db.phipad.tracks.map((t) => ({ value: t.id, label: t.name }))} />
    : f.locked ? <Input value={vals[f.id] ?? ''} disabled placeholder="Filled in after review" />
    : <Input value={vals[f.id] ?? ''} placeholder={f.label} onChange={(e) => set(f.id)(e.target.value)} />;
  const sectionsFor = (groups: string[]) => groups.map((g) => ({
    title: g,
    fields: FIELDS.filter((f) => f.group === g).map((f) => ({ id: f.id, label: f.label, full: full(f.label), control: control(f) })),
  }));
  const chosen = (groups: string[]) => { const ids = FIELDS.filter((f) => groups.includes(f.group)).map((f) => f.id); const l = ids.map((id) => id === 'track' ? (db.phipad.tracks.find((t) => t.id === track)?.name) : vals[id]?.trim()).filter(Boolean).join(' \u00b7 '); return l ? (l.length > 34 ? l.slice(0, 33) + '\u2026' : l) : undefined; };
  const steps: StepFormStep[] = [
    { id: 'club', label: 'Club', icon: <Users size={16} />, title: 'Club', lede: 'Your club, ticker and the track you are applying to.', hint: chosen(['Club']), sections: sectionsFor(['Club']) },
    { id: 'token', label: 'Token', icon: <Coins size={16} />, title: 'Token & funding', lede: 'The contract, the mint and what you are raising.', hint: chosen(['Contract & mint', 'Funding']), sections: sectionsFor(['Contract & mint', 'Funding']) },
    { id: 'world', label: 'World', icon: <Globe size={16} />, title: 'World & PFTs', lede: 'The world you will build and your Profile Fungible Tokens.', hint: chosen(['World', 'PFTs \u00b7 Profile Fungible Tokens']), sections: sectionsFor(['World', 'PFTs \u00b7 Profile Fungible Tokens']) },
    { id: 'review', label: 'Review', icon: <ClipboardCheck size={16} />, title: 'Papers & review', lede: 'Link your EggPaper, then submit.', sections: sectionsFor(['Papers']) },
  ];
  return (
    <>
      <Head title="Apply" sub="Two ways in. Pick the one that fits where your club is." />
      <Stack autoFill="260px" gap={3}>{(db.phipad.routes || []).map((r) => (
        <Stack key={r.id} direction="column" gap={2} surface="card"><Title level={3} size="md">{r.title}</Title><Text size="sm" intent="secondary">{r.body}</Text>
          <Stack as="ul" gap={1} paddingLeft={5} margin={0}>{r.points.map((pt) => <Text as="li" key={pt} size="sm" intent="secondary">{pt}</Text>)}</Stack></Stack>))}</Stack>
      {sent ? (
        <Stack as="section" direction="column" gap={2} surface="card" align="start">
          <Title level={2} size="lg">Application in</Title>
          <Text size="sm" intent="secondary" role="status">Thanks \u2014 your application is in. Review happens weekly; watch Messages in Phiegg for a reply.</Text>
          <Button variant="outline" onClick={() => { setVals({}); setSent(false); }}>Start another</Button>
        </Stack>
      ) : (
        <StepForm steps={steps} onSubmit={() => setSent(true)} submitLabel="Submit application"
          title="Start an application" sub="Four steps. Everything can be edited before you submit." fill={false} />
      )}
    </>
  );
};

export const NewsPage: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => (
  <>
    <Head title="News" sub="Cohorts, tracks and launches." />
    <Box className={s.news}>{db.phipad.news.map((nw) => (
      <Pressable key={nw.id} fill divider paddingBottom={3} onClick={() => onOpen({ kind: 'news', id: nw.id })}><Stack direction="column" gap={2}>
        <Stack direction="row" gap={2} wrap align="center"><Tag minimal round>{nw.tag}</Tag><Text as="span" size="xs" intent="muted">{nw.date}</Text></Stack>
        <Title level={3} size="md">{nw.title}</Title><Text size="sm" intent="secondary">{nw.body}</Text>
      </Stack></Pressable>))}</Box>
  </>
);

export const About: React.FC<{ db: DB }> = ({ db }) => (
  <>
    <Head title="About Phipad" />
    <Box className={s.prose}>
      <Text size="lg" intent="secondary">{db.phipad.about.body}</Text>
      {db.phipad.about.sections.map((sec) => <Stack as="section" key={sec.title} direction="column" gap={2}><Title level={2} size="lg">{sec.title}</Title><Text size="sm" intent="secondary">{sec.body}</Text></Stack>)}
    </Box>
  </>
);

export const Faq: React.FC<{ db: DB }> = ({ db }) => (
  <>
    <Head title="FAQ" sub="The questions founders ask first." />
    <Box>{db.phipad.faq.map((f) => <Stack key={f.q} direction="column" gap={1.5} paddingY={4} rule="bottom" maxWidth="70ch"><Text as="strong" weight="bold">{f.q}</Text><Text as="span" size="sm" intent="secondary">{f.a}</Text></Stack>)}</Box>
  </>
);

export const Panel: React.FC<{ db: DB; open: Open; onClose: () => void }> = ({ db, open, onClose }) => {
  if (open.kind === 'news') {
    const nw = db.phipad.news.find((x) => x.id === open.id)!;
    return (<><Stack direction="row" justify="between" align="center" wrap><Tag minimal round>{nw.tag}</Tag><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></Stack><Text as="span" size="xs" intent="muted">{nw.date}</Text><Title level={2} size="xl">{nw.title}</Title><Text size="sm" intent="secondary">{nw.body}</Text></>);
  }
  const a = db.phipad.applications.find((x) => x.id === open.id)!; const c = byId(db.core.clubs, a.clubId); const t = byId(db.phipad.tracks, a.trackId);
  const pct = Math.min(100, Math.round((a.raised / a.ask) * 100)); const [bg, ink] = tone(c?.tone || 'neutral');
  return (
    <>
      <Stack direction="row" justify="between" align="center" wrap><Tag minimal round>{byId(db.phipad.stages, a.stage)?.label}</Tag><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></Stack>
      <Frame ratio="4/1" rounded="md" place="end-start" tint={bg} tintStrength={100} ink={ink}><Title level={3} size="lg" color={ink}>{c?.name || a.clubId}</Title></Frame>
      <Title level={2} size="xl">{c?.name || a.clubId}</Title>
      {c ? <Text size="sm" intent="secondary">{c.tagline}</Text> : null}
      <Rows cols={2} colsSm={2}>
        <Stack direction="column" gap={2} surface="card"><Text as="span" size="xs" intent="muted">Ask</Text><Text as="strong" weight="bold">{usd(a.ask)}</Text></Stack>
        <Stack direction="column" gap={2} surface="card"><Text as="span" size="xs" intent="muted">Raised</Text><Text as="strong" weight="bold">{usd(a.raised)}</Text></Stack>
      </Rows>
      <ProgressBar value={pct / 100} size="sm" />
      <Text as="span" size="xs" intent="muted">{pct}% of ask{t ? ' · ' + t.name + ' track (' + t.currency + ')' : ''}{a.submittedAt ? ' · applied ' + a.submittedAt : ''}</Text>
      {a.puts ? <Text as="span" size="xs" intent="muted">{num(a.puts.minted)} Puts minted · {a.puts.utility.join(', ')}</Text> : null}
      {a.members && a.members.length ? (
        <><Title level={3} size="lg">Team</Title>{a.members.map((m, i) => <Stack key={i} direction="row" align="center" gap={2}><Box flex="none"><Frame ratio="1/1" width="34px" rounded="full" tint="var(--phi-organic-accent-200)" tintStrength={100} ink="var(--phi-organic-accent-900)"><Text size="xs" weight="bold" as="span">{initials(m.userId.replace('u_', ''))}</Text></Frame></Box><Text as="span" flex="1"><Text as="strong" weight="bold">{m.role}</Text> <Text as="span" size="xs" intent="muted">· {m.puts} Puts</Text></Text></Stack>)}</>
      ) : null}
    </>
  );
};


// ── Launchpad: the GemPad content as its Phi counterpart, straight from the one database ──
const launchMoney = (l: Launch) => {
  const raised = typeof l.raised === 'number' ? num(l.raised) : l.raised;
  const cap = l.target ?? (typeof l.hardCap === 'number' ? num(l.hardCap) : undefined);
  return cap ? `Raised ${raised} of ${cap}` : `Raised ${raised}`;
};
export const Launchpad: React.FC<{ db: DB }> = ({ db }) => {
  const { launches, tiers, graduates } = db.pad;
  if (!launches.length && !tiers.length && !graduates.length) return (
    <>
      <Head title="Launchpad" sub="Launches, tiers and graduates live from the one database." />
      <Text intent="secondary">Start Phiora (VITE_PHI_API) to see the launchpad records.</Text>
    </>
  );
  return (
    <>
      <Head title="Launchpad" sub="Launches, tiers and graduates live from the one database." />
      {launches.length > 0 && <Stack as="section" direction="column" gap={3}><Title level={2} size="lg">Launches</Title>
        <Stack autoFill="220px" gap={3}>{launches.slice(0, 24).map((l) => (
          <Stack as="article" key={l.id} direction="column" gap={2} surface="card">
            <Stack direction="row" justify="between" align="center" wrap><Text as="strong" weight="bold">{l.name}</Text><Tag minimal round>{l.status}</Tag></Stack>
            {l.desc ? <Text size="sm" intent="secondary">{l.desc}</Text> : null}
            <Text as="span" size="xs" intent="muted">{launchMoney(l)}</Text>
            <Stack direction="row" gap={2} wrap align="center">{l.tier ? <Tag minimal round size="sm">{l.tier}</Tag> : null}
              {typeof l.participants === 'number' ? <Text as="span" size="xs" intent="muted">{num(l.participants)} participants</Text> : null}</Stack>
          </Stack>))}</Stack>
      </Stack>}
      {tiers.length > 0 && <Stack as="section" direction="column" gap={3}><Title level={2} size="lg">Tiers</Title>
        <Stack autoFill="180px" gap={3}>{tiers.slice(0, 12).map((t) => (
          <Stack key={t.id} direction="column" gap={2} surface="card">
            <Stack direction="row" justify="between" align="center"><Text as="strong" weight="bold">{t.name}</Text>{t.status ? <Tag minimal round size="sm">{t.status}</Tag> : null}</Stack>
            <Text as="span" size="xs" intent="muted">{t.min_stake ?? t.stake ? `Stake ${t.min_stake ?? t.stake}` : ''}</Text>
            <Text as="span" size="xs" intent="muted">{[t.multiplier ?? t.alloc, typeof t.members === 'number' ? `${t.members} members` : t.pool].filter(Boolean).join(' · ')}</Text>
          </Stack>))}</Stack>
      </Stack>}
      {graduates.length > 0 && <Stack as="section" direction="column" gap={3}><Title level={2} size="lg">Graduates</Title>
        <Stack autoFill="200px" gap={3}>{graduates.slice(0, 16).map((g) => (
          <Stack key={g.id} direction="column" gap={2} surface="card">
            <Stack direction="row" justify="between" align="center"><Text as="strong" weight="bold">{g.name}</Text>{(g.status ?? g.symbol) ? <Tag minimal round size="sm">{g.status ?? g.symbol}</Tag> : null}</Stack>
            <Text as="span" size="xs" intent="muted">{[g.ath_roi ? `ATH ${g.ath_roi}` : g.ath ? `ATH ${g.ath}` : null, g.market_cap ?? g.current, g.launched ?? g.raised].filter(Boolean).join(' · ')}</Text>
          </Stack>))}</Stack>
      </Stack>}
    </>
  );
};
