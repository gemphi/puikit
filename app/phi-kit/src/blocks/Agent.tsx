import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, DataTable, Icon, Stack, TabList, Tag, Text, Textarea, Title, type DataTableColumn } from '@pui/components';
import { Lock, Play } from 'lucide-react';
import type { Block } from '../data';
import { hasPhient, needsSignIn, phientAgents, phientPolicy, runVerb, type PhientActor, type PhientAgent, type PhientPolicy } from '../phient';
import { useMe } from '../auth';
import { presetsFor, type Preset } from '../presets';
type Run = { n: number; at: number; verb: string; ok: boolean; status: string; confidence?: number; ms?: number; output: unknown; actor?: PhientActor };

const statusOf = (out: unknown, evalStatus?: string) => {
  const o = out as { status?: string; result?: { error?: string } } | undefined;
  return o?.result?.error ? 'failed' : o?.status ?? evalStatus ?? 'done';
};

/**
 * A Phient platform agent inside an app: what it is, its verbs (the app's presets first), the parameters, a run, the
 * output, and the runs so far (sortable). Block data: { kind: "agent", agent: "phigit", intro?, presets?: [{ verb,
 * label?, params?, note? }], verb?, autorun? }. Without presets it uses the shared ones (phi-kit/presets). `verb` picks
 * the verb to start on and `autorun` runs it once on mount (Phione's agent cards). Runs are kept per agent for the
 * session, so switching agents and back keeps them. Needs VITE_PHIADK_API; with Phiora on, each run carries the
 * signed-in user's delegation.
 */
const RUNS = new Map<string, Run[]>();
export const Agent: React.FC<{ b: Block }> = ({ b }) => {
  const presets: Preset[] = b.presets || presetsFor(b.agent);
  const [meta, setMeta] = useState<PhientAgent | null>(null);
  const first = presets.find((p) => p.verb === b.verb) ?? (b.verb ? { verb: b.verb as string } : presets[0]);
  const [verb, setVerb] = useState<string>(first?.verb || '');
  const [params, setParams] = useState<string>(JSON.stringify(first?.params ?? {}, null, 2));
  const [runs, setRunsState] = useState<Run[]>(() => RUNS.get(b.agent) ?? []);
  const setRuns = (f: (xs: Run[]) => Run[]) => setRunsState((xs) => { const next = f(xs); RUNS.set(b.agent, next); return next; });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pol, setPol] = useState<PhientPolicy | null>(null);
  const me = useMe();
  useEffect(() => { void phientPolicy().then(setPol); }, []);
  useEffect(() => { setRunsState(RUNS.get(b.agent) ?? []); }, [b.agent]);
  useEffect(() => { void phientAgents().then((all) => { const a = all.find((x) => x.agent_id === b.agent) ?? null; setMeta(a); if (!verb && a?.verbs?.length) setVerb(a.verbs[0]); }); }, [b.agent]);

  const verbs = useMemo(() => Array.from(new Set([...presets.map((p) => p.verb), ...(meta?.verbs ?? [])])), [presets, meta]);
  const preset = presets.find((p) => p.verb === verb);
  const pick = (v: string) => { setVerb(v); const p = presets.find((x) => x.verb === v); setParams(JSON.stringify(p?.params ?? {}, null, 2)); setErr(null); };
  const run = async (text = params) => {
    let prm: Record<string, unknown>;
    try { prm = JSON.parse(text || '{}'); } catch { setErr('The parameters are not valid JSON.'); return; }
    setBusy(true); setErr(null);
    const r = await runVerb(b.agent, verb, prm);
    setBusy(false);
    if (!r) { setErr('The Phient platform did not answer.'); return; }
    if ('refused' in r) { setErr(r.message); return; }
    const out = r.results?.output ?? r.results;
    setRuns((xs) => [{ n: xs.length + 1, at: Date.now(), verb, ok: statusOf(out, r.results?.eval?.status) !== 'failed', status: statusOf(out, r.results?.eval?.status), confidence: r.confidence, ms: r.results?.duration_ms, output: out, actor: r.results?.actor }, ...xs]);
  };
  useEffect(() => { if (b.autorun && hasPhient && verb) void run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const last = runs[0];
  const cols: DataTableColumn<Run>[] = [
    { id: 'n', header: '#', cell: (r) => <Text as="span" size="sm" numeric>{r.n}</Text>, sortValue: (r) => r.n, width: '3rem' },
    { id: 'at', header: 'Time', cell: (r) => <Text as="span" size="sm" numeric>{new Date(r.at).toISOString().slice(11, 19)}</Text>, sortValue: (r) => r.at, width: '6rem' },
    { id: 'verb', header: 'Verb', cell: (r) => <Text as="span" size="sm" mono>{r.verb}</Text>, sortValue: (r) => r.verb },
    { id: 'status', header: 'Status', cell: (r) => <Tag intent={r.ok ? 'success' : 'error'} minimal round size="sm">{r.status}</Tag>, sortValue: (r) => r.status },
    { id: 'by', header: 'By', cell: (r) => <Text as="span" size="sm" intent="secondary">{r.actor ? '@' + (r.actor.handle ?? r.actor.sub) : '·'}</Text>, sortValue: (r) => r.actor?.handle ?? '' },
    { id: 'conf', header: 'Confidence', cell: (r) => <Text as="span" size="sm" numeric>{r.confidence != null ? Math.round(r.confidence * 100) + '%' : '·'}</Text>, sortValue: (r) => r.confidence ?? -1 },
  ];

  return (
    <Stack direction="column" gap={3}>
      <Stack direction="column" gap={2} surface="card">
        <Stack direction="row" gap={2} align="center" wrap>
          <Title level={3} size="md">{meta?.agent_name ?? b.agent}</Title>
          {meta?.layer && <Badge variant="secondary">{meta.layer}</Badge>}
          <Tag intent={hasPhient ? (meta ? 'success' : 'warning') : undefined} minimal round size="sm">{hasPhient ? (meta ? 'On the Phient platform' : 'Connecting') : 'Platform off'}</Tag>
        </Stack>
        <Text size="sm" intent="secondary">{b.intro || meta?.description || 'An agent on the Phient platform.'}</Text>
        {!hasPhient && <Text size="xs" intent="muted">Start the platform (gemphi/phient: uvicorn phiadk.phiapi.app:create_app --factory --port 8000) and set VITE_PHIADK_API, or run node apps/dev-all.mjs --phiadk.</Text>}
      </Stack>

      <Stack direction="column" gap={2} surface="card">
        <TabList size="sm" variant="pills" aria-label="Verbs" activeId={verb} onChange={pick} items={verbs.map((v) => ({ id: v, label: (presets.find((p) => p.verb === v)?.label ?? v) + (needsSignIn(pol, b.agent, v) ? ' ·' : '') }))} />
        {needsSignIn(pol, b.agent, verb) && <Stack direction="row" gap={1} align="center"><Icon icon={Lock} size="xs" />
          <Text as="span" size="xs" intent={me && !me.guest ? 'secondary' : 'warning'}>{me && !me.guest ? `Changes the platform: runs as @${me.handle ?? me.id}, recorded in the audit trail.` : 'Changes the platform: sign in with a Phiora account to run it.'}</Text></Stack>}
        {preset?.note && <Text size="xs" intent="secondary">{preset.note}</Text>}
        <Stack as="label" direction="column" gap={1}><Text as="span" size="xs" intent="muted">Parameters (JSON)</Text>
          <Textarea value={params} onChange={(e) => setParams(e.target.value)} minRows={3} aria-label="Parameters" /></Stack>
        <Stack direction="row" gap={2} align="center">
          <Button variant="primary" size="sm" disabled={!hasPhient || !verb} loading={busy} onClick={() => void run()} icon={<Icon icon={Play} size="xs" />}>Run {verb}</Button>
          {err && <Text as="span" size="sm" intent="danger" role="alert">{err}</Text>}
        </Stack>
        {last && <Stack direction="column" gap={1} surface="sunken" maxHeight="20rem" scroll="y">
          <Stack direction="row" gap={2} align="center"><Text as="span" size="xs" intent="muted" mono>{last.verb}</Text><Tag intent={last.ok ? 'success' : 'error'} minimal round size="sm">{last.status}</Tag>{last.actor && <Text as="span" size="xs" intent="secondary">by @{last.actor.handle ?? last.actor.sub}</Text>}</Stack>
          <Text size="xs" mono pre>{JSON.stringify(last.output, null, 2)}</Text>
        </Stack>}
      </Stack>

      {runs.length > 0 && <Box scroll="x"><DataTable rows={runs} getKey={(r) => r.n} columns={cols} defaultSort={{ id: 'n', dir: 'desc' }} onRowClick={(r) => setRuns((xs) => [r, ...xs.filter((x) => x !== r)])} /></Box>}
    </Stack>
  );
};
