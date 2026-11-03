import React from 'react';
import { Badge, Box, Button, Divider, Icon, Sidebar, SidebarBody, SidebarFooter, SidebarHeader, Stack, Text, Title } from '@pui/components';
import { Bot, Database, Radio, MapPin, GitBranch, Shield, BookOpen, Fingerprint } from 'lucide-react';
import { useStore } from '@pui/store';
import { ontologyStore } from '../../state/ontologyStore';
import { phiadkStore } from '../../state/phiadk';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'identity', label: 'Identity', icon: Fingerprint },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'ontology', label: 'Ontology', icon: Database },
  { id: 'streams', label: 'PhiBus streams', icon: Radio },
  { id: 'spatial', label: 'Spatial & vectors', icon: MapPin },
  { id: 'orchestration', label: 'Playbooks', icon: GitBranch },
  { id: 'governance', label: 'Audit & governance', icon: Shield },
  { id: 'docs', label: 'API & SDK docs', icon: BookOpen },
];

export const SidebarNav: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { objectTypes } = useStore(ontologyStore);
  const { agents } = useStore(phiadkStore);
  const badges: Record<string, string | undefined> = {
    agents: agents.length ? String(agents.length) : undefined,
    ontology: `${objectTypes.length} types`,
  };
  return (
    <Sidebar defaultCollapsed={false}>
      <SidebarHeader>
        <Stack direction="column" gap={1} width="100%">
          <Title level={5} size="sm">Platform</Title>
          <Text size="xs" variant="muted">Phient identity, agents and ontology</Text>
        </Stack>
      </SidebarHeader>

      <SidebarBody>
        <Stack direction="column" gap={1}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'primary' : 'ghost'}
                size="md"
                className={styles.navButton}
                onClick={() => onSelectTab(item.id)}
              >
                <Box className={styles.navContent}>
                  <Box className={styles.navLeft}>
                    <Icon icon={item.icon} size="sm" />
                    <Text as="span" size="sm" intent="inherit" weight="inherit" className={styles.navLabel}>{item.label}</Text>
                  </Box>
                  {badges[item.id] && (
                    <Badge variant={isActive ? 'secondary' : 'primary'}>
                      {badges[item.id]}
                    </Badge>
                  )}
                </Box>
              </Button>
            );
          })}
        </Stack>
      </SidebarBody>

      <SidebarFooter>
        <Stack direction="column" gap={1}>
          <Divider />
          <Text size="xs" variant="muted" align="center">Phione · Phient platform</Text>
        </Stack>
      </SidebarFooter>
    </Sidebar>
  );
};
