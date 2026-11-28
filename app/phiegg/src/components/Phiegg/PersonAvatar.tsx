import React from 'react';
import { Avatar } from '@pui/components';
import { person, site } from '../../lib/data';
import { portrait } from '../../lib/portraits';
import { OpensPost } from './OpensPost';

const GLYPHS: Record<string, string> = { ...(site.glyphs as Record<string, string>), ...((site as unknown as { glyphPaths?: Record<string, string> }).glyphPaths ?? {}) };

/** People and agents wear their beta portrait (lib/portraits); without one, the puikit default profile icon (agents carry their glyph). */
/** A face opens its person as a post of their pictures (OpensPost); `still` keeps it a picture alone. */
export const PersonAvatar: React.FC<{ id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; still?: boolean }> = ({ id, size = 'md', still }) => {
  const face = <PersonFace id={id} size={size} />;
  return still ? face : <OpensPost id={id} label={person(id).name}>{face}</OpensPost>;
};

const PersonFace: React.FC<{ id: string; size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({ id, size }) => {
  const p = person(id);
  const d = p.isAgent && p.glyph ? GLYPHS[p.glyph] : undefined;
  const pic = portrait(p.id);
  if (pic) return <Avatar size={size} alt={p.name} seed={p.id} initials={p.initials} sprite={pic.sprite} />;
  return (
    <Avatar size={size} alt={p.name} seed={p.id} initials={p.initials}
      icon={d ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg> : undefined} />
  );
};
