'use client';

import React from 'react';
import { Card, Table, Tag, Title, Text, Stack } from '@pui/components';
import { PageShell } from '../layouts/PageShell';
import { CORE_TOKENS, ELEVATION_TOKENS } from '../content/tokens';

export const TokensPage: React.FC = () => {
  const headers = ['Token Name', 'CSS Custom Property', 'Default Value', 'Description'];

  const coreRows = CORE_TOKENS.map((t) => [
    <strong>{t.name}</strong>,
    <code>{t.variable}</code>,
    <span style={{ fontFamily: 'monospace' }}>{t.value}</span>,
    t.description,
  ]);

  const elevationRows = ELEVATION_TOKENS.map((t) => [
    <strong>{t.name}</strong>,
    <code>{t.variable}</code>,
    <span style={{ fontFamily: 'monospace' }}>{t.value}</span>,
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
