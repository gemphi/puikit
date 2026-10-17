'use client';

import React from 'react';
import { Box, Drawer, FormGroup, Select, Stack, Switch, Tag, Text, Title, usePuiTheme } from '@pui/components';

interface InspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, themeStyle, setThemeStyle, brandId, setBrandId, brands, isDark } = usePuiTheme();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="PUI Global Inspector" position="right">
      <Box style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box>
          <Title level={5}>Live Design System Controls</Title>
          <Text size="sm" intent="secondary">
            Mutates root CSS custom properties in real-time.
          </Text>
        </Box>

        <FormGroup label="Active Brand Palette">
          <Select value={brandId} onChange={(e) => setBrandId(e.target.value)} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
        </FormGroup>

        <FormGroup label="Surface Style Mode">
          <Select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value as any)} options={[
            { value: 'flat', label: 'Flat (Default)' },
            { value: 'elevated', label: 'Elevated Shadows' },
            { value: 'glass', label: 'Glassmorphism' },
            { value: 'gradient', label: 'Subtle Gradient' },
          ]} />
        </FormGroup>

        <FormGroup label="Dark Mode Theme">
          <Switch
            label="Enable Foundry Dark Mode"
            checked={isDark}
            onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
          />
        </FormGroup>

        <Stack direction="row" gap={2} wrap>
          <Tag intent="primary">puijs.com</Tag>
          <Tag intent="success">Decoupled Architecture</Tag>
        </Stack>
      </Box>
    </Drawer>
  );
};
