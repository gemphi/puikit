import React from 'react';
import { Button, Card, CardBody, Icon, Page, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { facetsFor, sortsFor, tableFor } from '../../lib/fields';
import { Sparkles } from 'lucide-react';
import { D, fmt, t } from '../../lib/data';
import { ListView } from '../../components/Phiegg/Views';
import type { Agent } from '../../types/phiegg';
import { Tile, Ring } from '../../components/Phiegg/Tile';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';

export const AgentsHubPage: React.FC = () => {
  const s = useStore(phieggStore);
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Card depth={2} variant="hero"><CardBody><Stack direction="column" gap={2}>
          <Tag intent="success" minimal round icon={<Icon icon={Sparkles} size="xs" />}>{t('aiAgent')}</Tag>
          <Title level={1} size="3xl">{t('meetAgents')}</Title><Text intent="secondary">{t('agentsSub')}</Text>
          <Stack direction="row" gap={2}>{D.agents.agents.map((a) => <Ring key={a.id} label={a.name} onClick={() => s.openStory(a.id)}><PersonAvatar id={a.id} size="lg" /></Ring>)}</Stack>
        </Stack></CardBody></Card>
        <ListView<Agent> rows={D.agents.agents} keyOf={(a) => a.id} text={(a) => a.name + ' ' + a.role + ' ' + a.house + ' ' + a.style} onRow={(a) => s.go('profile', { profileId: a.id })}
          facets={facetsFor<Agent>('agent')}
          sorts={sortsFor<Agent>('agent')}
          table={tableFor<Agent>('agent')}
          render={(a) => (
            <Card depth={2}><CardBody><Stack direction="column" gap={2}>
              <Tile tone={a.tone} ratio="16/8" title={a.name} sub={a.role + ' · ' + a.house} badges={<Tag round size="sm">{a.status}</Tag>} />
              <Text size="sm">{a.style}</Text>
              <Stack direction="row" gap={1} wrap>{a.abilities.slice(0, 2).map((x) => <Tag key={x} minimal round intent="success" size="sm">{x}</Tag>)}</Stack>
              <Stack direction="row" gap={2} align="center">
                <Button variant="primary" size="sm" onClick={() => s.openChat(a.id)}>{t('chat')}</Button>
                <Button variant="outline" size="sm" onClick={() => s.go('profile', { profileId: a.id })}>{t('profile')}</Button>
                <Text size="xs" intent="muted" pushEnd>{fmt(a.followers)} {t('followers')}</Text>
              </Stack>
            </Stack></CardBody></Card>)} />
      </Stack>
    </Page>
  );
};
