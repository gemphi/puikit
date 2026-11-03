import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Columns, Drawer, Icon, ItemCard, Page, ProgressBar, Rows, Stack, Tag, Text, Title, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { D, itemImage, lookOf, person, poolOfShow, poseOf, showLead, showOf, site, t, usd, worldOf } from '../../lib/data';
import { lookLive, poolNumbers, useNow } from '../../lib/market';
import { record } from '../../lib/activity';
import type { Look, PoseRig } from '../../types/phiegg';
import { Tile } from '../../components/Phiegg/Tile';
import { Connected } from '../../components/Phiegg/Connected';
import { AgentChat } from '../../components/Phiegg/AgentChat';
import { LookImage } from '../../components/Phiegg/LookImage';

const Rig: React.FC<{ rig: PoseRig }> = ({ rig }) => (
  <Stack direction="column" gap={1}>{(Object.keys(rig) as (keyof PoseRig)[]).map((k) => (
    <Stack key={k} direction="row" gap={2} align="center"><Stack width="3rem"><Text size="xs" intent="muted">{k}</Text></Stack>
      <Stack grow={1}><ProgressBar value={(rig[k] + 90) / 180} size="sm" animate={false} /></Stack><Text size="xs" mono>{rig[k]}°</Text></Stack>))}</Stack>
);
/** A runway look's render: the store look (PFT) it walks, so the dress and its background are the same colour. */
const renderOf = (lk: Look) => { const p = lk.lookId ? lookOf(lk.lookId) : undefined; return p?.views.FRONT ? itemImage(p.views.FRONT) : undefined; };

/**
 * The play page. The stage shows the look on the runway; the player is a docked bottom sheet whose header holds the
 * controls (previous · play / pause · next · progress) and whose body drives everything else as columns: every look,
 * the look and its PFT (buy, swap, the drop), the poses and a chat with the host. Columns expand or close; the sheet
 * folds to its header, unfolds and grows to the window.
 */
export const ShowPage: React.FC = () => {
  const s = useStore(phieggStore);
  const show = showOf(s.showId) ?? D.shows.shows[0]; // undefined only for an instant, before lib/heavy.ts lands
  const [idx, setIdx] = useState(0); const [playing, setPlaying] = useState(true); const [family, setFamily] = useState(site.poseFamilies[0]);
  const [folded, setFolded] = useState(false);
  const n = show?.looks.length ?? 1;
  useEffect(() => setIdx(0), [show?.id]);
  useEffect(() => { if (!playing || !show) return; const id = setInterval(() => setIdx((i) => (i + 1) % n), site.autoplay.slideMs); return () => clearInterval(id); }, [playing, show?.id, n]);
  const now = useNow(2000);
  if (!show) return null;
  const w = worldOf(show.worldId)!; const host = person(show.hostAgentId);
  const lead = showLead(show);
  const look = show.looks[idx]; const pose = poseOf(look.poseId)!; const pft = look.lookId ? lookOf(look.lookId) : undefined;
  const dropPool = poolOfShow(show.id); const dropN = dropPool ? poolNumbers(dropPool, now) : undefined;
  const step = (d: number) => setIdx((i) => (i + d + n) % n);
  const pick = (i: number) => { setIdx(i); setPlaying(false); record('open', show.looks[i].id, { refKind: 'runway-look', with: show.id }); };

  // ── sheet header: the player controls ──
  const controls = (
    <Stack direction="row" gap={2} align="center" minWidth="0">
      <Button variant="ghost" size="sm" icon={<Icon icon={ChevronLeft} size="sm" />} onClick={() => step(-1)} aria-label={t('prev')} />
      <Button variant="primary" size="sm" iconLeft={playing ? Pause : Play} onClick={() => setPlaying(!playing)}>{playing ? t('autoplayOn') : t('autoplayOff')}</Button>
      <Button variant="ghost" size="sm" icon={<Icon icon={ChevronRight} size="sm" />} onClick={() => step(1)} aria-label={t('next')} />
      <Stack direction="column" gap={1} grow={1} minWidth="0">
        <Text size="sm" weight="semibold" truncate>{t('lookOf', { i: look.n, n })} · {look.title}</Text>
        <ProgressBar value={(idx + 1) / n} size="sm" animate={false} />
      </Stack>
      {pft && <Button size="sm" variant="outline" onClick={() => s.openLook(pft.id)}>{t('shOpenPft')}</Button>}
    </Stack>
  );

  // ── sheet body: columns that drive the traffic ──
  const looksCol = (
    <Rows cols={3} colsSm={2} minItemWidth="8rem">{show.looks.map((l, i) => (
      <Tile key={l.id} tone={l.tone} color={l.hex} ratio="3/4" deck={i === idx ? 3 : 1} depth={{ worldId: show.worldId, clubId: show.clubId, personId: show.hostAgentId, mid: renderOf(l) }}
        title={l.title} badges={<Tag round size="sm" intent={i === idx ? 'primary' : undefined}>{l.n}</Tag>} onClick={() => pick(i)} />))}</Rows>
  );
  const lookCol = (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={1} wrap>{look.pieces.map((x) => <Tag key={x} minimal round intent="primary">{x}</Tag>)}</Stack>
      {pft && <ItemCard depth={2} mediaSize="lg" onClick={() => s.openLook(pft.id)} media={<LookImage look={pft} cascade={1} />}
        title={pft.name} meta={t('shThePft') + ' · ' + pft.colour + ' · ' + pft.rarity}
        actions={<><Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); s.openLook(pft.id); }}>{t('shOpenPft')}</Button>
          {dropPool && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); s.go('pool', { poolId: dropPool.id }); }}>{t('plOpensDrop')}</Button>}</>}>
        <Text size="xs" intent="muted" numeric>{t('plLive', { v: usd(lookLive(pft, now).total) })}</Text>
      </ItemCard>}
      <Card depth={1} variant="flat"><CardBody><Title level={5} size="sm">{t('pose')} · {pose.name}</Title><Rig rig={pose.rig} /></CardBody></Card>
    </Stack>
  );
  const posesCol = (
    <Stack direction="column" gap={2}>
      <TabList size="sm" variant="pills" activeId={family} onChange={(id) => setFamily(id as typeof family)} items={site.poseFamilies.map((f) => ({ id: f, label: f }))} />
      <Rows cols={1} colsSm={1}>{show.poseIds.map((pid) => poseOf(pid)!).filter((p) => p.family === family).map((p) => (
        <Card depth={1} key={p.id} variant="flat" padding="sm"><CardBody><Stack direction="row" justify="between"><Text size="sm" weight="bold">{p.name}</Text><Tag minimal round size="sm">{p.family}</Tag></Stack><Rig rig={p.rig} /></CardBody></Card>))}</Rows>
    </Stack>
  );

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Tile tone={show.tone} color={lead.hex} ratio="21/7" big grid depth={{ worldId: show.worldId, clubId: show.clubId, personId: show.hostAgentId, mid: lead.mid }} title={show.title} sub={t('venue', { city: w.cities.find((c) => c.id === show.venueCityId)?.name ?? '', world: w.name })}
          badges={<><Tag round size="sm">{t('looksN', { n })}</Tag><Tag round size="sm">{t('posesN', { n: show.poseIds.length })}</Tag><Tag round size="sm">{show.date.slice(0, 10)}</Tag>{dropPool && <Tag round size="sm" intent="primary">{t('plShowDrop')}</Tag>}</>} />
        <Stack direction="row" gap={2} wrap align="center">
          <Text size="sm">{t('hostedBy', { name: host.name })}</Text>
          <Button size="sm" variant="outline" onClick={() => s.go('world', { worldId: w.id })}>{w.name}</Button>
          {dropPool && <Button size="sm" variant="outline" onClick={() => s.go('pool', { poolId: dropPool.id })}>{t('plOpensDrop')} · {t('plSold', { sold: dropN!.sold.toLocaleString('en-US'), supply: dropN!.supply.toLocaleString('en-US') })} · {usd(dropN!.total)}</Button>}
        </Stack>
        {/* The stage: the look walking now, on its own colour. */}
        <Stack maxWidth="30rem" width="100%" centered>
          <Tile key={look.id} animate tone={look.tone} color={look.hex} ratio="4/5" big depth={{ worldId: show.worldId, clubId: show.clubId, personId: show.hostAgentId, mid: renderOf(look) }}
            title={look.title} sub={pose.name} badges={<><Tag round size="sm">{t('shNowWalking')}</Tag><Tag round size="sm">{t('lookOf', { i: look.n, n })}</Tag><Tag round size="sm">{pose.family}</Tag></>} onClick={() => pft && s.openLook(pft.id)} />
        </Stack>
        <Connected kind="show" id={show.id} />
      </Stack>
      <Drawer isOpen docked position="bottom" size="sm" title={t('shPlayer')} header={controls} folded={folded} onFoldedChange={setFolded}
        foldLabel={t('shFold')} unfoldLabel={t('shUnfold')} expandable expandLabel={t('expand')} collapseLabel={t('collapse')}>
        <Columns expandLabel={t('expand')} collapseLabel={t('collapse')} columns={[
          { id: 'looks', title: t('looks'), content: looksCol, width: '22rem', closable: true, expandable: true },
          { id: 'look', title: look.title, label: t('look', { n: look.n }), content: lookCol, minWidth: '18rem', expandable: true },
          { id: 'poses', title: t('poses'), content: posesCol, width: '18rem', closable: true, expandable: true },
          { id: 'chat', title: host.name, label: t('chat'), content: <AgentChat agentId={host.id} context={look.title} prompts={[t('shAskLook'), t('shAskPose'), t('shAskDrop')]} />, width: '22rem', closable: true, expandable: true },
        ]} />
      </Drawer>
    </Page>
  );
};
