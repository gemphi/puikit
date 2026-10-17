// Live data from the Phient platform API (gemphi/phient → phiadk.phiapi, FastAPI).
//   VITE_PHIADK_API=http://localhost:8000 npm run dev
// Without it the console keeps its built-in sample ontology and agents.
import { createStore } from '@pui/store';
import { ontologyStore } from './ontologyStore';
import { agentStore, agentVerbs } from './agentStore';
import { hasPhiadk, phiGet, type RawAgent } from './phiadkClient';
import type { ActionDef, LinkTypeDef, ObjectTypeDef, PropertyDef } from '../types/ontology';
import type { AgentMetric } from '../types/agents';

export { PHIADK, hasPhiadk } from './phiadkClient';

/** Connection state + the live agent catalogue (verbs per agent). */
export const phiadkStore = createStore<{ status: 'off' | 'loading' | 'live' | 'offline'; agents: RawAgent[] }>(() => ({
  status: hasPhiadk ? 'loading' : 'off', agents: [],
}));

type RawProp = { api_name: string; data_type?: string; is_primary_key?: boolean; is_indexed?: boolean; required?: boolean };
type RawType = { api_name: string; display_name?: string; description?: string; primary_key?: string; icon?: string; properties?: Record<string, RawProp> };
type RawLink = { api_name: string; display_name?: string; source_object_type: string; target_object_type: string; cardinality?: string };
type RawAction = { api_name: string; display_name?: string; target_object_type: string; operation?: string; parameters?: Record<string, { api_name: string; data_type?: string; required?: boolean }> };
type RawOntology = { object_types?: Record<string, RawType>; link_types?: Record<string, RawLink>; action_types?: Record<string, RawAction> };

const TYPES: PropertyDef['type'][] = ['string', 'integer', 'double', 'boolean', 'timestamp', 'attachment', 'timeseries', 'ciphertext'];
const propType = (t = 'string'): PropertyDef['type'] => {
  const x = t.toLowerCase();
  if (TYPES.includes(x as PropertyDef['type'])) return x as PropertyDef['type'];
  if (/int|long|short/.test(x)) return 'integer';
  if (/float|double|decimal|number/.test(x)) return 'double';
  if (/bool/.test(x)) return 'boolean';
  if (/date|time/.test(x)) return 'timestamp';
  return 'string';
};
const CARD = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'] as const;
const morph = (op = ''): ActionDef['morphismType'] => (/create|add|provision|onboard/i.test(op) ? 'CREATE' : /delete|remove/i.test(op) ? 'DELETE' : /mutat|modif|update/i.test(op) ? 'MODIFY' : 'DISPATCH');

export function mapOntology(raw: RawOntology): { objectTypes: ObjectTypeDef[]; linkTypes: LinkTypeDef[]; actions: ActionDef[] } {
  const objectTypes = Object.values(raw.object_types ?? {}).map((t) => ({
    id: t.api_name.toLowerCase(), apiName: t.api_name, displayName: t.display_name ?? t.api_name, description: t.description ?? '',
    primaryKey: t.primary_key ?? Object.values(t.properties ?? {}).find((p) => p.is_primary_key)?.api_name ?? 'id', icon: 'Box', count: 0,
    properties: Object.values(t.properties ?? {}).map((p) => ({ name: p.api_name, type: propType(p.data_type), required: !!(p.required ?? p.is_primary_key), indexed: !!p.is_indexed })),
  }));
  const linkTypes = Object.values(raw.link_types ?? {}).map((l, i) => ({
    id: 'l' + i, apiName: l.api_name, displayName: l.display_name ?? l.api_name, sourceType: l.source_object_type, targetType: l.target_object_type,
    cardinality: (CARD as readonly string[]).includes(l.cardinality ?? '') ? (l.cardinality as LinkTypeDef['cardinality']) : 'MANY_TO_MANY',
  }));
  const actions = Object.values(raw.action_types ?? {}).map((a, i) => ({
    id: 'a' + i, apiName: a.api_name, displayName: a.display_name ?? a.api_name, targetObjectType: a.target_object_type, morphismType: morph(a.operation ?? a.api_name),
    parameters: Object.values(a.parameters ?? {}).map((p) => ({ name: p.api_name, type: p.data_type ?? 'string', required: !!p.required })),
  }));
  return { objectTypes, linkTypes, actions };
}

type Row = Record<string, unknown>;
/** phiapi has no generic instance list yet, so rows come from the domain endpoints that do exist. */
const INSTANCE_SOURCES: Record<string, () => Promise<Row[] | null>> = {
  Employee: async () => {
    const org = await phiGet<{ manager_name?: string; direct_reports?: { name: string; title?: string; location?: string }[] }>('/v2/workforce/org');
    if (!org) return null;
    const people = [
      ...(org.manager_name ? [{ name: org.manager_name.replace(/\s*\(.*\)$/, ''), title: /\((.*)\)/.exec(org.manager_name)?.[1] ?? '' }] : []),
      ...(org.direct_reports ?? []),
    ];
    return people.map((p) => ({ display_name: p.name, title: p.title ?? '', country: (p as { location?: string }).location ?? '', status: 'active' }));
  },
  GitCommit: async () => {
    const log = await phiGet<{ commits?: { sha1?: string; sha?: string; message?: string; author?: string }[] }>('/v2/git/log');
    return log ? (log.commits ?? []).map((c) => ({ sha1: c.sha1 ?? c.sha ?? '', message: c.message ?? '', author: c.author ?? '' })) : null;
  },
};

/** Load the rows for one object type (once). Types without a source get an empty list. */
export async function loadInstances(typeId: string): Promise<void> {
  if (!hasPhiadk) return;
  const st = ontologyStore.getState();
  const t = st.objectTypes.find((x) => x.id === typeId);
  if (!t || st.instances[typeId] !== undefined) return;
  ontologyStore.setState({ loadingType: typeId });
  const rows = (await INSTANCE_SOURCES[t.apiName]?.()) ?? [];
  const cur = ontologyStore.getState();
  ontologyStore.setState({
    instances: { ...cur.instances, [typeId]: rows },
    objectTypes: cur.objectTypes.map((x) => (x.id === typeId ? { ...x, count: rows.length } : x)),
    loadingType: cur.loadingType === typeId ? null : cur.loadingType,
  });
}

const CATEGORY: Record<string, AgentMetric['category']> = { Infrastructure: 'Foundation', Engine: 'Intelligence', Interface: 'Operations', Governance: 'Governance' };
/** Replace the sample agent list with GET /v2/agents (keeps sample metrics where ids match; the API serves no metrics). */
export async function loadAgents(): Promise<boolean> {
  const r = await phiGet<{ agents?: RawAgent[] }>('/v2/agents');
  if (!r?.agents?.length) return false;
  const prev = new Map(agentStore.getState().agents.map((a) => [a.id, { tag: a.tag }]));
  const agents: AgentMetric[] = r.agents.map((a) => ({
    latencyMs: 0, orderParam: 1, phaseAngle: 0, memoryMb: 0, invocations: 0, uptime: '—', ...prev.get(a.agent_id), measured: false,
    layer: a.layer, version: a.version, verbs: a.verbs ?? [], specs: a.specs ?? [],
    id: a.agent_id, name: a.agent_name, tag: prev.get(a.agent_id)?.tag ?? a.tasks?.[0]?.replace(/_/g, ' ') ?? a.layer ?? '',
    category: CATEGORY[a.layer ?? ''] ?? 'Operations', description: a.description ?? '', status: 'HEALTHY',
  }));
  const sel = agentStore.getState().selectedAgentId;
  agentStore.setState({ agents, selectedAgentId: agents.some((a) => a.id === sel) ? sel : agents[0].id });
  for (const a of r.agents) agentVerbs[a.agent_id] = a.verbs ?? [];
  phiadkStore.setState({ agents: r.agents });
  return true;
}

/** Boot: ontology + agents from the platform, then the first type's rows. */
export async function connectPhiadk(): Promise<void> {
  if (!hasPhiadk) return;
  const [o, a] = await Promise.all([loadOntology(), loadAgents()]);
  phiadkStore.setState({ status: o || a ? 'live' : 'offline' });
  if (o) await loadInstances(ontologyStore.getState().selectedTypeId);
}

/** Replace the sample ontology with the platform's real one (GET /v2/ontologies). Returns false when the API is off or unreachable. */
export async function loadOntology(): Promise<boolean> {
  if (!hasPhiadk) return false;
  const raw = await phiGet<RawOntology>('/v2/ontologies');
  const o = raw ? mapOntology(raw) : null;
  if (!o?.objectTypes.length) return false;
  ontologyStore.setState({ ...o, selectedTypeId: o.objectTypes[0].id, selectedInstance: null, instances: {} });
  return true;
}
