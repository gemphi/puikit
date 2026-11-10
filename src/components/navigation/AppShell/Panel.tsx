import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import { Link } from '../Link';
import { Avatar } from '../../media/Avatar';
import type { AppShellApp, AppShellGroup, AppShellPreview } from './types';
import styles from './styles.module.scss';

/** The fold arrow at the left of a row: down while open, turned right when folded. */
const Caret: React.FC<{ open: boolean; label: string; onClick: () => void }> = ({ open, label, onClick }) => (
  <Pressable className={styles.caret} aria-expanded={open} aria-label={label} onClick={onClick}><ChevronDown size={14} /></Pressable>
);

/** The app switcher: each app a glass row with its glyph in black and white. */
export const AppsList: React.FC<{ apps: AppShellApp[] }> = ({ apps }) => (
  <Stack direction="column" gap={1}>
    {apps.map((a) => (
      <Link key={a.id} href={a.current ? '#' : (a.href ?? '#')} className={cn(styles.appRow, a.current && styles.appOn)} aria-current={a.current ? 'page' : undefined}>
        <Box as="span" className={styles.appGlyph}>{a.glyph ?? a.name.slice(0, 1)}</Box>
        <Box as="span" className={styles.appText}>
          <Text as="span" size="sm" weight="bold">{a.name}</Text>
          {a.tagline && <Text as="span" size="xs" intent="muted">{a.tagline}</Text>}
        </Box>
      </Link>
    ))}
  </Stack>
);

export type GroupMenuProps = {
  group: AppShellGroup; view: string; go: (id: string) => void;
  onPreview?: (leafId: string, p: AppShellPreview) => void;
  foldLabel: (label: string, open: boolean) => string;
};

/**
 * One menu of the panel: its title folds the whole menu, and every entry that pulls records folds them, each with the
 * arrow at the left of its row (entries without one keep its room, so labels line up). Children sit flush under the
 * row, never indented.
 */
export const GroupMenu: React.FC<GroupMenuProps> = ({ group, view, go, onPreview, foldLabel }) => {
  const [shut, setShut] = React.useState(false);
  const [folded, setFolded] = React.useState<Record<string, boolean>>({});
  return (
    <Box className={styles.panelGroup}>
      <Stack direction="row" gap={1} align="center" className={styles.groupHead}>
        <Caret open={!shut} label={foldLabel(group.label, !shut)} onClick={() => setShut(!shut)} />
        <Text as="span" size="sm" weight="semibold">{group.label}</Text>
      </Stack>
      {!shut && group.items.map((it) => {
        const pulls = it.previews ?? []; const open = folded[it.id] ?? view === it.id;
        return (
          <Box key={it.id} className={styles.navEntry}>
            <Stack direction="row" gap={0} align="center">
              {pulls.length > 0 ? <Caret open={open} label={foldLabel(it.label, open)} onClick={() => setFolded({ ...folded, [it.id]: !open })} /> : <span className={styles.caretRoom} />}
              <Pressable row gap={3} fill hover minHeight="40px" paddingX={2} className={styles.navRow}
                aria-current={view === it.id ? 'page' : undefined} onClick={() => go(it.id)}>
                {it.icon ?? null}
                <Text as="span" intent="inherit" weight={view === it.id ? 'bold' : 'medium'} truncate>{it.label}</Text>
              </Pressable>
            </Stack>
            {pulls.length > 0 && open && pulls.map((p) => (
              <Pressable key={p.id} row gap={2} fill hover paddingY={1} paddingX={2} className={styles.pullRow} onClick={() => { onPreview?.(it.id, p); }}>
                <Avatar size="xs" src={p.image} alt={p.label} initials={p.label.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()} seed={p.id} />
                <Stack direction="column" gap={0} flex="1" minWidth="0">
                  <Text as="span" size="xs" weight="medium" truncate>{p.label}</Text>
                  {p.sub ? <Text as="span" size="xs" intent="muted" truncate>{p.sub}</Text> : null}
                </Stack>
              </Pressable>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};
