import React from 'react';
import { Button, Card, CardBody, Grid, Page, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { D, clubOf, fmt, t } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';

export const JoinPage: React.FC = () => {
  const s = useStore(phieggStore);
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}><Title level={2} size="xl">{t('join')}</Title><Text intent="secondary">{t('joinSub')}</Text></Stack>
      <Grid gap={3} xs={1} sm={2} md={4}>{D.hosts.hosts.map((h) => (
        <Card depth={2} key={h.id}><CardBody><Stack direction="column" gap={2}>
          <Tile animate tone={h.tone} ratio="16/9" title={h.name} sub={clubOf(h.clubId)?.name} />
          <Stack direction="row" gap={1} wrap><Tag minimal round size="sm" intent="success">{h.gated}</Tag><Tag minimal round size="sm">{t('online', { n: fmt(h.online) })}</Tag></Stack>
          <Button variant={s.follow[h.id] ? 'secondary' : 'primary'} size="sm" onClick={() => { s.toggle('follow', h.id); s.flash(t('joined_', { name: h.name })); }}>{s.follow[h.id] ? t('following') : t('join')}</Button>
        </Stack></CardBody></Card>))}</Grid>
    </Stack></Page>
  );
};
