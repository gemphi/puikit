import React from 'react';
import { Avatar, useCardTint } from '@pui/components';
import { entityColour } from '../../lib/colour';
import { hostOf, initials } from '../../lib/data';
import { portrait } from '../../lib/portraits';

/** Default profile icon for any record without a photo, worlds, hosts, clubs, nests, events, quests, coins, rooms. */
/** Hosts wear their beta portrait (lib/portraits). */
export const EntityAvatar: React.FC<{ id: string; name: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({ id, name, size = 'md' }) => {
  const pic = hostOf(id) ? portrait(id) : undefined;
  useCardTint(entityColour(id), 16); // a club, host, world or pool card takes that record's colour
  return <Avatar size={size} alt={name} seed={id} sprite={pic?.sprite} initials={initials(name.replace(/^[#@]\s*/, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim() || '·')} />;
};
