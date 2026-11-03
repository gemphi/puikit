'use client';

import React from 'react';
import { DataTable, Stack, Tag, Button, ProgressBar, Text } from '@pui/components';
import { Cpu, Database, Shield } from 'lucide-react';

interface AgentRow {
  id: string;
  name: string;
  icon: React.ReactNode;
  domain: string;
  health: number;
  status: string;
  intent: 'success' | 'primary';
}

const ROWS: AgentRow[] = [
  { id: 'phigen', name: 'PhiGen', icon: <Cpu size={14} />, domain: 'Code Generation', health: 0.96, status: 'Active', intent: 'success' },
  { id: 'phirag', name: 'PhiRAG', icon: <Database size={14} />, domain: 'Vector Manifold', health: 0.91, status: 'Tuning', intent: 'primary' },
  { id: 'philog', name: 'PhiLog', icon: <Shield size={14} />, domain: 'Telemetry Stream', health: 0.88, status: 'Streaming', intent: 'primary' },
];

/** Columns declared once; the header and the cells cannot drift apart. */
export const TableExample: React.FC = () => (
  <DataTable
    rows={ROWS}
    getKey={(row) => row.id}
    columns={[
      {
        id: 'agent',
        header: 'Agent',
        cell: (row) => (
          <Stack direction="row" gap={2} align="center">
            {row.icon}
            <Text as="span" weight="semibold">{row.name}</Text>
          </Stack>
        ),
      },
      { id: 'domain', header: 'Domain', cell: (row) => row.domain },
      { id: 'health', header: 'Health', width: '10rem', cell: (row) => <ProgressBar value={row.health} intent={row.intent} /> },
      { id: 'status', header: 'Status', cell: (row) => <Tag intent={row.intent} round>{row.status}</Tag> },
      {
        id: 'actions',
        header: '',
        align: 'right',
        cell: () => <Button variant="outline" size="sm">Inspect</Button>,
      },
    ]}
  />
);
