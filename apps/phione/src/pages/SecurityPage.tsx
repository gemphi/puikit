import React, { useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Icon, Input, Page, Stack, Tag, Text, Title, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { KeyRound, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { hasPhiadk } from '../state/phiadkClient';
import { securityStore, type Vulnerability } from '../state/securityStore';

const SEV_INTENT: Record<string, 'error' | 'warning' | 'primary'> = { CRITICAL: 'error', HIGH: 'error', MEDIUM: 'warning' };

/** PhiSec: the security agent's verbs — scan a target, verify a token, enforce a policy — and the last scan's posture. */
export const SecurityPage: React.FC = () => {
  const { scan, scans, busy, lastError, lastAction, runScan, runVerb } = useStore(securityStore);
  const [target, setTarget] = useState('workspace');
  const [token, setToken] = useState('');
  const [resource, setResource] = useState('workspace/sql');
  const [subject, setSubject] = useState('analyst');
  const [note, setNote] = useState<string | null>(null);

  const verify = async () => {
    const out = await runVerb('verify_token', { token });
    setNote(out ? (out.token_valid ? `Token valid — ${String(out.subject ?? '')} (${(out.roles as string[] | undefined)?.join(', ') ?? 'user'})` : 'Token is NOT valid.') : null);
  };
  const enforce = async () => {
    const out = await runVerb('enforce_policy', { resource, action: 'read', subject });
    setNote(out ? `Policy answered: ${JSON.stringify(out).slice(0, 120)}` : null);
  };

  const columns: DataTableColumn<Vulnerability>[] = [
    { id: 'sev', header: 'Severity', cell: (v) => <Tag intent={SEV_INTENT[v.severity] ?? 'primary'} minimal round size="sm">{v.severity}</Tag>, sortValue: (v) => v.severity, width: '8rem' },
    { id: 'title', header: 'Finding', cell: (v) => <Text as="span" size="sm">{v.title}</Text>, sortValue: (v) => v.title },
    { id: 'target', header: 'Target', cell: (v) => <Badge variant="secondary">{v.target}</Badge>, sortValue: (v) => v.target, width: '12rem' },
  ];

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="between" align="center" wrap gap={2}>
          <Stack direction="column" gap={1}>
            <Title level={2} size="xl">Security · PhiSec</Title>
            <Text intent="secondary">The security agent on the ends: vulnerability scans, token verification and policy enforcement, run as verbs.</Text>
          </Stack>
          <Stack direction="row" gap={2} align="center">
            <Tag intent={hasPhiadk ? 'success' : undefined} minimal round>{hasPhiadk ? 'Platform' : 'Sample data'}</Tag>
            {scan && <Tag intent={scan.passed ? 'success' : 'error'} minimal round>{scan.passed ? 'Posture OK' : 'At risk'}</Tag>}
          </Stack>
        </Stack>
        {lastError && <Text size="sm" intent="warning">{lastError}</Text>}
        {(lastAction || note) && <Text size="sm" intent="secondary" role="status">{note ?? lastAction}</Text>}

        <Stack autoFill="10rem" gap={3}>
          {[['Risk score', scan ? scan.riskScore : '·'], ['Findings', scan ? scan.vulnerabilities.length : 0],
            ['Scans run', scans.length], ['Last scan', scan ? scan.at : '·']].map(([l, v]) => (
            <Stack key={l} direction="column" gap={1} surface="card"><Text as="span" size="xs" intent="muted">{l}</Text><Text as="span" font="heading" size="2xl" lineHeight={1} numeric>{v}</Text></Stack>))}
        </Stack>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={ShieldAlert} size="sm" /><Title level={4} size="md">Scan</Title></Stack></CardHeader>
          <CardBody>
            <Stack direction="row" gap={2} align="end" wrap>
              <Stack as="label" direction="column" gap={1}><Text as="span" size="xs" intent="muted">Target</Text><Input value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Scan target" width="16rem" /></Stack>
              <Button variant="primary" size="sm" disabled={busy} onClick={() => void runScan(target.trim() || 'workspace')} icon={<Icon icon={RefreshCw} size="xs" />}>{busy ? 'Running…' : 'Run scan'}</Button>
            </Stack>
          </CardBody>
        </Card>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={ShieldCheck} size="sm" /><Title level={4} size="md">Findings {scan ? `— ${scan.scanId} on ${scan.target}` : ''}</Title></Stack></CardHeader>
          <CardBody>
            <DataTable rows={scan?.vulnerabilities ?? []} getKey={(v) => v.id} columns={columns} defaultSort={{ id: 'sev', dir: 'asc' }}
              empty={{ title: 'No findings', description: scan ? 'The last scan came back clean.' : 'Run a scan to read the posture.' }} />
          </CardBody>
        </Card>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={KeyRound} size="sm" /><Title level={4} size="md">Verify &amp; enforce</Title></Stack></CardHeader>
          <CardBody>
            <Stack direction="column" gap={3} maxWidth="44rem">
              <Stack direction="row" gap={2} align="end" wrap>
                <Stack as="label" direction="column" gap={1}><Text as="span" size="xs" intent="muted">Token</Text><Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="A delegation or service token" aria-label="Token" width="22rem" /></Stack>
                <Button size="sm" variant="secondary" disabled={busy || !token.trim()} onClick={() => void verify()}>Verify token</Button>
              </Stack>
              <Stack direction="row" gap={2} align="end" wrap>
                <Stack as="label" direction="column" gap={1}><Text as="span" size="xs" intent="muted">Resource</Text><Input value={resource} onChange={(e) => setResource(e.target.value)} aria-label="Resource" width="14rem" /></Stack>
                <Stack as="label" direction="column" gap={1}><Text as="span" size="xs" intent="muted">Subject</Text><Input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" width="12rem" /></Stack>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => void enforce()}>Enforce policy</Button>
              </Stack>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </Page>
  );
};
