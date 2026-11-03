import React, { useEffect, useMemo } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Icon, Input, Page, Stack, TabList, Tag, Text, Title, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { Pause, Play, RefreshCw, ScrollText, ShieldCheck } from 'lucide-react';
import { hasPhiadk } from '../state/phiadkClient';
import { logStore, type AuditRecord, type LogRecord } from '../state/logStore';

const POLL_MS = 4000;
const LEVEL_INTENT: Record<string, 'error' | 'warning' | 'primary'> = { ERROR: 'error', CRITICAL: 'error', WARN: 'warning', WARNING: 'warning' };

/** PhiLog: the platform's telemetry (GET /v2/telemetry/tail) and audit trail (GET /v2/audit/tail), filtered and live. */
export const LogsPage: React.FC = () => {
  const { logs, audits, live, isPaused, level, searchQuery, lastError, togglePause, setLevel, setSearch, refresh } = useStore(logStore);

  useEffect(() => {
    if (!hasPhiadk || isPaused) return undefined;
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [isPaused, refresh]);

  const levels = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((l) => l.level))).sort()], [logs]);
  const errors = useMemo(() => logs.filter((l) => LEVEL_INTENT[l.level] === 'error').length, [logs]);
  const q = searchQuery.trim().toLowerCase();
  const rows = logs.filter((l) => (level === 'ALL' || l.level === level)
    && (!q || (l.source + ' ' + l.level + ' ' + l.message + ' ' + JSON.stringify(l.data)).toLowerCase().includes(q)));

  const logColumns: DataTableColumn<LogRecord>[] = [
    { id: 'time', header: 'Time', cell: (l) => <Text as="span" size="sm" numeric>{l.time}</Text>, sortValue: (l) => l.time, width: '7rem' },
    { id: 'level', header: 'Level', cell: (l) => <Tag intent={LEVEL_INTENT[l.level] ?? 'primary'} minimal round size="sm">{l.level}</Tag>, sortValue: (l) => l.level, width: '7rem' },
    { id: 'source', header: 'Agent', cell: (l) => <Badge variant="primary">{l.source}</Badge>, sortValue: (l) => l.source, width: '9rem' },
    { id: 'message', header: 'Message', cell: (l) => <Text as="span" size="sm">{l.message}</Text>, sortValue: (l) => l.message },
    { id: 'data', header: 'Data', cell: (l) => <Text as="span" size="xs" intent="secondary" mono truncate maxWidth="18rem">{JSON.stringify(l.data)}</Text> },
  ];
  const auditColumns: DataTableColumn<AuditRecord>[] = [
    { id: 'time', header: 'Time', cell: (a) => <Text as="span" size="sm" numeric>{a.time}</Text>, sortValue: (a) => a.time, width: '7rem' },
    { id: 'actor', header: 'Actor', cell: (a) => <Badge variant="primary">{a.actor}</Badge>, sortValue: (a) => a.actor, width: '9rem' },
    { id: 'action', header: 'Action', cell: (a) => <Tag intent="primary" minimal round size="sm">{a.action}</Tag>, sortValue: (a) => a.action },
    { id: 'entity', header: 'Entity', cell: (a) => <Text as="span" size="sm">{a.entity}</Text>, sortValue: (a) => a.entity },
    { id: 'data', header: 'Details', cell: (a) => <Text as="span" size="xs" intent="secondary" mono truncate maxWidth="18rem">{JSON.stringify(a.data)}</Text> },
  ];

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="between" align="center" wrap gap={2}>
          <Stack direction="column" gap={1}>
            <Title level={2} size="xl">Logs · PhiLog</Title>
            <Text intent="secondary">The platform's telemetry and audit trail, newest first — every agent, every verb, every rule that fired.</Text>
          </Stack>
          <Stack direction="row" gap={2} align="center">
            <Tag intent={live ? 'success' : hasPhiadk ? 'warning' : undefined} minimal round>{live ? 'Live' : hasPhiadk ? 'Connecting' : 'Sample data'}</Tag>
            {hasPhiadk && <Button size="sm" variant="ghost" onClick={() => void refresh()} icon={<Icon icon={RefreshCw} size="xs" />}>Refresh</Button>}
            <Button size="sm" variant={isPaused ? 'danger' : 'primary'} onClick={togglePause} icon={<Icon icon={isPaused ? Play : Pause} size="xs" />}>{isPaused ? 'Resume' : 'Pause'}</Button>
          </Stack>
        </Stack>
        {lastError && <Text size="sm" intent="warning">{lastError}</Text>}

        <Stack autoFill="10rem" gap={3}>
          {[['Records', logs.length], ['Errors', errors], ['Audit events', audits.length], ['Shown', rows.length]].map(([l, v]) => (
            <Stack key={l} direction="column" gap={1} surface="card"><Text as="span" size="xs" intent="muted">{l}</Text><Text as="span" font="heading" size="2xl" lineHeight={1} numeric>{v}</Text></Stack>))}
        </Stack>

        <Stack direction="row" gap={2} align="center" wrap>
          <TabList size="sm" variant="pills" aria-label="Levels" activeId={level} onChange={(id) => setLevel(id)} items={levels.map((l) => ({ id: l, label: l === 'ALL' ? 'All' : l }))} />
          <Input value={searchQuery} onChange={(e) => setSearch(e.target.value)} placeholder="Search agent, message or data" aria-label="Search logs" width="18rem" />
        </Stack>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={ScrollText} size="sm" /><Title level={4} size="md">Telemetry ({rows.length})</Title></Stack></CardHeader>
          <CardBody>
            <DataTable rows={rows} getKey={(l) => l.id} columns={logColumns} defaultSort={{ id: 'time', dir: 'desc' }}
              empty={{ title: 'No log records', description: hasPhiadk ? 'Nothing at this level yet — run an agent and it logs here.' : 'Sample mode: set VITE_PHIADK_API to read the platform.' }} />
          </CardBody>
        </Card>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={ShieldCheck} size="sm" /><Title level={4} size="md">Audit trail ({audits.length})</Title></Stack></CardHeader>
          <CardBody>
            <DataTable rows={audits} getKey={(a) => a.id} columns={auditColumns} defaultSort={{ id: 'time', dir: 'desc' }}
              empty={{ title: 'No audit events', description: 'Governance rules write here as they fire.' }} />
          </CardBody>
        </Card>
      </Stack>
    </Page>
  );
};
