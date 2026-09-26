'use client';

import React, { useState } from 'react';
import { Button, Dialog, Drawer, Stack, Text, ProgressBar , Box } from '@pui/components';

export const OverlayExample: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={2}>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>Open Modal Dialog</Button>
        <Button variant="outline" onClick={() => setDrawerOpen(true)}>Open Slideout Drawer</Button>
      </Stack>

      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Ontology Inspector">
        <Box paddingY={3}>
          <Text>Inspecting entity schema for FinanceTransaction with strict typing invariants.</Text>
          <Box marginTop={3}>
            <ProgressBar value={0.85} intent="primary" />
          </Box>
        </Box>
      </Dialog>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Live Telemetry" position="right">
        <Box padding={4}>
          <Text size="sm" intent="secondary">Streaming telemetry data from Phiano phase manifold.</Text>
        </Box>
      </Drawer>
    </Stack>
  );
};
