
import { Button, Stack, Text } from '@pui/components';
import type { ModuleView } from '@phi-kit/module';
import { castVote } from './data';

/**
 * The ballot: Phidao's one module of its own, added to the shared registry as `vote`. It stays here because it writes
 * this app's own state (the member's vote, `dao.votes`); no shared block casts a vote. Its data: `{ id, mine, weight, note }`.
 */
export const Vote: ModuleView = ({ b }) => (
  <Stack direction="column" gap={2}>
    <Text size="xs" intent="muted" as="span">Your weight: {b.weight}{b.mine ? ' · you voted ' + b.mine : ''}</Text>
    <Stack direction="row" gap={2} wrap align="center">
      <Button variant={b.mine === 'for' ? 'primary' : 'outline'} onClick={() => castVote(b.id, 'for')}>Vote for</Button>
      <Button variant={b.mine === 'against' ? 'primary' : 'outline'} onClick={() => castVote(b.id, 'against')}>Vote against</Button>
    </Stack>
    {b.note ? <Text size="xs" intent="muted" as="span">{b.note}</Text> : null}
  </Stack>
);
