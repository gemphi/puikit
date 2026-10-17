'use client';

import React from 'react';
import { Box, Button, Card, ProgressBar, Stack, Table, Tag, Text, Title } from '@pui/components';
import { Cpu, Database, Shield, RefreshCw } from 'lucide-react';

export const SwarmTable: React.FC<{ onInspect: () => void }> = ({ onInspect }) => {
  const headers = ['Agent / Entity', 'Domain', 'Resonance (r)', 'Status', 'Actions'];
  const rows = [
    [
      <Stack direction="row" gap={2} align="center"><Cpu size={15} /><Box as="strong">PhiGen-Master</Box></Stack>,
      'Code Generation',
      <ProgressBar value={0.96} intent="success" />,
      <Tag intent="success" round>Active</Tag>,
      <Button variant="outline" size="sm" onClick={onInspect}>Inspect</Button>,
    ],
    [
      <Stack direction="row" gap={2} align="center"><Database size={15} /><Box as="strong">PhiRAG-Manifold</Box></Stack>,
      'Zero-Matrix Search',
      <ProgressBar value={0.91} intent="primary" />,
      <Tag intent="primary" round>Tuning</Tag>,
      <Button variant="outline" size="sm" onClick={onInspect}>Inspect</Button>,
    ],
    [
      <Stack direction="row" gap={2} align="center"><Shield size={15} /><Box as="strong">PhiLog-Monitor</Box></Stack>,
      'Telemetry Stream',
      <ProgressBar value={0.88} intent="info" />,
      <Tag intent="info" round>Streaming</Tag>,
      <Button variant="outline" size="sm" onClick={onInspect}>Inspect</Button>,
    ],
  ];

  return (
    <Card>
      <Stack direction="row" justify="between" align="center" style={{ marginBottom: '16px' }}>
        <Box>
          <Title level={5}>Live Agent Swarms & Ontologies</Title>
          <Text size="sm" color="secondary">Real-time status of GemPhi mesh nodes</Text>
        </Box>
        <Stack direction="row" gap={2}>
          <Button variant="outline" size="sm" icon={<RefreshCw size={13} />}>Refresh</Button>
          <Button variant="primary" size="sm">Deploy Swarm</Button>
        </Stack>
      </Stack>
      <Table headers={headers} rows={rows} />
    </Card>
  );
};
