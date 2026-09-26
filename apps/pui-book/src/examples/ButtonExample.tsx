'use client';

import React from 'react';
import { Button, Stack, Text } from '@pui/components';
import { Play, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export const ButtonExample: React.FC = () => {
  return (
    <Stack direction="column" gap={3}>
      <Text size="sm" intent="secondary">
        Buttons trigger actions and support intent variants, sizes, icons, and loading states.
      </Text>
      <Stack direction="row" gap={2} wrap align="center">
        <Button variant="primary" icon={<Play size={14} />}>Primary Action</Button>
        <Button variant="secondary" icon={<Sparkles size={14} />}>Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger" icon={<AlertCircle size={14} />}>Danger</Button>
        <Button variant="ghost">Minimal Ghost</Button>
        <Button variant="primary" loading icon={<RefreshCw size={14} />}>Loading</Button>
      </Stack>
      <Stack direction="row" gap={2} align="center">
        <Button size="sm" variant="primary">Small (sm)</Button>
        <Button size="md" variant="primary">Default (md)</Button>
        <Button size="lg" variant="primary">Large (lg)</Button>
      </Stack>
    </Stack>
  );
};
