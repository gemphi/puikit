import React from 'react';
import { Avatar, useCardTint } from '@pui/components';
import { personColour } from '../../lib/colour';
import { person, site } from '../../lib/data';
import { portrait } from '../../lib/portraits';

const GLYPHS: Record<string, string> = { ...(site.glyphs as Record<string, string>), ...((site as unknown as { glyphPaths?: Record<string, string> }).glyphPaths ?? {}) };

/** People and agents wear their beta portrait (lib/portraits); without one, the puijs default profile icon (agents carry their glyph). */
export const PersonAvatar: React.FC<{ id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({ id, size = 'md' }) => {
  const p = person(id);
  const d = p.isAgent && p.glyph ? GLYPHS[p.glyph] : undefined;
  const pic = portrait(p.id);
  useCardTint(personColour(p.id), 16); // a profile card takes its person's colour (a tile in the card still wins)
  if (pic) return <Avatar size={size} alt={p.name} seed={p.id} initials={p.initials} sprite={pic.sprite} />;
  return (
    <Avatar size={size} alt={p.name} seed={p.id} initials={p.initials}
      icon={d ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg> : undefined} />
  );
};
