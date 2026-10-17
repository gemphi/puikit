import React from 'react';
import { Card, CardHeader, CardBody, Stack, Title, Text, Tag, Button, Icon } from '@pui/components';
import { AgentMetric } from '../../types/agents';
import { Bot, Clock, Cpu } from 'lucide-react';

interface AgentCardProps {
  agent: AgentMetric;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRunVerb?: (agentId: string, verb: string) => void;
}

/** One Phient agent: what it does, and (live) the verbs it answers to. */
export const AgentCard: React.FC<AgentCardProps> = ({ agent, isSelected, onSelect, onRunVerb }) => {
  const verbs = agent.verbs ?? [];
  return (
    <Card variant="default" selected={isSelected} hoverable onClick={() => onSelect(agent.id)}>
      <CardHeader action={agent.layer ? <Tag minimal round size="sm">{agent.layer}</Tag> : undefined}>
        <Stack direction="row" align="center" gap={2}>
          <Icon icon={Bot} size="sm" />
          <Stack direction="column" gap={0}>
            <Title level={4} size="sm">{agent.name}</Title>
            <Text size="xs" variant="muted">{agent.tag}{agent.version ? ` · v${agent.version}` : ''}</Text>
          </Stack>
        </Stack>
      </CardHeader>
      <CardBody>
        <Stack direction="column" gap={3}>
          <Text size="sm" variant="muted">{agent.description}</Text>
          {verbs.length > 0 ? (
            <Stack direction="row" gap={1} wrap>
              {verbs.slice(0, isSelected ? verbs.length : 4).map((v) => (
                <Button key={v} size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onRunVerb?.(agent.id, v); }}>
                  <Text size="xs" mono>{v}</Text>
                </Button>
              ))}
              {!isSelected && verbs.length > 4 && <Text size="xs" variant="muted">+{verbs.length - 4} more</Text>}
            </Stack>
          ) : agent.measured !== false && (
            <Stack direction="row" gap={3} align="center">
              <Stack direction="row" align="center" gap={1}><Icon icon={Clock} size="xs" /><Text size="xs" variant="muted">{agent.latencyMs} ms</Text></Stack>
              <Stack direction="row" align="center" gap={1}><Icon icon={Cpu} size="xs" /><Text size="xs" variant="muted">{agent.memoryMb} MB</Text></Stack>
              <Text size="xs" variant="muted">sample</Text>
            </Stack>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
