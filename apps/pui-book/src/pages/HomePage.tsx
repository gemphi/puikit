'use client';

import React from 'react';
import { Button, Card, Callout, Tag, Stack, Grid, Title, Text } from '@pui/components';
import { PageShell } from '../layouts/PageShell';
import { ArrowRight, Layers, Shield, Zap, Code2 } from 'lucide-react';

export const HomePage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  return (
    <PageShell
      title="Phient UI"
      description="Enterprise React design system engineered for dense interfaces, knowledge graphs, and AI agent swarms."
      badge={<Tag intent="primary" round>puijs.com</Tag>}
    >
      <Callout intent="primary" title="Zero Business Coupling Standard">
        PUI primitives contain zero business logic or domain shopping carts. Props flow down, callbacks flow up.
      </Callout>

      <Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap={4}>
        <Card>
          <Layers size={20} style={{ color: 'var(--phi-color-primary)', marginBottom: '8px' }} />
          <Title level={5}>Core Primitives</Title>
          <Text size="sm" intent="secondary" style={{ marginBottom: '16px' }}>
            Tree, Table, Card, Dialog, Drawer, Tag, Callout, Switch, and Slider designed for dense applications.
          </Text>
          <Button variant="outline" size="sm" onClick={() => onNavigate('/components/primitives')}>
            View Catalog
          </Button>
        </Card>

        <Card>
          <Shield size={20} style={{ color: 'var(--phi-color-success)', marginBottom: '8px' }} />
          <Title level={5}>Strict Design Tokens</Title>
          <Text size="sm" intent="secondary" style={{ marginBottom: '16px' }}>
            Centralized --phi-* design tokens with Palantir Foundry, Blueprint, and Emerald theme palettes.
          </Text>
          <Button variant="outline" size="sm" onClick={() => onNavigate('/tokens')}>
            Inspect Tokens
          </Button>
        </Card>

        <Card>
          <Zap size={20} style={{ color: 'var(--phi-color-warning)', marginBottom: '8px' }} />
          <Title level={5}>Interactive Playground</Title>
          <Text size="sm" intent="secondary" style={{ marginBottom: '16px' }}>
            Live component testing sandbox with real-time prop mutation and accessibility verification.
          </Text>
          <Button variant="primary" size="sm" onClick={() => onNavigate('/playground')}>
            Open Playground
          </Button>
        </Card>
      </Grid>
    </PageShell>
  );
};