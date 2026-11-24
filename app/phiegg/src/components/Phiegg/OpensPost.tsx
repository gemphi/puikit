import React from 'react';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';

/** A picture that opens as a post (lib/picturePost.ts), wherever it stands: a press on it opens the post screen and
 *  goes no further, so the row or card it sits in still opens its own page from anywhere else. */
export const OpensPost: React.FC<{ id: string; label: string; children: React.ReactNode }> = ({ id, label, children }) => {
  const s = useStore(phieggStore);
  const open = (e: React.SyntheticEvent) => { e.stopPropagation(); e.preventDefault(); s.openPost(id); };
  return (
    <span role="button" tabIndex={0} aria-label={label} style={{ display: 'inline-flex', cursor: 'zoom-in', borderRadius: '50%' }}
      onClick={open} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(e); }}>{children}</span>
  );
};
