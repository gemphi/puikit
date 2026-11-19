import React from 'react';
import { Cascade, Frame, Image, Text } from '@pui/components';
import { itemImage } from '../../lib/data';
import type { ShopLook } from '../../types/phiegg';

/** A look in the kit's frame, on the one surface. Looks without renders show their name.
    The stacks sit inside the card, top and bottom mirrored, so the photo reads as held between them.
    `cascade` is the stack size (0 means flat); `pocket` overrides the sheet count directly. */
export const LookImage: React.FC<{ look: ShopLook; view?: string; src?: string; cascade?: number; pocket?: number }> = ({ look, view = 'FRONT', src, cascade = 4, pocket }) => {
  const path = src ?? look.views[view] ?? look.views.FRONT;
  return (
    <Cascade depth={0} pocket={pocket ?? cascade} cap={pocket ?? cascade}>
    <Frame ratio="3/4" rounded="lg">
      {path
        ? <Image src={itemImage(path)} alt={look.name} loading="lazy" fit="contain" fill />
        : <Text weight="bold" align="center" padding={4} color="text-primary">{look.name}</Text>}
    </Frame>
    </Cascade>
  );
};
