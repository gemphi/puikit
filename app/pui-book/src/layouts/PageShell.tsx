'use client';

import React from 'react';
import { Box, Stack, Text, Title } from '@pui/components';

interface PageShellProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  badge,
  children,
}) => {
  return (
    <Box style={{ maxWidth: '960px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box as="header" style={{ borderBottom: '1px solid var(--phi-color-border-subtle)', paddingBottom: '16px' }}>
        <Stack direction="row" justify="between" align="center">
          <Title level={2} style={{ letterSpacing: '-0.02em', margin: 0 }}>{title}</Title>
          {badge}
        </Stack>
        {description && (
          <Text size="md" intent="secondary" style={{ marginTop: '8px' }}>
            {description}
          </Text>
        )}
      </Box>
      <Box as="main" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {children}
      </Box>
    </Box>
  );
};
