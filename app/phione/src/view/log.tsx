import React, { useMemo } from 'react';
import { Badge, Button, Icon, Tag, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { hasPhiadk } from '../state/phiadkClient';
import { logStore, type AuditRecord, type LogRecord } from '../state/logStore';
import { dataCell, sourceTag, textCell, timeCell, usePoll, type ConsoleView } from './part';

const LEVEL_INTENT: Record<string, 'error' | 'warning' | 'primary'> = { ERROR: 'error', CRITICAL: 'error', WARN: 'warning', WARNING: 'warning' };

const LOG_COLUMN: DataTableColumn<LogRecord>[] = [
  { id: 'time', header: 'Time', cell: (l) => timeCell(l.time), sortValue: (l) => l.time, width: '7rem' },
  { id: 'level', header: 'Level', cell: (l) => <Tag intent={LEVEL_INTENT[l.level] ?? 'primary'} minimal round size="sm">{l.level}</Tag>, sortValue: (l) => l.level, width: '7rem' },
  { id: 'source', header: 'Agent', cell: (l) => <Badge variant="primary">{l.source}</Badge>, sortValue: (l) => l.source, width: '9rem' },
  { id: 'message', header: 'Message', cell: (l) => textCell(l.message), sortValue: (l) => l.message },
  { id: 'data', header: 'Data', cell: (l) => dataCell(l.data) },
];
const AUDIT_COLUMN: DataTableColumn<AuditRecord>[] = [
  { id: 'time', header: 'Time', cell: (a) => timeCell(a.time), sortValue: (a) => a.time, width: '7rem' },
  { id: 'actor', header: 'Actor', cell: (a) => <Badge variant="primary">{a.actor}</Badge>, sortValue: (a) => a.actor, width: '9rem' },
  { id: 'action', header: 'Action', cell: (a) => <Tag intent="primary" minimal round size="sm">{a.action}</Tag>, sortValue: (a) => a.action },
  { id: 'entity', header: 'Entity', cell: (a) => textCell(a.entity), sortValue: (a) => a.entity },
  { id: 'data', header: 'Details', cell: (a) => dataCell(a.data) },
];

/** PhiLog: the platform's telemetry (GET /v2/telemetry/tail) and audit trail (GET /v2/audit/tail), filtered and live. */
export const useLogView = (): ConsoleView => {
  const { logs, audits, live, isPaused, level, searchQuery, lastError, togglePause, setLevel, setSearch, refresh } = useStore(logStore);
  usePoll(hasPhiadk && !isPaused, refresh, 4000);

  const levels = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((l) => l.level))).sort()], [logs]);
  const errors = useMemo(() => logs.filter((l) => LEVEL_INTENT[l.level] === 'error').length, [logs]);
  const q = searchQuery.trim().toLowerCase();
  const rows = logs.filter((l) => (level === 'ALL' || l.level === level)
    && (!q || (l.source + ' ' + l.level + ' ' + l.message + ' ' + JSON.stringify(l.data)).toLowerCase().includes(q)));

  return {
    title: 'Logs · PhiLog',
    sub: "The platform's telemetry and audit trail, newest first - every agent, every verb, every rule that fired.",
    action: <>
      {sourceTag(live)}
      {hasPhiadk && <Button size="sm" variant="ghost" onClick={() => void refresh()} icon={<Icon icon={RefreshCw} size="xs" />}>Refresh</Button>}
      <Button size="sm" variant={isPaused ? 'danger' : 'primary'} onClick={togglePause} icon={<Icon icon={isPaused ? Play : Pause} size="xs" />}>{isPaused ? 'Resume' : 'Pause'}</Button>
    </>,
    noteList: lastError ? [{ text: lastError, intent: 'warning' }] : [],
    blocks: [
      { kind: 'stats', items: [{ label: 'Records', value: logs.length }, { label: 'Errors', value: errors }, { label: 'Audit events', value: audits.length }, { label: 'Shown', value: rows.length }] },
      {
        kind: 'table', title: `Telemetry (${rows.length})`, columns: LOG_COLUMN, items: rows, getKey: (l: LogRecord) => l.id, sort: { id: 'time', dir: 'desc' },
        tabs: { label: 'Levels', activeId: level, onChange: setLevel, items: levels.map((l) => ({ id: l, label: l === 'ALL' ? 'All' : l })) },
        search: { value: searchQuery, onChange: setSearch, placeholder: 'Search agent, message or data' },
        empty: { title: 'No log records', description: hasPhiadk ? 'Nothing at this level yet - run an agent and it logs here.' : 'Sample mode: set VITE_PHIADK_API to read the platform.' },
      },
      {
        kind: 'table', title: `Audit trail (${audits.length})`, columns: AUDIT_COLUMN, items: audits, getKey: (a: AuditRecord) => a.id, sort: { id: 'time', dir: 'desc' },
        empty: { title: 'No audit events', description: 'Governance rules write here as they fire.' },
      },
    ],
  };
};
