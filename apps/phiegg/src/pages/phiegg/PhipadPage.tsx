import React, { useState } from 'react';
import { Button, Card, CardBody, Grid, Input, Page, ProgressBar, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { D, clubOf, fmt, site, t } from '../../lib/data';
import type { ClubRoute, PhipadApplication, PhipadTrackId } from '../../types/phiegg';
import { Tile } from '../../components/Phiegg/Tile';

export const PhipadPage: React.FC = () => {
  const s = useStore(phieggStore); const P = D.phipad;
  const [apps, setApps] = useState<PhipadApplication[]>(P.applications); const [names, setNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false); const [name, setName] = useState(''); const [route, setRoute] = useState<ClubRoute>('phipad');
  const [track, setTrack] = useState<PhipadTrackId>(P.tracks[0].id); const [ask, setAsk] = useState('');
  const submit = () => { if (!name.trim()) return; const id = 'c_new' + apps.length; setNames((n) => ({ ...n, [id]: name }));
    if (route === 'phipad') setApps((x) => [...x, { id: 'a' + x.length, clubId: id, trackId: track, stage: 'applied', ask: Number(ask) || 0, raised: 0, submittedAt: new Date().toISOString().slice(0, 10) }]);
    s.flash(route === 'phipad' ? t('applied', { name }) : t('live', { name })); setOpen(false); setName(''); setAsk(''); };
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Card depth={2} variant="hero"><CardBody><Stack direction="column" gap={2}><Title level={4} size="md">{site.brand.sub}</Title><Title level={1} size="3xl">{P.hero.subtitle}</Title><Text>{P.hero.body}</Text>
          <Button variant="primary" onClick={() => setOpen(!open)}>{t('submitClub')}</Button></Stack></CardBody></Card>
        {open && <Card depth={2}><CardBody><Stack direction="column" gap={3}>
          <TabList size="sm" variant="pills" activeId={route} onChange={(id) => setRoute(id as typeof route)} items={P.routes.map((r) => ({ id: r.id, label: r.title }))} />
          <Input value={name} placeholder={t('clubName')} onChange={(e) => setName(e.target.value)} />
          {route === 'phipad' && <><TabList size="sm" variant="pills" activeId={track} onChange={(id) => setTrack(id as typeof track)} items={P.tracks.map((x) => ({ id: x.id, label: x.name }))} />
            <Input value={ask} placeholder={t('askUsdc')} onChange={(e) => setAsk(e.target.value.replace(/\D/g, ''))} /></>}
          <Button variant="primary" disabled={!name.trim()} onClick={submit}>{route === 'phipad' ? t('submitPad') : t('submitDirect')}</Button>
        </Stack></CardBody></Card>}
        <Title level={3} size="lg">{t('tracks')}</Title>
        <Grid gap={3} xs={1} sm={2} md={4}>{P.tracks.map((x) => <Tile key={x.id} tone={x.tone} ratio="4/3" title={'$' + fmt(x.pool)} sub={x.name + ' · ' + x.body} />)}</Grid>
        <Title level={3} size="lg">{t('pipeline')}</Title>
        <Grid gap={3} xs={1} sm={2} md={5}>{P.stages.map((st) => { const list = apps.filter((a) => a.stage === st.id); return (
          <Stack key={st.id} direction="column" gap={2}><Stack direction="row" justify="between"><Text weight="bold">{st.label}</Text><Tag minimal round size="sm">{list.length}</Tag></Stack>
            {list.map((a) => <Card depth={2} key={a.id} variant="flat"><CardBody><Text size="sm" weight="bold">{clubOf(a.clubId)?.name ?? names[a.clubId]}</Text>
              <Text size="xs" intent="muted">{t('raised', { ask: '$' + fmt(a.ask), raised: '$' + fmt(a.raised) })}</Text><ProgressBar value={a.ask ? a.raised / a.ask : 0} size="sm" animate={false} /></CardBody></Card>)}</Stack>); })}</Grid>
      </Stack>
    </Page>
  );
};
