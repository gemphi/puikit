import React, { useState } from 'react';
import { ItemCard, Stack, TabList, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { person, t, usd, type SiteCopyKey } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { PersonAvatar } from './PersonAvatar';

export type ItemPartId = 'info' | 'stats' | 'trail' | 'owner' | 'related';
export type ItemPart = { id: ItemPartId; content: React.ReactNode; hidden?: boolean };
/** The word for each tab (data/site.json), in the order the tabs stand. */
const WORD: [ItemPartId, SiteCopyKey][] = [['info', 'isTabInfo'], ['stats', 'isTabStats'], ['trail', 'isTabTrail'], ['owner', 'isTabOwner'], ['related', 'isTabRelated']];

/**
 * An item's tabs, the same set wherever an item is shown (a look, an EGG item, a SUM, a ride, a jewel, a profile PFT):
 * Info, Stats, Trail, Owner, Related, and under them the part the tab that is on names. A part with nothing to show
 * (`hidden`) has no tab.
 */
export const ItemParts: React.FC<{ label: string; parts: ItemPart[] }> = ({ label, parts }) => {
  const shown = WORD.map(([id, key]) => ({ key, part: parts.find((p) => p.id === id && !p.hidden) })).filter((x): x is { key: SiteCopyKey; part: ItemPart } => !!x.part);
  const [on, setOn] = useState<string>('info'); const cur = shown.find((x) => x.part.id === on) ?? shown[0];
  return (
    <Stack direction="column" gap={3}>
      <TabList size="sm" variant="pills" aria-label={label} activeId={cur?.part.id ?? ''} onChange={setOn} items={shown.map((x) => ({ id: x.part.id, label: t(x.key) }))} />
      {cur?.part.content}
    </Stack>
  );
};

/** Who holds an item, the newest first: each a person's row, since when, and what they paid. */
export const ItemOwners: React.FC<{ rows: { id: string; at?: string; usd?: number }[] }> = ({ rows }) => {
  const s = useStore(phieggStore);
  if (!rows.length) return <Text size="sm" intent="muted">{t('isNoOwner')}</Text>;
  return (
    <Stack direction="column" gap={1}>{rows.map((h) => (
      <ItemCard key={h.id} variant="flat" stackBelow="never" onClick={() => s.go('profile', { profileId: h.id })} media={<PersonAvatar id={h.id} size="md" />}
        title={person(h.id).name} meta={h.at ? t('isHeldSince', { date: h.at.slice(0, 10) }) : undefined} aside={h.usd ? <Tag minimal round size="sm">{usd(h.usd)}</Tag> : undefined} />))}</Stack>
  );
};
