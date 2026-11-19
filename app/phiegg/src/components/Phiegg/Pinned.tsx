import React from 'react';
import { Icon, Pressable, Text } from '@pui/components';
import { MapPin } from 'lucide-react';
import { useStore } from '@pui/store';
import { cityOf, itemOf } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';

/** Where something was posted or happens, with the pin: the world and its zone, opening the zone (else the world). */
export const Pinned: React.FC<{ worldId?: string | null; cityId?: string | null }> = ({ worldId, cityId }) => {
  const s = useStore(phieggStore);
  const hit = cityOf(cityId); const world = hit?.world ?? itemOf('world', worldId);
  if (!world) return null;
  const open = (e: React.MouseEvent) => { e.stopPropagation(); hit ? s.go('city', { cityId: hit.city.id, worldId: world.id }) : s.go('world', { worldId: world.id }); };
  return (
    <Pressable row gap={1} onClick={open} aria-label={[world.name, hit?.city.name].filter(Boolean).join(', ')}>
      <Icon icon={MapPin} size="xs" /><Text as="span" size="xs" weight="semibold">{world.name}{hit ? ' · ' + hit.city.name : ''}</Text>
    </Pressable>
  );
};
