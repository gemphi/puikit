import { Box } from '@pui/components';
import React from 'react';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { initials, num, tone, type Club } from '../data';

/** Club tile: flat club-colour top, badge across the edge, name / tagline / floor. */
export const ClubCard: React.FC<{ c: Club; onOpen: () => void }> = ({ c, onOpen }) => {
  const [bg, ink] = tone(c.tone);
  return (
    <Box as="article" className={k.card + ' ' + k.cardBtn} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()} style={{ overflow: 'hidden' }}>
      <Box className={s.clubTop} style={{ background: bg }}><Box as="span" className={s.badge} style={{ color: ink }}>{initials(c.name)}</Box></Box>
      <Box className={s.clubBody}>
        <Box as="h3" className={k.cardTitle}>{c.name}</Box>
        <Box as="p" className={k.body}>{c.tagline}</Box>
        <Box as="span" className={k.small}>{c.floor} ETH floor · {num(c.holders)} holders</Box>
      </Box>
    </Box>
  );
};
