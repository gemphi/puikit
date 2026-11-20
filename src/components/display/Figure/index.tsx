import React from 'react';
import { Stack } from '../../layout/Stack';
import { Text, type TextProps } from '../../primitives/Text';
import { ProgressBar } from '../../feedback/ProgressBar';

export type FigureProps = {
  /** What the figure is (High, Left, Entrants). */
  label: React.ReactNode;
  value: React.ReactNode;
  /** Colours the value (a rise, a fall, a warning). */
  intent?: TextProps['intent'];
  /** A share from 0 to 1 drawn as a bar under the value. */
  share?: number;
};

/** One figure on a ground of its own (a region): what it is, the figure, and a bar when it is a share of something. */
export const Figure = ({ label, value, intent, share }: FigureProps) => (
  <Stack direction="column" gap={0} surface="region" flex="1 1 4rem" minWidth="0">
    <Text size="xs" intent="muted" truncate>{label}</Text>
    <Text size="sm" weight="bold" numeric intent={intent} truncate>{value}</Text>
    {share != null && <ProgressBar value={share} size="sm" animate={false} style={{ marginTop: 'var(--phi-space-1)' }} />}
  </Stack>
);

/** A line of figures that share its width and wrap when it is narrow. */
export const FigureRow = ({ children }: { children: React.ReactNode }) => <Stack direction="row" gap={2} wrap>{children}</Stack>;
