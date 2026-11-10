import React from 'react';
import { Cascade, Frame, Image, Text, useCardTint } from '@pui/components';
import { itemImage } from '../../lib/data';
import type { ShopLook } from '../../types/phiegg';

/** A look on its own colour, the same backdrop the viewer uses. Looks without renders show their colour swatch and name. */
/** The stacks sit INSIDE the card, top and bottom mirrored, in the look's own colour: strongest at the edges,
    fading to the card's background beside the photo, so the photo reads as held between them.
    `cascade` is the stack size (0 means flat); `pocket` overrides the sheet count directly. */
export const LookImage: React.FC<{ look: ShopLook; view?: string; src?: string; cascade?: number; pocket?: number }> = ({ look, view = 'FRONT', src, cascade = 4, pocket }) => {
  const path = src ?? look.views[view] ?? look.views.FRONT;
  useCardTint(look.hex, 22); // the card holding a look is the look's colour
  return (
    <Cascade depth={0} pocket={pocket ?? cascade} cap={pocket ?? cascade} tint={look.hex}>
    <Frame ratio="3/4" rounded="lg" tint={look.hex} tintStrength={path ? 22 : 45}>
      {path
        ? <Image src={itemImage(path)} alt={look.name} loading="lazy" fit="contain" fill />
        : <Text weight="bold" align="center" padding={4} color="text-primary">{look.name}</Text>}
    </Frame>
    </Cascade>
  );
};
