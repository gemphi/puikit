/**
 * Ready-made runs for each Phient platform agent: a verb, a plain label and parameters checked against the real
 * platform. The `agent` block uses them when the app's data gives none, and Phione's Agents page uses them for every
 * agent, so a verb can be tried without writing JSON first.
 */
export type Preset = { verb: string; label?: string; params?: Record<string, unknown>; note?: string };

const NOOR = 'noor.hale@phiace.dev';

export const PRESETS: Record<string, Preset[]> = {
  phione: [
    { verb: 'headcount_report', label: 'Headcount', params: { group_by: 'country' } },
    { verb: 'org_structure', label: 'Org chart', params: {} },
    { verb: 'traverse_team', label: 'Team', params: { department: 'Engineering' } },
    { verb: 'lookup_identity', label: 'Find identity', params: { email: NOOR } },
    { verb: 'provision_identity', label: 'Provision', params: { user_data: { name: 'Noor Hale', email: NOOR, department: 'Creators' } }, note: 'Creates an identity: needs a signed-in Phiora account.' },
  ],
  phiora: [
    { verb: 'get_record', label: 'Read a record', params: { collection: 'worlds', key: 'w_loraland' } },
    { verb: 'list_keys', label: 'Keys', params: { collection: 'worlds' } },
    { verb: 'put_record', label: 'Write a record', params: { collection: 'worlds', key: 'w_loraland', value: { name: 'Lora Land', owner: 'loraland' } } },
    { verb: 'snapshot_collection', label: 'Snapshot', params: { collection: 'worlds' } },
  ],
  phigit: [
    { verb: 'log', label: 'Log', params: { ref: 'refs/heads/main', max_count: 20 } },
    { verb: 'list_refs', label: 'Refs', params: {} },
    { verb: 'store_blob', label: 'Store a blob', params: { content: 'hello phiace' } },
    { verb: 'commit', label: 'Commit', params: { message: 'Phihub: first commit', ref: 'refs/heads/main' } },
  ],
  philog: [
    { verb: 'tail', label: 'Latest', params: { n: 20 } },
    { verb: 'count', label: 'Count', params: {} },
    { verb: 'query', label: 'By agent', params: { agent_id: 'phigit' } },
    { verb: 'log', label: 'Write a line', params: { level: 'INFO', message: 'Hello from Phione', agent_id: 'phione' } },
  ],
  phillm: [
    { verb: 'ping', label: 'Ping', params: {} },
    { verb: 'get_config', label: 'Settings', params: {} },
    { verb: 'count_tokens', label: 'Count tokens', params: { text: 'A word has no position, only its relations.' } },
    { verb: 'complete', label: 'Complete', params: { prompt: 'Write one line about a forest of words.', max_tokens: 80 } },
  ],
  phical: [
    { verb: 'list_circuits', label: 'Circuits', params: {} },
    { verb: 'query', label: 'Search', params: { text: 'flying cars over Wondrous', top_k: 3 } },
    { verb: 'create_circuit', label: 'New circuit', params: { name: 'bell', num_qubits: 2 } },
    { verb: 'train_model', label: 'Train', params: { model_name: 'phinet_small', epochs: 3 } },
  ],
  phirag: [
    { verb: 'search', label: 'Search', params: { query: 'Who runs Lora Land?', top_k: 3 } },
    { verb: 'answer_query', label: 'Answer', params: { query: 'Who runs Lora Land?' } },
  ],
  phidoc: [
    { verb: 'search_docs', label: 'Search docs', params: { query: 'onboarding' } },
    { verb: 'create_page', label: 'New page', params: { title: 'Skim Cup notes', content: 'Schedule and hosts.' } },
  ],
  phimen: [
    { verb: 'assess_objective', label: 'Assess', params: { objective: 'Launch Skim City with the Skim Cup' } },
    { verb: 'delegate_task', label: 'Delegate', params: { task: 'Draft the Skim Cup schedule' } },
  ],
  phibot: [
    { verb: 'list_playbooks', label: 'Playbooks', params: {} },
    { verb: 'execute_playbook', label: 'Run weekly report', params: { playbook_id: 'weekly_report' } },
  ],
  phibrd: [
    { verb: 'get_checklist', label: 'Checklist', params: {} },
    { verb: 'onboard_employee', label: 'Onboard', params: { employee_data: { name: 'Noor Hale', email: NOOR, role: 'Creator' } } },
  ],
};

export const presetsFor = (agent: string): Preset[] => PRESETS[agent] ?? [];
