import React from 'react';
import { Box, ChoiceRow, Player, RadiusPicker, Stack, Text } from '@pui/components';
import { useLayout, usePuiTheme, type Theme } from '@pui/providers';
import { SURFACES, THEMES, useSurface, useThemeChoice } from './appearance';
import { PREFS, type Mini as MiniSpec, type PrefGroup, type PrefOption } from './prefs';
import { Head } from './views';
import css from './settings.module.scss';

/** A small window drawn as a choice lays it: its tabs on top or at the side, its feed as headings, a partial feed or
 *  a full page; in its own colours where the choice has them (a look, a mode), else in the look that is on. */
export const Mini: React.FC<{ mini?: MiniSpec }> = ({ mini = {} }) => {
  const ground = mini.swatch && (mini.split ? `linear-gradient(90deg, ${mini.swatch[0]} 50%, ${mini.swatch[1]} 50%)` : `linear-gradient(90deg, ${mini.swatch.join(', ')})`);
  const tone = mini.swatch ? (mini.dark || mini.split ? css.dark : css.light) : '';
  const lines = (n: number) => Array.from({ length: n }, (_, i) => <Box as="span" key={i} className={css.line} />);
  const cards = (n: number) => <Box as="span" className={css.cards}>{Array.from({ length: n }, (_, i) => <Box as="span" key={i} className={css.card} />)}</Box>;
  const feed = mini.feed === 'headings' ? lines(5)
    : mini.feed === 'partial' ? <><Box as="span" className={css.hero} />{cards(3)}</>
    : <>{cards(3)}{cards(3)}</>;
  return (
    <Box as="span" className={[css.mini, mini.tabs === 'side' ? css.side : css.top, tone].join(' ')} style={ground ? ({ '--mini-ground': ground } as React.CSSProperties) : undefined}>
      <Box as="span" className={css.bar} />
      <Box as="span" className={css.body}>
        <Box as="span" className={css.tabs}>{[0, 1, 2, 3].map((i) => <Box as="span" key={i} className={css.tab} />)}</Box>
        <Box as="span" className={css.feed}>{feed}</Box>
      </Box>
    </Box>
  );
};

const pictured = (options: PrefOption[]) => options.map((o) => ({ value: o.value, label: o.label, picture: o.mini ? { preview: <Mini mini={o.mini} /> } : undefined }));

/** One group of Settings, by what it sets: its options as pictures where they have them. */
const Group: React.FC<{ g: PrefGroup }> = ({ g }) => {
  const { theme, setTheme, density, setDensity, isDark } = usePuiTheme();
  const [pick, setPick] = useThemeChoice();
  const [surface, setSurface] = useSurface();
  const [value, setValue] = useLayout(g.id, g.fallback ?? '');
  const titled = (node: React.ReactNode) => <Stack direction="column" gap={2}><Text size="md" weight="medium">{g.label}</Text>{node}</Stack>;
  switch (g.kind) {
    // A theme is its colours, drawn in the mode that is on; a surface is how the parts are laid.
    case 'theme':
      return <ChoiceRow label={g.label} showLabel minWidth="8rem" value={pick?.id ?? ''} onChange={setPick} limit={THEMES.length}
        options={THEMES.map((x) => ({ value: x.id, label: x.label, picture: { preview: <Mini mini={{ swatch: x.swatch, dark: isDark }} /> } }))} />;
    case 'surface':
      return <ChoiceRow label={g.label} showLabel minWidth="8rem" value={surface?.id ?? ''} onChange={setSurface} limit={SURFACES.length}
        options={SURFACES.map((x) => ({ value: x.id, label: x.label, picture: { preview: <Mini mini={{ swatch: x.swatch, dark: isDark }} /> } }))} />;
    case 'mode':
      return <ChoiceRow label={g.label} showLabel minWidth="9rem" value={theme} onChange={(v) => setTheme(v as Theme)} options={pictured(g.options ?? [])} />;
    case 'layout':
      return <ChoiceRow label={g.label} showLabel minWidth="9rem" value={value} onChange={setValue} options={pictured(g.options ?? [])} />;
    case 'density':
      return <ChoiceRow label={g.label} showLabel value={String(density)} onChange={(v) => setDensity(Number(v))} options={pictured(g.options ?? [])} />;
    case 'radius': return titled(<RadiusPicker />);
    default: return null;
  }
};

/** The window as the person has it now: the look's ground, the tabs and the feed they chose, with depth. */
const Live: React.FC = () => {
  const [feed] = useLayout('feed', PREFS.groups.find((g) => g.id === 'feed')?.fallback ?? '');
  const [tabs] = useLayout('tabs', PREFS.groups.find((g) => g.id === 'tabs')?.fallback ?? '');
  return (
    <Box className={css.live}>
      <Player ratio="4/3" label={PREFS.head.title}><Mini mini={{ feed: feed as MiniSpec['feed'], tabs: tabs === 'vertical' ? 'side' : 'top' }} /></Player>
    </Box>
  );
};

/** Settings, the same in every app: the groups prefs.json names, in its order, beside the live picture; `shared`
 *  shows only the groups an app's own Appearance carries too. */
export const SettingsView: React.FC<{ shared?: boolean }> = ({ shared }) => {
  // Inside an app's own Appearance: only the groups every app shares, without the head and the live picture.
  const groups = PREFS.groups.filter((g) => !shared || g.shared);
  if (shared) return <Stack direction="column" gap={4}>{groups.map((g) => <Group key={g.id} g={g} />)}</Stack>;
  return (
    <>
      <Head title={PREFS.head.title} sub={PREFS.head.sub} />
      <Box className={css.page}>
        <Live />
        <Box className={css.groups}>{groups.map((g) => <Group key={g.id} g={g} />)}</Box>
      </Box>
    </>
  );
};
