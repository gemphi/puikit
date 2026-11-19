import React from 'react';
import { Avatar } from '@pui/components';
import { entityPalette } from '../../lib/colour';
import { initials, worldMark, itemOf } from '../../lib/data';
import { portrait } from '../../lib/portraits';

/** Default profile icon for any record without a photo, worlds, hosts, clubs, nests, events, quests, coins, rooms. */
/** Hosts wear their beta portrait (lib/portraits). */
export const EntityAvatar: React.FC<{ id: string; name: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({ id, name, size = 'md' }) => {
  const pic = itemOf('host', id) ? portrait(id) : undefined;
  // A world with its own mark (the Bold Cities' icons from the drive) wears it, whole, like a flag.
  const mark = worldMark(itemOf('world', id));
  if (mark) return <Avatar size={size} alt={name} src={mark} fit="contain" colors={entityPalette(id)} />;
  return <Avatar size={size} alt={name} seed={id} colors={entityPalette(id)} sprite={pic?.sprite} initials={initials(name.replace(/^[#@]\s*/, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim() || '·')} />;
};
