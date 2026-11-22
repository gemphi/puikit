import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import { Badge } from '../../primitives/Badge';
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

/** Is the page shown this entry or one of its sub-menu's entries (at any depth)? */
const holds = (it: AppShellLeaf, view: string): boolean => it.id === view || (it.items ?? []).some((x) => holds(x, view));

/** One entry: the fold arrow (or its room) at the left, then the entry; what it folds sits flush under it: the records
 *  it pulls, its panel, or its sub-menu (entries of their own, which may hold sub-menus too, a storefront's
 *  department > category > item). An entry with a sub-menu opens it and also goes to its own page; it starts open when
 *  the page shown is inside it. */
const Entry: React.FC<MenuProps & { it: AppShellLeaf; folded: Record<string, boolean>; fold: (id: string, open: boolean) => void }> = ({ it, view, go, onPreview, foldLabel, folded, fold }) => {
  const pulls = it.previews ?? []; const subs = it.items ?? []; const kids = !it.steady && (pulls.length > 0 || !!it.panel || subs.length > 0);
  const open = it.steady || (folded[it.id] ?? (it.open || (subs.length ? holds(it, view) : view === it.id))); const on = view === it.id && !it.panel && !it.head;
  return (
    <Box className={styles.navEntry}>
      <Stack direction="row" gap={0} align="center">
        {kids ? <Caret open={open} label={foldLabel(it.label, open)} onClick={() => fold(it.id, !open)} /> : <span className={styles.caretRoom} />}
        <Pressable row gap={3} fill hover minHeight="var(--pui-shell-control)" paddingX={2} className={styles.navRow}
          aria-current={on ? 'page' : undefined} onClick={() => { if (it.panel || it.head) { fold(it.id, !open); return; } if (subs.length) fold(it.id, true); go(it.id); }}>
          {it.icon ?? null}
          <Text as="span" size={it.head ? 'xs' : undefined} intent={it.head ? 'muted' : 'inherit'} weight={on ? 'bold' : 'medium'} truncate>{it.label}</Text>
          {it.count ? <Box as="span" className={styles.rowCount}><Badge variant="count">{it.count}</Badge></Box> : null}
        </Pressable>
      </Stack>
      {open && it.panel ? <Box className={styles.entryPanel}>{it.panel}</Box> : null}
      {open && subs.length > 0 ? <Box role="group" aria-label={it.label} className={cn(styles.subMenu, it.head && styles.headMenu)}><Run items={subs} view={view} go={go} onPreview={onPreview} foldLabel={foldLabel} /></Box> : null}
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
 * them, the arrow at the left of its row. A group in runs lays them like the rail: top runs from the top, a centre run in the middle, the bottom run at the foot.
 */
export const GroupMenu: React.FC<MenuProps & { group: AppShellGroup }> = ({ group, ...rest }) => {
  const [shut, setShut] = React.useState(false);
  const runs = group.sections ?? [{ id: group.id, items: group.items }];
  // The panel's three places: top runs from the top, the centre run sits in the very middle, bottom runs at the foot.
  // Each place holds its own runs (and scrolls on its own), so opening or folding the top never moves the centre.
  // The group's fold arrow folds the group's own first run only, never what sits in the centre or at the foot.
  // A run with no place of its own takes its group's, so a menu opens beside its own icon on the rail (a group in the
  // middle of the rail opens in the middle of the panel, one at the foot at the foot).
  const placeOf = (run: (typeof runs)[number]) => { const p = run.place ?? (run.end ? 'bottom' : group.place); return p === 'center' ? 'center' : p === 'bottom' ? 'bottom' : 'top'; };
  const block = (run: (typeof runs)[number], i: number) => (
    <Box key={run.id} className={styles.panelGroup}>
      {i === 0 && (
        <Stack direction="row" gap={1} align="center" className={cn(styles.groupHead, !shut && styles.groupOpen)}>
          <Caret open={!shut} label={rest.foldLabel(group.label, !shut)} onClick={() => setShut(!shut)} />
          <Text as="span" size="sm" weight="semibold">{group.label}</Text>
        </Stack>
      )}
      {(i > 0 || !shut) && <Run items={run.items} {...rest} />}
    </Box>
  );
  const at = (p: 'top' | 'center' | 'bottom') => runs.map((run, i) => ({ run, i })).filter((x) => placeOf(x.run) === p);
  return (
    <>
      <Box className={styles.placeTop}>{at('top').map((x) => block(x.run, x.i))}</Box>
      {at('center').length > 0 && <Box className={styles.placeCenter}>{at('center').map((x) => block(x.run, x.i))}</Box>}
      {at('bottom').length > 0 && <Box className={styles.placeBottom}>{at('bottom').map((x) => block(x.run, x.i))}</Box>}
    </>
  );
};

/** The app's single pages (the groups that are one page each) as one menu with no title, so a page that is a group of
 *  its own never shows its name twice. */
export const PageMenu: React.FC<MenuProps & { pages: AppShellLeaf[] }> = ({ pages, ...rest }) => (
  <Box className={styles.panelGroup}><Run items={pages} {...rest} /></Box>
);
