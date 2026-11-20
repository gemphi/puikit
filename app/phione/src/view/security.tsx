import React, { useState } from 'react';
import { Badge, Tag, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { hasPhiadk } from '../state/phiadkClient';
import { securityStore, type Vulnerability } from '../state/securityStore';
import { textCell, type ConsoleView, type Note } from './part';

const SEV_INTENT: Record<string, 'error' | 'warning' | 'primary'> = { CRITICAL: 'error', HIGH: 'error', MEDIUM: 'warning' };
const COLUMN: DataTableColumn<Vulnerability>[] = [
  { id: 'sev', header: 'Severity', cell: (v) => <Tag intent={SEV_INTENT[v.severity] ?? 'primary'} minimal round size="sm">{v.severity}</Tag>, sortValue: (v) => v.severity, width: '8rem' },
  { id: 'title', header: 'Finding', cell: (v) => textCell(v.title), sortValue: (v) => v.title },
  { id: 'target', header: 'Target', cell: (v) => <Badge variant="secondary">{v.target}</Badge>, sortValue: (v) => v.target, width: '12rem' },
];

/** PhiSec: the security agent's verbs - scan a target, verify a token, enforce a policy - and the last scan's posture. */
export const useSecurityView = (): ConsoleView => {
  const { scan, scans, busy, lastError, lastAction, runScan, runVerb } = useStore(securityStore);
  const [note, setNote] = useState<string | null>(null);

  const verify = async (v: Record<string, string>) => {
    const out = await runVerb('verify_token', { token: v.token });
    setNote(out ? (out.token_valid ? `Token valid - ${String(out.subject ?? '')} (${(out.roles as string[] | undefined)?.join(', ') ?? 'user'})` : 'Token is NOT valid.') : null);
  };
  const enforce = async (v: Record<string, string>) => {
    const out = await runVerb('enforce_policy', { resource: v.resource, action: 'read', subject: v.subject });
    setNote(out ? `Policy answered: ${JSON.stringify(out).slice(0, 120)}` : null);
  };
  const said = note ?? lastAction;
  const noteList: Note[] = [...(lastError ? [{ text: lastError, intent: 'warning' as const }] : []), ...(said ? [{ text: said, intent: 'secondary' as const }] : [])];

  return {
    title: 'Security · PhiSec',
    sub: 'The security agent on the ends: vulnerability scans, token verification and policy enforcement, run as verbs.',
    action: <>
      <Tag intent={hasPhiadk ? 'success' : undefined} minimal round>{hasPhiadk ? 'Platform' : 'Sample data'}</Tag>
      {scan && <Tag intent={scan.passed ? 'success' : 'error'} minimal round>{scan.passed ? 'Posture OK' : 'At risk'}</Tag>}
    </>,
    noteList,
    blocks: [
      { kind: 'stats', items: [{ label: 'Risk score', value: scan ? scan.riskScore : '·' }, { label: 'Findings', value: scan ? scan.vulnerabilities.length : 0 }, { label: 'Scans run', value: scans.length }, { label: 'Last scan', value: scan ? scan.at : '·' }] },
      {
        kind: 'form', variant: 'inline', title: 'Scan', submitLabel: busy ? 'Running…' : 'Run scan', disabled: busy,
        fields: [{ id: 'target', label: 'Target', value: 'workspace' }], onSubmit: (v: Record<string, string>) => runScan(v.target.trim() || 'workspace'),
      },
      {
        kind: 'table', title: scan ? `Findings - ${scan.scanId} on ${scan.target}` : 'Findings', columns: COLUMN, items: scan?.vulnerabilities ?? [], getKey: (v: Vulnerability) => v.id, sort: { id: 'sev', dir: 'asc' },
        empty: { title: 'No findings', description: scan ? 'The last scan came back clean.' : 'Run a scan to read the posture.' },
      },
      {
        kind: 'form', variant: 'inline', title: 'Verify', submitLabel: 'Verify token', submitVariant: 'secondary', disabled: busy, onSubmit: verify,
        fields: [{ id: 'token', label: 'Token', placeholder: 'A delegation or service token', required: true }],
      },
      {
        kind: 'form', variant: 'inline', title: 'Enforce', submitLabel: 'Enforce policy', submitVariant: 'secondary', disabled: busy, onSubmit: enforce,
        fields: [{ id: 'resource', label: 'Resource', value: 'workspace/sql' }, { id: 'subject', label: 'Subject', value: 'analyst' }],
      },
    ],
  };
};
