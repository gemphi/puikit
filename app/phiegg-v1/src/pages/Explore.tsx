import React from 'react';
import { Box, Button, Input } from '@pui/components';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { byId, initials, num, tone, type DB } from '../data';
import { ClubCard } from './ClubCard';
import type { Open } from '../panels';

export const Explore: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('All');
  const ql = q.trim().toLowerCase();
  const clubs = (ql || cat !== 'All' ? db.core.clubs : db.explore.trendingClubIds.map((id) => byId(db.core.clubs, id)!).filter(Boolean))
    .filter((c) => (!ql || (c.name + ' ' + c.tagline).toLowerCase().includes(ql)) && (cat === 'All' || c.tags.some((t) => t.toLowerCase().includes(cat.toLowerCase()))));
  const creators = db.explore.creatorIds.map((id) => byId(db.core.users, id)!).filter((u) => u && (!ql || (u.name + u.handle).toLowerCase().includes(ql)));
  return (
    <>
      <Box as="header"><Box as="h1" className={k.title}>Explore</Box><Box as="p" className={k.sub}>Clubs, worlds and creators across Phiegg.</Box></Box>
      <Input className={k.input} style={{ maxWidth: 620, flex: 'none' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clubs, worlds, creators" aria-label="Search" />
      <Box className={s.chips}>{db.explore.categories.map((c) => <Button key={c} size="sm" variant={cat === c ? 'primary' : 'outline'} onClick={() => setCat(c)}>{c}</Button>)}</Box>
      <Box as="section" className={k.block}>
        <Box as="h2" className={k.blockTitle}>{ql || cat !== 'All' ? clubs.length + ' clubs' : 'Trending clubs'}</Box>
        <Box className={k.grid}>{clubs.slice(0, 24).map((c) => <ClubCard key={c.id} c={c} onOpen={() => onOpen({ kind: 'club', id: c.id })} />)}</Box>
      </Box>
      <Box as="section" className={k.block}>
        <Box as="h2" className={k.blockTitle}>Creators</Box>
        <Box className={k.grid}>
          {creators.slice(0, 12).map((u) => { const [bg, ink] = tone(u.tone); return (
            <Box as="button" key={u.id} className={k.card + ' ' + k.cardBtn} onClick={() => onOpen({ kind: 'user', id: u.id })}>
              <Box className={s.who}><Box as="span" className={s.mini} style={{ background: bg, color: ink }}>{initials(u.name)}</Box><Box><Box as="strong">{u.name}</Box><Box className={k.small}>@{u.handle} · {num(u.followers || 0)} followers</Box></Box></Box>
            </Box>); })}
        </Box>
      </Box>
    </>
  );
};
