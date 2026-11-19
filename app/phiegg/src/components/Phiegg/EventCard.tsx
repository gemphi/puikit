import React from 'react';
import { Button, Frame, Image, ItemCard, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { D, fmt, site, t, worldImage, itemOf } from '../../lib/data';
import type { PhieggEvent } from '../../types/phiegg';

const kinds = site.eventKinds as Record<string, string>;
/** Every event shows its world's art; an event with no world borrows one, picked steadily by its id. */
const ART = D.core.worlds.filter((w) => w.image);
const artOf = (e: PhieggEvent) => worldImage(itemOf('world', e.worldId)) ?? worldImage(ART[[...e.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0) % Math.max(1, ART.length)]);

/** An event or a drop: its day, its world's art, when and where, what it costs, and the viewer's own answer to it. */
export const EventCard: React.FC<{ e: PhieggEvent }> = ({ e }) => {
  const s = useStore(phieggStore); const going = !!s.rsvp[e.id];
  const month = site.months[Number(e.startsAt.slice(5, 7)) - 1]; const place = itemOf('world', e.worldId)?.name ?? site.brand.name;
  return (
    <ItemCard depth={2} stackBelow="lg"
      media={<Stack direction="row" gap={3} align="center">
        <Stack direction="column" align="center" gap={0} minWidth="3rem"><Title level={3} size="lg">{e.startsAt.slice(8, 10)}</Title><Text size="xs" intent="muted">{month}</Text></Stack>
        {artOf(e) ? <Frame ratio="4/3" width="6.5rem" rounded="md"><Image src={artOf(e)!} alt="" fit="cover" fill loading="lazy" /></Frame> : null}
      </Stack>}
      title={e.title} meta={t('dateLine', { time: e.startsAt.slice(11, 16), place, n: fmt(e.rsvps + (going ? 1 : 0)) })}
      actions={<Button variant={going ? 'primary' : 'outline'} onClick={() => { s.toggle('rsvp', e.id); if (!going) s.flash(t('calendarAdded')); }}>{going ? t('going') : e.kind === 'drop' ? t('remind') : t('rsvp')}</Button>}>
      <Stack direction="row" gap={1} wrap><Tag intent="primary" minimal round size="sm">{kinds[e.kind]}</Tag>{e.price && <Tag minimal round size="sm">{t('priceLine', { price: e.price, supply: fmt(e.supply ?? 0) })}</Tag>}{itemOf('club', e.clubId) && <Tag minimal round size="sm">{itemOf('club', e.clubId)!.name}</Tag>}{e.recurring && <Tag intent="success" minimal round size="sm">{t('evRecurring', { when: e.recurring.toLowerCase() })}</Tag>}</Stack>
    </ItemCard>);
};
