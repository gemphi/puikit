'use client';

import React from 'react';
import { Callout, Stack } from '@pui/components';

export const CalloutExample: React.FC = () => {
  return (
    <Stack direction="column" gap={3}>
      <Callout intent="primary" title="Palantir Foundry Aesthetic">
        Phient UI delivers dense, accessible, and decoupled enterprise building blocks.
      </Callout>
      <Callout intent="success" title="Continuous Phase Manifold">
        Kuramoto phase synchronization reached harmonic lock (r = 0.984).
      </Callout>
      <Callout intent="warning" title="Decoupled Architecture Rule">
        No domain data, carts, or services are bundled in core library components.
      </Callout>
      <Callout intent="error" title="Phase Tension Alert">
        Orthogonal wave offset detected in experimental sector 4.
      </Callout>
    </Stack>
  );
};
