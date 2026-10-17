import React from 'react';
import { Box, Button } from '@pui/components';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { byId, type DB } from '../data';
import { ClubCard } from './ClubCard';
import type { Open } from '../panels';

export const Clubs: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const me = byId(db.core.users, db.core.currentUserId);
  const [tab, setTab] = React.useState<'mine' | 'live' | 'all'>('mine');
  const list = tab === 'mine' ? db.core.clubs.filter((c) => (me?.clubIds || []).includes(c.id)) : tab === 'live' ? db.core.clubs.filter((c) => c.status === 'live') : db.core.clubs;
  return (
    <>
      <Box as="header"><Box as="h1" className={k.title}>Clubs</Box><Box as="p" className={k.sub}>Fashion clubs building worlds. Hold a piece to join.</Box></Box>
      <Box className={s.chips}>
        {([['mine', 'Your clubs'], ['live', 'Live'], ['all', 'All clubs']] as const).map(([id, l]) => <Button key={id} size="sm" variant={tab === id ? 'primary' : 'outline'} onClick={() => setTab(id)}>{l}</Button>)}
      </Box>
      <Box className={k.grid}>{list.map((c) => <ClubCard key={c.id} c={c} onOpen={() => onOpen({ kind: 'club', id: c.id })} />)}</Box>
    </>
  );
};
