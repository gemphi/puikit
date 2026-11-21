import React from 'react';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text, type TextProps } from '../../primitives/Text';
import { ProgressBar } from '../../feedback/ProgressBar';

export type FigureProps = {
  /** What the figure is (High, Left, Entrants). */
  label: React.ReactNode;
  value: React.ReactNode;
  /** Colours the value (a rise, a fall, a warning). */
  intent?: TextProps['intent'];
  /** A share from 0 to 1 drawn as a bar under the words, on a ground of its own. */
  share?: number;
};

/**
 * One figure on a ground of its own (a region): what it is, then the figure. When it is a share of something, its bar
 * stands under the words in a second ground, the holder's light, which runs against the words' own.
 */
export const Figure = ({ label, value, intent, share }: FigureProps) => {
  const words = (
    <Stack direction="column" gap={0} surface="region" flex={share == null ? '1 1 4rem' : undefined} minWidth="0">
      <Text size="xs" intent="muted" truncate>{label}</Text>
      <Text size="sm" weight="bold" numeric intent={intent} truncate>{value}</Text>
    </Stack>
  );
  if (share == null) return words;
  return (
    <Stack direction="column" gap={1} flex="1 1 4rem" minWidth="0">
      {words}
      <Box className="phi-holder" style={{ padding: 'var(--phi-space-2) var(--phi-space-3)' }}><ProgressBar value={share} size="sm" animate={false} /></Box>
    </Stack>
  );
};

/** A line of figures that share its width and wrap when it is narrow. */
export const FigureRow = ({ children }: { children: React.ReactNode }) => <Stack direction="row" gap={2} wrap>{children}</Stack>;
