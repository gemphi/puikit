// PhiSec: the security agent's verbs, run through the platform (POST /v2/agents/phisec/execute).
// Without VITE_PHIADK_API, the page shows a sample posture so the console still reads.
import { createStore } from '@pui/store';
import { executeVerb, hasPhiadk, lastRefusal } from './phiadkClient';

export type Vulnerability = { id: string; severity: string; title: string; target: string };
export type Scan = { scanId: string; target: string; riskScore: number; passed: boolean; vulnerabilities: Vulnerability[]; at: string };

const SAMPLE: Scan = {
  scanId: 'scan_sample01', target: 'workspace', riskScore: 12.5, passed: true, at: '14:18:30',
  vulnerabilities: [
    { id: 'v-1', severity: 'LOW', title: 'Demo token older than 30 days', target: 'sessions' },
    { id: 'v-2', severity: 'MEDIUM', title: 'Open CORS origin in dev profile', target: 'phiora/dev' },
  ],
};

const now = () => new Date().toISOString().slice(11, 19);
const s = (v: unknown, fb = '·'): string => (typeof v === 'string' && v ? v : fb);

const toScan = (out: Record<string, unknown>): Scan => {
  const vulns = Array.isArray(out.vulnerabilities) ? (out.vulnerabilities as Record<string, unknown>[]) : [];
  return {
    scanId: s(out.scan_id, 'scan'),
    target: s(out.target, 'workspace'),
    riskScore: Number(out.risk_score ?? 0),
    passed: out.passed !== false,
    at: now(),
    vulnerabilities: vulns.map((v, i) => ({
      id: s(v.id ?? v.vuln_id, 'v-' + i),
      severity: s(v.severity ?? v.level, 'LOW').toUpperCase(),
      title: s(v.title ?? v.description ?? v.name, ''),
      target: s(v.target ?? v.component, ''),
    })),
  };
};

/** The verb result's output, wherever the platform put it. */
const outputOf = (r: Record<string, unknown> | null): Record<string, unknown> | null => {
  if (!r) return null;
  const results = (r.results ?? r) as Record<string, unknown>;
  return (results.output ?? results.plan ?? results) as Record<string, unknown>;
};

export interface SecurityStoreState {
  scan: Scan | null;
  scans: Scan[];
  busy: boolean;
  lastError: string | null;
  lastAction: string | null;
  runScan: (target: string) => Promise<void>;
  runVerb: (verb: string, parameters: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
}

export const securityStore = createStore<SecurityStoreState>((set, get) => ({
  scan: hasPhiadk ? null : SAMPLE,
  scans: hasPhiadk ? [] : [SAMPLE],
  busy: false,
  lastError: null,
  lastAction: null,
  runScan: async (target) => {
    set({ busy: true, lastError: null });
    if (!hasPhiadk) {
      const scan = { ...SAMPLE, scanId: 'scan_local' + Date.now().toString(36), target, at: now() };
      set({ busy: false, scan, scans: [scan, ...get().scans].slice(0, 20), lastAction: 'Sample scan of ' + target });
      return;
    }
    const out = outputOf(await executeVerb('phisec', 'scan_vulnerability', { target }));
    if (!out) { set({ busy: false, lastError: lastRefusal?.message ?? 'PhiSec did not answer.' }); return; }
    const scan = toScan(out);
    set({ busy: false, scan, scans: [scan, ...get().scans].slice(0, 20), lastAction: `Scanned ${scan.target} — risk ${scan.riskScore}` });
  },
  runVerb: async (verb, parameters) => {
    set({ busy: true, lastError: null });
    if (!hasPhiadk) { set({ busy: false, lastAction: `Sample mode — ${verb} not sent.` }); return null; }
    const out = outputOf(await executeVerb('phisec', verb, parameters));
    set({ busy: false, lastError: out ? null : lastRefusal?.message ?? 'PhiSec did not answer.', lastAction: out ? `Ran ${verb}.` : null });
    return out;
  },
}));
