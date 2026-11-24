import React from 'react';
import { GradientLevelPicker, PalettePicker, RadiusPicker, Stack, Text, TabList } from '@pui/components';
import type { RadiusPreset } from '@pui/providers';
import { usePuiTheme } from '@pui/hooks';
import { useStore } from '@pui/store';
import { LOOKS, useLook } from '@phi-kit/looks';
import { SettingsView } from '@phi-kit/settings';
import { site, t } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';

type Opt = { id: string; label: string };
const Row: React.FC<{ label: string; opts: Opt[]; value: string; set: (v: string) => void }> = ({ label, opts, value, set }) => (
  <Stack direction="column" gap={1}><Text size="xs" intent="muted" weight="bold">{label}</Text>
    <TabList size="sm" variant="pills" aria-label={label} activeId={value} onChange={set} items={opts.map((o) => ({ id: o.id, label: o.label }))} /></Stack>
);

/** The theme picker carries its gradient level and corner preset into Phiegg's appearance, so the Gradients and
 *  Corners rows show what the theme chose and fine-tune from there. */
export const usePhieggLook = () => {
  const [look, setLook] = useLook(); const { setAppearance } = useStore(phieggStore);
  const set = (id: string) => { const l = LOOKS.find((x) => x.id === id); setLook(id); if (l) { setAppearance('gradient', l.gradient); setAppearance('radius', l.radius); } };
  return [look, set] as const;
};

/** Phiegg opens in the looks data/site.json lists (today the blue Muse look): a look saved from elsewhere, or from
 *  before, is swapped for the first listed one when the app opens. Once open, a look the person picks (Apple, Glass,
 *  any of the kit's) stands: it is checked once, not on every change, or a pick would be taken back at once. */
export const useListedLook = () => {
  const [look, setLook] = usePhieggLook();
  const listed = site.appearance.looks;
  React.useEffect(() => { if (listed.length && !listed.some((l) => l.id === look.id)) setLook(listed[0].id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

/** Theme (Apple · SpaceX · Organic), palette (16 seeded), mode, accent, radius, gradients, shades, opacity and motion, options from data/site.json appearance. */
export const Appearance: React.FC = () => {
  const { theme, setTheme, brandId, setBrandId, setPaletteId, setGradientLevel } = usePuiTheme();
  const [look, setLook] = usePhieggLook();
  const { appearance, setAppearance } = useStore(phieggStore);
  const ap = site.appearance;
  // Each row by its id; the order is data (site.json appearance.order).
  const rows: Record<string, React.ReactNode> = {
    look: ap.looks.length > 1 && <Row label={t('lookStyle')} opts={ap.looks} value={look.id} set={setLook} />,
    mode: <Row label={t('mode')} opts={ap.themes} value={theme} set={(v) => setTheme(v as typeof theme)} />,
    palette: <Stack direction="column" gap={1}><Text size="xs" intent="muted" weight="bold">{t('palette')}</Text><PalettePicker noneLabel={t('paletteNone')} /></Stack>,
    accent: <Row label={t('accent')} opts={ap.brands} value={brandId} set={(v) => { setBrandId(v as typeof brandId); setPaletteId('none'); }} />,
    radius: <Stack direction="column" gap={1}><Text size="xs" intent="muted" weight="bold">{t('radius')}</Text>
      <RadiusPicker value={appearance.radius as RadiusPreset} onChange={(v) => setAppearance('radius', v)} labels={Object.fromEntries(ap.radii.map((r) => [r.id, r.label]))} /></Stack>,
    gradient: <Stack direction="column" gap={1}><Text size="xs" intent="muted" weight="bold">{t('gradient')}</Text>
      <GradientLevelPicker value={appearance.gradient as 'flat'} onChange={(v) => { setAppearance('gradient', v); setGradientLevel(v); }} /></Stack>,
    sidebar: <Row label={t('sidebarShade')} opts={ap.shades} value={appearance.sidebar} set={(v) => setAppearance('sidebar', v)} />,
    content: <Row label={t('contentShade')} opts={ap.shades} value={appearance.content} set={(v) => setAppearance('content', v)} />,
    opacity: <Row label={t('surfaceOpacity')} opts={ap.opacities} value={appearance.opacity} set={(v) => setAppearance('opacity', v)} />,
    motion: <Row label={t('motion')} opts={ap.motion} value={appearance.motion} set={(v) => setAppearance('motion', v)} />,
  };
  const order = (ap as unknown as { order: { rows: string[] } }).order.rows;
  return (
    <Stack direction="column" gap={3}>{order.map((id) => rows[id] ? <React.Fragment key={id}>{rows[id]}</React.Fragment> : null)}
      {/* The layout every Phi app shares (phi-kit prefs.json): the feed and the tabs, chosen by their pictures. */}
      <SettingsView shared /></Stack>
  );
};
