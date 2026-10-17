'use client';

import React from 'react';
import { Box, Title, Tree, TreeNode } from '@pui/components';
import { Database, Layers, Activity } from 'lucide-react';

export const treeNodes: TreeNode[] = [
  {
    id: 'ontology',
    label: 'Ontology Topos',
    icon: <Database size={15} />,
    isExpanded: true,
    childNodes: [
      { id: 'geo', label: 'GeoProperty (Space-Time Series)' },
      { id: 'media', label: 'MediaProperty (Multi-Modal Stream)' },
      { id: 'cipher', label: 'CipherProperty (Homomorphic Crypto)' },
      { id: 'action', label: 'ActionTypeMetadata (Axiom Morphisms)' },
    ],
  },
  {
    id: 'agents',
    label: 'Agent Swarms (GemPhi)',
    icon: <Layers size={15} />,
    isExpanded: true,
    childNodes: [
      { id: 'phigen', label: 'PhiGen Agent (LLM Code Synthesis)' },
      { id: 'phirag', label: 'PhiRAG Agent (Continuous Manifold)' },
      { id: 'philog', label: 'PhiLog Agent (Observability Telemetry)' },
    ],
  },
];

export const CockpitSidebar: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  return (
    <Box as="aside" style={{ borderRight: '1px solid var(--phi-color-border)', backgroundColor: 'var(--phi-color-background-secondary)', padding: '16px' }}>
      <Title level={6} style={{ marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--phi-color-text-muted)' }}>
        System Hierarchy
      </Title>
      <Tree nodes={treeNodes} onNodeClick={(node) => onSelect(String(node.id))} />
    </Box>
  );
};
