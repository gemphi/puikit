import React from 'react';
import { Badge, Button, Icon, ProgressBar, Stack, Tag, Text } from '@pui/components';
import { Globe, Play } from 'lucide-react';
import type { ConsoleView } from './part';

// The two pages with no store behind them yet: their rows are fixed samples, drawn by the shared blocks.

const POINT = [
  { id: 'SPT-01', lat: 37.7749, lon: -122.4194, label: 'SFO Terminal Hub', cluster: 'Cluster #A', similarity: 0.992 },
  { id: 'SPT-02', lat: 40.7128, lon: -74.0060, label: 'JFK Radar Station', cluster: 'Cluster #A', similarity: 0.984 },
  { id: 'SPT-03', lat: 51.5074, lon: -0.1278, label: 'LHR Control Tower', cluster: 'Cluster #B', similarity: 0.976 },
  { id: 'SPT-04', lat: 35.6762, lon: 139.6503, label: 'HND Pacific Gate', cluster: 'Cluster #C', similarity: 0.965 },
];

/** Spatial and vectors: the nearest-neighbour clusters and the content-addressed store they are kept in. */
export const SPATIAL_VIEW: ConsoleView = {
  title: 'Spatial & vectors',
  sub: 'HNSW nearest-neighbor vector similarity clustering and GeoSpatial coordinate indexing.',
  action: <>
    <Tag intent="primary" minimal round size="md"><Icon icon={Globe} size="xs" />Active CRS: EPSG:4326 (WGS84)</Tag>
    <Tag intent="success" minimal round size="md">HNSW Indexed</Tag>
  </>,
  blocks: [
    {
      kind: 'table', title: 'Nearest-neighbor vector clusters', cols: ['Vector ID', 'Label', 'Cluster', 'Coordinates (Lat, Lon)', 'Cosine similarity'],
      rows: POINT.map((pt) => [
        <Badge key="id" variant="primary">{pt.id}</Badge>,
        pt.label,
        <Tag key="c" intent="primary" minimal round size="sm">{pt.cluster}</Tag>,
        <Text key="ll" as="span" size="sm" mono>{pt.lat.toFixed(4)}, {pt.lon.toFixed(4)}</Text>,
        <Stack key="s" direction="column" gap={1}><Text size="sm" weight="medium">{pt.similarity.toFixed(3)}</Text><ProgressBar value={pt.similarity} intent="success" size="sm" /></Stack>,
      ]),
    },
    {
      kind: 'stats', title: 'Git KV content-addressed store',
      items: [{ label: 'Root tree hash', value: '0x8849...210f', sub: 'Commit ID: c_99182 · Author: phigit. Contains 4,820 coordinate blobs and HNSW adjacency lists.' }],
    },
  ],
};

const STEP = [
  { step: 1, name: 'Ingest Radar Telemetry', agent: 'PhiOra', status: 'SUCCEEDED', duration: '14ms' },
  { step: 2, name: 'Validate Security & Cipher Signature', agent: 'PhiSec', status: 'SUCCEEDED', duration: '8ms' },
  { step: 3, name: 'Execute Quantum Phase Superposition', agent: 'PhiCal', status: 'SUCCEEDED', duration: '32ms' },
  { step: 4, name: 'Recursive Evaluation & Dispatch', agent: 'PhiMen', status: 'RUNNING', duration: '45ms' },
  { step: 5, name: 'Broadcast SSE Packet Stream', agent: 'PhiBus', status: 'PENDING', duration: '-' },
];
const STEP_INTENT: Record<string, 'success' | 'primary' | undefined> = { SUCCEEDED: 'success', RUNNING: 'primary' };

/** Playbooks: one workflow's run, step by step. */
export const PLAYBOOK_VIEW: ConsoleView = {
  title: 'Playbooks',
  sub: 'Monocle-grade DAG workflow execution, step-by-step telemetry, and state checkpoints.',
  action: <Button variant="primary" size="md" icon={<Icon icon={Play} size="xs" />}>Trigger playbook</Button>,
  blocks: [
    { kind: 'stats', items: [{ label: 'Workflow', value: 'SyncGlobalFleet' }, { label: 'Playbook execution DAG', value: 'Step 4 of 5', progress: 0.8 }] },
    {
      kind: 'table', title: 'Steps', cols: ['Step', 'Name', 'Agent', 'Status', 'Duration'],
      rows: STEP.map((s) => [
        `Step ${s.step}`, s.name,
        <Badge key="a" variant="secondary">Agent: {s.agent}</Badge>,
        <Tag key="s" intent={STEP_INTENT[s.status]} minimal round size="sm">{s.status}</Tag>,
        s.duration,
      ]),
    },
  ],
};
