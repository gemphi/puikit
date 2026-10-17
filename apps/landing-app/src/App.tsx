'use client';

import React from 'react';
import { Box, Button, Card, Grid, Stack, Tag, Text, Title, usePuiTheme } from '@pui/components';
import { Layers, Shield, Sparkles, ArrowRight, Code2, Sun, Moon } from 'lucide-react';

export default function App() {
  const { setTheme, isDark } = usePuiTheme();

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--phi-color-background)', color: 'var(--phi-color-text-primary)' }}>
      <Box as="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '64px', borderBottom: '1px solid var(--phi-color-border)' }}>
        <Stack direction="row" gap={3} align="center">
          <Box as="span" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--phi-color-primary)' }}>Φ</Box>
          <Box as="span" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Phient UI (PUI)</Box>
          <Tag intent="primary" round>puijs.com</Tag>
        </Stack>
        <Stack direction="row" gap={3} align="center">
          <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? 'light' : 'dark')} icon={isDark ? <Sun size={14} /> : <Moon size={14} />}>
            {isDark ? 'Light' : 'Dark'}
          </Button>
          <Button variant="primary" size="sm" icon={<Code2 size={14} />}>GitHub</Button>
        </Stack>
      </Box>

      <Box as="section" style={{ padding: '64px 32px 48px 32px', maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
        <Tag intent="primary" minimal style={{ marginBottom: '16px' }}>REACT 18 & 19 ENTERPRISE DESIGN SYSTEM</Tag>
        <Title level={1} style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px' }}>
          Dense UI Primitives.<br />
          <Box as="span" style={{ background: 'var(--phi-brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zero Domain Coupling.
          </Box>
        </Title>
        <Text size="lg" color="secondary" style={{ maxWidth: '600px', margin: '0 auto 28px auto' }}>
          Phient UI delivers Palantir Blueprint-grade trees, tables, dialogs, drawers, and multi-brand themes.
        </Text>
        <Stack direction="row" gap={3} justify="center">
          <Button variant="primary" size="lg" icon={<ArrowRight size={16} />}>Explore Workbench</Button>
          <Button variant="outline" size="lg">Read Documentation</Button>
        </Stack>
      </Box>

      <Box as="section" style={{ padding: '24px 32px 64px 32px', maxWidth: '1000px', margin: '0 auto' }}>
        <Grid columns="repeat(auto-fit, minmax(280px, 1fr))" gap={4}>
          <Card>
            <Layers size={22} style={{ color: 'var(--phi-color-primary)', marginBottom: '8px' }} />
            <Title level={4}>Pure Composable Primitives</Title>
            <Text size="sm" color="secondary">Tree, Table, Dialog, Drawer, Tag, and Callout designed for dense data.</Text>
          </Card>
          <Card>
            <Shield size={22} style={{ color: 'var(--phi-color-success)', marginBottom: '8px' }} />
            <Title level={4}>Zero Business Coupling</Title>
            <Text size="sm" color="secondary">Strictly decoupled. Props flow down, callbacks flow up.</Text>
          </Card>
          <Card>
            <Sparkles size={22} style={{ color: 'var(--phi-color-warning)', marginBottom: '8px' }} />
            <Title level={4}>Multi-Brand Theming</Title>
            <Text size="sm" color="secondary">Foundry, Blueprint, Emerald, and Midnight palettes with instant dark mode.</Text>
          </Card>
        </Grid>
      </Box>
    </Box>
  );
}
