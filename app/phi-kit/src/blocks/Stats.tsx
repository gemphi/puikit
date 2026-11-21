import { Card, Grid, Stack, Text, Title } from '@pui/components';
import React from 'react';
import type { Block } from '../data';
import { meter } from './GridExtra';

export type StatItem = { label: string; value: React.ReactNode; sub?: React.ReactNode; /** A meter under the value, 0 to 1 (`split`: two shares). */ progress?: number; split?: boolean };

/**
 * Numbers side by side, the one way in every app. `lg` (default) is a page's own figures: a card each, the value in
 * the heading face. `sm` is a record's facts: up to six a row, each as tall as its two lines (a plain grid, since Rows
 * keeps card-shaped cells, which facts are not).
 */
export const StatGrid: React.FC<{ items: StatItem[]; size?: 'sm' | 'lg' }> = ({ items, size = 'lg' }) => (size === 'sm' ? (
  <Grid gap={2} xs={2} sm={3} lg={6}>
    {items.map((it) => (
      <Card key={it.label} variant="flat" padding="sm" hoverable={false}>
        <Text size="xs" intent="muted">{it.label}</Text><Title level={5} size="md">{it.value}</Title>
      </Card>
    ))}
  </Grid>
) : (
  <Stack autoFill="220px" gap={3}>
    {items.map((it) => (
      <Stack key={it.label} direction="column" gap={2} surface="card">
        <Text as="span" size="xs" intent="muted">{it.label}</Text>
        <Text as="span" font="heading" size="3xl" lineHeight={1}>{it.value}</Text>
        {it.progress != null ? meter(it.progress, it.split) : null}
        {it.sub ? <Text as="span" size="sm" intent="secondary" flex="1">{it.sub}</Text> : null}
      </Stack>
    ))}
  </Stack>
));

export const Stats: React.FC<{ b: Block }> = ({ b }) => <StatGrid items={b.items || []} />;
