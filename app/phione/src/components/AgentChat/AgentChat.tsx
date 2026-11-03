import React from 'react';
import { Card, CardHeader, CardBody, CardFooter, Stack, Title, Text, Button, Input, Tag, Badge, Icon, Callout, Spinner } from '@pui/components';
import { useStore } from '@pui/store';
import { agentStore } from '../../state/agentStore';
import { Send, Bot, User, CheckCircle, Terminal } from 'lucide-react';

export const AgentChat: React.FC = () => {
  const { chatMessages, selectedAgentId, isStreaming, activePrompt, setPrompt, sendMessage } = useStore(agentStore);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(activePrompt);
    }
  };

  return (
    <Card variant="default">
      <CardHeader
        action={
          <Stack direction="row" align="center" gap={2}>
            <Tag intent="primary" minimal round size="sm">{selectedAgentId}</Tag>
            {isStreaming && <Spinner size="sm" />}
          </Stack>
        }
      >
        <Stack direction="row" align="center" gap={2}>
          <Icon icon={Terminal} size="sm" />
          <Title level={3} size="sm">Console</Title>
        </Stack>
      </CardHeader>

      <CardBody>
        <Stack direction="column" gap={3} maxHeight="460px" scroll="y" paddingRight={1}>
          {chatMessages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            const isUser = msg.sender === 'user';
            return (
              <Callout
                key={msg.id}
                intent={isAgent ? 'primary' : isUser ? 'none' : 'warning'}
                title={isAgent ? (msg.agentId || 'Agent') : isUser ? 'You' : 'Phione'}
                icon={<Icon icon={isAgent ? Bot : User} size="sm" />}
              >
                <Stack direction="column" gap={2}>
                  <Text size="sm">{msg.content}</Text>
                  {msg.traces && (
                    <Stack direction="column" gap={1}>
                      <Text size="xs" weight="semibold" variant="muted">Trace</Text>
                      {msg.traces.map((trace) => (
                        <Stack key={trace.step} direction="row" align="center" gap={2}>
                          <Icon icon={CheckCircle} size="xs" />
                          <Badge variant="secondary">Step {trace.step}: {trace.toolName}</Badge>
                          <Text size="xs" variant="muted">{trace.durationMs} ms</Text>
                        </Stack>
                      ))}
                      {msg.traces.map((trace) => Object.keys(trace.output ?? {}).length > 0 && (
                        <Text key={'o' + trace.step} size="xs" mono pre variant="muted" maxHeight="180px" scroll="y">
                          {JSON.stringify(trace.output, null, 2)}
                        </Text>
                      ))}
                    </Stack>
                  )}
                  <Text size="xs" intent="muted">{msg.timestamp}</Text>
                </Stack>
              </Callout>
            );
          })}
        </Stack>
      </CardBody>

      <CardFooter>
        <Stack direction="row" gap={2} align="center" width="100%" marginTop={2}>
          <Input
            placeholder={`verb key=value — runs on ${selectedAgentId}`}
            value={activePrompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => sendMessage(activePrompt)}
            disabled={!activePrompt.trim() || isStreaming}
            icon={<Icon icon={Send} size="sm" />}
          >
            Run
          </Button>
        </Stack>
      </CardFooter>
    </Card>
  );
};
