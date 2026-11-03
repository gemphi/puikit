export type AgentStatus = 'HEALTHY' | 'RUNNING' | 'DEGRADED' | 'IDLE';

export interface ToolReceipt {
  step: number;
  toolName: string;
  input: Record<string, any>;
  output: Record<string, any>;
  durationMs: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  agentId?: string;
  content: string;
  timestamp: string;
  tokens?: number;
  traces?: ToolReceipt[];
}

export interface AgentMetric {
  id: string;
  name: string;
  tag: string;
  category: 'Foundation' | 'Intelligence' | 'Operations' | 'Governance';
  description: string;
  status: AgentStatus;
  latencyMs: number;
  orderParam: number; // Kuramoto r: 0.0 - 1.0
  phaseAngle: number; // Phase psi: -PI to +PI
  memoryMb: number;
  invocations: number;
  uptime: string;
  /** From GET /v2/agents (live only). */
  layer?: string;
  version?: string;
  verbs?: string[];
  specs?: string[];
  /** False when the numbers above are samples, not measurements. */
  measured?: boolean;
}
