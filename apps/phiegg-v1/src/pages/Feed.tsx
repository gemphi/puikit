import React from 'react';
import { Box, Tag } from '@pui/components';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { byId, initials, num, tone, type DB } from '../data';
import type { Open } from '../panels';

export const Feed: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const [limit, setLimit] = React.useState(12);
  const users = db.core.users;
  return (
    <>
      <Box as="header"><Box as="h1" className={k.title}>Feed</Box><Box as="p" className={k.sub}>Shots from your clubs and the people you follow.</Box></Box>
      <Box className={s.moments}>
        {db.feed.moments.map((m) => { const u = byId(users, m.userId); const [bg, ink] = tone(u?.tone || 'sand'); return (
          <Box as="button" key={m.id} className={s.moment} style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => u && onOpen({ kind: 'user', id: u.id })}>
            <Box as="span" className={s.ring}><Box as="span" className={s.avatar} style={{ background: bg, color: ink }}>{initials(u?.name || '?')}</Box></Box>
            <Box as="span">{m.live ? 'Live · ' : ''}{m.label}</Box>
          </Box>); })}
      </Box>
      <Box className={s.feed}>
        {db.feed.shots.slice(0, limit).map((sh) => {
          const u = byId(users, sh.authorId), c = byId(db.core.clubs, sh.clubId); const [bg, ink] = tone(sh.media.tone); const [ub, ui] = tone(u?.tone || 'sand');
          return (
            <Box as="article" key={sh.id} className={k.card + ' ' + k.cardBtn} role="button" tabIndex={0} onClick={() => onOpen({ kind: 'shot', id: sh.id })}>
              <Box className={s.who}>
                <Box as="span" className={s.mini} style={{ background: ub, color: ui }}>{initials(u?.name || 'Phiegg')}</Box>
                <Box><Box as="strong">{u?.name || 'Phiegg'}</Box><Box className={k.small}>{c ? c.name : '@' + (u?.handle || 'phiegg')}</Box></Box>
              </Box>
              <Box className={s.media} style={{ aspectRatio: sh.media.ratio, background: bg, color: ink }}>{sh.media.title}</Box>
              <Box as="p" className={k.body}>{sh.caption}</Box>
              <Box className={k.row}>{sh.tags.slice(0, 3).map((t) => <Tag key={t} minimal round>{t}</Tag>)}</Box>
              <Box as="span" className={k.small}>{num(sh.likes)} likes · {num(sh.comments)} comments · {num(sh.reshares)} reshares</Box>
            </Box>
          );
        })}
        {limit < db.feed.shots.length ? <Box as="button" className={k.item} style={{ justifyContent: 'center', background: 'var(--phi-color-background-secondary)' }} onClick={() => setLimit((l) => l + 12)}>Load more</Box> : null}
      </Box>
    </>
  );
};
