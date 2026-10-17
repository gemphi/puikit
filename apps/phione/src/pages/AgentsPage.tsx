import React, { useState } from 'react';
import { Page, Stack, Sticky, Grid, Col, Card, CardBody, Title, Text, Icon } from '@pui/components';
import { useStore } from '@pui/store';
import { agentStore } from '../state/agentStore';
import { phiadkStore } from '../state/phiadk';
import { AgentCard } from '../components/AgentCard/AgentCard';
import { Agent } from '@phi-kit/blocks/Agent';
import { Bot, Layers, Terminal, Plug } from 'lucide-react';

const Stat: React.FC<{ icon: typeof Bot; label: string; value: string }> = ({ icon, label, value }) => (
  <Card variant="flat">
    <CardBody>
      <Stack direction="row" align="center" gap={3}>
        <Icon icon={icon} size="md" />
        <Stack direction="column" gap={0}>
          <Text size="xs" variant="muted">{label}</Text>
          <Title level={3} size="md">{value}</Title>
        </Stack>
      </Stack>
    </CardBody>
  </Card>
);

export const AgentsPage: React.FC = () => {
  const { agents, selectedAgentId, selectAgent } = useStore(agentStore);
  // The console is the phi-kit agent block (the same one the apps' Platform views use): a card's verb opens it on
  // that verb and runs it; picking a card opens it on the agent's first ready-made run.
  const [pick, setPick] = useState<{ n: number; verb?: string }>({ n: 0 });
  const choose = (id: string) => { if (id === selectedAgentId) return; selectAgent(id); setPick((p) => ({ n: p.n + 1 })); };
  const runVerb = (id: string, verb: string) => { selectAgent(id); setPick((p) => ({ n: p.n + 1, verb })); };
  const { status } = useStore(phiadkStore);
  const layers = new Set(agents.map((a) => a.layer).filter(Boolean));
  const verbs = agents.reduce((n, a) => n + (a.verbs?.length ?? 0), 0);

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Title level={2} size="xl">Agents</Title>
          <Text size="md" variant="muted">The Phient platform agents. Pick one and run a verb: ready-made parameters, the output, who ran it and every run so far.</Text>
        </Stack>

        <Grid gap={3} xs={1} sm={2} md={4} lg={4}>
          <Col span={3} xs={12} sm={6} md={3} lg={3}><Stat icon={Bot} label="Agents" value={String(agents.length)} /></Col>
          <Col span={3} xs={12} sm={6} md={3} lg={3}><Stat icon={Terminal} label="Verbs" value={verbs ? String(verbs) : '—'} /></Col>
          <Col span={3} xs={12} sm={6} md={3} lg={3}><Stat icon={Layers} label="Layers" value={layers.size ? String(layers.size) : '—'} /></Col>
          <Col span={3} xs={12} sm={6} md={3} lg={3}><Stat icon={Plug} label="Phient API" value={status === 'live' ? 'Live' : status === 'off' ? 'Not set' : status === 'loading' ? 'Connecting' : 'Offline'} /></Col>
        </Grid>

        <Grid gap={4} xs={1} sm={1} md={1} lg={12}>
          <Col span={7} xs={12} sm={12} md={12} lg={7}>
            <Grid gap={3} xs={1} sm={1} md={2} lg={2}>
              {agents.map((agent) => (
                <Col span={6} xs={12} sm={12} md={6} lg={6} key={agent.id}>
                  <AgentCard agent={agent} isSelected={agent.id === selectedAgentId} onSelect={choose} onRunVerb={runVerb} />
                </Col>
              ))}
            </Grid>
          </Col>
          <Col span={5} xs={12} sm={12} md={12} lg={5}>
            <Sticky top={0}>
              <Agent key={selectedAgentId + ':' + pick.n} b={{ kind: 'agent', agent: selectedAgentId, verb: pick.verb, autorun: !!pick.verb }} />
            </Sticky>
          </Col>
        </Grid>
      </Stack>
    </Page>
  );
};
