import React from 'react';
import { ItemCard, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { lookOf, usd } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { LookImage } from './LookImage';

/** A look sent in a chat: a small card under the message (its colour, its picture, its price); it opens the item sheet. */
export const LookAttachment: React.FC<{ id?: string }> = ({ id }) => {
  const s = useStore(phieggStore); const l = id ? lookOf(id) : undefined;
  if (!l) return null;
  return <ItemCard depth={1} variant="flat" padding="sm" stackBelow="never" mediaSize="sm" tint={l.hex} tintStrength={22} onClick={() => s.openLook(l.id)}
    media={<LookImage look={l} cascade={0} />} title={l.name} meta={l.rarity} aside={<Text size="xs" weight="bold" numeric>{usd(l.usd)}</Text>} />;
};
