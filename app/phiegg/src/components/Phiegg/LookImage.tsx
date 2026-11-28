import React from 'react';
import { Box, Cascade, Frame, Image, Text } from '@pui/components';
import { itemImage } from '../../lib/data';
import type { ShopLook } from '../../types/phiegg';
import { OpensPost } from './OpensPost';

/** A look in the kit's frame, on the one surface. Looks without renders show their name.
    The stacks sit inside the card, top and bottom mirrored, so the photo reads as held between them.
    `cascade` is the stack size (0 means flat); `pocket` overrides the sheet count directly. */
export const LookImage: React.FC<{ look: ShopLook; view?: string; src?: string; cascade?: number; pocket?: number;
  /** The look's name, inside the picture at its foot. */ title?: React.ReactNode;
  /** What marks it (its rarity, that it is owned), beside its name at the foot; nothing is laid over the picture's top. */ badges?: React.ReactNode;
  /** Kept a picture alone, where a press already opens the look (its own page, its post); else it opens as a post. */ still?: boolean }> = ({ look, view = 'FRONT', src, cascade = 4, pocket, title, badges, still }) => {
  const path = src ?? look.views[view] ?? look.views.FRONT;
  return (
    <Cascade depth={0} pocket={pocket ?? cascade} cap={pocket ?? cascade}>
    <Frame ratio="3/4" rounded="lg" className="ph-look">
      {path
        ? (still ? <Image src={itemImage(path)} alt={look.name} loading="lazy" fit="contain" fill />
          : <OpensPost id={look.id} label={look.name} fill><Image src={itemImage(path)} alt={look.name} loading="lazy" fit="contain" fill /></OpensPost>)
        : !title && <Text weight="bold" align="center" padding={4} color="text-primary">{look.name}</Text>}
      {(title || badges) && <Box className="ph-look-foot">{title && <Text weight="bold" truncate>{title}</Text>}{badges && <Box className="ph-look-marks">{badges}</Box>}</Box>}
    </Frame>
    </Cascade>
  );
};
