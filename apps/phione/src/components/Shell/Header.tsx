import React from 'react';
import { Navbar, NavbarSection, Title, Tag, Select, Button, Icon, Stack } from '@pui/components';
import { usePuiTheme } from '@pui/hooks';
import { Fingerprint, Activity, Sun, Moon } from 'lucide-react';
import { useStore } from '@pui/store';
import { LOOKS, useLook } from '../../../../phi-kit/src/looks';
import { phiadkStore, hasPhiadk } from '../../state/phiadk';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const LOOK_OPTIONS = LOOKS.map((l) => ({ value: l.id, label: l.label }));

/** Phione — the identity & ontology console of the Phient platform (formerly the Phiegg cockpit). */
export const Header: React.FC<HeaderProps> = () => {
  const { theme, setTheme } = usePuiTheme();
  const [look, setLook] = useLook();
  const { status } = useStore(phiadkStore);
  const live = status === 'live';

  return (
    <Navbar sticky variant="solid" height={52}>
      <NavbarSection align="start">
        <Stack direction="row" align="center" gap={2}>
          <Icon icon={Fingerprint} size="sm" />
          <Title level={4} size="sm">Phione</Title>
          <Tag minimal round size="sm">Identity &amp; ontology</Tag>
        </Stack>
        <Tag intent={live ? 'success' : hasPhiadk ? 'warning' : undefined} minimal round size="sm">
          <Icon icon={Activity} size="xs" />
          {live ? 'Phient API live' : hasPhiadk ? (status === 'loading' ? 'Connecting…' : 'Phient API offline') : 'Sample data'}
        </Tag>
      </NavbarSection>

      <NavbarSection align="end">
        <Stack direction="row" align="center" gap={2}>
          <Select size="sm" value={look.id} options={LOOK_OPTIONS} onChange={(e) => setLook(e.target.value)} aria-label="Theme" />
          <Button
            variant="ghost"
            size="sm"
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            icon={<Icon icon={theme === 'dark' ? Sun : Moon} size="xs" />}
          />
        </Stack>
      </NavbarSection>
    </Navbar>
  );
};
