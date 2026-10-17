'use client';

import React from 'react';
import { Box, Button, Input, Select, Stack, Tag, usePuiTheme } from '@pui/components';
import { Search, Sun, Moon } from 'lucide-react';

export const CockpitHeader: React.FC = () => {
  const { theme, setTheme, brandId, setBrandId, brands, isDark } = usePuiTheme();

  return (
    <Box as="header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '56px',
        borderBottom: '1px solid var(--phi-color-border)',
        backgroundColor: 'var(--phi-color-background-card)',
      }}
    >
      <Stack direction="row" gap={3} align="center">
        <Box as="span" style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box as="span" style={{ color: 'var(--phi-color-primary)' }}>Φ</Box> PUI Enterprise Cockpit
        </Box>
        <Tag intent="primary" minimal>Palantir Foundry Parity</Tag>
      </Stack>

      <Stack direction="row" gap={3} align="center">
        <Input placeholder="Search entities, agents, axioms..." icon={<Search size={14} />} style={{ width: '280px' }} />
        <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? 'light' : 'dark')} icon={isDark ? <Sun size={14} /> : <Moon size={14} />}>
          {isDark ? 'Light' : 'Dark'}
        </Button>
        <Select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={{ width: '150px' }}
          options={brands.map((b) => ({ value: b.id, label: b.name }))} />
      </Stack>
    </Box>
  );
};
