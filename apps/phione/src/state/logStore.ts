// PhiLog telemetry + audit. With VITE_PHIADK_API set, records come from the platform
// (GET /v2/telemetry/tail, GET /v2/audit/tail, polled); without it the page keeps sample records.
import { createStore } from '@pui/store';
import { hasPhiadk, phiGet } from './phiadkClient';

export type LogRecord = { id: string; time: string; level: string; source: string; message: string; data: Record<string, unknown> };
export type AuditRecord = { id: string; time: string; actor: string; action: string; entity: string; data: Record<string, unknown> };

const SAMPLE_LOGS: LogRecord[] = [
  { id: 'lg-1', time: '14:20:58', level: 'INFO', source: 'PhiBot', message: 'Playbook SyncGlobalFleet started', data: { playbook: 'SyncGlobalFleet' } },
  { id: 'lg-2', time: '14:21:02', level: 'INFO', source: 'PhiOra', message: 'Ontology snapshot committed', data: { objects: 15210 } },
  { id: 'lg-3', time: '14:21:05', level: 'WARN', source: 'PhiSec', message: 'Token near expiry for subject ops@phiace', data: { expires_in: 120 } },
  { id: 'lg-4', time: '14:21:09', level: 'ERROR', source: 'PhiGen', message: 'Model upstream 429, backing off', data: { retry_ms: 800 } },
  { id: 'lg-5', time: '14:21:12', level: 'INFO', source: 'PhiBus', message: 'Core stream healthy', data: { ratePerSec: 14820 } },
];
const SAMPLE_AUDITS: AuditRecord[] = [
  { id: 'au-1', time: '14:19:40', actor: 'phigov', action: 'PII_REDACTED', entity: 'User#904', data: { clearance: 'LEVEL_4' } },
  { id: 'au-2', time: '14:20:12', actor: 'phisec', action: 'POLICY_ENFORCED', entity: 'workspace/sql', data: { subject: 'analyst' } },
];

const t = (v: unknown): string => {
  const d = typeof v === 'number' ? new Date(v > 1e12 ? v : (v as number) * 1000) : new Date(String(v ?? ''));
  return isNaN(+d) ? String(v ?? '·') : d.toISOString().slice(11, 19);
};
const s = (v: unknown, fb = '·'): string => (typeof v === 'string' && v ? v : fb);

/** Tolerant mapping: the platform's record fields, whatever their exact names. */
const toLog = (r: Record<string, unknown>, i: number): LogRecord => ({
  id: s(r.id ?? r.log_id, 'log-' + i),
  time: t(r.timestamp ?? r.ts ?? r.time ?? r.at),
  level: s(r.level ?? r.severity, 'INFO').toUpperCase(),
  source: s(r.agent ?? r.agent_id ?? r.source ?? r.source_agent, 'platform'),
  message: s(r.message ?? r.msg ?? r.event, ''),
  data: (r.data ?? r.payload ?? r.context ?? {}) as Record<string, unknown>,
});
const toAudit = (r: Record<string, unknown>, i: number): AuditRecord => ({
  id: s(r.id ?? r.audit_id, 'audit-' + i),
  time: t(r.timestamp ?? r.ts ?? r.time ?? r.at),
  actor: s(r.actor ?? r.agent ?? r.by ?? r.subject, 'platform'),
  action: s(r.action ?? r.rule_id ?? r.event, ''),
  entity: s(r.entity ?? r.resource ?? r.target, ''),
  data: (r.data ?? r.payload ?? r.details ?? {}) as Record<string, unknown>,
});

export interface LogStoreState {
  logs: LogRecord[];
  audits: AuditRecord[];
  live: boolean;
  isPaused: boolean;
  level: string;
  searchQuery: string;
  lastError: string | null;
  togglePause: () => void;
  setLevel: (l: string) => void;
  setSearch: (q: string) => void;
  refresh: () => Promise<void>;
}

export const logStore = createStore<LogStoreState>((set, get) => ({
  logs: hasPhiadk ? [] : SAMPLE_LOGS,
  audits: hasPhiadk ? [] : SAMPLE_AUDITS,
  live: false,
  isPaused: false,
  level: 'ALL',
  searchQuery: '',
  lastError: null,
  togglePause: () => set({ isPaused: !get().isPaused }),
  setLevel: (level) => set({ level }),
  setSearch: (searchQuery) => set({ searchQuery }),
  refresh: async () => {
    if (!hasPhiadk || get().isPaused) return;
    const [tl, au] = await Promise.all([
      phiGet<{ logs: Record<string, unknown>[] }>('/v2/telemetry/tail?n=200'),
      phiGet<{ audits: Record<string, unknown>[] }>('/v2/audit/tail?n=100'),
    ]);
    if (!tl && !au) { set({ live: false, lastError: 'PhiLog did not answer.' }); return; }
    set({
      live: true, lastError: null,
      logs: [...(tl?.logs ?? [])].reverse().map(toLog),
      audits: [...(au?.audits ?? [])].reverse().map(toAudit),
    });
  },
}));
