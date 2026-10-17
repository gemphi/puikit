'use client';

import React from 'react';
import { Box, Card, Stack, Table, Tag, Text, Title } from '@pui/components';
import { PageShell } from '../layouts/PageShell';
import { CORE_TOKENS, ELEVATION_TOKENS } from '../content/tokens';

export const TokensPage: React.FC = () => {
  const headers = ['Token Name', 'CSS Custom Property', 'Default Value', 'Description'];

  const coreRows = CORE_TOKENS.map((t) => [
    <Box as="strong">{t.name}</Box>,
    <Box as="code">{t.variable}</Box>,
    <Box as="span" style={{ fontFamily: 'monospace' }}>{t.value}</Box>,
    t.description,
  ]);

  const elevationRows = ELEVATION_TOKENS.map((t) => [
    <Box as="strong">{t.name}</Box>,
    <Box as="code">{t.variable}</Box>,
    <Box as="span" style={{ fontFamily: 'monospace' }}>{t.value}</Box>,
    t.description,
  ]);

  return (
    <PageShell
      title="Design Tokens"
      description="Centralized CSS custom properties powering light/dark themes, spacing, and elevation."
      badge={<Tag intent="primary" round>--phi-* Standard</Tag>}
    >
      <Card>
        <Title level={5} style={{ marginBottom: '16px' }}>Core Color & Surface Tokens</Title>
        <Table headers={headers} rows={coreRows} />
      </Card>

      <Card>
        <Title level={5} style={{ marginBottom: '16px' }}>Elevation & Shadow Levels</Title>
        <Table headers={headers} rows={elevationRows} />
      </Card>
    </PageShell>
  );
};
