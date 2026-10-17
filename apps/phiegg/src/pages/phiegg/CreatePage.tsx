import React from 'react';
import { Button, Card, CardBody, Icon, ItemCard, Page, Rows, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { Camera, Clapperboard, Hash, Layers, Rocket, Sparkles, Workflow, type LucideIcon } from 'lucide-react';
import { phieggStore } from '../../state/phieggStore';
import { D, fmt, site, t, worldOf } from '../../lib/data';
import { Composer } from '../../components/Phiegg/Overlays';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { PageSections } from '../../components/Phiegg/PageSections';

type Kind = { id: string; label: string; body: string; icon: string; tab?: string; action?: 'post' | 'nest' | 'create'; kind?: string };
const KINDS = (site as unknown as { createKinds: Kind[] }).createKinds;
const ICONS: Record<string, LucideIcon> = { Camera, Clapperboard, Hash, Layers, Rocket, Sparkles, Workflow };
const NOW = Date.parse('2026-10-12T00:00:00Z');

/** Make something: a shot, a show, a channel, a pool, a ride, a flow or a club, with the quests and events to make it for. */
export const CreatePage: React.FC = () => {
  const s = useStore(phieggStore);
  const quests = [...D.economy.quests].sort((a, b) => b.reward - a.reward).slice(0, 6);
  const soon = D.events.events.filter((e) => Date.parse(e.startsAt) >= NOW).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 6);
  const act = (k: Kind) => { if (k.action === 'nest') s.openNest(D.hosts.hosts[0].id, null, 'channel'); else if (k.action === 'create' && k.kind) s.openCreate(k.kind); else if (k.tab) s.go(k.tab); };
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}><Title level={2} size="xl">{t('create')}</Title><Text intent="secondary">{t('createSub')}</Text></Stack>
      <Card depth={2}><CardBody><Composer placeholder={t('sharePh')} onSend={(v) => s.postShot(v)} /></CardBody></Card>
      <PageSections id="create" sections={[
        { id: 'start', title: t('crStart'), hint: t('crStartHint'), content: (
          <Rows cols={4} colsSm={1} minItemWidth="14rem">{KINDS.filter((k) => k.action !== 'post').map((k) => (
            <ItemCard key={k.id} depth={1} variant="flat" onClick={() => act(k)} media={<Icon icon={ICONS[k.icon] ?? Sparkles} size="lg" />} title={k.label}
              actions={<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); act(k); }}>{t('open')}</Button>}>{k.body}</ItemCard>))}</Rows>) },
        { id: 'quests', title: t('crQuests'), hint: t('crQuestsHint'), content: (
          <Rows cols={3} colsSm={1} minItemWidth="16rem">{quests.map((q) => { const w = worldOf(q.worldId); return (
            <ItemCard key={q.id} depth={1} variant="flat" onClick={() => s.go('quests')} media={<EntityAvatar id={q.worldId} name={w?.name ?? q.title} size="md" />} title={q.title}
              meta={[w?.name, t('entrants', { n: fmt(q.entrants) })].filter(Boolean).join(' · ')} aside={<Tag round size="sm" intent="primary">{t('reward', { n: fmt(q.reward), coin: q.rewardCoin })}</Tag>} />); })}</Rows>) },
        { id: 'soon', title: t('crSoon'), hint: t('crSoonHint'), content: (
          <Rows cols={3} colsSm={1} minItemWidth="16rem">{soon.map((e) => { const w = e.worldId ? worldOf(e.worldId) : undefined; return (
            <ItemCard key={e.id} depth={1} variant="flat" onClick={() => s.go('events')} media={<EntityAvatar id={e.clubId ?? e.worldId ?? e.id} name={e.title} size="md" />} title={e.title}
              meta={[site.eventKinds[e.kind as keyof typeof site.eventKinds] ?? e.kind, w?.name, e.startsAt.slice(0, 10)].filter(Boolean).join(' · ')}
              aside={e.recurring ? <Tag minimal round size="sm">{e.recurring}</Tag> : undefined} />); })}</Rows>) },
      ]} />
    </Stack></Page>
  );
};
