import React, { useMemo } from 'react';
import { Badge, Button, Icon, Tag, Text, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { RefreshCw } from 'lucide-react';
import { hasPhiadk } from '../state/phiadkClient';
import { governanceStore, type AuditRow } from '../state/governanceStore';
import type { LogRow } from '../types/streams';
import { monoCell, sourceTag, textCell, timeCell, usePoll, type ConsoleView } from './part';

const LEVEL_INTENT: Record<string, 'success' | 'warning' | 'error' | 'primary' | undefined> = { INFO: 'primary', DEBUG: undefined, WARN: 'warning', WARNING: 'warning', ERROR: 'error', CRITICAL: 'error' };
const AUDIT_COLUMN: DataTableColumn<AuditRow>[] = [
  { id: 'time', header: 'Time', cell: (a) => timeCell(String(a.timestamp).slice(11, 19)), sortValue: (a) => String(a.timestamp), width: '7rem' },
  { id: 'agent', header: 'Agent', cell: (a) => <Badge variant="secondary">{a.agent_id}</Badge>, sortValue: (a) => a.agent_id },
  { id: 'action', header: 'Action', cell: (a) => monoCell(a.action), sortValue: (a) => a.action },
  { id: 'by', header: 'By', cell: (a) => textCell(a.metadata?.actor ? '@' + (a.metadata.actor.handle ?? a.metadata.actor.sub) : '·'), sortValue: (a) => a.metadata?.actor?.handle ?? '' },
  { id: 'status', header: 'Status', cell: (a) => <Tag intent={a.status === 'success' ? 'success' : 'warning'} minimal round size="sm">{a.status}</Tag>, sortValue: (a) => a.status },
];
const LOG_COLUMN: DataTableColumn<LogRow>[] = [
  { id: 'time', header: 'Time', cell: (l) => timeCell(l.timestamp.slice(11, 19)), sortValue: (l) => l.timestamp, width: '7rem' },
  { id: 'level', header: 'Level', cell: (l) => <Tag intent={LEVEL_INTENT[l.level.toUpperCase()]} minimal round size="sm">{l.level.toUpperCase()}</Tag>, sortValue: (l) => l.level, width: '7rem' },
  { id: 'agent', header: 'Agent', cell: (l) => <Badge variant="secondary">{l.agent_id ?? '·'}</Badge>, sortValue: (l) => l.agent_id ?? '' },
  { id: 'message', header: 'Message', cell: (l) => textCell(l.message), sortValue: (l) => l.message },
  { id: 'trace', header: 'Trace', cell: (l) => <Text as="span" size="xs" intent="muted" mono>{l.trace_id ?? '·'}</Text> },
];
/** The PhiGov checks, ready-made on the shared agent block. */
const CHECK = [
  { verb: 'get_compliance_score', label: 'Compliance score' },
  { verb: 'check_compliance', label: 'Check compliance' },
  { verb: 'audit_lineage', label: 'Audit lineage' },
];
type Run = { confidence?: number; results?: { eval?: { status?: string } } };

/** Audit and governance: the PhiLog telemetry tail (GET /v2/telemetry/tail) and PhiGov verbs run on the platform. */
export const useGovernanceView = (): ConsoleView => {
  const { logs, audits, live, level, setLevel, load, record } = useStore(governanceStore);
  usePoll(hasPhiadk, load, 5000);

  const levels = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((l) => l.level.toUpperCase())))], [logs]);
  const rows = logs.filter((l) => level === 'ALL' || l.level.toUpperCase() === level);

  return {
    title: 'Audit and governance',
    sub: 'The PhiLog telemetry tail and PhiGov compliance verbs, run on the Phient platform.',
    action: <>
      {sourceTag(live)}
      {hasPhiadk && <Button size="sm" variant="ghost" onClick={() => void load()} icon={<Icon icon={RefreshCw} size="xs" />}>Refresh</Button>}
    </>,
    blocks: [
      // Each check also goes on the PhiLog record, so the telemetry tail is the audit trail of what was run.
      { kind: 'agent', title: 'PhiGov', agent: 'phigov', presets: CHECK, onRun: (verb: string, r: Run) => void record(verb, r.results?.eval?.status ?? 'done', r.confidence) },
      ...(hasPhiadk ? [{
        kind: 'table', title: `Audit trail (${audits.length})`, columns: AUDIT_COLUMN, items: audits, getKey: (a: AuditRow) => a.audit_id, sort: { id: 'time', dir: 'desc' },
        empty: { title: 'No changes yet', description: 'Every verb that changes the platform is recorded here with who ran it (a Phiora delegation is required).' },
      }] : []),
      {
        kind: 'table', title: `Telemetry (${rows.length})`, columns: LOG_COLUMN, items: rows, getKey: (l: LogRow) => l.id, sort: { id: 'time', dir: 'desc' },
        tabs: { label: 'Levels', activeId: level, onChange: setLevel, items: levels.map((l) => ({ id: l, label: l === 'ALL' ? 'All' : l })) },
        empty: { title: 'No telemetry yet', description: 'Run a PhiGov check above; each run is written to PhiLog and shows here.' },
      },
    ],
  };
};
