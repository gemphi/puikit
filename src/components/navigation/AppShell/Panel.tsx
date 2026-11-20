import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import { Link } from '../Link';
import type { AppShellApp, AppShellGroup, AppShellTab } from './types';
import styles from './styles.module.scss';

export { Caret, GroupMenu, PageMenu } from './Menu';

const AppRow: React.FC<{ a: AppShellApp }> = ({ a }) => (
  <Link href={a.current ? '#' : (a.href ?? '#')} className={cn(styles.appRow, a.current && styles.appOn)} aria-current={a.current ? 'page' : undefined}>
    <Box as="span" className={styles.appGlyph}>{a.glyph ?? a.name.slice(0, 1)}</Box>
    <Box as="span" className={styles.appText}>
      <Text as="span" size="sm" weight="bold">{a.name}</Text>
      {a.tagline && <Text as="span" size="xs" intent="muted">{a.tagline}</Text>}
    </Box>
  </Link>
);

/** The app switcher: each app a glass row with its glyph in black and white; the `more` ones behind a fold. */
export const AppsList: React.FC<{ apps: AppShellApp[]; moreLabel: string }> = ({ apps, moreLabel }) => {
  const [more, setMore] = React.useState(false);
  const mine = apps.filter((a) => !a.more); const rest = apps.filter((a) => a.more);
  return (
    <Stack direction="column" gap={1}>
      {mine.map((a) => <AppRow key={a.id} a={a} />)}
      {rest.length > 0 && (
        <Pressable row gap={2} fill hover minHeight="var(--pui-shell-control)" paddingX={3} className={styles.navRow} aria-expanded={more} onClick={() => setMore(!more)}>
          <Plus size={16} /><Text as="span" size="sm" intent="inherit">{moreLabel}</Text>
        </Pressable>
      )}
      {more && rest.map((a) => <AppRow key={a.id} a={a} />)}
    </Stack>
  );
};

/** Phones: the rail itself as the bar at the foot. Each group is its icon alone on a ground of its own (its name is
 *  said to a screen reader, not drawn); the one whose menu is open, or whose page is shown, is lit. */
export const PhoneRail: React.FC<{ label: string; groups: AppShellGroup[]; on: string; current?: string; pick: (g: AppShellGroup) => void; inDrawer?: boolean }> = ({ label, groups, on, current, pick, inDrawer }) => (
  <Box as="nav" aria-label={label} className={inDrawer ? styles.tabsIn : styles.tabs}>
    {groups.map((g) => (
      <Pressable key={g.id} aria-label={g.label} aria-expanded={on === g.id} aria-current={current === g.id ? 'page' : undefined}
        className={cn(styles.tab, styles.tabIcon, (on === g.id || (!on && current === g.id)) && styles.tabOn)} onClick={() => pick(g)}>
        {g.icon ?? <span className={styles.railGlyph}>{g.label.slice(0, 1)}</span>}
      </Pressable>
    ))}
  </Box>
);

/** Phones: the menu button and the app's tabs in a bar at the foot. */
export const PhoneTabs: React.FC<{ tabs: AppShellTab[]; view: string; go: (id: string) => void; menu: { label: string; icon: React.ReactNode; open: boolean; onClick: () => void } }> = ({ tabs, view, go, menu }) => (
  <Box as="nav" aria-label={menu.label} className={styles.tabs}>
    <Pressable aria-label={menu.label} aria-expanded={menu.open} className={cn(styles.tab, menu.open && styles.tabOn)} onClick={menu.onClick}>
      {menu.icon}<Text as="span" size="xs" intent="inherit">{menu.label}</Text>
    </Pressable>
    {tabs.map((t) => (
      <Pressable key={t.id} aria-label={t.label} aria-current={view === t.id ? 'page' : undefined} className={cn(styles.tab, view === t.id && styles.tabOn)} onClick={() => go(t.id)}>
        {t.icon}<Text as="span" size="xs" intent="inherit">{t.label}</Text>
      </Pressable>
    ))}
  </Box>
);
