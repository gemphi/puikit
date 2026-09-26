'use client';

import React from 'react';
import { Card, Callout, Tag, Stack, Grid, Title, Text } from '@pui/components';
import { PageShell } from '../layouts/PageShell';
import { Database, Activity, Cpu, Layers } from 'lucide-react';

export const EcosystemPage: React.FC = () => {
  return (
    <PageShell
      title="GemPhi Ecosystem & Topos Architecture"
      description="How Phient UI seamlessly connects with Phient, Phiano, and the PhiADK agent mesh."
      badge={<Tag intent="success" round>Axiomatic Topos</Tag>}
    >
      <Callout intent="primary" title="Unified Subsystem Integration">
        PUI provides the visual and interaction layer for all GemPhi AI agents, continuous phase manifolds, and ontology schemas.
      </Callout>

      <Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap={4}>
        <Card>
          <Cpu size={20} style={{ color: 'var(--phi-color-primary)', marginBottom: '8px' }} />
          <Title level={5}>PhiADK Agent Mesh</Title>
          <Text size="sm" intent="secondary">
            phiadk.agents.phigen, phirag, and phibus emit telemetry streams rendered directly in PUI dashboards.
          </Text>
        </Card>

        <Card>
          <Activity size={20} style={{ color: 'var(--phi-color-success)', marginBottom: '8px' }} />
          <Title level={5}>Phiano Phase Manifold</Title>
          <Text size="sm" intent="secondary">
            Continuous phase representations, Kuramoto coupling, and 16-layer memory octave continuum visualizers.
          </Text>
        </Card>

        <Card>
          <Database size={20} style={{ color: 'var(--phi-color-warning)', marginBottom: '8px' }} />
          <Title level={5}>Axiomatic Ontologies</Title>
          <Text size="sm" intent="secondary">
            Topos schemas: GeoProperty, MediaProperty, CipherProperty, and ActionTypeMetadata.
          </Text>
        </Card>
      </Grid>
    </PageShell>
  );
};
