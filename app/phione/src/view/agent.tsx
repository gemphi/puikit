import { useState } from 'react';
import { useStore } from '@pui/store';
import type { GridItem } from '@phi-kit/blocks';
import { agentStore } from '../state/agentStore';
import { phiadkStore } from '../state/phiadk';
import type { AgentMetric } from '../types/agents';
import type { ConsoleView } from './part';

const API_STATE = { live: 'Live', off: 'Not set', loading: 'Connecting', offline: 'Offline' };
/** Verbs a card shows before it is the one picked. */
const VERB_SHOWN = 4;

/** One Phient agent as a card of the shared grid: what it does, and (live) the verbs it answers to. */
const agentItem = (a: AgentMetric, selected: boolean): GridItem => {
  const verbs = a.verbs ?? [];
  const more = selected ? 0 : Math.max(0, verbs.length - VERB_SHOWN);
  return {
    id: a.id, title: a.name, sub: a.tag + (a.version ? ` · v${a.version}` : ''), tag: a.layer, body: a.description, selected,
    chipList: selected ? verbs : verbs.slice(0, VERB_SHOWN),
    note: more ? `+${more} more` : undefined,
    meta: !verbs.length && a.measured !== false ? `${a.latencyMs} ms · ${a.memoryMb} MB · sample` : undefined,
  };
};

/**
 * Agents: the Phient platform agents as cards, and the shared agent block as the console. Picking a card opens the
 * console on the agent's first ready-made run; a verb on a card opens it on that verb and runs it.
 */
export const useAgentView = (): ConsoleView => {
  const { agents, selectedAgentId, selectAgent } = useStore(agentStore);
  const { status } = useStore(phiadkStore);
  const [pick, setPick] = useState<{ n: number; verb?: string }>({ n: 0 });
  const choose = (id: string) => { if (id === selectedAgentId) return; selectAgent(id); setPick((p) => ({ n: p.n + 1 })); };
  const runVerb = (id: string, verb: string) => { selectAgent(id); setPick((p) => ({ n: p.n + 1, verb })); };
  const layers = new Set(agents.map((a) => a.layer).filter(Boolean));
  const verbs = agents.reduce((n, a) => n + (a.verbs?.length ?? 0), 0);

  return {
    title: 'Agents',
    sub: 'The Phient platform agents. Pick one and run a verb: ready-made parameters, the output, who ran it and every run so far.',
    onOpen: (it) => { if (it.id) choose(it.id); },
    blocks: [
      { kind: 'stats', items: [{ label: 'Agents', value: agents.length }, { label: 'Verbs', value: verbs || '·' }, { label: 'Layers', value: layers.size || '·' }, { label: 'Phient API', value: API_STATE[status] }] },
      { kind: 'grid', layout: 'tile', items: agents.map((a) => agentItem(a, a.id === selectedAgentId)), onChip: (it: GridItem, verb: string) => { if (it.id) runVerb(it.id, verb); } },
      { kind: 'agent', key: selectedAgentId + ':' + pick.n, agent: selectedAgentId, verb: pick.verb, autorun: !!pick.verb },
    ],
  };
};
