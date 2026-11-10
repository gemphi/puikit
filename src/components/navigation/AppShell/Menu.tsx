import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import { Avatar } from '../../media/Avatar';
import type { AppShellGroup, AppShellLeaf, AppShellPreview } from './types';
import styles from './styles.module.scss';

/** The fold arrow at the left of a row: down while open, turned right when folded. */
export const Caret: React.FC<{ open: boolean; label: string; onClick: () => void }> = ({ open, label, onClick }) => (
  <Pressable className={styles.caret} aria-expanded={open} aria-label={label} onClick={onClick}><ChevronDown size={14} /></Pressable>
);

const initials = (s: string) => s.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export type MenuProps = {
  view: string; go: (id: string) => void;
  onPreview?: (leafId: string, p: AppShellPreview) => void;
  foldLabel: (label: string, open: boolean) => string;
};

/** One entry: the fold arrow (or its room) at the left, then the entry; what it folds sits flush under it. */
const Entry: React.FC<MenuProps & { it: AppShellLeaf; folded: Record<string, boolean>; fold: (id: string, open: boolean) => void }> = ({ it, view, go, onPreview, foldLabel, folded, fold }) => {
  const pulls = it.previews ?? []; const kids = pulls.length > 0 || !!it.panel;
  const open = folded[it.id] ?? (it.open || view === it.id); const on = view === it.id && !it.panel;
  return (
    <Box className={styles.navEntry}>
      <Stack direction="row" gap={0} align="center">
        {kids ? <Caret open={open} label={foldLabel(it.label, open)} onClick={() => fold(it.id, !open)} /> : <span className={styles.caretRoom} />}
        <Pressable row gap={3} fill hover minHeight="40px" paddingX={2} className={styles.navRow}
          aria-current={on ? 'page' : undefined} onClick={() => (it.panel ? fold(it.id, !open) : go(it.id))}>
          {it.icon ?? null}
          <Text as="span" intent="inherit" weight={on ? 'bold' : 'medium'} truncate>{it.label}</Text>
        </Pressable>
      </Stack>
      {open && it.panel ? <Box className={styles.entryPanel}>{it.panel}</Box> : null}
      {open && pulls.map((p) => (
        <Pressable key={p.id} row gap={2} fill hover paddingY={1} paddingX={2} className={styles.pullRow} onClick={() => (p.onSelect ? p.onSelect() : onPreview?.(it.id, p))}>
          {p.avatar ?? <Avatar size="xs" src={p.image} alt={p.label} initials={initials(p.label)} seed={p.id} />}
          <Stack direction="column" gap={0} flex="1" minWidth="0">
            <Text as="span" size="xs" weight="medium" truncate>{p.label}</Text>
            {p.sub ? <Text as="span" size="xs" intent="muted" truncate>{p.sub}</Text> : null}
          </Stack>
          {p.meta ? <Text as="span" size="xs" intent="muted" numeric>{p.meta}</Text> : null}
        </Pressable>
      ))}
    </Box>
  );
};

/** A run of entries; an entry marked `inline` shares the row of the one before it. */
const Run: React.FC<MenuProps & { items: AppShellLeaf[] }> = ({ items, ...rest }) => {
  const [folded, setFolded] = React.useState<Record<string, boolean>>({});
  const fold = (id: string, open: boolean) => setFolded((f) => ({ ...f, [id]: open }));
  const rows = items.reduce<AppShellLeaf[][]>((r, it) => { if (it.inline && r.length) r[r.length - 1].push(it); else r.push([it]); return r; }, []);
  return <>{rows.map((row) => row.length === 1
    ? <Entry key={row[0].id} it={row[0]} folded={folded} fold={fold} {...rest} />
    : <Box key={row.map((x) => x.id).join('|')} className={styles.inlineRow}>{row.map((it) => <Entry key={it.id} it={it} folded={folded} fold={fold} {...rest} />)}</Box>)}</>;
};

/**
 * One group's menu in the panel: its title folds the whole menu; every entry that pulls records or holds a panel folds
 * them, the arrow at the left of its row. A group in runs lays each run on its own pane, the `end` run at the foot.
 */
export const GroupMenu: React.FC<MenuProps & { group: AppShellGroup }> = ({ group, ...rest }) => {
  const [shut, setShut] = React.useState(false);
  const runs = group.sections ?? [{ id: group.id, items: group.items }];
  return (
    <>
      {runs.map((run, i) => (
        <Box key={run.id} className={cn(styles.panelGroup, run.end && styles.panelEnd)}>
          {i === 0 && (
            <Stack direction="row" gap={1} align="center" className={styles.groupHead}>
              <Caret open={!shut} label={rest.foldLabel(group.label, !shut)} onClick={() => setShut(!shut)} />
              <Text as="span" size="sm" weight="semibold">{group.label}</Text>
            </Stack>
          )}
          {!shut && <Run items={run.items} {...rest} />}
        </Box>
      ))}
    </>
  );
};

/** The app's single pages (the groups that are one page each) as one menu with no title, so a page that is a group of
 *  its own never shows its name twice. */
export const PageMenu: React.FC<MenuProps & { pages: AppShellLeaf[] }> = ({ pages, ...rest }) => (
  <Box className={styles.panelGroup}><Run items={pages} {...rest} /></Box>
);
