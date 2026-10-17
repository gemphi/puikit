import { createStore } from '@pui/store';
import { AgentMetric, ChatMessage } from '../types/agents';
import { hasPhiadk, executeVerb, lastRefusal } from './phiadkClient';

/** Verbs per agent id, filled from GET /v2/agents (see phiadk.ts). */
export const agentVerbs: Record<string, string[]> = {};

const INITIAL_AGENTS: AgentMetric[] = [
  { id: 'phione', name: 'PhiOne', tag: 'Identity & HR', category: 'Foundation', description: 'User identity, employee attributes, team structures, security clearance.', status: 'HEALTHY', latencyMs: 38, orderParam: 0.988, phaseAngle: 0.12, memoryMb: 142, invocations: 12490, uptime: '99.98%' },
  { id: 'phiora', name: 'PhiOra', tag: 'Spatial & Vector', category: 'Foundation', description: 'Content-addressed Git KV store, HNSW vector search, GeoSpatial datasets.', status: 'HEALTHY', latencyMs: 19, orderParam: 0.994, phaseAngle: 0.04, memoryMb: 512, invocations: 89410, uptime: '99.99%' },
  { id: 'phigit', name: 'PhiGit', tag: 'Git Engine', category: 'Foundation', description: 'Git blobs, tree objects, commit graph, cryptographic diffs and checkpoints.', status: 'HEALTHY', latencyMs: 24, orderParam: 0.991, phaseAngle: 0.08, memoryMb: 280, invocations: 43210, uptime: '99.99%' },
  { id: 'philog', name: 'PhiLog', tag: 'Telemetry', category: 'Governance', description: 'Distributed structured telemetry, audit trails, and data health monitors.', status: 'HEALTHY', latencyMs: 14, orderParam: 0.996, phaseAngle: 0.02, memoryMb: 198, invocations: 154020, uptime: '100.0%' },
  { id: 'phical', name: 'PhiCal', tag: 'Quantum Learning', category: 'Intelligence', description: 'Semantic superposition search, quantum circuits, and state training.', status: 'HEALTHY', latencyMs: 64, orderParam: 0.978, phaseAngle: 0.22, memoryMb: 420, invocations: 8740, uptime: '99.94%' },
  { id: 'phirag', name: 'PhiRAG', tag: 'Knowledge RAG', category: 'Intelligence', description: 'Dense vector retrieval, hybrid reranking, and contextual augmentation.', status: 'HEALTHY', latencyMs: 45, orderParam: 0.985, phaseAngle: 0.14, memoryMb: 360, invocations: 31200, uptime: '99.97%' },
  { id: 'phidoc', name: 'PhiDoc', tag: 'Knowledge Base', category: 'Intelligence', description: 'Workspace documentation, Notion sync, and markdown knowledge graphs.', status: 'HEALTHY', latencyMs: 52, orderParam: 0.982, phaseAngle: 0.18, memoryMb: 210, invocations: 14900, uptime: '99.95%' },
  { id: 'phibot', name: 'PhiBot', tag: 'Workflow Engine', category: 'Operations', description: 'Playbook automation, DAG task execution, and subagent orchestration.', status: 'RUNNING', latencyMs: 82, orderParam: 0.965, phaseAngle: 0.35, memoryMb: 340, invocations: 28400, uptime: '99.92%' },
  { id: 'phibrd', name: 'PhiBrd', tag: 'Onboarding', category: 'Operations', description: 'Cross-domain lifecycle orchestration, SaaS connector sync, and data onboarding.', status: 'HEALTHY', latencyMs: 58, orderParam: 0.979, phaseAngle: 0.20, memoryMb: 230, invocations: 9820, uptime: '99.96%' },
  { id: 'phillm', name: 'PhiLLM', tag: 'Multi-LLM Router', category: 'Intelligence', description: 'OpenAI, Anthropic, Gemini multi-provider routing and token streaming.', status: 'HEALTHY', latencyMs: 110, orderParam: 0.958, phaseAngle: 0.42, memoryMb: 480, invocations: 64100, uptime: '99.91%' },
  { id: 'phisec', name: 'PhiSec', tag: 'Zero-Trust Sec', category: 'Governance', description: 'Cryptographic authorization, cipher text encryption, and policy verification.', status: 'HEALTHY', latencyMs: 18, orderParam: 0.995, phaseAngle: 0.03, memoryMb: 160, invocations: 198000, uptime: '100.0%' },
  { id: 'phigov', name: 'PhiGov', tag: 'Lineage & Policy', category: 'Governance', description: 'Data lineage DAGs, provenance verification, and regulatory compliance rules.', status: 'HEALTHY', latencyMs: 32, orderParam: 0.990, phaseAngle: 0.09, memoryMb: 210, invocations: 47200, uptime: '99.99%' },
  { id: 'phibus', name: 'PhiBus', tag: 'Event Stream', category: 'Foundation', description: 'Real-time SSE event bus, distributed streaming, and event replay.', status: 'HEALTHY', latencyMs: 6, orderParam: 0.998, phaseAngle: 0.01, memoryMb: 320, invocations: 480000, uptime: '100.0%' },
  { id: 'phimen', name: 'PhiMen', tag: 'Virtual CEO', category: 'Operations', description: 'Executive strategic orchestration, recursive evaluation, and swarm leadership.', status: 'IDLE', latencyMs: 140, orderParam: 0.950, phaseAngle: 0.48, memoryMb: 610, invocations: 4200, uptime: '99.90%' },
  { id: 'phigen', name: 'PhiGen', tag: 'Code Generator', category: 'Operations', description: 'Ontology schema compilation, TypeScript/Python SDK generators, and UI widgets.', status: 'HEALTHY', latencyMs: 74, orderParam: 0.972, phaseAngle: 0.28, memoryMb: 290, invocations: 18900, uptime: '99.94%' },
];

export interface AgentStoreState {
  agents: AgentMetric[];
  selectedAgentId: string;
  chatMessages: ChatMessage[];
  isStreaming: boolean;
  activePrompt: string;
  selectAgent: (id: string) => void;
  setPrompt: (p: string) => void;
  sendMessage: (content: string) => void;
  /** Select an agent and run one of its verbs with no parameters. */
  runVerb: (agentId: string, verb: string) => void;
}

export const agentStore = createStore<AgentStoreState>((set, get) => ({
  agents: INITIAL_AGENTS,
  selectedAgentId: 'phibot',
  isStreaming: false,
  activePrompt: '',
  chatMessages: [
    {
      id: 'msg-1',
      sender: 'system',
      content: hasPhiadk ? 'Phione connected to the Phient platform. Type a verb (e.g. headcount_report) to run it on the selected agent.' : 'Phione is showing sample agents. Set VITE_PHIADK_API to talk to the Phient platform.',
      timestamp: '14:20:00',
    },
  ],
  selectAgent: (id: string) => set({ selectedAgentId: id }),
  runVerb: (agentId: string, verb: string) => { set({ selectedAgentId: agentId }); get().sendMessage(verb); },
  setPrompt: (activePrompt: string) => set({ activePrompt }),
  sendMessage: (content: string) => {
    if (!content.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
    };
    const currentAgent = get().selectedAgentId;
    set({
      chatMessages: [...get().chatMessages, userMsg],
      activePrompt: '',
      isStreaming: true,
    });
    const reply = (msg: Omit<ChatMessage, 'id' | 'sender' | 'timestamp'>) => set({
      chatMessages: [...get().chatMessages, { id: `msg-${Date.now() + 1}`, sender: 'agent', agentId: currentAgent, timestamp: new Date().toLocaleTimeString(), ...msg }],
      isStreaming: false,
    });
    if (hasPhiadk) {
      // "verb key=value key=value" → POST /v2/agents/{id}/execute
      const [verbIn, ...rest] = content.trim().split(/\s+/);
      const verbs = agentVerbs[currentAgent] ?? [];
      const verb = verbs.includes(verbIn) ? verbIn : verbs.find((v) => content.toLowerCase().includes(v.replace(/_/g, ' '))) ;
      if (!verb) { reply({ content: verbs.length ? `I can run: ${verbs.join(', ')}. Start your message with one of them, then key=value parameters.` : 'This agent has no verbs listed by the platform.' }); return; }
      const parameters = Object.fromEntries(rest.filter((x) => x.includes('=')).map((x) => { const [k, ...v] = x.split('='); return [k, v.join('=')]; }));
      const t0 = performance.now();
      void executeVerb(currentAgent, verb, parameters).then((r) => {
        const ms = Math.round(performance.now() - t0);
        if (!r) { reply({ content: lastRefusal ? `${verb} refused: ${lastRefusal.message} (Identity issues the delegation.)` : `${verb} failed: the Phient API did not answer.` }); return; }
        reply({
          content: `${verb}: ${r.results?.eval?.status ?? 'done'}${r.confidence != null ? ` · confidence ${r.confidence}` : ''}`,
          traces: [{ step: 1, toolName: `${currentAgent}.${verb}`, input: parameters, output: (r.results?.output ?? r.results ?? {}) as Record<string, any>, durationMs: ms }],
        });
      });
      return;
    }
    setTimeout(() => reply({
      content: `Sample reply from [${currentAgent}]. Connect the Phient API (VITE_PHIADK_API) to run real verbs.`,
      tokens: 12,
    }), 400);
  },
}));
