// Audit and governance: the PhiLog telemetry tail (GET /v2/telemetry/tail) and the audit trail (GET /v2/audit/tail),
// read while the page is open. A PhiGov check run from the page is also written to PhiLog, so the tail is its record.
import { createStore } from '@pui/store';
import { executeVerb, hasPhiadk, phiGet } from './phiadkClient';
import type { LogRow } from '../types/streams';

export type AuditRow = { audit_id: string; action: string; agent_id: string; target: string; status: string; timestamp: string; metadata?: { actor?: { sub: string; handle?: string | null; name?: string } } };

const SAMPLE: LogRow[] = [
  { id: 'AUD-901', timestamp: '2026-10-12T14:20:12Z', level: 'INFO', agent_id: 'phione', message: 'ROTATE_CREDENTIALS User#882', trace_id: '0x33ee...881a' },
  { id: 'AUD-902', timestamp: '2026-10-12T14:20:18Z', level: 'INFO', agent_id: 'phisec', message: 'ENCRYPT_CIPHER_TEXT Payment#401', trace_id: '0x77fa...99cc' },
  { id: 'AUD-903', timestamp: '2026-10-12T14:20:25Z', level: 'WARN', agent_id: 'phigov', message: 'APPLY_PII_REDACTION TelemetryLog#99', trace_id: '0x12ab...44ef' },
  { id: 'AUD-904', timestamp: '2026-10-12T14:20:31Z', level: 'INFO', agent_id: 'phibot', message: 'DISPATCH_WORKFLOW Playbook#Sync', trace_id: '0x66bb...11ee' },
];

export interface GovernanceStoreState {
  logs: LogRow[];
  audits: AuditRow[];
  live: boolean;
  level: string;
  setLevel: (level: string) => void;
  load: () => Promise<void>;
  /** A PhiGov check was run: put it on the PhiLog record and read the tail again. */
  record: (verb: string, status: string, confidence?: number) => Promise<void>;
}

export const governanceStore = createStore<GovernanceStoreState>((set, get) => ({
  logs: hasPhiadk ? [] : SAMPLE,
  audits: [],
  live: false,
  level: 'ALL',
  setLevel: (level) => set({ level }),
  load: async () => {
    const r = await phiGet<{ tail_count: number; logs: (Omit<LogRow, 'id'> & { idx?: string })[] }>('/v2/telemetry/tail?n=100');
    if (!r) { set({ live: false }); return; }
    set({ live: true, logs: r.logs.map((l, i) => ({ ...l, id: l.idx ?? `${l.timestamp}-${i}` })).reverse() });
    const a = await phiGet<{ audits: AuditRow[] }>('/v2/audit/tail?n=100'); if (a) set({ audits: [...a.audits].reverse() });
  },
  record: async (verb, status, confidence) => {
    await executeVerb('philog', 'info', { message: `PhiGov ${verb}: ${status}`, agent_id: 'phigov', verb, confidence });
    await get().load();
  },
}));
