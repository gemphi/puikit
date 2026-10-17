'use client';

import React from 'react';
import { Card, Grid, Title, Text, Tag } from '@pui/components';

export const MetricsGrid: React.FC = () => {
  return (
    <Grid columns="repeat(auto-fit, minmax(220px, 1fr))" gap={3}>
      <Card>
        <Text size="xs" color="secondary" weight="semibold">TOTAL ACTIVE AGENTS</Text>
        <Title level={3} style={{ margin: '8px 0 4px 0' }}>15 Swarms</Title>
        <Tag intent="success" minimal>+3 Synchronized</Tag>
      </Card>
      <Card>
        <Text size="xs" color="secondary" weight="semibold">PHASE MANIFOLD RESONANCE</Text>
        <Title level={3} style={{ margin: '8px 0 4px 0' }}>r = 0.984</Title>
        <Tag intent="primary" minimal>Harmonic Lock</Tag>
      </Card>
      <Card>
        <Text size="xs" color="secondary" weight="semibold">AXIOMATIC MORPHISMS</Text>
        <Title level={3} style={{ margin: '8px 0 4px 0' }}>14 Modules</Title>
        <Tag intent="info" minimal>100% Type-Safe</Tag>
      </Card>
      <Card>
        <Text size="xs" color="secondary" weight="semibold">MEMORY OCTAVE CONTINUUM</Text>
        <Title level={3} style={{ margin: '8px 0 4px 0' }}>16 Layers</Title>
        <Tag intent="warning" minimal>Surface to Deep</Tag>
      </Card>
    </Grid>
  );
};
