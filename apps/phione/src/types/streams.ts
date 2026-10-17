/** Bus topics the samples use; live topics come from the Phient bus and can be any string. */
export type StreamTaxonomy =
  | 'AGENT_STATUS'
  | 'ONTOLOGY_MUTATION'
  | 'TRANSACTION_COMMITTED'
  | 'AUDIT_EVENT'
  | 'TELEMETRY_PULSE'
  | (string & {});

export interface StreamPacket {
  id: string;
  sequence: number;
  timestamp: string;
  taxonomy: StreamTaxonomy;
  source: string;
  payload: Record<string, any>;
  merkleSignature: string;
}

/** A PBusEvent from GET /v2/bus/events (phiadk.agents.phibus.models). */
export interface RawBusEvent { event_id: string; topic: string; payload: Record<string, any>; timestamp: string | number; source_agent: string; commit_sha1?: string | null }

/** A LogRecord from GET /v2/telemetry/tail (phiadk.agents.philog.models). */
export interface LogRow { id: string; level: string; message: string; agent_id?: string | null; trace_id?: string | null; details?: Record<string, any>; timestamp: string }
