import React from 'react';
import { Backdrop, EntityLayout, type EntityColumn } from '@pui/components';
import { usePageTheme } from '../../lib/pageTheme';

export type { EntityColumn };

/**
 * The page a look, an asset, a title or a place opens on: the core EntityLayout (title over columns, square middle on
 * a desktop, no title said twice), with Phiegg's two touches: the entity's picture under the whole app, blurred to its
 * colour, and the colour the page wears (`wear`, for an entity with no theme of its own).
 */
export const EntityPage: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; picture?: React.ReactNode; columns: EntityColumn[]; stickLast?: boolean; wear?: string }> = ({ picture, wear, ...layout }) => {
  usePageTheme(wear, undefined, 'vivid', 'entity');
  return <EntityLayout {...layout} backdrop={picture ? <Backdrop>{picture}</Backdrop> : undefined} />;
};
