import React from 'react';
import { Box, Button, Card, CardBody, Icon, Page, Stack, Tag, Text, Title } from '@pui/components';
import { KindList } from '../../components/Phiegg/KindList';
import type { ItemRow } from '../../lib/data';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { Sparkles } from 'lucide-react';
import { D, t } from '../../lib/data';
import { Ring } from '../../components/Phiegg/Tile';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import tile from '../../components/Phiegg/Tile.module.scss';

export const AgentsHubPage: React.FC = () => {
  const s = useStore(phieggStore);
  const list = React.useRef<HTMLDivElement>(null);
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Card depth={2} variant="hero"><CardBody><Stack direction="column" gap={2}>
          <Tag intent="success" minimal round icon={<Icon icon={Sparkles} size="xs" />}>{t('aiAgent')}</Tag>
          <Title level={1} size="3xl">{t('meetAgents')}</Title><Text intent="secondary">{t('agentsSub')}</Text>
          <Stack direction="row" gap={2} align="center">
            <Box className={tile.ringRow}>{D.agents.agents.map((a) => <Ring key={a.id} label={a.name} onClick={() => s.openStory(a.id)}><PersonAvatar id={a.id} size="lg" /></Ring>)}</Box>
            <Button variant="glass" onClick={() => list.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{t('allAgents')} {D.agents.agents.length}</Button>
          </Stack>
        </Stack></CardBody></Card>
        {/* An agent in a list is the one card of any kind (data/card.json), and opens the one profile: no card of its own here. */}
        <Box ref={list}><KindList kind="agent" rows={D.agents.agents as unknown as ItemRow[]} label={t('meetAgents')} /></Box>
      </Stack>
    </Page>
  );
};
