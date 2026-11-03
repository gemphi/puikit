'use client';

import React from 'react';
import { Tag, Stack } from '@pui/components';
import { CheckCircle2, Shield, Activity } from 'lucide-react';

export const TagExample: React.FC = () => {
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={2} wrap align="center">
        <Tag intent="primary">Primary Intent</Tag>
        <Tag intent="success" icon={<CheckCircle2 size={12} />}>Success Synchronized</Tag>
        <Tag intent="warning" icon={<Activity size={12} />}>Warning Advisory</Tag>
        <Tag intent="error" icon={<Shield size={12} />}>Error State</Tag>
        <Tag intent="info">Info Notice</Tag>
      </Stack>
      <Stack direction="row" gap={2} wrap align="center">
        <Tag intent="primary" round>Round Chip</Tag>
        <Tag intent="success" minimal>Minimal Styling</Tag>
        <Tag intent="warning" onRemove={() => alert('Removed')}>Removable Tag</Tag>
      </Stack>
    </Stack>
  );
};
