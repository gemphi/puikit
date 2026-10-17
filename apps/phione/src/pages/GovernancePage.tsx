import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Icon, Page, Stack, TabList, Tag, Text, Title, type DataTableColumn } from '@pui/components';
import { CheckCircle, Gauge, GitBranch, RefreshCw, Shield, ShieldCheck } from 'lucide-react';
import { executeVerb, hasPhiadk, phiGet } from '../state/phiadkClient';
import type { LogRow } from '../types/streams';

const SAMPLE: LogRow[] = [
  { id: 'AUD-901', timestamp: '2026-10-12T14:20:12Z', level: 'INFO', agent_id: 'phione', message: 'ROTATE_CREDENTIALS User#882', trace_id: '0x33ee...881a' },
  { id: 'AUD-902', timestamp: '2026-10-12T14:20:18Z', level: 'INFO', agent_id: 'phisec', message: 'ENCRYPT_CIPHER_TEXT Payment#401', trace_id: '0x77fa...99cc' },
  { id: 'AUD-903', timestamp: '2026-10-12T14:20:25Z', level: 'WARN', agent_id: 'phigov', message: 'APPLY_PII_REDACTION TelemetryLog#99', trace_id: '0x12ab...44ef' },
  { id: 'AUD-904', timestamp: '2026-10-12T14:20:31Z', level: 'INFO', agent_id: 'phibot', message: 'DISPATCH_WORKFLOW Playbook#Sync', trace_id: '0x66bb...11ee' },
];
const LEVEL_INTENT: Record<string, 'success' | 'warning' | 'error' | 'primary' | undefined> = { INFO: 'primary', DEBUG: undefined, WARN: 'warning', WARNING: 'warning', ERROR: 'error', CRITICAL: 'error' };
type AuditRow = { audit_id: string; action: string; agent_id: string; target: string; status: string; timestamp: string; metadata?: { actor?: { sub: string; handle?: string | null; name?: string } } };
const AUDIT_COLS: DataTableColumn<AuditRow>[] = [
  { id: 'time', header: 'Time', cell: (a) => <Text as="span" size="sm" numeric>{String(a.timestamp).slice(11, 19)}</Text>, sortValue: (a) => String(a.timestamp), width: '7rem' },
  { id: 'agent', header: 'Agent', cell: (a) => <Badge variant="secondary">{a.agent_id}</Badge>, sortValue: (a) => a.agent_id },
  { id: 'action', header: 'Action', cell: (a) => <Text as="span" size="sm" mono>{a.action}</Text>, sortValue: (a) => a.action },
  { id: 'by', header: 'By', cell: (a) => <Text as="span" size="sm">{a.metadata?.actor ? '@' + (a.metadata.actor.handle ?? a.metadata.actor.sub) : '·'}</Text>, sortValue: (a) => a.metadata?.actor?.handle ?? '' },
  { id: 'status', header: 'Status', cell: (a) => <Tag intent={a.status === 'success' ? 'success' : 'warning'} minimal round size="sm">{a.status}</Tag>, sortValue: (a) => a.status },
];
const CHECKS = [
  { verb: 'get_compliance_score', label: 'Compliance score', icon: Gauge },
  { verb: 'check_compliance', label: 'Check compliance', icon: ShieldCheck },
  { verb: 'audit_lineage', label: 'Audit lineage', icon: GitBranch },
] as const;

/** Audit and governance: the PhiLog telemetry tail (GET /v2/telemetry/tail) and PhiGov verbs run on the platform. */
export const GovernancePage: React.FC = () => {
  const [logs, setLogs] = useState<LogRow[]>(hasPhiadk ? [] : SAMPLE);
  const [live, setLive] = useState(false);
  const [level, setLevel] = useState('ALL');
  const [result, setResult] = useState<{ verb: string; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [audits, setAudits] = useState<AuditRow[]>([]);

  const load = useCallback(async () => {
    const r = await phiGet<{ tail_count: number; logs: (Omit<LogRow, 'id'> & { idx?: string })[] }>('/v2/telemetry/tail?n=100');
    if (!r) { setLive(false); return; }
    setLive(true); setLogs(r.logs.map((l, i) => ({ ...l, id: l.idx ?? `${l.timestamp}-${i}` })).reverse());
    const a = await phiGet<{ audits: AuditRow[] }>('/v2/audit/tail?n=100'); if (a) setAudits([...a.audits].reverse());
  }, []);
  useEffect(() => { if (!hasPhiadk) return undefined; void load(); const id = setInterval(() => void load(), 5000); return () => clearInterval(id); }, [load]);

  const run = async (verb: string) => {
    setBusy(verb);
    const r = hasPhiadk ? await executeVerb('phigov', verb) : null;
    // Each check also goes on the PhiLog record, so the telemetry tail is the audit trail of what was run.
    if (r) await executeVerb('philog', 'info', { message: `PhiGov ${verb}: ${r.results?.eval?.status ?? 'done'}`, agent_id: 'phigov', verb, confidence: r.confidence });
    setResult({ verb, text: r ? JSON.stringify(r.results?.output ?? r.results ?? r, null, 2) : hasPhiadk ? 'PhiGov did not answer.' : 'Set VITE_PHIADK_API to run PhiGov verbs on the Phient platform.' });
    setBusy(null); if (hasPhiadk) void load();
  };

  const levels = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((l) => l.level.toUpperCase())))], [logs]);
  const rows = logs.filter((l) => level === 'ALL' || l.level.toUpperCase() === level);
  const columns: DataTableColumn<LogRow>[] = [
    { id: 'time', header: 'Time', cell: (l) => <Text as="span" size="sm" numeric>{l.timestamp.slice(11, 19)}</Text>, sortValue: (l) => l.timestamp, width: '7rem' },
    { id: 'level', header: 'Level', cell: (l) => <Tag intent={LEVEL_INTENT[l.level.toUpperCase()]} minimal round size="sm">{l.level.toUpperCase()}</Tag>, sortValue: (l) => l.level, width: '7rem' },
    { id: 'agent', header: 'Agent', cell: (l) => <Badge variant="secondary">{l.agent_id ?? '·'}</Badge>, sortValue: (l) => l.agent_id ?? '' },
    { id: 'message', header: 'Message', cell: (l) => <Text as="span" size="sm">{l.message}</Text>, sortValue: (l) => l.message },
    { id: 'trace', header: 'Trace', cell: (l) => <Text as="span" size="xs" intent="muted" mono>{l.trace_id ?? '·'}</Text> },
  ];

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="between" align="center" wrap gap={2}>
          <Stack direction="column" gap={1}>
            <Title level={2} size="xl">Audit and governance</Title>
            <Text intent="secondary">The PhiLog telemetry tail and PhiGov compliance verbs, run on the Phient platform.</Text>
          </Stack>
          <Stack direction="row" gap={2} align="center">
            <Tag intent={live ? 'success' : hasPhiadk ? 'warning' : undefined} minimal round>{live ? 'Live' : hasPhiadk ? 'Connecting' : 'Sample data'}</Tag>
            {hasPhiadk && <Button size="sm" variant="ghost" onClick={() => void load()} icon={<Icon icon={RefreshCw} size="xs" />}>Refresh</Button>}
          </Stack>
        </Stack>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={Shield} size="sm" /><Title level={4} size="md">PhiGov</Title></Stack></CardHeader>
          <CardBody>
            <Stack direction="column" gap={3}>
              <Stack direction="row" gap={2} wrap>{CHECKS.map((c) => (
                <Button key={c.verb} size="sm" variant={result?.verb === c.verb ? 'primary' : 'outline'} loading={busy === c.verb} onClick={() => void run(c.verb)} icon={<Icon icon={c.icon} size="xs" />}>{c.label}</Button>))}</Stack>
              {result && <Stack direction="column" gap={1} surface="sunken" maxHeight="18rem" scroll="y">
                <Stack direction="row" gap={1} align="center"><Icon icon={CheckCircle} size="xs" /><Text as="span" size="xs" intent="muted">{result.verb}</Text></Stack>
                <Text size="xs" mono pre>{result.text}</Text>
              </Stack>}
            </Stack>
          </CardBody>
        </Card>

        {hasPhiadk && <Card variant="default">
          <CardHeader><Title level={4} size="md">Audit trail ({audits.length})</Title></CardHeader>
          <CardBody>
            <DataTable rows={audits} getKey={(a) => a.audit_id} columns={AUDIT_COLS} defaultSort={{ id: 'time', dir: 'desc' }}
              empty={{ title: 'No changes yet', description: 'Every verb that changes the platform is recorded here with who ran it (a Phiora delegation is required).' }} />
          </CardBody>
        </Card>}

        <Card variant="default">
          <CardHeader action={<TabList size="sm" variant="pills" aria-label="Levels" activeId={level} onChange={setLevel} items={levels.map((l) => ({ id: l, label: l === 'ALL' ? 'All' : l }))} />}>
            <Title level={4} size="md">Telemetry ({rows.length})</Title>
          </CardHeader>
          <CardBody>
            <DataTable rows={rows} getKey={(l) => l.id} columns={columns} defaultSort={{ id: 'time', dir: 'desc' }}
              empty={{ title: 'No telemetry yet', description: 'Run a PhiGov check above; each run is written to PhiLog and shows here.' }} />
          </CardBody>
        </Card>
      </Stack>
    </Page>
  );
};
