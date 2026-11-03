
import React from 'react';
import { Box, Button, Tag } from '@pui/components';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { byId, num, tone, useStored, type DB } from '../data';
import type { Open } from '../panels';

const KIND: Record<string, string> = { Drops: 'drop', Runways: 'runway', Parties: 'party', Talks: 'talk' };
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const Events: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const [f, setF] = React.useState('All');
  const [going, setGoing] = useStored<Record<string, boolean>>('phi.rsvp', {});
  const [limit, setLimit] = React.useState(18);
  const list = db.events.events.filter((e) => f === 'All' || (f === 'Going' ? going[e.id] : e.kind === (KIND[f] || f.toLowerCase())))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <>
      <Box as="header"><Box as="h1" className={k.title}>Events</Box><Box as="p" className={k.sub}>Runways, drops and meetups across the worlds.</Box></Box>
      <Box className={s.chips}>{[...db.events.filters, 'Going'].map((x) => <Button key={x} size="sm" variant={f === x ? 'primary' : 'outline'} onClick={() => setF(x)}>{x}</Button>)}</Box>
      <Box className={k.grid}>
        {list.slice(0, limit).map((e) => { const c = byId(db.core.clubs, e.clubId); const [bg, ink] = tone(c?.tone || 'sand'); const on = !!going[e.id]; return (
          <Box as="article" key={e.id} className={k.card}>
            <Box className={s.media} style={{ height: 88, background: bg, color: ink, fontSize: 16 }}>{when(e.startsAt)}</Box>
            <Box className={k.row}><Tag minimal round>{e.kind}</Tag></Box>
            <Box as="h3" className={k.cardTitle}>{e.title}</Box>
            <Box as="span" className={k.small}>{num(e.rsvps + (on ? 1 : 0))} going</Box>
            <Box className={k.row}>
              <Button size="sm" variant={on ? 'outline' : 'primary'} onClick={() => setGoing({ ...going, [e.id]: !on })}>{on ? 'Going' : 'RSVP'}</Button>
              {c ? <Button size="sm" variant="ghost" onClick={() => onOpen({ kind: 'club', id: c.id })}>{c.name}</Button> : null}
            </Box>
          </Box>); })}
      </Box>
      {!list.length ? <Box as="p" className={k.sub}>{f === 'Going' ? 'You have not RSVPed to anything yet.' : 'No events here.'}</Box> : null}
      {limit < list.length ? <Button variant="outline" onClick={() => setLimit((l) => l + 18)}>Load more</Button> : null}
    </>
  );
};
