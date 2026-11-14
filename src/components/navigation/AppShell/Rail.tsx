import React from 'react';
import { Grid3x3 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Pressable } from '../../primitives/Pressable';
import type { AppShellGroup, AppShellLeaf } from './types';
import styles from './styles.module.scss';

export const APPS = '__apps';

export type RailProps = {
  label: string;
  groups: AppShellGroup[]; footGroups: AppShellGroup[]; footLeaves: AppShellLeaf[];
  railId: string; groupOfView?: string; view: string;
  apps?: { label: string; icon?: React.ReactNode };
  pick: (g: AppShellGroup) => void; pickApps: () => void; go: (id: string) => void;
};

const glyph = (l: { label: string; icon?: React.ReactNode }) => l.icon ?? <span className={styles.railGlyph}>{l.label.slice(0, 1)}</span>;

/**
 * The rail of menu groups: the first groups at the top, the `center` ones in the middle, and at the foot the `bottom`
 * ones, the app switcher and the foot entries (You, Settings). Every button is the same square.
 */
export const Rail: React.FC<RailProps> = ({ label, groups, footGroups, footLeaves, railId, groupOfView, view, apps, pick, pickApps, go }) => {
  const btn = (id: string, l: string, icon: React.ReactNode, on: boolean, onClick: () => void) => (
    <Pressable key={id} title={l} aria-label={l} aria-pressed={on} className={cn(styles.railBtn, on && styles.railOn)} onClick={onClick}>{icon}</Pressable>
  );
  const group = (g: AppShellGroup) => btn(g.id, g.label, glyph(g), railId === g.id || groupOfView === g.id, () => pick(g));
  const at = (p: 'top' | 'center' | 'bottom') => groups.filter((g) => (g.place ?? 'top') === p);
  return (
    <Box as="nav" className={styles.rail} aria-label={label}>
      <Stack direction="column" gap={1} align="center" className={styles.railGroup}>{at('top').map(group)}</Stack>
      <Box flex="1" />
      {at('center').length > 0 && <><Stack direction="column" gap={1} align="center" className={styles.railGroup}>{at('center').map(group)}</Stack><Box flex="1" /></>}
      <Stack direction="column" gap={1} align="center" className={styles.railGroup}>
        {at('bottom').map(group)}
        {apps && btn(APPS, apps.label, apps.icon ?? <Grid3x3 size={20} />, railId === APPS, pickApps)}
        {footGroups.map(group)}
        {footLeaves.map((f) => btn(f.id, f.label, glyph(f), view === f.id, () => go(f.id)))}
      </Stack>
    </Box>
  );
};
