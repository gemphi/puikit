import React, { useState } from 'react';
import { Button, Frame, Image, ItemCard, Page, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, sortsFor, tableFor } from '../../lib/fields';
import { D, clubOf, fmt, site, t, worldImage, worldOf } from '../../lib/data';
import { ListView } from '../../components/Phiegg/Views';
import type { PhieggEvent } from '../../types/phiegg';

const filters = site.eventFilters as Record<string, string>;
const kinds = site.eventKinds as Record<string, string>;
/** Every event shows its world's art; an event with no world borrows one, picked steadily by its id. */
const ART = D.core.worlds.filter((w) => w.image);
const artOf = (e: PhieggEvent) => worldImage(worldOf(e.worldId)) ?? worldImage(ART[[...e.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0) % Math.max(1, ART.length)]);

/** Events and drops: one row of kind tabs; club, world, genre and month are filters; the table sorts by its headings. */
export const EventsPage: React.FC<{ only?: string }> = ({ only }) => {
  const s = useStore(phieggStore); const [f, setF] = useState(only ?? D.events.filters[0]);
  const list = D.events.events.filter((e) => !filters[f] || e.kind === filters[f]);
  const month = (e: PhieggEvent) => site.months[Number(e.startsAt.slice(5, 7)) - 1];
  const place = (e: PhieggEvent) => worldOf(e.worldId)?.name ?? site.brand.name;
  const card = (e: PhieggEvent) => { const going = !!s.rsvp[e.id]; return (
    <ItemCard depth={2} stackBelow="lg"
      media={<Stack direction="row" gap={3} align="center">
        <Stack direction="column" align="center" gap={0} minWidth="3rem"><Title level={3} size="lg">{e.startsAt.slice(8, 10)}</Title><Text size="xs" intent="muted">{month(e)}</Text></Stack>
        {artOf(e) ? <Frame ratio="4/3" width="6.5rem" rounded="md"><Image src={artOf(e)!} alt="" fit="cover" fill loading="lazy" /></Frame> : null}
      </Stack>}
      title={e.title} meta={t('dateLine', { time: e.startsAt.slice(11, 16), place: place(e), n: fmt(e.rsvps + (going ? 1 : 0)) })}
      actions={<Button variant={going ? 'primary' : 'outline'} onClick={() => { s.toggle('rsvp', e.id); if (!going) s.flash(t('calendarAdded')); }}>{going ? t('going') : e.kind === 'drop' ? t('remind') : t('rsvp')}</Button>}>
      <Stack direction="row" gap={1} wrap><Tag intent="primary" minimal round size="sm">{kinds[e.kind]}</Tag>{e.price && <Tag minimal round size="sm">{t('priceLine', { price: e.price, supply: fmt(e.supply ?? 0) })}</Tag>}{clubOf(e.clubId) && <Tag minimal round size="sm">{clubOf(e.clubId)!.name}</Tag>}{e.recurring && <Tag intent="success" minimal round size="sm">{t('evRecurring', { when: e.recurring.toLowerCase() })}</Tag>}</Stack>
    </ItemCard>); };
  return (
    <Page>
      <Stack direction="column" gap={3}>
        <Title level={2} size="xl">{only ? t('dropsTitle') : t('eventsTitle')}</Title>
        <TabList size="sm" variant="pills" activeId={f} onChange={(id) => setF(id as typeof f)} items={D.events.filters.map((x) => ({ id: x, label: x }))} />
        <ListView<PhieggEvent> rows={list} keyOf={(e) => e.id} text={(e) => e.title + ' ' + place(e)} cols={2}
          facets={facetsFor<PhieggEvent>('event')}
          sorts={sortsFor<PhieggEvent>('event')}
          table={[...tableFor<PhieggEvent>('event'), { id: 'place', header: t('lsWorld'), cell: place, sortValue: place }]}
          render={card} />
      </Stack>
    </Page>
  );
};
