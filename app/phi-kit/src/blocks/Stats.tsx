import { Stack, Text } from '@pui/components';
import React from 'react';
import type { Block } from '../data';
import s from '../kit.module.scss';

export const Stats: React.FC<{ b: Block }> = ({ b }) => (
  <Stack autoFill="220px" gap={3}>
    {(b.items || []).map((it: any) => (
      <Stack key={it.label} direction="column" gap={2} surface="card">
        <Text as="span" size="xs" intent="muted">{it.label}</Text>
        <Text as="span" font="heading" size="3xl" lineHeight={1}>{it.value}</Text>
        {it.sub ? <Text as="span" size="sm" intent="secondary" flex="1">{it.sub}</Text> : null}
      </Stack>
    ))}
  </Stack>
);
