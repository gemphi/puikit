/**
 * Stack usage examples (documentation source).
 *
 * Plain, framework-agnostic example descriptors consumed textually by
 * `scripts/generate-docs.mjs`. No Storybook or external documentation framework
 * dependency (Requirements 13.4, 14.4).
 */
import { Stack } from './index';

/** Local, self-contained example descriptor (no external framework). */
interface PuiExample {
  args?: Record<string, unknown>;
  render?: () => unknown;
}

interface PuiExampleMeta {
  title: string;
  component: unknown;
}

const meta: PuiExampleMeta = {
  title: 'Layout/Stack',
  component: Stack,
};

export default meta;

const Box = () => (
  <div
    style={{
      width: 40,
      height: 40,
      backgroundColor: 'var(--phi-color-primary)',
      borderRadius: 'var(--phi-radius-md)',
    }}
  />
);

export const Vertical: PuiExample = {
  render: () => (
    <Stack gap={4}>
      <Box />
      <Box />
      <Box />
    </Stack>
  ),
};

export const Horizontal: PuiExample = {
  render: () => (
    <Stack direction="row" gap={4} align="center">
      <Box />
      <Box />
      <Box />
    </Stack>
  ),
};
