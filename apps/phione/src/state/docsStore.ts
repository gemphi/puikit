import { createStore } from '@pui/store';
import { NamespaceDef } from '../types/docs';
import { hasPhiadk, phiGet, phiPost } from './phiadkClient';

const BASE = 'http://localhost:8000';

/** The real Phient platform endpoints (gemphi/phient → phiadk.phiapi). "Run" calls them when VITE_PHIADK_API is set. */
const PHIENT_NAMESPACES: NamespaceDef[] = [
  {
    name: 'Ontologies', title: 'Ontologies', description: 'Object, link and action types of the Phient core ontology.',
    endpoints: [
      {
        id: 'get-ontology', namespace: 'Ontologies', method: 'GET', path: '/v2/ontologies',
        summary: 'Get the ontology', description: 'Every object type, link type and action type.',
        parameters: [],
        sampleResponse: { api_name: 'phient_core_ontology', object_types: { Employee: { primary_key: 'id' } } },
        pythonSnippet: 'import httpx\n\nonto = httpx.get("' + BASE + '/v2/ontologies").json()\nprint(list(onto["object_types"]))',
        tsSnippet: 'const onto = await fetch("' + BASE + '/v2/ontologies").then((r) => r.json());\nconsole.log(Object.keys(onto.object_types));',
        curlSnippet: 'curl "' + BASE + '/v2/ontologies"',
      },
      {
        id: 'get-object-type', namespace: 'Ontologies', method: 'GET', path: '/v2/ontologies/objects/Employee',
        summary: 'Get one object type', description: 'Properties, primary key and description of a type.',
        parameters: [{ name: 'object_type', type: 'string', required: true, description: 'Type api name (path)' }],
        sampleResponse: { api_name: 'Employee', primary_key: 'id', properties: { email: { data_type: 'string' } } },
        pythonSnippet: 'import httpx\n\nt = httpx.get("' + BASE + '/v2/ontologies/objects/Employee").json()\nprint(t["properties"].keys())',
        tsSnippet: 'const t = await fetch("' + BASE + '/v2/ontologies/objects/Employee").then((r) => r.json());',
        curlSnippet: 'curl "' + BASE + '/v2/ontologies/objects/Employee"',
      },
    ],
  },
  {
    name: 'Agents', title: 'Agents', description: 'List the platform agents and run their verbs.',
    endpoints: [
      {
        id: 'list-agents', namespace: 'Agents', method: 'GET', path: '/v2/agents',
        summary: 'List agents', description: 'Every agent with its layer, specs, tasks and verbs.',
        parameters: [],
        sampleResponse: { agents: [{ agent_id: 'phione', agent_name: 'PhiOne', verbs: ['lookup_employee'] }] },
        pythonSnippet: 'import httpx\n\nfor a in httpx.get("' + BASE + '/v2/agents").json()["agents"]:\n    print(a["agent_id"], a["verbs"])',
        tsSnippet: 'const { agents } = await fetch("' + BASE + '/v2/agents").then((r) => r.json());',
        curlSnippet: 'curl "' + BASE + '/v2/agents"',
      },
      {
        id: 'execute-verb', namespace: 'Agents', method: 'POST', path: '/v2/agents/phione/execute',
        summary: 'Run a verb', description: 'Plans, runs and evaluates one verb on an agent.',
        parameters: [{ name: 'verb', type: 'string', required: true, description: 'One of the agent\'s verbs' }, { name: 'parameters', type: 'object', required: false, description: 'Verb arguments' }],
        samplePayload: { verb: 'headcount_report', parameters: { group_by: 'country' } },
        sampleResponse: { agent_id: 'phione', verb: 'headcount_report', confidence: 0.95, results: { eval: { status: 'valid' } } },
        pythonSnippet: 'import httpx\n\nr = httpx.post("' + BASE + '/v2/agents/phione/execute", json={"verb": "headcount_report", "parameters": {"group_by": "country"}})\nprint(r.json()["results"]["eval"])',
        tsSnippet: 'const r = await fetch("' + BASE + '/v2/agents/phione/execute", {\n  method: "POST", headers: { "content-type": "application/json" },\n  body: JSON.stringify({ verb: "headcount_report", parameters: { group_by: "country" } }),\n}).then((x) => x.json());',
        curlSnippet: 'curl -X POST "' + BASE + '/v2/agents/phione/execute" \\\n  -H "content-type: application/json" \\\n  -d \'{"verb":"headcount_report","parameters":{"group_by":"country"}}\'',
      },
    ],
  },
  {
    name: 'Workforce', title: 'Workforce', description: 'Employee lookup and org structure (PhiOne).',
    endpoints: [
      {
        id: 'workforce-org', namespace: 'Workforce', method: 'GET', path: '/v2/workforce/org',
        summary: 'Org unit', description: 'Manager and direct reports, optionally for one department.',
        parameters: [{ name: 'department', type: 'string', required: false, description: 'Department name (query)' }],
        sampleResponse: { manager_name: 'Tomas Andersen (Engineering Manager)', direct_reports: [{ name: 'Riya Sharma' }] },
        pythonSnippet: 'import httpx\n\norg = httpx.get("' + BASE + '/v2/workforce/org").json()\nprint(org["manager_name"])',
        tsSnippet: 'const org = await fetch("' + BASE + '/v2/workforce/org").then((r) => r.json());',
        curlSnippet: 'curl "' + BASE + '/v2/workforce/org"',
      },
    ],
  },
  {
    name: 'Streams', title: 'PhiBus', description: 'Publish to and read the platform event bus.',
    endpoints: [
      {
        id: 'bus-events', namespace: 'Streams', method: 'GET', path: '/v2/bus/events',
        summary: 'Recent events', description: 'Events published on the PhiBus.',
        parameters: [],
        sampleResponse: { events: [] },
        pythonSnippet: 'import httpx\n\nprint(httpx.get("' + BASE + '/v2/bus/events").json())',
        tsSnippet: 'const ev = await fetch("' + BASE + '/v2/bus/events").then((r) => r.json());',
        curlSnippet: 'curl "' + BASE + '/v2/bus/events"',
      },
    ],
  },
];

export interface DocsStoreState {
  namespaces: NamespaceDef[];
  selectedNamespaceName: string;
  selectedEndpointId: string;
  activeLanguage: 'python' | 'ts' | 'curl';
  liveResponse: Record<string, any> | null;
  isRunning: boolean;
  selectEndpoint: (ns: string, id: string) => void;
  setLanguage: (lang: 'python' | 'ts' | 'curl') => void;
  runEndpoint: () => void;
}

export const docsStore = createStore<DocsStoreState>((set, get) => ({
  namespaces: PHIENT_NAMESPACES,
  selectedNamespaceName: 'Ontologies',
  selectedEndpointId: 'get-ontology',
  activeLanguage: 'python',
  liveResponse: null,
  isRunning: false,
  selectEndpoint: (selectedNamespaceName: string, selectedEndpointId: string) => set({ selectedNamespaceName, selectedEndpointId, liveResponse: null }),
  setLanguage: (activeLanguage: 'python' | 'ts' | 'curl') => set({ activeLanguage }),
  runEndpoint: () => {
    const ns = get().namespaces.find((n) => n.name === get().selectedNamespaceName);
    const ep = ns?.endpoints.find((e) => e.id === get().selectedEndpointId);
    if (!ep) return;
    set({ isRunning: true });
    if (!hasPhiadk) { setTimeout(() => set({ liveResponse: { sample: true, ...ep.sampleResponse }, isRunning: false }), 300); return; }
    const call = ep.method === 'GET' ? phiGet<Record<string, any>>(ep.path) : phiPost<Record<string, any>>(ep.path, ep.samplePayload ?? {});
    void call.then((r) => set({ liveResponse: r ?? { error: 'The Phient API did not answer.' }, isRunning: false }));
  },
}));
