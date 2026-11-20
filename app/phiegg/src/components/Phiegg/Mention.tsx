import React from 'react';
import { Button } from '@pui/components';
import { useStore } from '@pui/store';
import { itemOf, kindOfId, person } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';
import { EntityAvatar } from './EntityAvatar';
import { PersonAvatar } from './PersonAvatar';

/**
 * Any record named in passing (a shop's club, a post's author, a world's creator): always its thumbnail and its name
 * after an @, as one button like every other button, and pressing it opens the record. A person is called by their
 * handle; anything else by its name. Never a bare word or a small text link.
 */
export const Mention: React.FC<{ id: string }> = ({ id }) => {
  const s = useStore(phieggStore);
  const kind = kindOfId(id);
  const isPerson = kind === 'person' || kind === 'agent';
  const name = isPerson ? person(id).handle : (itemOf(kind ?? '', id) as { name?: string } | undefined)?.name ?? id;
  return (
    <Button variant="glass" icon={isPerson ? <PersonAvatar id={id} size="xs" /> : <EntityAvatar id={id} name={name} size="xs" />} onClick={() => s.openId(id)}>
      @{name}
    </Button>
  );
};
