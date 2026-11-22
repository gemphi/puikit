import React from 'react';
import { Backdrop, EntityLayout, type EntityColumn, type EntityHero } from '@pui/components';
import { usePageTheme } from '../../lib/pageTheme';

export type { EntityColumn };

/**
 * The page a look, an asset, a title or a place opens on: the core EntityLayout (title over columns, square middle on
 * a desktop, no title said twice), with Phiegg's two touches: the entity's picture under the whole app, blurred to its
 * colour, and the colour the page wears (`wear`, for an entity with no theme of its own). A profile (a club, a world,
 * a shop) gives `hero`: its first screen is the picture as it is and its name, its tabs under it; the picture blurs as
 * the page scrolls (the kit's EntityLayout and Backdrop).
 */
export const EntityPage: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; picture?: React.ReactNode; columns: EntityColumn[]; stickLast?: boolean; wear?: string; hero?: EntityHero }> = ({ picture, wear, ...layout }) => {
  usePageTheme(wear, undefined, 'vivid', 'entity');
  return <EntityLayout {...layout} backdrop={picture ? <Backdrop opening={!!layout.hero}>{picture}</Backdrop> : undefined} />;
};
