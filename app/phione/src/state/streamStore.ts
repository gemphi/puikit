// PhiBus streams. With VITE_PHIADK_API set, packets come from the Phient bus (GET /v2/bus/events, polled while the
// stream runs) and publishing posts to /v2/bus/pub; without it the page keeps its sample packets.
import { createStore } from '@pui/store';
import type { RawBusEvent, StreamPacket } from '../types/streams';
import { hasPhiadk, phiGet, phiPost } from './phiadkClient';

const SAMPLE: StreamPacket[] = [
  { id: 'pkt-1', sequence: 49201, timestamp: '14:21:01', taxonomy: 'AGENT_STATUS', source: 'PhiBot', payload: { state: 'RUNNING', playbook: 'SyncGlobalFleet' }, merkleSignature: '0x7f4a...88c2' },
  { id: 'pkt-2', sequence: 49202, timestamp: '14:21:03', taxonomy: 'ONTOLOGY_MUTATION', source: 'POntologyEngine', payload: { objectType: 'Flight', primaryKey: 'FL-101', status: 'EN_ROUTE' }, merkleSignature: '0x3e1b...99a1' },
  { id: 'pkt-3', sequence: 49203, timestamp: '14:21:05', taxonomy: 'TRANSACTION_COMMITTED', source: 'PhiSec', payload: { txId: 'tx_88192', changes: 4, verified: true }, merkleSignature: '0x99dd...120f' },
  { id: 'pkt-4', sequence: 49204, timestamp: '14:21:08', taxonomy: 'TELEMETRY_PULSE', source: 'PhiBus', payload: { channel: 'CORE_STREAM', ratePerSec: 14820, latencyMs: 2.1 }, merkleSignature: '0x12bb...884a' },
  { id: 'pkt-5', sequence: 49205, timestamp: '14:21:10', taxonomy: 'AUDIT_EVENT', source: 'PhiGov', payload: { ruleId: 'PII_REDACTED', entity: 'User#904', clearance: 'LEVEL_4' }, merkleSignature: '0x44fa...77b1' },
];

const time = (t: string | number) => { const d = typeof t === 'number' ? new Date(t > 1e12 ? t : t * 1000) : new Date(t); return isNaN(+d) ? String(t) : d.toISOString().slice(11, 19); };
const short = (sha?: string | null) => (sha ? sha.slice(0, 6) + '...' + sha.slice(-4) : '·');
export const toPacket = (e: RawBusEvent, i: number, n: number): StreamPacket => ({
  id: e.event_id, sequence: n - i, timestamp: time(e.timestamp), taxonomy: e.topic, source: e.source_agent, payload: e.payload ?? {}, merkleSignature: short(e.commit_sha1),
});

export interface StreamStoreState {
  packets: StreamPacket[];
  live: boolean;
  isPaused: boolean;
  selectedTaxonomy: string;
  searchQuery: string;
  lastError: string | null;
  addPacket: (p: StreamPacket) => void;
  togglePause: () => void;
  setTaxonomy: (t: string) => void;
  setSearch: (q: string) => void;
  clearPackets: () => void;
  refresh: () => Promise<void>;
  publish: (topic: string, payload: Record<string, unknown>) => Promise<boolean>;
}

export const streamStore = createStore<StreamStoreState>((set, get) => ({
  packets: hasPhiadk ? [] : SAMPLE,
  live: false,
  isPaused: false,
  selectedTaxonomy: 'ALL',
  searchQuery: '',
  lastError: null,
  addPacket: (p) => { if (get().isPaused) return; set({ packets: [p, ...get().packets].slice(0, 200) }); },
  togglePause: () => set({ isPaused: !get().isPaused }),
  setTaxonomy: (selectedTaxonomy) => set({ selectedTaxonomy }),
  setSearch: (searchQuery) => set({ searchQuery }),
  clearPackets: () => set({ packets: [] }),
  refresh: async () => {
    if (!hasPhiadk || get().isPaused) return;
    const r = await phiGet<{ events: RawBusEvent[]; count: number }>('/v2/bus/events?limit=200');
    if (!r) { set({ live: false, lastError: 'The Phient bus did not answer.' }); return; }
    const ev = [...r.events].reverse();
    set({ live: true, lastError: null, packets: ev.map((e, i) => toPacket(e, i, ev.length)) });
  },
  publish: async (topic, payload) => {
    if (!hasPhiadk) {
      const n = (get().packets[0]?.sequence ?? 0) + 1;
      set({ packets: [{ id: 'local-' + n, sequence: n, timestamp: new Date().toISOString().slice(11, 19), taxonomy: topic, source: 'phione', payload: payload as Record<string, any>, merkleSignature: '·' }, ...get().packets] });
      return true;
    }
    const r = await phiPost<{ status: string }>('/v2/bus/pub', { topic, payload, source_agent: 'phione' });
    await get().refresh();
    return !!r;
  },
}));
